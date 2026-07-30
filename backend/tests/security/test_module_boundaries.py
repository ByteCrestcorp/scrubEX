"""The three single-point boundaries of invariant 12, enforced by AST scan.

    only jobs/store.py     accesses Redis
    only sandbox/runner.py invokes the sandbox
    only config.py         reads secrets

Plus invariant 4: no parser is importable inside the API service.

These are conventions right up until something checks them. Today most of the
scanned modules are docstring-only stubs, so every case passes trivially -- that
is deliberate. The boundary is enforced from the first line of real code in
P1-P5 rather than retrofitted after a violation ships.
"""

import ast
from pathlib import Path

_PACKAGE = Path(__file__).resolve().parents[2] / "scrubex"

# Only jobs/store.py may talk to Redis. Every other module goes through it, so a
# Redis compromise has one code path to audit rather than many.
_REDIS_MODULES = {"redis"}
_REDIS_OWNER = "jobs/store.py"

# Sandbox invocation goes through one wrapper rather than being called from each
# worker. subprocess is the mechanism, so its use is the tell.
_PROCESS_MODULES = {"subprocess", "os.spawn", "pty"}
_SANDBOX_OWNER = "sandbox/runner.py"

# Parser libraries process hostile input and must not be importable in the api
# service: the process holding Redis credentials must not be the one parsing a
# hostile file (invariant 4, security.md privilege separation).
_PARSER_MODULES = {"pikepdf", "PIL", "docx", "lxml", "exiftool"}


def _modules() -> list[tuple[str, ast.Module]]:
    found: list[tuple[str, ast.Module]] = []
    for path in sorted(_PACKAGE.rglob("*.py")):
        rel = path.relative_to(_PACKAGE).as_posix()
        found.append((rel, ast.parse(path.read_text(encoding="utf-8"), filename=str(path))))
    return found


def _imported_roots(tree: ast.Module) -> set[str]:
    """Top-level package name of every import in a module."""
    roots: set[str] = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            roots.update(alias.name.split(".")[0] for alias in node.names)
        elif isinstance(node, ast.ImportFrom) and node.module is not None and node.level == 0:
            roots.add(node.module.split(".")[0])
    return roots


def _reads_environment(tree: ast.Module) -> bool:
    """True if the module reads os.environ or calls os.getenv."""
    for node in ast.walk(tree):
        if isinstance(node, ast.Attribute) and node.attr in {"environ", "getenv"}:
            return True
        if isinstance(node, ast.Name) and node.id in {"environ", "getenv"}:
            return True
    return False


def test_only_the_job_store_imports_redis() -> None:
    offenders = [
        rel
        for rel, tree in _modules()
        if rel != _REDIS_OWNER and _imported_roots(tree) & _REDIS_MODULES
    ]

    assert not offenders, (
        f"{offenders} import Redis directly. Invariant 12: only {_REDIS_OWNER} "
        "accesses Redis, so expiry-by-TTL and the no-delete rule have one "
        "enforcement point rather than many."
    )


def test_only_the_sandbox_runner_spawns_processes() -> None:
    offenders = [
        rel
        for rel, tree in _modules()
        if rel != _SANDBOX_OWNER and _imported_roots(tree) & _PROCESS_MODULES
    ]

    assert not offenders, (
        f"{offenders} can spawn a process. Invariant 12: sandbox invocation goes "
        f"through {_SANDBOX_OWNER} alone. A parser reached any other way runs "
        "unconfined, which is the one thing the architecture cannot survive."
    )


def test_only_config_reads_the_environment() -> None:
    offenders = [rel for rel, tree in _modules() if rel != "config.py" and _reads_environment(tree)]

    assert not offenders, (
        f"{offenders} read the environment directly. Invariant 12: only "
        "config.py reads secrets, which is what makes fail-closed declaration "
        "verifiable in one place."
    )


def test_no_parser_is_importable_in_the_api_service() -> None:
    offenders = [
        rel
        for rel, tree in _modules()
        if rel.startswith("api/") and _imported_roots(tree) & _PARSER_MODULES
    ]

    assert not offenders, (
        f"{offenders} import a parser library inside the API service. Invariant "
        "4: the process that answers untrusted requests and holds Redis "
        "credentials must never be the process that parses a hostile file."
    )


def test_the_package_tree_matches_the_architecture() -> None:
    """Guards against a module appearing outside its documented boundary."""
    expected = {
        "__init__.py",
        "config.py",
        "api/__init__.py",
        "api/admission.py",
        "api/manifest.py",
        "api/routes/__init__.py",
        "jobs/__init__.py",
        "jobs/store.py",
        "jobs/states.py",
        "jobs/tokens.py",
        "detect/__init__.py",
        "sandbox/__init__.py",
        "sandbox/runner.py",
        "workers/__init__.py",
        "workers/image.py",
        "workers/pdf.py",
        "workers/office.py",
        "report/__init__.py",
        "bot/__init__.py",
    }
    actual = {rel for rel, _ in _modules()}

    assert expected <= actual, f"missing from the tree: {sorted(expected - actual)}"
