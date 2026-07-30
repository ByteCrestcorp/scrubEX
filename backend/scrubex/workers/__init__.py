"""Per-format job orchestration.

Owns: orchestration of a job through inspect, strip and verify.

Does not own: direct parser execution. **Parsers run inside the sandbox** --
a worker holds Redis credentials, so it must never be the process parsing a
hostile file. That inversion is deliberate and must not be collapsed for
convenience.

Workers are organised by file format, not by channel, and hold no state that
assumes they are the only replica running.
"""
