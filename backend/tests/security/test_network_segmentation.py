"""Topology-level security controls in ``infra/compose.yml``.

The two-network split is the control that denies parser workers any route to the
internet. It is topological rather than firewall-based, which means it cannot
drift out of sync with intent -- but it *can* be edited away, silently and with
no visible symptom. Hence this file.

Read against `security.md` network security and the boundary table: boundary 4
(the sandbox) caps what a compromise costs; boundary 3 (this network) removes the
exfiltration path after one.
"""

from pathlib import Path
from typing import Any

import pytest
import yaml

_COMPOSE = Path(__file__).resolve().parents[3] / "infra" / "compose.yml"

_HARDENING_EXEMPT: frozenset[str] = frozenset()


@pytest.fixture(scope="module")
def compose() -> dict[str, Any]:
    assert _COMPOSE.is_file(), f"missing {_COMPOSE}"
    loaded: Any = yaml.safe_load(_COMPOSE.read_text(encoding="utf-8"))
    assert isinstance(loaded, dict)
    return loaded


@pytest.fixture(scope="module")
def services(compose: dict[str, Any]) -> dict[str, dict[str, Any]]:
    found: Any = compose.get("services", {})
    assert isinstance(found, dict)
    return found


def _networks_of(service: dict[str, Any]) -> list[str]:
    declared: Any = service.get("networks", [])
    if isinstance(declared, dict):
        return list(declared)
    if isinstance(declared, list):
        return [str(n) for n in declared]
    return []


def test_core_network_is_internal(compose: dict[str, Any]) -> None:
    """Invariant 3. Without this, worker egress denial does not exist."""
    core: Any = compose.get("networks", {}).get("core")

    assert isinstance(core, dict), "the `core` network is gone from compose.yml"
    assert core.get("internal") is True, (
        "`core` is no longer declared internal: true. Redis and every parser "
        "worker now have a route to the internet, which removes the control that "
        "constrains XXE/SSRF blast radius and the easy exfiltration path after a "
        "parser compromise. This is a security incident, not a config tweak."
    )


def test_only_the_api_spans_both_networks(services: dict[str, dict[str, Any]]) -> None:
    spanning = [
        name for name, service in services.items() if {"edge", "core"} <= set(_networks_of(service))
    ]

    assert spanning == ["api"], (
        f"expected only `api` on both networks, found {spanning}. The api must "
        "answer edge traffic and reach Redis; nothing else has a reason to bridge "
        "the boundary."
    )


def test_the_bot_is_not_on_the_core_network(services: dict[str, dict[str, Any]]) -> None:
    """security.md privilege separation: the bot holds no Redis credentials."""
    bot = services.get("bot")
    assert bot is not None, "the bot service is gone from compose.yml"

    assert "core" not in _networks_of(bot), (
        "the bot is on the `core` network. It is a thin client, exactly like the "
        "web frontend: no Redis credentials, no direct access to job state or "
        "queues. Putting it on core reopens the anonymity question the "
        "bot-as-single-client admission model was designed to close."
    )

    environment: Any = bot.get("environment", {})
    keys = set(environment) if isinstance(environment, dict) else set()
    assert not {k for k in keys if "REDIS" in k.upper()}, (
        f"the bot service was given Redis environment: {sorted(keys)}"
    )


def test_no_service_mounts_the_docker_socket(services: dict[str, dict[str, Any]]) -> None:
    """Root-equivalent on the host, and explicitly locked against."""
    offenders = [
        name
        for name, service in services.items()
        if any("docker.sock" in str(volume) for volume in service.get("volumes", []) or [])
    ]

    assert not offenders, (
        f"{offenders} mount docker.sock, which is root-equivalent on the host. "
        "The per-job sandbox is an in-process bubblewrap namespace precisely so "
        "that nothing needs container-spawning rights."
    )


def test_redis_has_no_persistence_volume(services: dict[str, dict[str, Any]]) -> None:
    """Invariant 2, at the topology level rather than the config level."""
    redis = services.get("redis")
    assert redis is not None, "the redis service is gone from compose.yml"

    data_mounts = [
        volume
        for volume in redis.get("volumes", []) or []
        if str(volume).rstrip("/:ro").endswith("/data")
    ]
    assert not data_mounts, (
        f"redis /data is backed by a volume: {data_mounts}. It must be tmpfs, so "
        "there is deliberately nowhere to persist even if a future edit "
        "re-enabled snapshotting."
    )

    tmpfs = [str(entry) for entry in redis.get("tmpfs", []) or []]
    assert any("/data" in entry for entry in tmpfs), (
        "redis /data is no longer tmpfs. Expired job data could survive a restart."
    )


def test_every_service_is_hardened(services: dict[str, dict[str, Any]]) -> None:
    """A parser compromise is assumed, so nothing relies on good behaviour."""
    failures: list[str] = []

    for name, service in services.items():
        if name in _HARDENING_EXEMPT:
            continue
        if service.get("read_only") is not True:
            failures.append(f"{name}: read_only is not true")
        if service.get("cap_drop") != ["ALL"]:
            failures.append(f"{name}: cap_drop is not [ALL]")
        opts = [str(o) for o in service.get("security_opt", []) or []]
        if not any("no-new-privileges" in o for o in opts):
            failures.append(f"{name}: no-new-privileges missing")
        if "user" not in service:
            failures.append(f"{name}: runs without an explicit non-root user")

    assert not failures, "hardening regressed:\n  " + "\n  ".join(failures)


@pytest.mark.parametrize("variable", ["REDIS_PASSWORD", "PUBLIC_API_URL"])
def test_required_secrets_are_declared_fail_closed(variable: str) -> None:
    """T15: the stack refuses to start rather than defaulting insecurely.

    Asserted against the raw text, because YAML parsing discards the ``:?``
    substitution syntax that carries the meaning.
    """
    raw = _COMPOSE.read_text(encoding="utf-8")

    assert f"${{{variable}:?" in raw, (
        f"{variable} is no longer declared with `:?` in compose.yml. A missing "
        "value must stop the stack, not fall back to something insecure."
    )
    assert f"${{{variable}:-" not in raw, (
        f"{variable} was given a default via `:-`. Required secrets have no "
        "defaults, in compose, in .env.example, and in scrubex/config.py."
    )
