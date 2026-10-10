# Hoenn Pixel Pokédex

An unofficial Hoenn Pokédex built around the **original pixel sprite grid** and GBA-shaped Pokédex imagery from Pokémon Omega Ruby / Alpha Sapphire.

## Experience

1. The website opens with a GBA-inspired device entrance and a short animation using the original cover artwork.
2. The **default screen is a complete pixel-art Hoenn index**; no individual Pokémon details are fetched on initial entry.
3. Click or tap a pixel sprite to open its individual record, including height, weight, types and stats.
4. Press **Back** or **Escape** to return to the same filtered grid and scroll position.
5. Search by name or regional/national number, save favorites locally, and use the hardware-like directional buttons for navigation.

## Ambient animation

Optional floating 3D Poké Balls are rendered behind the device using [Three.js](https://threejs.org/) v0.167.1, loaded **at runtime** from a pinned jsDelivr module URL (`src/assets/pokeball-scene.js`). The application remains fully usable without this external module. The device opening, covers and sprite transitions use CSS instead of WebGL to keep pixel artwork sharp.

The WebGL scene uses a small number of low-polygon objects, caps rendering pixel density, pauses while the tab is hidden, disposes GPU resources on exit, and does not run when `prefers-reduced-motion: reduce` is enabled.

## Data and artwork

- The regional index is loaded once from [PokéAPI's updated Hoenn Pokédex](https://pokeapi.co/docs/v2#pokedexes).
- Pixel sprites use [PokeAPI/sprites](https://github.com/PokeAPI/sprites)'s Pokémon Emerald assets where available, with a standard sprite fallback.
- Detail records are fetched **only when needed** and cached for the current session.
- Original repository artwork (`pokedex_cover_top.png`, `pokedex_cover_bottom.png`, `pokedex_dpad.png`, `diamond_cover.png`, `cw_pokedex.png`) is retained and reused.
- Favorites are stored in the browser's `localStorage`; no login or personal data service is used.

## Local development

Requires Node.js 20+.

```bash
npm ci
npm start
```

Open <http://localhost:4200/>.

## Verification

```bash
npm run build -- --base-href /pokedex/
npm test -- --watch=false --browsers=ChromeHeadless
```

## GitHub Pages

After PR approval, merging into `main` triggers `.github/workflows/build.yml`: verify, build with `/pokedex/` as the base href, upload static output and deploy via GitHub Pages.

Live site: <https://wutkaru.github.io/pokedex/>.

**Publishing control:** Keep this feature branch unmerged until the visual design and startup animation are reviewed. CI success alone does not verify the rendered page on all browsers. `docs/` remains legacy output; Actions deploys `dist/pokedex/browser`.

## Attribution

Pokémon and the related artwork and trademarks belong to their respective owners. This is an unofficial, non-commercial fan project and is not affiliated with Nintendo, Game Freak, or The Pokémon Company.
