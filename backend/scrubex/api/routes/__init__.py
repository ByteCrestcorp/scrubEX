"""Route handlers for the Core Job API.

Endpoint surface is fixed by ``architecture.md`` "API contracts" and is the
single source both clients are generated from. Implemented in P3.

Error responses fall into exactly three buckets, and the distinction is
deliberate: admission rejections collapse to one generic response so an
attacker cannot calibrate; request facts stay specific because they reveal
nothing the user could not learn from their own file; job-state responses
collapse to one generic response so there is no enumeration oracle.
"""
