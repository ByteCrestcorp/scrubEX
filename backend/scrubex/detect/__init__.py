"""Type identification from bytes, and rejection. Implemented in P2.

Owns: magic-byte typing (invariant 8 -- extension and client-declared MIME are
never trusted, on either channel), macro rejection by zip inspection
(invariant 9), archive ceilings, normalised-path checks.

Does not own: metadata extraction.

Validation reduces how many files reach a parser. It never certifies one as
safe -- a structurally valid PDF, JPEG or OOXML package can still exploit the
parser reading it, which is why the sandbox exists.
"""
