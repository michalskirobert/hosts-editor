---
name: hosts-editor-release
description: Prepare full Hosts Editor releases, descriptions, installers and coordinated website updates.
---

Compare the current source with the previous release. Confirm version and channels; do not infer a version bump from a branch name. Run appropriate checks and build native artifacts on supported runners. Check platform/architecture, hashes, actual signatures and update from the previous version with preserved settings and hosts backups in an isolated machine. Draft release notes only from actual changes; never include private data. Present commit, tag, notes, files and remaining limitations before requesting publication approval. Publishing tags/GitHub Release requires approval distinct from merge. Website/feed production update needs its own approval or explicit inclusion in a combined approval. Draft preparation does not authorize remote draft creation. Verify downloaded assets, feed and website version after publication; retry without overwriting published artifacts. Unavailable native platforms remain UNTESTED.


For version-affecting work read `.nurbyte/VERSIONING.md` before preparing commits/merge/release. Include old/new version and PATCH/MINOR/MAJOR rationale in approval. Prepare any bump before final tests and approval; no unapproved post-merge bump. Do not bump the core version twice when promoting DEV to stable.
