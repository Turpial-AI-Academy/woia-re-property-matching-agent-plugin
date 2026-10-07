import { createHash } from 'node:crypto';

const actions = ['property-match.evaluate', 'property-match.explain', 'property-match.refresh'];
const text = (v) => typeof v === 'string' && v.trim().length > 0;
const scalar = (v) => typeof v === 'string' || typeof v === 'boolean' || (typeof v === 'number' && Number.isFinite(v));
function assert(ok, message) { if (!ok) throw new Error(message); }
function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`;
  return JSON.stringify(value);
}
const digest = (value) => createHash('sha256').update(canonical(value)).digest('hex');
function freeze(value) { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; }
function inputs(input) {
  assert(text(input.org_id), 'Organization scope required');
  assert(input && text(input.evaluation_id) && Number.isSafeInteger(input.version) && input.version > 0, 'Explicit evaluation identity/version required');
  assert(['sales', 'leasing', 'customer-service'].includes(input.scope?.department) && input.scope.authorized === true && text(input.scope.purpose) && text(input.scope.binding_ref), 'Authorized consumer scope/purpose/binding required');
  assert(text(input.criteria_source_ref) && text(input.criteria_version), 'Accepted criteria source/version required');
  assert(input.criteria_accepted === true, 'Criteria must be accepted; do not invent criteria');
  assert(Array.isArray(input.criteria) && input.criteria.length > 0 && Array.isArray(input.candidates), 'Criteria and candidate lists required');
  const ids = new Set();
  for (const c of input.criteria) {
    assert(text(c.id) && !ids.has(c.id) && text(c.field) && ['equals', 'at-least', 'at-most'].includes(c.operator) && scalar(c.expected), 'Invalid or duplicate criterion'); ids.add(c.id);
    assert(c.operator === 'equals' || typeof c.expected === 'number', 'Ordered criterion must be finite numeric');
  }
  const properties = new Set();
  for (const p of input.candidates) {
    assert(p.org_id === input.org_id, 'Cross-organization property prohibited');
    assert(text(p.property_id) && !properties.has(p.property_id) && text(p.version) && Array.isArray(p.facts), 'Distinct property identity/version/facts required'); properties.add(p.property_id);
    const fields = new Set();
    for (const f of p.facts) {
      assert(f.org_id === input.org_id, 'Cross-organization fact prohibited');
      assert(text(f.field) && !fields.has(f.field), 'Duplicate/invalid fact field'); fields.add(f.field);
      assert(text(f.source_ref) && text(f.source_version) && text(f.accepted_by) && text(f.acceptance_ref), 'Fact source authority/provenance required');
      assert(['ACCEPTED', 'UNKNOWN', 'DISPUTED', 'UNACCEPTED'].includes(f.status) && typeof f.stale === 'boolean', 'Explicit fact status/freshness required');
      assert(f.status !== 'ACCEPTED' || scalar(f.value), 'Accepted fact must be scalar');
    }
  }
}
function authorize(input, action, context, historical = false) {
  assert(context && typeof context.resolveScope === 'function' && text(context.principal_id) && Number.isFinite(Date.parse(context.now)), 'Trusted host resolver, principal and time required');
  const grant = context.resolveScope({ principal_id: context.principal_id, org_id: input.org_id, binding_ref: input.scope?.binding_ref });
  assert(grant && grant.principal_id === context.principal_id && grant.org_id === input.org_id && grant.binding_ref === input.scope?.binding_ref && grant.department === input.scope?.department && grant.purpose === input.scope?.purpose, 'Host-resolved scope mismatch');
  assert(grant.current === true && grant.revoked === false && grant.hold === false && grant.emergency_stop === false, 'Grant must be current, unrevoked, unheld and unstopped');
  const now = Date.parse(context.now);
  assert(Number.isFinite(Date.parse(grant.effective_from)) && Number.isFinite(Date.parse(grant.effective_until)) && now >= Date.parse(grant.effective_from) && now < Date.parse(grant.effective_until), 'Grant expired or not effective');
  assert(grant.actions?.includes(action), 'Action not authorized by host');
  if (!historical) {
    assert(grant.criteria_source_ref === input.criteria_source_ref && grant.criteria_version === input.criteria_version, 'Criteria not authorized by host');
    assert(Array.isArray(grant.criteria) && canonical(grant.criteria) === canonical(input.criteria), 'Criteria content differs from accepted host criteria');
  }
  assert(text(grant.source_map_ref) && text(grant.source_map_version) && Array.isArray(grant.source_map), 'Effective source map required');
  const copy = JSON.parse(JSON.stringify(input));
  copy.evaluated_at = context.now;
  copy.source_map_ref = grant.source_map_ref;
  copy.source_map_version = grant.source_map_version;
  for (const p of copy.candidates) {
    assert(grant.property_ids?.includes(p.property_id), 'Property outside authorized scope');
    for (const f of p.facts) {
      assert(grant.fields?.includes(f.field), 'Field outside authorized scope');
      if (historical) continue;
      const entries = grant.source_map.filter(e => e.org_id === input.org_id && e.property_id === p.property_id && e.field === f.field && e.source_ref === f.source_ref && e.source_version === f.source_version && e.accepted_by === f.accepted_by && e.acceptance_ref === f.acceptance_ref && now >= Date.parse(e.effective_from) && now < Date.parse(e.effective_until));
      assert(entries.length === 1, 'Fact source authority missing, ambiguous or ineffective');
      assert(entries[0].conflict === false && entries[0].revoked === false && entries[0].property_version === p.version, 'Fact source conflict, revocation or version mismatch');
      assert(entries[0].fact && canonical(entries[0].fact) === canonical(f), 'Fact value/status/freshness differs from host-resolved source snapshot');
      assert(Number.isFinite(Date.parse(f.fresh_until)), 'Fact freshness deadline required');
    }
  }
  for (const c of copy.criteria) assert(grant.fields?.includes(c.field), 'Criterion field outside authorized scope');
  return copy;
}
function build(input) {
  inputs(input);
  const source = JSON.parse(JSON.stringify(input));
  const results = source.candidates.map(p => {
    const criteria = source.criteria.map(c => {
      const f = p.facts.find(f => f.field === c.field);
      let result = 'UNKNOWN';
      const expired = f && Date.parse(source.evaluated_at) >= Date.parse(f.fresh_until);
      if (f?.status === 'ACCEPTED' && !f.stale && !expired && typeof f.value === typeof c.expected) {
        const ok = c.operator === 'equals' ? f.value === c.expected : c.operator === 'at-least' ? f.value >= c.expected : f.value <= c.expected;
        result = ok ? 'MATCH' : 'NO_MATCH';
      }
      return { criterion_id: c.id, result, source_ref: f?.source_ref ?? null, source_version: f?.source_version ?? null, reason: !f ? 'MISSING_FACT' : f.stale || expired ? 'STALE_FACT' : f.status !== 'ACCEPTED' ? f.status : typeof f.value !== typeof c.expected ? 'TYPE_MISMATCH' : 'EXPLICIT_CRITERION' };
    });
    return { property_id: p.property_id, property_version: p.version, result: criteria.some(c => c.result === 'NO_MATCH') ? 'NO_MATCH' : criteria.some(c => c.result === 'UNKNOWN') ? 'UNKNOWN' : 'MATCH', criteria };
  });
  const snapshot = { schema: 'dev.woia.property-match/v1', evaluation_id: source.evaluation_id, version: source.version, input: source, results, availability: 'NOT_ASSERTED', authority: 'NOT_GRANTED', acceptance: 'NOT_GRANTED', external_effects: false };
  return freeze({ ...snapshot, digest: digest(snapshot) });
}
function verify(snapshot) {
  assert(snapshot && typeof snapshot === 'object', 'Snapshot required');
  const { digest: claimed, ...body } = snapshot;
  assert(claimed === digest(body), 'Snapshot integrity mismatch');
  const rebuilt = build(snapshot.input);
  assert(canonical(rebuilt) === canonical(snapshot), 'Snapshot does not match evaluated inputs');
}
/** Pure evaluation using independently host-resolved scoped authority and accepted source snapshots. Host adapters are not qualified here. */
export function execute(action, request, context) {
  assert(actions.includes(action), 'Unsupported action; evaluation only');
  if (action === 'property-match.evaluate') return build(authorize(request, action, context));
  verify(request.previous);
  assert(typeof context?.resolveSnapshot === 'function' && canonical(context.resolveSnapshot(request.previous.digest)) === canonical(request.previous), 'Historical snapshot must match trusted durable evidence');
  authorize(request.previous.input, action, context, true);
  if (action === 'property-match.explain') {
    assert(request.scope?.authorized === true && request.scope.binding_ref === request.previous.input.scope.binding_ref && request.scope.purpose === request.previous.input.scope.purpose && request.scope.department === request.previous.input.scope.department, 'Explanation requires original authorized scope');
    return freeze(JSON.parse(JSON.stringify(request.previous)));
  }
  assert(request.input.evaluation_id === request.previous.evaluation_id && request.input.version === request.previous.version + 1, 'Refresh must advance the same evaluation exactly one version');
  assert(request.input.previous_digest === request.previous.digest, 'Refresh must reference immutable prior digest');
  assert(request.input.scope.binding_ref === request.previous.input.scope.binding_ref && request.input.scope.purpose === request.previous.input.scope.purpose && request.input.scope.department === request.previous.input.scope.department, 'Refresh cannot widen consumer scope');
  return build(authorize(request.input, action, context));
}
