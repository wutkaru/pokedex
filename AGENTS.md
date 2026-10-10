# Pokédex project instructions

## Identity and authority

- **Project:** Pokédex, a personal fan-made browser application owned by `wutkaru`.
- **Trust domain:** `PERSONAL`. Do not import Karu Universe or client credentials, secrets, unrelated project memories, or private assets.
- **Shared workflow source:** [Karugameshop/karu-skills](https://github.com/Karugameshop/karu-skills), especially `skills/session-bootstrap`, `skills/git-guardrails`, `skills/resilient-execution`, `skills/orchestrate`, `skills/verify`, and `skills/ci-evidence`. Read canonical instructions when access is available; this file contains *project-specific* rules, not a fork of those skills.
- Maintain work state in GitHub Issues/PRs. Do not depend on private conversation history to resume engineering work.

## Product scope

- Browser-first, mobile-friendly Hoenn Pokédex inspired by Pokémon Omega Ruby and Alpha Sapphire. Do not claim affiliation with Nintendo or The Pokémon Company.
- Regional order comes from PokeAPI's `updated-hoenn` Pokédex; national species identifiers are distinct from Hoenn entry numbers.
- Data is public and read-only. Never require secrets, account login, or privileged API keys for the application.
- Prefer accessible, responsive UI and CSS/DOM motion to unnecessary heavy rendering dependencies. Respect `prefers-reduced-motion`.
- Do not add unrelated products, services, domains, deployments, or accounts.

## Architecture and commands

- Angular standalone app, TypeScript strict mode, SCSS.
- `npm ci` installs from the committed lockfile.
- `npm run build` is the production build.
- `npm test -- --watch=false --browsers=ChromeHeadless` runs noninteractive unit tests in CI where Chrome is available.
- GitHub Pages serves the application under `/pokedex/`. Use the correct build base href, and keep asset URLs compatible with the subpath.
- CI must finish noninteractively before a PR is considered verified.
- Use English commit messages and PR descriptions. Do not add explanatory source-code comments unless required by an existing convention.

## Change safety

- Use a topic branch and pull request for feature and workflow work; do not push straight to `main`.
- Keep configuration/onboarding changes separate from product UI changes.
- Do not merge, deploy to production, or change repository settings without the appropriate explicit authorization and verified current GitHub state.
- Do not commit secrets or platform-global runtime configuration.
- See [docs/karu-workflow.md](docs/karu-workflow.md) for the ownership decision, integration surface, and verification checkpoint.
