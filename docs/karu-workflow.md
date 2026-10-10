# Karu workflow integration — Pokédex

## Identity

- **Repository:** `wutkaru/pokedex`
- **Ownership / trust:** `PERSONAL` (not Karu Universe and not external/client).
- **Canonical source:** `Karugameshop/karu-skills`, observed at `2bf62bbcd6fbb4dddd63eee8b32004204ae40445` during initialization.
- **Entrypoint:** `/karu-init` delegates to `/karu-sync SETUP`.

## Selected shared responsibilities

Only use the following canonical skills when relevant to work being performed:

| Concern | Canonical skill |
| --- | --- |
| First interaction / resume | `session-bootstrap` |
| Git and protected operations | `git-guardrails` |
| Safe mutation / uncertain-write recovery | `resilient-execution` |
| Multi-step engineering | `orchestrate` |
| Acceptance evidence | `verify` |
| GitHub Actions results | `ci-evidence` |

## Integration strategy

- **ChatGPT with the connected GitHub account:** direct canonical GitHub reads; no skill files duplicated into the project.
- **Codex or other repo-aware CLI:** local `AGENTS.md` defines project rules; canonical skill resolution is optional and depends on that runtime's GitHub access.
- **Claude Code:** `CLAUDE.md` is a narrow pointer to `AGENTS.md` rather than a second policy copy.
- **Claude Desktop / global runtime config / secret stores:** not installed or modified. Project-level config does not imply app-level configuration.
- **Karu sync consumer mapping:** not required for this direct-reference strategy. Register one only if an actual runtime later needs a managed compatibility copy.

## Boundaries and evidence

- Never import Personal, Karu Universe, or external/client credential values into this repository.
- Do not overwrite unrelated `.agents`, `.claude`, or global runtime settings.
- Repository source and GitHub are the only durable work state; discussions alone are not authoritative.
- **Verified:** ownership from repository metadata; Angular project/CI/build layout inspected; canonical skill instructions were read through the connected GitHub integration.
- **Not applicable:** compatibility-copy drift/dependency checks (no managed copies); user-global runtime configuration (untouched).
- **Not yet verified:** native Codex and Claude Code discovery on a workstation; they are optional runtimes and require a real runtime smoke test before claiming PASS.
- **Next gate:** review this onboarding PR separately from any Pokédex design/deployment PR. Feature/deployment completion requires its own build and browser verification evidence.
