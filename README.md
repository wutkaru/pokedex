# Hoenn Pokédex

An unofficial, mobile-friendly Hoenn Pokédex inspired by the red and blue hardware and interface details of Pokémon Omega Ruby / Alpha Sapphire and classic handheld Pokédex designs.

**Live site after deployment:** https://wutkaru.github.io/pokedex/

## Features

- Complete updated Hoenn regional index from [PokéAPI](https://pokeapi.co/docs/v2#pokedexes), loaded in **one index request** instead of one request per Pokémon.
- Full Pokémon artwork and sprites from [PokéAPI Sprites](https://github.com/PokeAPI/sprites).
- Detail lookup on selection (type, height and weight), with an in-memory cache.
- Search by species name, Hoenn number or National number.
- Previous / next buttons, keyboard arrow controls, and responsive mobile layout.
- Saved favorites stored in local browser storage.
- Motion effects with reduced-motion support.
- Shareable Pokémon selection using the `?pokemon=252` query parameter.

## Development

Requires Node.js 20+.

```bash
npm ci
npm start
```

Open http://localhost:4200.

## Verification

```bash
npm run build -- --base-href /pokedex/
npm test -- --watch=false --browsers=ChromeHeadless
```

## GitHub Pages

A GitHub Actions workflow in `.github/workflows/build.yml` builds and tests pull requests, and deploys the `main` branch only after verification passes.

**One-time repository setting:** under **Settings → Pages → Build and deployment → Source**, choose **GitHub Actions**. Merging an approved feature PR into `main` then triggers the publication workflow. The deployed Angular application uses the `/pokedex/` base path.

Old compiled files in `docs/` are legacy output and are not used by the Actions-based publishing workflow.

## Credits

Pokémon and all related names and artwork are the property of their respective owners. This is a non-commercial fan project and is not affiliated with or endorsed by Nintendo, Game Freak, or The Pokémon Company.
