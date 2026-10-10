# ORAS artwork sourcing and visual verification

## Current inventory

The Pokédex shell already includes project artwork in src/assets/:

| Layer | Repository file | Current rendering |
| --- | --- | --- |
| Upper housing | pokedex_cover_top.png | Original 2048×512 image |
| Lower housing | pokedex_cover_bottom.png | Original 2048×512 image |
| Round Poké Ball control | pokedex_dpad.png | 512×512 image cropped to a circle |
| Screen wordmark | cw_pokedex.png | Existing project artwork |
| LCD decoration | diamond_cover.png | Existing project artwork |
| A/B inner controls | None found | CSS approximation in .device-control-frame |

The two housing images and round emblem must not be stretched into replacement silhouettes. The A/B inner-control panel is **not** verified as an original graphic. This remains the primary unresolved artwork task in #67.

## External research leads (not approved assets)

1. [The Spriters Resource — Pokémon ORAS](https://www.spriters-resource.com/3ds/pokemonomegarubyalphasapphire/) lists Pokédex preview sprites and miscellaneous graphics including *Backgrounds and Decorations*. These are research leads, **not** verification of the A/B housing artwork or permission to redistribute it.
2. [The Models Resource — Pokémon ORAS](https://models.spriters-resource.com/3ds/pokemonomegarubyalphasapphire/) primarily catalogs game models. No matching isolated A/B inner-control housing has yet been verified from the entries reviewed.
3. [Project Pokémon — ORAS File System](https://projectpokemon.org/home/docs/gen-6/oras-file-system-r32/) labels **a/2/5/6** as LZ11-compressed Pokédex UI and **a/0/1/1** as menu app UI images. These are leads for investigating *in-game screen graphics*, not evidence that the physical shell artwork exists there.
4. [The Pokémon Company — ORAS information](https://www.pokemon.com/us/pokemon-video-games/pokemon-omega-ruby-and-pokemon-alpha-sapphire) is useful for official visual terminology and reference. Reference images alone do not grant redistribution rights.

Do not commit game data, sprites, 3D models, or extracted third-party art without verifying permission, attribution requirements, origin, and fidelity. Treat any user's official reference image as a visual comparison target, not as an automatically reusable asset.

## Verification approach

A screenshot workflow, .github/workflows/visual-review.yml, captures three layouts with reduced motion enabled:

- desktop at 1440×900;
- iPhone-sized Chromium at 390×844;
- smaller iPhone-sized Chromium at 375×667.

The workflow uses a deterministic small Hoenn Pokédex API fixture, checks housing/control/screen bounds, checks horizontal overflow, exercises A to collection to detail to B, and uploads screenshots plus measurements.json as a GitHub Actions artifact. The fixture does **not** make screenshot reviews proof of live PokeAPI availability or of sprite-asset redistribution rights.

This is automated **Chromium viewport** coverage, not real iPhone Safari QA. Before completing #67, inspect the generated screenshots, compare them with the confirmed reference art, and verify on a real iPhone or mobile Safari. In particular, inspect the top/bottom seam, round control crop, A/B panel, LCD window, and tap areas.

## Artwork acceptance gate

An A/B inner frame may replace the CSS approximation only when:

1. Its source, creator, and reuse permission have been verified.
2. It matches the original reference geometry, not a newly invented device.
3. Transparent layers scale uniformly, with no distorted A/B graphics.
4. Desktop, mobile viewport, and real mobile Safari evidence show no seam, overflow, or touch-accessibility regression.
5. Build/test and screenshot workflow runs pass on the proposed pull request.

Until then, preserve the current visual fallback and keep #67 open.
