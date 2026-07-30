"""ScrubEX backend.

Package boundaries follow the folder-ownership table in
``context/architecture.md``. Three of those boundaries are invariants
rather than conventions (invariant 12):

* only ``jobs.store`` accesses Redis
* only ``sandbox.runner`` invokes bubblewrap
* only ``config`` reads secrets

``tests/security/test_module_boundaries.py`` enforces all three by AST scan.
"""
