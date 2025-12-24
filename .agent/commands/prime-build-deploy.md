# Context for — Build / Deploy / Runtime Config

> Purpose: load the minimum context to modify build, deployment, runtime configuration, or environment-specific behavior safely.

## Key rules (read this before coding)

- This is an **Angular 21 SPA** intended for **static hosting**.
- Be careful with **runtime config** vs build-time config:
  - Current code uses an InjectionToken config pattern; don’t silently hardcode prod endpoints.
- If adding new build/deploy behavior (headers, CSP, assets, routing rewrites), keep it compatible with static hosting.

## Read the following files

README.md
package.json
angular.json
tsconfig.json

docs/build_guide.md

ai_spec/runtime_config.md
ai_spec/environment_configuration.md
ai_spec/deployment_static_hosting.md
ai_spec/ci_cd_pipeline.md

ai_spec/security_headers_and_csp.md
