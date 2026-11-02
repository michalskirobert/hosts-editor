# Complete a reviewed task

Prepare a JSON plan inside the assigned repo (locally ignored file), with fields:
repo (owner/name), source, target (dev/master), sha (full commit), base_sha (reviewed remote target), version, deployment (actual effects), title, body (PR description), checks (list of {name, result: PASS, sha}). Include only genuine checks; no invented PASS. CI is additionally verified on GitHub; branch protection remains authoritative.

`python3 .nurbyte/finish.py --plan PATH` displays the plan/digest without remote action. Show the user result, checks and full scope: push, PR, merge, checkout/sync and local/remote source deletion. After explicit final acceptance run `python3 .nurbyte/finish.py --plan PATH --approved-plan DIGEST` in the required execution approval context. The digest binds the plan, not user identity. Do not store secrets in the plan or print raw failure output. Never approve a digest on the user's behalf.

The helper stops on pending/failed CI; inspect CI before resuming with the same approved digest. A changed plan/SHA needs renewed acceptance. Merge commits are required for safe ancestry-based cleanup; repositories that disallow them stop rather than silently squash. A dirty checkout must be preserved/resolved before the final process; do not stage unrelated configuration, stash, reset or clean. Target movement stops execution/cleanup. Remote deletion uses an exact expected-SHA lease solely for deleting the merged task ref, never rewriting a branch. No production tag, release or migration is implied.

Colors are printed in a real terminal: cyan running, yellow waiting, red blocked, green done. No background LLM polling or hang inference. Native Codex permission prompts may still appear.

Measure three comparable tasks (small fix, feature, merge-only): model/effort actually used, total usage when exposed, tool-call count, elapsed time and rework. Do not convert subscription percentage to token/API cost. No server telemetry or external upload.
