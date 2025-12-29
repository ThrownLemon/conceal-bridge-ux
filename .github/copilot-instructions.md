# GitHub Copilot Instructions

## Issue Tracking with GitHub Issues

This project uses **GitHub Issues** for issue tracking.

### Essential Commands

```bash
# List open issues
gh issue list

# View issue details
gh issue view <number>

# Create a new issue
gh issue create --title "Title" --body "Description"

# Close an issue
gh issue close <number>
```

### Workflow

1. **Check open issues**: `gh issue list`
2. **Claim task**: Assign yourself to an issue
3. **Work on it**: Implement, test, document
4. **Complete**: Close the issue with a PR reference

### Labels

- `bug` - Something isn't working
- `enhancement` - New feature or improvement
- `documentation` - Documentation updates
- `priority:high` - Urgent issues
- `priority:low` - Backlog items

### Git Workflow

- Always reference issue numbers in commits: `fix: resolve login bug (#42)`
- PRs should close issues automatically: `Closes #42`

## Important Rules

- Use GitHub Issues for ALL task tracking
- Reference issue numbers in commits and PRs
- Keep issues updated with progress
