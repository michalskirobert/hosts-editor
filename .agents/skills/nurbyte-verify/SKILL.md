---
name: nurbyte-verify
description: Verify a NurByte change with application-specific tests and reproducible evidence.
---

Read .nurbyte/PROJECT.md and package scripts before running checks. Select checks by risk, not fixed test counts. Inspect database-dependent scripts before use; no production writes as tests. For UI interact with the running app and verify persistence. For DocFlow layout changes verify A4/PDF and editor selection. For permission or notification changes test two-user isolation and blocked sessions. For website performance retain accepted appearance and measure the same build repeatedly. Identify the exact tree/build and distinguish PASS, FAIL, SKIPPED and UNTESTED. Do not weaken tests to pass. New changes require appropriate retesting.
