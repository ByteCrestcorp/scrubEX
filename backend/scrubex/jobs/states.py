"""Job state machine. Implemented in P1.

``UPLOADING -> INSPECTING -> REVIEWABLE -> CLEANING -> VERIFYING -> READY / FAILED``

Expiry is implicit via Redis TTL, so there is no ``EXPIRED`` state. There is no
``QUEUED`` state either: the backlog-depth admission rule works off live queue
depth at admission time rather than per-job tracking.

The API enforces legal transitions, not merely payload shape. ``clean`` is legal
only from ``REVIEWABLE`` (invariant 10).
"""
