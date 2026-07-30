"""Coverage manifest endpoint (``/.well-known/scrubex.json``). Implemented in P10.

The machine-readable form of the trust claim: per format, which metadata
namespaces are detected, removed, kept deliberately, or unreachable, plus
engine versions, TTL values and a build identifier.

Its contents come from the per-format namespace audit produced by the parser
work in P4, which is why this phase follows it.
"""
