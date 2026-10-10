# ORAS Hoenn Pokédex — Pokémon Menu Icons

An unofficial Hoenn Pokédex based on the **Omega Ruby / Alpha Sapphire red GBA-shaped Pokédex concept**, with a dense archive of **original-size Pokémon menu icons** as the primary content. The device recreation is a custom SVG/CSS interpretation, not an official 3D model.

## Experience

1. The website opens with a short GBA-inspired entrance animation using the ORAS-inspired silhouette: red rounded body, original Poké Ball emblem, central blue LCD, light-green A/B buttons and smaller Start/Select buttons.
2. The **default screen is a compact, icon-sized Hoenn archive**. Every Pokémon occupies a 40×32 pixel image, with no oversized card, species name, or number on the icon tile. Names and numbers are available through the icon's accessible label and hover tooltip.
3. Click or tap a menu icon to open a separate detail overlay, including height, weight, types and stats.
4. Press **Back** or **Escape** to return to the same filtered grid and scroll position.
5. Search by name or regional/national number, save favorites locally, and use the hardware-like directional buttons for navigation.

## Ambient animation

Optional floating 3D Poké Balls are rendered behind the device using [Three.js](https://threejs.org/) v0.167.1, loaded **at runtime** from a pinned jsDelivr module URL (`src/assets/pokeball-scene.js`). The application remains fully usable without this external module. The device opening, covers and sprite transitions use CSS instead of WebGL to keep pixel artwork sharp.

The WebGL scene uses a small number of low-polygon objects, caps rendering pixel density, pauses while the tab is hidden, disposes GPU resources on exit, and does not run when `prefers-reduced-motion: reduce` is enabled.

## Data and artwork

- The regional index is loaded once from [PokéAPI's updated Hoenn Pokédex](https://pokeapi.co/docs/v2#pokedexes).
- Primary icon wall uses [PokeAPI/sprites](https://github.com/PokeAPI/sprites)'s Generation VII `icons/front_default` (40px menu icons), matching the **original repository's source choice**. Detail view uses Emerald pixel sprites, with fallback assets where necessary.
- Detail records are fetched **only when needed** and cached for the current session.
- Original artwork is retained in `src/assets/`. The original `pokedex_dpad.png` and `diamond_cover.png` appear in the new design; other originals are preserved in the repository. No copyrighted official concept image is embedded as a page asset.
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

**Publishing control:** Keep this feature branch unmerged until the recreated device outline and original-sized Pokémon icon wall are visually reviewed. CI success alone does not verify the rendered page on all browsers. `docs/` remains legacy output; Actions deploys `dist/pokedex/browser`.

## Attribution

Pokémon and the related artwork and trademarks belong to their respective owners. This is an unofficial, non-commercial fan project and is not affiliated with Nintendo, Game Freak, or The Pokémon Company.
