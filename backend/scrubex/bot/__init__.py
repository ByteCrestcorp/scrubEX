"""Telegram client. Implemented in P5.

Owns: Telegram presentation and per-chat fairness.

Does not own: job state. **It has no Redis access** -- a thin client exactly
like the web frontend, handling file bytes as a pipe but never parsing them.

Per-chat fairness uses in-memory counters that are never persisted, so Telegram
identity never crosses the API boundary; the API treats the bot as a single
client with an elevated budget. That constrains the service to **exactly one
replica** -- two would split the counters and double the effective per-chat
allowance. It is the one deliberately stateful component in the system.
"""
