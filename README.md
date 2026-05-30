# Lumière Tiles — Showroom Visualizer

A self-contained web app for a luxury tile showroom. Show customers any tile,
let them **see it before they buy it** in a true-to-scale room, fine-tune the
look, and build an instant quote — helping you close deals faster.

No build step, no server, no internet required. Tile looks are generated
procedurally, so there are **no image files to manage** and it runs fully
offline on a showroom tablet or laptop.

## Features

- **The Collection** — a browsable catalog of tiles (marble, granite, wood,
  mosaic, terrazzo, cement, ceramic) with material, finish, size and price.
- **Search & filter** by keyword, material, colour, and sort by price or name.
- **Room Visualizer** — drop any tile onto a perspective room floor so the
  customer can picture it at real scale, with walls and furniture for context.
- **Top-down view** to judge the repeat pattern and grout up close.
- **Customize the look** live:
  - Layout: straight or brick-bond
  - Tile scale
  - Grout width
  - Grout colour
- **Customer Quote builder** — add tiles, set the area in m², get line totals
  and a running grand total. Saved on the device and printable to PDF.

## Run it

Just open `index.html` in any modern browser.

Or serve the folder (so everything loads consistently):

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## How a sales conversation flows

1. Browse or search **The Collection** with the customer.
2. Hit **Visualize** on a tile to see it filling a room floor.
3. Adjust layout, scale and grout until they love it; flip to **Top down** to
   show the detail.
4. Click **Add to quote**, set the room area in m², and repeat for other tiles.
5. **Print / Save PDF** to hand the customer a quote on the spot.

## Project structure

```
index.html          markup and layout
css/styles.css      luxurious showroom styling (+ print styles for quotes)
js/data.js          the tile catalog (edit to add your own products)
js/texture.js       procedural Canvas textures for each material
js/visualizer.js    room (perspective) and top-down floor rendering
js/app.js           catalog, filtering, visualizer controls, quote logic
```

## Add your own tiles

Edit `js/data.js` and add an entry to the `TILES` array. Set the `material`,
`sizeMm`, `price`, and a `texture` block; the swatch and room preview are drawn
automatically from those values.
