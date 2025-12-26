---
description: Markdown Creation & Editing Workflow
---

# Markdown Workflow

> **Purpose**: Ensure all documentation follows consistent styling and passes linting criteria.

## 1. Structure

1.  **Top-Level Heading**: Every file must start with a `# Heading`.
2.  **Hierarchy**: Use logical heading levels (`#`, `##`, `###`). Do not skip levels.
3.  **Spacing**:
    - Surround all headings with blank lines.
    - Surround all code blocks with blank lines.
    - Surround all lists with blank lines.
4.  **Lists**: Use a single space after the list marker (e.g., `- Item` not `-  Item`).

## 2. Content Quality

1.  **Code Blocks**: Always specify the language for syntax highlighting (e.g., ` ```bash `, ` ```typescript `).
2.  **Punctuation**: Avoid trailing colons or periods in headings unless it's a question.
3.  **Links**: Use descriptive link text. Ensure and verify all internal file links are valid.

## 3. Verification

1.  **Formatting**: Run `npm run format` after any edits to `.md` files.
2.  **Linting**: If a Markdown linter is available in the IDE, check for warnings (e.g., MD041, MD031, MD047).
3.  **Final Check**: Ensure the file ends with exactly one newline character.

## 4. Common Rules (Reference)

| Rule ID | Description                                          | Fix                               |
| :-----: | ---------------------------------------------------- | --------------------------------- |
|  MD041  | First line must be a top-level header                | Add `# Title` at line 1           |
|  MD031  | Fenced code blocks must be surrounded by blank lines | Add newlines before/after ```     |
|  MD032  | Lists must be surrounded by blank lines              | Add newlines before/after lists   |
|  MD047  | File must end with a single newline                  | Ensure one `\n` at EOF            |
|  MD026  | No trailing punctuation in headers                   | Remove `:` or `.` from `# Title:` |
|  MD040  | Fenced code blocks must have a language              | Add language specifier after ```  |
