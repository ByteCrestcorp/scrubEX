"""HTTP boundary, admission decisions, state transitions.

Owns: the HTTP surface, admission control, enforcement of legal state
transitions.

Does not own: parsing. **No parser is importable here** (invariant 4) --
the process that answers untrusted requests and holds Redis credentials
must not be the process that parses a hostile file.
"""
