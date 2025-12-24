# Workflow

1. **Context**: Read relevant `prime-*.md` files (see top of file) for domain specifics if required.
2. **Specs**: If the user has provided a specs file, read it carefully; if not, create a specs file for the user.
3. **Explore**: Use `angular-cli` (docs/examples) or `context7` (libraries), or just web search as required to help build the plan.
4. **Plan**: Create a detailed plan for the user.
5. **Approval**: Ask for approval before implementing.
6. **Code**: Implement changes + meaningful unit tests.
7. **Verify**:
   - **Self-Verification**: You MUST use available tools (Browser Tool, Terminal) to verify your changes yourself. Do not ask the user to perform manual manual verification steps if you can do it.
   - **Browser Tool**: Use it to visually confirm UI changes, modal states, and interactions.
   - **Tests**: Run `ng test` and `npm run build` to ensure stability.
8. **Update**:
   - **Extensive Documentation Check**: At the end of every task, you MUST search for and update ALL relevant documentation. Don't just update the obvious file; `grep` for keywords to find hidden references in `docs`, `.claude`, and `README` files.
   - **Configuration Hygiene**: When removing dependencies, check `angular.json` (e.g., `allowedCommonJsDependencies`) and `tsconfig.json` for strict cleanup.
   - **Artifacts**: Ensure `task.md` and `walkthrough.md` are up to date.
