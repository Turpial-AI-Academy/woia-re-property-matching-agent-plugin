# Validation

The W2 provider thin profile uses the official Ecosystem v0.5.4 plugin:certify-thin against a committed clean candidate. It validates Agent Plugins/Agent Skills, paths/payload, portable archive and all discovered provider tests. Authoring tests are excluded from the portable ZIP through /tests export-ignore.

Run mise run bootstrap and mise run doctor once for the pinned toolchain, mise run ci:fast before candidate commit and mise run release:check against the committed candidate. Thin certification is the central profile; container lanes are not required since maintenance portability is unchanged. No claim of host/storage qualification, Operator E2E, G6/G7 or Production Ready results from these gates.

Domain regressions cover deterministic evaluation, source versions, immutability, explicit criteria/consumer guards, stale/disputed/unaccepted/missing facts, UNKNOWN preservation, explain integrity/scope, refresh lineage/scope and rejection of forbidden dispatch/mutation actions.
