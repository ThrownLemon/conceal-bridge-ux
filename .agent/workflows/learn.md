---
description: "Workflow for the agent to 'learn' from completed tasks and update its expert knowledge."
---

# /learn Workflow

> **Purpose**: Adapt and evolve the persistent "Expert Knowledge" (Mental Models) based on the learnings from the most recent task. Run this AFTER a task is verified and completed.

## 1. Review the Context

- Read the `task.md` and `walkthrough.md` (if available) to understand what was just accomplished.
- Read the existing "Expertise Files" in `docs/expert_knowledge/` to see the current state of knowledge.

## 2. Identify Learnings

- **Ask yourself**:
  - "Did I discover a new pattern that worked well?"
  - "Did I fall into a trap that I should warn future agents about?"
  - "Did I clarify a piece of the architecture?"
  - "Is there a specific command or flag that was critical?"

## 3. Update Integration

- **If yes to any above**:
  - Open the relevant file in `docs/expert_knowledge/`.
  - Add a new section or bullet point.
  - Keep it concise. High signal, low noise.
  - **Format**:
    - **Rule/Pattern Name**
    - **Context/Why**
    - **Code Snippet** (if applicable)

## 4. Notify

- Tell the user what you "learned" and which file was updated.
