# Workflow source

Read GIT-CHECKLIST.md. It is the sole task/approval sequence; do not reload duplicate workflow documents.

## Human manual commits
The user explicitly authorizes unrestricted HUMAN local commits, including directly on dev/master, without an agent task assignment and with arbitrary messages/content. NurByte pre-commit, commit-msg and pre-push checks therefore apply only to Codex-marked processes (NURBYTE_AGENT=1 or CODEX_THREAD_ID). This opt-out includes local secret scanning for human commits; the human accepts responsibility for the content. Human terminal pushes are also exempt from local AI pre-push checks; remote protections are unchanged.

The AI must retain and propagate its markers, use its assigned task branch, scan staged content and follow commit format. It must never unset/forge markers, strip its environment, use --no-verify, disable hooks or ask a helper/other agent to impersonate the human to evade restrictions. Human manual commits do not authorize subsequent AI pushes, merges, releases or production changes. Marker detection is a local convenience, NOT a tamper-proof identity boundary. A process with the same user permissions can defeat it; do not claim technical separation of human and AI accounts.
