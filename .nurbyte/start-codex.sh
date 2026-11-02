#!/bin/sh
# Project-only fresh session using the invocation verified by the user.
PATH="/Users/robertmichalski/.volta/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin"
export PATH
PROJECT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd -P) || exit 1
case "$PROJECT" in
  /Users/robertmichalski/Workspace/projects/NurByte/hosts-editor|/Users/robertmichalski/Workspace/projects/NurByte/nurbyte-backoffice|/Users/robertmichalski/Workspace/projects/NurByte/docflow|/Users/robertmichalski/Workspace/projects/NurByte/nurbyte) ;;
  *) printf '%s\n' 'Odmowa: skrypt poza dozwolonym repozytorium NurByte.' >&2; exit 1 ;;
esac
cd -- "$PROJECT" || exit 1
exec codex --no-daemon --strict-config \
  --enable default_mode_request_user_input \
  --model gpt-5.6-luna \
  -c 'model_reasoning_effort="low"' \
  -c 'approvals_reviewer="auto_review"' \
  --sandbox workspace-write --ask-for-approval on-request \
  --disable shell_snapshot \
  -c 'allow_login_shell=false' \
  -c 'shell_environment_policy.set.PATH="/Users/robertmichalski/.volta/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin"'
