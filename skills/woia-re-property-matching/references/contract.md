# Evaluation contract

Runtime semantic reference: published woia-re-domain-contracts v0.5.0, commit fb1c8a3f7fb116f2a00daf05ae335fdfbc7c3f3f, tree f3ff5a68a0d5df2e615a650eddc313c9585b7f08. This is a versioned semantic reference, not a hard package/repository dependency. Temporary build coordination is not required for consumer operation.

Actions: property-match.evaluate, property-match.explain, property-match.refresh. Consumers: Sales, Leasing, Customer Service. No availability, Mandate authority, competent acceptance or external-person contact is granted by a match.

Inputs carry evaluation identity/version, authorized scope/purpose/binding and accepted criteria source/version. Criteria have unique IDs, explicit fields/operators (equals, at-least, at-most) and scalar expected values. Numeric bounds require finite numbers; callers resolve compatible units. There are no default criteria, weighting, ranking or financial arithmetic.

Distinct Property snapshots contain unique fact fields, source/version, competent acceptance reference and explicit freshness/status. ACCEPTED is an assertion supplied by the caller, not source competence established here. Missing, stale, disputed, unaccepted and type-incompatible facts yield UNKNOWN. Known failing criteria yield NO_MATCH while criterion UNKNOWNs stay visible. MATCH requires every criterion known and satisfied.

Outputs preserve copied immutable inputs and explanations with source versions and SHA-256 over recursively key-sorted JSON. Explain verifies the digest and recomputation. Refresh advances one version, preserves scope and references the prior digest. Organization storage remains caller-owned; no database is selected. Field/participant access must be enforced before supplying facts and exposing snapshots.

Local tests are synthetic provider regression, not runtime qualification, business acceptance or Operator E2E.

## Trusted host integration

execute(action, request, context) requires an independent host-injected resolveScope callback plus authenticated principal_id and explicit evaluation time. Never deserialize that callback from user input. The host resolves the current organization binding, action grant, consumer/purpose, validity interval, allowed property IDs and fields, accepted criteria version and exact effective Source Authority Map. A request authorized=true is insufficient. Cross-organization facts are rejected. Current host time invalidates expired grants/maps and turns expired fact freshness into UNKNOWN. Access is checked again when explaining retained evidence. This is a deterministic reference enforcement boundary; the actual host/authentication/store adapter is NOT_QUALIFIED.

Host-resolved grants must explicitly be current, unrevoked, unheld and unstopped. Accepted criteria content must match exactly; a policy/version reference alone never authorizes altered thresholds. Source-map acceptance is bound to the exact Property ID, not transferable across properties. Snapshots retain trusted evaluated_at and source-map version. Explain preserves historical evaluation time while rechecking current read authority; only refresh performs fresh evaluation.

Each trusted source-map entry must bind the exact Property version and entire fact snapshot (organization, field, value, status, freshness, source and acceptance), with conflict=false and revoked=false. Fact values/status/deadlines cannot be supplied merely by reusing accepted references. Reconcile conflicting sources before evaluation. Trusted evaluated_at determines expiration without rewriting the original freshness evidence.

Explain and refresh require resolveSnapshot(digest), a trusted host callback loading the exact durable historical snapshot. Current read scope is rechecked, but historical source facts are not misrepresented as current observations. Refresh then independently resolves and evaluates current accepted facts; it never rewrites prior evidence. Both resolver callbacks are host-injected functions, never data supplied by an untrusted request.
