"""Three-stage admission funnel. Implemented in P2.

Each stage rejects before spending the resource it protects: edge (Cloudflare),
pre-flight capacity check before any file bytes are accepted, then bounded
backlog depth tied to the TTL contract.

Every rejection returns one generic response plus ``retry_after``. It never
reveals which limit fired -- that feedback loop is what an attacker needs to
tune request timing (T7, T16).
"""
