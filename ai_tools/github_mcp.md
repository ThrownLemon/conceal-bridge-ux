# GitHub MCP Integration Guide

## Overview

The GitHub MCP server provides a comprehensive set of tools to interact with GitHub repositories, issues, pull requests, and more directly from your AI agent.

## Available Tools

### Repository Management

#### `create_repository`

Create a new GitHub repository in your account or organization.

#### `fork_repository`

Fork an existing repository to your account or organization.

#### `list_branches`

List all branches in a repository.

#### `create_branch`

Create a new branch from an existing one.

#### `get_file_contents`

Read the contents of a file or directory from a repository.

#### `create_or_update_file`

Create or update a single file in a repository.

#### `delete_file`

Delete a file from a repository.

#### `push_files`

Push multiple files to a repository in a single commit.

#### `search_repositories`

Find repositories by name, description, or topic.

### Issues Management

#### `list_issues`

List issues in a repository with filtering options.

#### `issue_read`

Get details of a specific issue, including comments and labels.

#### `issue_write`

Create a new issue or update an existing one.

#### `add_issue_comment`

Add a comment to an issue.

#### `search_issues`

Search for issues using GitHub's search syntax.

#### `assign_copilot_to_issue`

Assign GitHub Copilot to work on a specific issue.

#### `sub_issue_write`

Manage sub-issues (add, remove, reprioritize).

### Pull Request Management

#### `list_pull_requests`

List pull requests in a repository.

#### `pull_request_read`

Get details, diffs, status, or files of a pull request.

#### `create_pull_request`

Create a new pull request.

#### `update_pull_request`

Update an existing pull request (title, body, state, base branch).

#### `merge_pull_request`

Merge a pull request.

#### `pull_request_review_write`

Create, submit, or delete a review for a pull request.

#### `add_comment_to_pending_review`

Add a comment to a pending review.

#### `update_pull_request_branch`

Update a PR branch with the latest changes from base.

#### `request_copilot_review`

Request an automated code review from GitHub Copilot.

#### `search_pull_requests`

Search for pull requests.

### Git Operations & History

#### `list_commits`

List commits on a branch.

#### `get_commit`

Get details of a specific commit.

#### `list_tags`

List tags in a repository.

#### `get_tag`

Get details of a specific tag.

#### `list_releases`

List releases in a repository.

#### `get_latest_release`

Get the latest release.

#### `get_release_by_tag`

Get a specific release by tag.

### Search & Discovery

#### `search_code`

Search for code across GitHub repositories.

#### `search_users`

Find GitHub users.

### Teams & User

#### `get_me`

Get details of the authenticated user.

#### `get_teams`

Get teams the user is a member of.

#### `get_team_members`

Get members of a specific team.

## Best Practices

1. **Context is Key**: When creating issues or PRs, provide clear and descriptive titles and bodies.
2. **Safety First**: Be careful with destructive actions like `delete_file` or `merge_pull_request`.
3. **Search Efficiently**: Use the specific search tools (`search_code`, `search_issues`, etc.) for better results than general queries.
4. **Pull Requests**: Use `pull_request_read` with `method='get_diff'` to understand changes before reviewing or merging.
