# Plan, progress and completion

Before implementation present 3–6 concrete stages, including required verification and the final review/merge gate. Wait for the user's solution-plan approval unless the same plan is already explicitly approved. Use the native plan tracker if available; otherwise a short numbered list. No separate plan for trivial factual answers. Read-only diagnosis may precede the plan.

At meaningful transitions state: completed stages, current activity, next stage. Keep it to 1–3 lines; do not poll models just to report status. During lengthy work provide a useful update at least every 60 seconds when possible. A command's silence alone does not establish a hang.

Counts describe their scope: 'implementation 8/8; verification 0/3', never 'task 8/8 done' while tests, review or required delivery remain. If new required work is discovered, update the plan and explain the change before declaring completion. Completed subagents do not mean the parent task is finished.

After plan approval execute necessary scoped tests autonomously. At transition say 'Implementation is complete; now running the agreed tests', not 'Should I run the tests?' Ask only for a new scope, destructive/external effect, missing access/decision or a required runtime permission. Do not rerun a valid unchanged full suite merely for status. Production tests/migrations are not implicitly authorized.

When blocked, investigate and continue independent authorized work. For each remaining blocker name the failed check, next diagnostic/fix, and dependency/owner. Distinguish within-scope fixes to perform now from unrelated work requiring a new assignment. Never stop with only a list of failures when useful authorized diagnosis remains. Do not change tests to hide failures, remove guards, expose secrets or clean unrelated edits. Unknown causes remain unknown.

Every task-ending reply is mandatory and concise, in the user's language:
- STATUS: complete / ready for final acceptance / blocked / needs plan approval.
- DONE: implemented scope and real PASS/FAIL/SKIPPED/UNTESTED checks.
- REMAINING: explicit unfinished stages; say 'none' only if true.
- NEXT: one concrete action and who performs it. If blocked, explain what enables resumption. If no user action is needed and work remains authorized, continue rather than ending the task.
- DECISION: if work remains when yielding, end with a concrete question about taking that next scope or the missing decision/access. If nothing remains, explicitly confirm completion.
Include actual Git/release state when relevant. If everything is ready, present the one scoped final acceptance from GIT-CHECKLIST.md. Never imply a local build is a deployed release. Notifications signal attention, not success; no sensitive content.

Example for blocked verification (illustrative, not current project evidence):
'BLOCKED — implementation complete, full verification incomplete. Passed: editor checks 3/3. Remaining: diagnose 403 vs 404, verify local HTTPS setup, inspect scanner false positives without printing values. Next: investigate the test mismatch in scope; unrelated access/contract changes need a separate assignment. Merge has not happened.'

If a task-ending reply lists remaining work, ALWAYS end with a concrete question asking whether to take that next scope now (or the specific missing decision/access). Name the proposed work; never end with only a blocker list or a vague offer. Do not stop already-approved work just to ask again: this rule applies when yielding back to the user. If nothing remains, explicitly say the task is complete without inventing another question.
