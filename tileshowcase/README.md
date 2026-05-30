# TileSHowcase

TileSHowcase is a local-first showroom assistant for luxury tile showrooms:

- Browse and search the tile catalog
- Shortlist tiles while talking to a customer
- Compare up to 4 tiles side-by-side
- Build a quick quote (area + discount) and print/save it

Deals and lists are stored in `localStorage` so it works well on tablets even with spotty Wi‑Fi.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Edit the catalog (demo data)

Update tile data and pricing in:

- `src/lib/tiles.ts`

Pricing uses `pricePerSqm` (INR / m²).

## Scripts

- `npm run dev` - local dev server
- `npm run lint` - lint
- `npm run build` - production build

## Routes

- `/catalog` – catalog + filters
- `/shortlist` – shortlisted tiles
- `/compare` – compare tiles
- `/deal` – deal/quote builder
- `/deals` – saved quotes

## Next improvements (recommended)

- Add images per tile (and a sample photo gallery)
- Add customer address/project name and delivery timeline
- Add “share quote” via PDF export or WhatsApp-friendly text
