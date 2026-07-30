"""Report schema and the verification pass. Implemented in P4b.

Owns: the three-category schema, canonical serialisation feeding
``report_hash``, and the verification pass.

Does not own: per-format stripping decisions.

Categories, and why there are three:

* ``privacy_metadata`` -- found and removed
* ``content_annotations`` -- found, not removed, because removal would change
  visible content
* ``residual_findings`` -- cannot be removed, each with a one-line reason

``file_properties`` (dimensions, format, size) is reported separately as
neutral facts, not findings.

The third category exists so verification has somewhere to put what it finds
instead of either hiding it or failing the job. It is the honest boundary of
what metadata stripping can reach -- never presented as a failure.
"""
