---
name: woia-re-property-matching
description: Evaluate, explain and refresh property matches using explicit accepted criteria and immutable source evidence for Sales, Leasing and Customer Service. A match never grants availability, authority or acceptance.
license: MIT
---

# Property matching

1. Resolve authorized Sales, Leasing or Customer Service scope, purpose and binding. Read [the contract](references/contract.md) before evaluating protected facts or refreshing evidence.
2. Obtain accepted, versioned criteria and scoped Property facts from competent sources. Never invent weights, thresholds, defaults or organization criteria. Domain Contracts owns canonical identities and Source Authority schemas.
3. Invoke `execute('property-match.evaluate', input)` from [the helper](scripts/matching.mjs). Explicit equality/numeric bounds compare deterministically; missing, unaccepted, disputed, stale or type-incompatible facts remain UNKNOWN.
4. Explain with `property-match.explain` using original authorized scope and integrity-checked evidence. Refresh with `property-match.refresh` using the same evaluation identity, next version and prior digest. Preserve all earlier snapshots.
5. Report criteria-level reasons, source versions and UNKNOWNs. MATCH never grants availability, authority, acceptance or an external Effect. Customer Service alone communicates externally via Communications. Never book, negotiate, publish, accept, charge or contact.

This pure offline helper consumes caller assertions. Resolve their authority through qualified organization Source Authority/access controls; this package cannot grant authority or prove runtime enforcement.

The helper requires a trusted host-injected resolver context (authenticated principal, explicit time, current grants, exact effective source map and allowed properties/fields). Request authorization booleans never suffice. See the trusted-host section of the contract before integrating any inputs.
