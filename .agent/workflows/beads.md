---
description: Workflow for issue tracking and task management with bd (beads)
---

# Beads Workflow

1. **Check ready work**: `bd ready` shows unblocked issues
2. **Confirm with user**: Ask the user if they want to work on any of the ready issues before continuing
3. **Claim your task**: `bd update <id> --status in_progress`
4. **Work on it**: Implement, test, document
5. **Discovered new work?** Create linked issue:
   - `bd create "Found bug" -p 1 --deps discovered-from:<parent-id>`
6. **Complete**: `bd close <id> --reason "Done"`
7. **Commit together**: Always commit the `.beads/issues.jsonl` file together with the code changes so issue state stays in sync with code state

## Important Rules

- ✅ Use bd for ALL task tracking
- ✅ Always use `--json` flag for programmatic use
- ✅ Link discovered work with `discovered-from` dependencies
- ✅ Check `bd ready` before asking "what should I work on?"
- ✅ Run `bd <cmd> --help` to discover available flags
- ❌ Do NOT create markdown TODO lists
- ❌ Do NOT use external issue trackers
- ❌ Do NOT duplicate tracking systems
- ❌ Do NOT clutter repo root with planning documents
