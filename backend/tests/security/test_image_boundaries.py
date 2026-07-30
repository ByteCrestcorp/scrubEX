"""Invariant 4 at the *image* level, not just the source level.

``test_module_boundaries.py`` proves no module under ``api/`` imports a parser.
That is necessary and insufficient: if the Dockerfile installs every dependency
into every target, a parser is still *importable* inside the API service, and
invariant 4 reads "no parser is importable inside the API service".

This file asserts the partition that keeps that true -- each target installing
only its own poetry groups. It caught a real violation during P0, where a single
shared dependency stage put pikepdf, Pillow, python-docx and lxml into the api
and bot images.

Static assertions against the Dockerfile and pyproject, so they run in CI without
a Docker daemon. The runtime confirmation is in ``infra/README.md``.
"""

import tomllib
from pathlib import Path

import pytest

_ROOT = Path(__file__).resolve().parents[3]
_DOCKERFILE = _ROOT / "infra" / "docker" / "backend.Dockerfile"
_PYPROJECT = _ROOT / "backend" / "pyproject.toml"

_PARSER_GROUPS = {"parser-image", "parser-pdf", "parser-office"}
_PARSER_PACKAGES = {"pikepdf", "pillow", "python-docx", "lxml"}

# target -> groups it is allowed to install
_EXPECTED: dict[str, set[str]] = {
    "api": {"main", "api"},
    "bot": {"main", "bot"},
    "worker-image": {"main", "worker", "parser-image"},
    "worker-pdf": {"main", "worker", "parser-pdf"},
    "worker-office": {"main", "worker", "parser-office"},
}


def _stage_instructions() -> dict[str, list[str]]:
    """Map each build stage to its instruction lines, comments excluded.

    Comments are dropped deliberately: prose *about* bubblewrap is expected in
    this file, and an earlier version of this test matched the word inside a
    comment block and failed the api target for discussing what it does not have.
    Only real instructions carry meaning here.
    """
    stages: dict[str, list[str]] = {}
    stage: str | None = None

    for raw in _DOCKERFILE.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        lowered = line.lower()
        if lowered.startswith("from ") and " as " in lowered:
            stage = lowered.rsplit(" as ", 1)[1].strip()
            stages[stage] = []
        elif stage is not None:
            stages[stage].append(line)
    return stages


def _install_groups() -> dict[str, set[str]]:
    """Map each `deps-<role>` stage to the groups its poetry install selects."""
    found: dict[str, set[str]] = {}
    for stage, lines in _stage_instructions().items():
        if not stage.startswith("deps-"):
            continue
        for line in lines:
            if "poetry install" in line and "--only " in line:
                spec = line.split("--only ", 1)[1].split()[0]
                found[stage.removeprefix("deps-")] = set(spec.split(","))
    return found


@pytest.fixture(scope="module")
def declared_groups() -> set[str]:
    data = tomllib.loads(_PYPROJECT.read_text(encoding="utf-8"))
    groups: dict[str, object] = data["tool"]["poetry"].get("group", {})
    return set(groups)


def test_every_target_partitions_its_dependencies() -> None:
    """No target installs the full dependency set."""
    actual = _install_groups()

    assert actual == _EXPECTED, (
        "the Dockerfile's per-role dependency partition changed.\n"
        f"  expected: {_EXPECTED}\n  actual:   {actual}\n"
        "Installing the full set in any target makes a parser importable where it "
        "must not be."
    )


@pytest.mark.parametrize("role", ["api", "bot"])
def test_credentialled_and_client_roles_get_no_parser(role: str) -> None:
    """Invariant 4, and the privilege inversion behind it.

    The process holding credentials must not be the process parsing a hostile
    file, and the bot is a thin client that never parses at all.
    """
    groups = _install_groups().get(role, set())

    assert not groups & _PARSER_GROUPS, (
        f"the {role} target installs parser group(s) {sorted(groups & _PARSER_GROUPS)}. "
        "Invariant 4: no parser is importable inside the API service, and the bot "
        "holds no parser tooling either."
    )


def test_the_bot_does_not_even_receive_the_redis_library(declared_groups: set[str]) -> None:
    """security.md privilege separation: the bot holds no Redis credentials.

    It has no reason to carry the client library either, and its absence makes an
    accidental direct-Redis call in P5 a build error rather than a review catch.
    """
    data = tomllib.loads(_PYPROJECT.read_text(encoding="utf-8"))
    bot_deps = data["tool"]["poetry"]["group"]["bot"]["dependencies"]

    assert "redis" not in bot_deps, (
        f"the bot dependency group gained redis: {sorted(bot_deps)}. The bot "
        "reaches the API by service name and never touches job state directly."
    )


def test_parser_packages_live_only_in_parser_groups(declared_groups: set[str]) -> None:
    """A parser added to `main` would reach every image silently."""
    data = tomllib.loads(_PYPROJECT.read_text(encoding="utf-8"))
    poetry = data["tool"]["poetry"]

    shared = set(poetry["dependencies"]) - {"python"}
    leaked = {pkg for pkg in shared if pkg.lower() in _PARSER_PACKAGES}
    assert not leaked, (
        f"parser package(s) {sorted(leaked)} are in the shared `main` group, so "
        "every image gets them. Parsers belong in a parser-* group."
    )

    for group in declared_groups - _PARSER_GROUPS:
        deps = set(poetry["group"][group]["dependencies"])
        leaked = {pkg for pkg in deps if pkg.lower() in _PARSER_PACKAGES}
        assert not leaked, f"group `{group}` contains parser package(s) {sorted(leaked)}"


@pytest.mark.parametrize("target", ["api", "bot"])
def test_no_bubblewrap_in_the_api_or_bot_images(target: str) -> None:
    """Only worker targets install bubblewrap.

    The api and bot never invoke a sandbox because they never parse. Shipping the
    binary there would be an unused privilege-adjacent tool in an
    internet-reachable image.
    """
    stages = _stage_instructions()
    assert target in stages, f"target {target} is gone from the Dockerfile"

    installs = [line for line in stages[target] if "bubblewrap" in line]

    assert not installs, (
        f"the {target} target installs bubblewrap: {installs}. Only worker targets "
        "invoke a sandbox, because only they parse."
    )
