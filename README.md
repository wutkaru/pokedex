# ORAS Hoenn Pokédex — Pokémon Menu Icons

An unofficial Hoenn Pokédex that restores the **original device artwork already authored for this repository**, with a dense archive of **original-size Pokémon menu icons** as the primary content. The shell is assembled from the project's original transparent PNG layers and aligned with CSS instead of tracing a new SVG outline.

## Experience

1. The page opens with only the original ORAS-inspired Pokédex shell, centered in the viewport. Tap the screen (or activate it with the keyboard) to reveal the Pokémon browser. The casing uses `pokedex_cover_top.png` and `pokedex_cover_bottom.png` at their shared 2048×512 source aspect ratio, overlapping the halves at the screen seam. The Poké Ball emblem is the original `pokedex_dpad.png`; the LCD uses the original `cw_pokedex.png` wordmark and `diamond_cover.png` decoration.
2. After the screen is activated, the Hoenn archive appears as small Pokémon menu sprites with no prominent tile background. The subtle white Poké Ball circle appears only while pressing or keyboard-focusing a Pokémon. Every sprite keeps its 40×32 pixel menu icon; names and numbers remain available through accessible labels and hover tooltips.
3. Click or tap a menu icon to open a separate detail overlay, including height, weight, types and stats.
4. Press **Back** or **Escape** to return to the same filtered grid and scroll position.
5. Search by name or regional/national number and use the hardware-like directional buttons for navigation. The experience is read-only, with no favorites or save function.

## Ambient animation

Optional floating 3D Poké Balls are rendered behind the device using [Three.js](https://threejs.org/) v0.167.1, loaded **at runtime** from a pinned jsDelivr module URL (`src/assets/pokeball-scene.js`). The application remains fully usable without this external module. The device uses the two original outer casing images, a separate CSS-rendered inner A/B control panel, an undistorted circular Poké Ball D-pad fitted into its cutout, a green power indicator, and a staged LCD power-on sequence. All device motion uses CSS rather than WebGL to keep artwork sharp. The initial page contains no visible archive, header or footer until the screen or A button is activated. The B button returns from the archive to the device splash.

The WebGL scene uses a small number of low-polygon objects, caps rendering pixel density, pauses while the tab is hidden, disposes GPU resources on exit, and does not run when `prefers-reduced-motion: reduce` is enabled.

## Data and artwork

- The regional index is loaded once from [PokéAPI's updated Hoenn Pokédex](https://pokeapi.co/docs/v2#pokedexes).
- Primary icon wall uses [PokeAPI/sprites](https://github.com/PokeAPI/sprites)'s Generation VII `icons/front_default` (40px menu icons), matching the **original repository's source choice**. Detail view uses Emerald pixel sprites, with fallback assets where necessary.
- Detail records are fetched **only when needed** and cached for the current session.
- Original artwork is retained in `src/assets/`. The live casing uses both `pokedex_cover_*.png` halves, the `pokedex_dpad.png` emblem, the `cw_pokedex.png` logo, and the `diamond_cover.png` texture. No replacement shell SVG and no copied external 3D model are used.
- The site provides browsing and species details only. No favorites, save feature, login or personal data service is used. The browser background is dark even during mobile overscroll.

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

**Publishing control:** Keep this feature branch unmerged until the assembled **original artwork** is visually verified on desktop and iPhone. CI passing alone does not establish that the image seam and LCD alignment look correct. CI success alone does not verify the rendered page on all browsers. `docs/` remains legacy output; Actions deploys `dist/pokedex/browser`.

## Attribution

Pokémon and the related artwork and trademarks belong to their respective owners. This is an unofficial, non-commercial fan project and is not affiliated with Nintendo, Game Freak, or The Pokémon Company.
