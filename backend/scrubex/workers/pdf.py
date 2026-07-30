"""PDF worker. Implemented in P4d.

pikepdf / qpdf. Info dictionary, XMP, embedded files, JavaScript, annotations,
incremental revisions.

Structural rebuild only -- never a re-render or re-encode (invariant 15).

Deliberately not combined with the office worker: PDF is a binary page format,
OOXML is a zip of XML parts. Structurally unrelated, different attack surfaces.
"""
