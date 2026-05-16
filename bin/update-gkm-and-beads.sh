#!/usr/bin/env bash
# update-gkm-and-beads.sh
#
# Refresh the agent prompts, skills, lib scripts, and run-all launcher of an
# EXISTING gkm-scaffolded project to the latest templates shipped with this
# repository. Project source files (package.json, src/**, infra, deploy
# configs) are NOT touched.
#
# Usage:
#   bash bin/update-gkm-and-beads.sh                 # from project umbrella
#   bash bin/update-gkm-and-beads.sh --pkg-manager yarn
#   bash bin/update-gkm-and-beads.sh --provider claude --vsc
#
# Run from one of:
#   - the umbrella directory  (e.g. ~/code/my-app)        — must contain main/
#   - the main worktree       (e.g. ~/code/my-app/main)   — autodetected
#
# What it refreshes:
#   - agents/<role>/AGENTS.md + prompt.txt + run.sh   (boss, manager, ...)
#   - agents/lib/*.sh                                  (validator, uniqueness,
#                                                       merge-and-close,
#                                                       stale-task-monitor)
#   - agents/run-all.sh
#   - agents/SKILLS.md
#   - .agents/skills/**                                (resync from sources)
#   - provider config (.claude, .codex, .cursor, .pi) if --provider passed
#   - .vscode/tasks.json if --vsc
#   - Warp launch config if --warp
#
# What it preserves:
#   - package.json, src/**, infra/**, .env files
#   - existing per-agent worktrees in wt/<lane>
#   - .beads/ database and history
#   - existing git history and uncommitted work
#
# What it does NOT do:
#   - install dependencies (run `<pkg-manager> install` after merging changes)
#   - auto-commit the diff (left staged-free for review)
#   - destroy any worktree, branch, or beads metadata
#
# Forwards all flags to init-gkm-and-beads.sh except those it owns. Adds the
# --update flag automatically.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INIT_SCRIPT="$SCRIPT_DIR/init-gkm-and-beads.sh"

if [[ ! -f "$INIT_SCRIPT" ]]; then
  echo "Error: init-gkm-and-beads.sh not found at $INIT_SCRIPT" >&2
  exit 1
fi

# Light pre-flight so the user gets a clear error before delegating to init.
if [[ ! -d "$(pwd)/main" && ! "$(basename "$(pwd)")" == "main" ]]; then
  echo "Error: run this from a project umbrella (containing main/) or from inside main/." >&2
  echo "       cwd: $(pwd)" >&2
  exit 1
fi

if [[ -d "$(pwd)/main" ]]; then
  _main="$(pwd)/main"
else
  _main="$(pwd)"
fi

if [[ ! -d "$_main/.git" && ! -f "$_main/.git" ]]; then
  echo "Error: '$_main' is not a git working tree." >&2
  exit 1
fi

# Warn if the working tree has uncommitted changes — refresh will overlay new
# content into agents/ + .agents/, which may collide. User chooses.
if ! git -C "$_main" diff --quiet 2>/dev/null || ! git -C "$_main" diff --cached --quiet 2>/dev/null; then
  echo "⚠  Uncommitted changes detected in $_main"
  echo "   Refresh will overwrite agents/ + .agents/ in place. Untracked"
  echo "   files outside those paths are safe. Continue? [y/N]"
  read -r _reply
  if [[ ! "$_reply" =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
  fi
fi

exec bash "$INIT_SCRIPT" --update "$@"
