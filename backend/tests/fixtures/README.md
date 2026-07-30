# Test fixtures

Sample files for parser tests, including **malformed and hostile input**.
Deliberately empty at P0 — fixtures arrive with the phase that needs them, so
each one exists to exercise a specific documented control rather than to pad a
corpus.

| Phase | Fixtures needed | Verifies |
| --- | --- | --- |
| P2 | `.docm` renamed to `.docx` | V1, invariant 9 — rejected before reaching a worker |
| P2 | Extension and magic bytes disagreeing | V2, invariant 8 — classified by magic bytes |
| P2 | Zip bomb inside a DOCX | V3 — rejected at admission, no parse attempted |
| P2 | Zip entry with a traversing path | T18 — normalised-path check rejects it |
| P4b | DOCX with an external entity reference | V4 — no resolution, no outbound request |
| P4c | JPEG with GPS EXIF, IPTC, XMP, ICC | Report shows actual values (R1, R2) |
| P4c | Image with no metadata at all | R5 — says so plainly, does not imply failure |
| P4d | PDF with embedded JS, annotations, incremental revisions | Per-namespace coverage |
| P4e | DOCX with tracked changes, comments, `w:rsid`, thumbnail | `content_annotations` vs `privacy_metadata` split |
| P4e | Cleaned DOCX and PDF | G8 — opens correctly, visible content unchanged |

## Rules

- **Never commit a real user file.** Every fixture is synthetic or public-domain,
  and its provenance is stated where it is added.
- A fixture carrying an exploit payload is checked in **inert** — it exercises a
  parser path, it does not need to work.
- Fixture *filenames* may describe their content freely. Filenames are never
  logged at runtime (`security.md` "never logged"), so there is no conflict.
