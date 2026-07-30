"""Office worker: docx. Implemented in P4e.

python-docx and lxml, editing the OOXML zip directly -- the package is never
opened, rendered or laid out, so fidelity cannot drift (invariant 15). This is
why LibreOffice headless was rejected.

Touches ``docProps/core.xml``, ``app.xml``, ``custom.xml``; strips ``w:rsid``
from ``document.xml`` and ``w:rsids`` from ``settings.xml`` (they correlate
documents edited in the same session and sit outside ``docProps/``); deletes
``docProps/thumbnail.jpeg`` if present, since an embedded first-page preview is
a visual content leak that survives a properties-only strip.

DTD processing and external entity resolution are disabled (T3).

Tracked changes, comments and hidden content are reported under
``content_annotations`` and left intact: removing them would alter visible
document content, which is a different action from metadata scrubbing.
"""
