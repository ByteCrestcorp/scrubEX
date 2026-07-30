"""The sole bubblewrap invocation point (invariant 12). Implemented in P4a.

The primary containment control, and the reason a parser compromise is
survivable. The design assumes parser compromise *will* happen and caps what it
costs.

One file, one job, one sandbox, destroyed on completion or failure and never
reused (invariant 6). Mount, PID, network and user namespaces plus seccomp.
Non-root, all capabilities dropped, no-new-privileges. No network interface,
resolver or route. No inherited secrets (invariant 5). Read-only bind mount of
exactly one file, separate write-only output path, tmpfs only. CPU, memory,
disk, process-count and wall-clock limits. Teardown covers crash and timeout,
not just clean exit.

Code running in here is assumed compromised.
"""
