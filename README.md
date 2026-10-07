# woia-re-property-matching

Evaluation-only Real Estate provider v0.5.0 for Sales, Leasing and Customer Service.

Actions: property-match.evaluate, property-match.explain, property-match.refresh. Explicit accepted criteria are compared against versioned, scoped facts. Stale, disputed, unaccepted or missing facts remain UNKNOWN. No criteria, score weighting, business rules or organization authority are invented.

Use [the skill](skills/woia-re-property-matching/SKILL.md) and [contract](skills/woia-re-property-matching/references/contract.md). The pure helper needs Node.js with standard crypto support and has no package/network dependency. It returns immutable digest-linked snapshots; organization-qualified storage/access/source authority remain caller responsibilities. A matching property is not proven available, authorized or accepted. External contact remains Customer Service through Communications.

Canonical Real Estate semantics stay in woia-re-domain-contracts; this provider adds no authority service, database or orchestration layer. No runtime adapter is qualified by these synthetic tests.

Maintenance: mise run bootstrap, mise run doctor, mise run ci:fast; after committing an exact clean candidate, run Ecosystem v0.5.4 plugin:certify-thin with --repo pointing here. Maintenance validation is documented in VALIDATION.md. There are no tags/releases/admission in the implementation gate.
