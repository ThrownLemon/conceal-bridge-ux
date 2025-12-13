# Angular CLI MCP Integration Guide

## Overview
The Angular CLI includes an experimental Model Context Protocol (MCP) server that enables AI assistants to interact with the Angular CLI in your development environment. This guide explains when and how to use each available tool.

## Available Tools

### Documentation & Learning Tools

#### `search_documentation`
**When to use:**
- User asks questions about Angular APIs, features, or concepts
- Need to verify Angular best practices or official recommendations
- Looking for tutorials or guides from angular.dev
- Clarifying how Angular features work

**Characteristics:**
- Searches official Angular documentation at https://angular.dev
- Not local-only (requires internet connection)
- Read-only operation

**Example scenarios:**
- "How do I use Angular signals?"
- "What's the syntax for control flow in Angular?"
- "How do I set up dependency injection?"

#### `get_best_practices`
**When to use:**
- Starting a new Angular project or feature
- Code review or refactoring existing code
- User asks about modern Angular patterns
- Need to ensure code follows current standards

**Characteristics:**
- Retrieves the comprehensive Angular Best Practices Guide
- Covers standalone components, typed forms, modern control flow
- Local-only and read-only

**Example scenarios:**
- "What are the current best practices for Angular components?"
- "How should I structure my Angular app?"
- Before generating new code to ensure it follows modern standards

#### `find_examples`
**When to use:**
- User needs concrete code examples
- Looking for reference implementations
- Want to see how to use new or modern Angular features
- Need authoritative, curated examples

**Characteristics:**
- Searches curated database of official examples
- Focuses on modern, new, and recently updated features
- Local-only and read-only

**Example scenarios:**
- "Show me an example of a reactive form with validation"
- "How do I implement a custom pipe?"
- "Example of using the new control flow syntax"

### Project Analysis Tools

#### `list_projects`
**When to use:**
- Need to understand workspace structure
- Before performing operations on specific projects
- User asks what applications or libraries exist
- Planning migrations or changes across projects

**Characteristics:**
- Reads `angular.json` to identify all projects
- Lists both applications and libraries
- Local-only and read-only

**Example scenarios:**
- "What projects are in this workspace?"
- Before running commands that need a project name
- Understanding monorepo structure

#### `onpush_zoneless_migration`
**When to use:**
- Preparing to migrate to zoneless Angular
- Want to improve change detection performance
- User asks about OnPush change detection strategy
- Need a migration plan for existing code

**Characteristics:**
- Analyzes code and provides step-by-step migration plan
- Prerequisite for zoneless applications
- Iterative approach
- Local-only and read-only

**Example scenarios:**
- "How can I migrate my app to OnPush change detection?"
- "What changes do I need to make for zoneless Angular?"
- Planning performance optimizations

### Experimental Tools

⚠️ **Use with caution - these tools are in experimental/preview status**

#### `modernize` (Experimental)
**When to use:**
- Have legacy Angular code that needs updating
- Want to align with latest syntax and best practices
- Performing major version migrations
- Code doesn't use standalone components, signals, or modern control flow

**Characteristics:**
- Performs actual code migrations (not read-only)
- Provides instructions for manual modernization steps
- Experimental/preview status - use with caution
- Local-only operation

**Example scenarios:**
- "Modernize this component to use standalone syntax"
- "Update my app to use the new control flow"
- "Help me migrate from NgModules to standalone"

**Important:** Since this modifies code, always:
- Ensure code is committed to version control first
- Review changes before accepting them
- Test thoroughly after migration

## Decision Flow

```
Question about Angular concept/API?
  → Use search_documentation

Need code example?
  → Use find_examples

Before generating new code?
  → Use get_best_practices first

Need to know workspace structure?
  → Use list_projects

Planning OnPush/zoneless migration?
  → Use onpush_zoneless_migration

Need to modernize legacy code?
  → Use modernize (experimental)
```

## Best Practices for Using These Tools

1. **Always check documentation first**: Use `search_documentation` and `get_best_practices` before generating code
2. **Provide examples**: Use `find_examples` to show users authoritative patterns
3. **Be cautious with experimental tools**: Only use `modernize` when explicitly needed and after proper safeguards
4. **Combine tools**: Often you'll want to use multiple tools (e.g., search docs, get best practices, then find examples)
5. **Read-only by default**: Most tools are read-only, which is safe - only `modernize` modifies code
6. **Internet vs local**: Be aware that only `search_documentation` requires internet; others work offline

## Key Terminology

- **local-only**: Tool works without internet connection
- **read-only**: Tool only reads/analyzes, doesn't modify code
- **experimental**: New or not fully tested - use with caution