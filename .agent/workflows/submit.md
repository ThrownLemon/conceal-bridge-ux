---
description: Automate the process of committing changes, syncing with remote, and creating a PR using GitHub MCP.
---

# Submit Workflow

> **Purpose**: Streamline the process of saving work and opening a Pull Request.

## 1. Prepare Changes

1.  **Check Status**:
    - Run `git status` to see modified files.
    - Run `git branch --show-current` to confirm the current branch.
    - **Rule**: Do NOT commit directly to `main` or `master`. If on a protected branch, create a new feature branch using `git checkout -b feature/your-feature-name`.

2.  **Stage Files**:
    - Run `git add .` to stage all changes. (Or specify files if partial commit is desired).

## 2. Commit

1.  **Generate Message**:
    - Analyze the staged changes (use `git diff --cached` if needed).
    - Create a concise **Conventional Commit** message (e.g., `feat: add new wallet modal`, `fix: resolve layout issue`).
    - **Format**: `<type>(<scope>): <subject>`

2.  **Commit**:
    - Run `git commit -m "your message"`.

## 3. Sync with Remote

1.  **Push**:
    - Run `git push origin <current_branch>`.
    - If the upstream is not set, use `git push -u origin <current_branch>`.

## 4. Pull Request (GitHub MCP)

1.  **Check Existing PR**:
    - Use `mcp_github_list_pull_requests` filtering by `head=<owner>:<current_branch>` **and** `state=open` to check whether an **open** PR already exists.

2.  **Create PR**:
    - If NO open PR exists, use `mcp_github_create_pull_request`.
    - **Title**: Use the commit message or a human-readable title.
    - **Body**: dynamic summary of the changes.
    - **Base**: usually `main`.
    - **Draft**: `false` (unless requested otherwise).

3.  **Verify**:
    - Output the URL of the created (or existing) PR to the user.
