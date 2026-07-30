"""The sole Redis access point (invariant 12). Implemented in P1.

Holds ``job:{job_id}``, ``upload:{upload_id}``, ``queue:{format}`` and the
admission counters.

**No code path here deletes a job record** (invariant 1). Expiry is performed
by Redis key TTL alone, which is what makes non-retention a database guarantee
rather than application code that has to remember to run. If every worker
crashed and the API went down, records would still expire on schedule.
"""
