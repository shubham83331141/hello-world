/*
 * Tile catalog for the showroom.
 *
 * Tiles use procedurally generated textures (drawn on a canvas at runtime)
 * so the app needs no external image assets and works fully offline on a
 * showroom tablet or laptop.
 *
 * Each tile:
 *   id        unique slug
 *   name      display name
 *   material  marble | granite | wood | ceramic | mosaic | terrazzo | cement
 *   color     primary colour family for filtering
 *   finish    Polished | Matte | Glossy | Textured
 *   size      nominal size label, e.g. "600 x 600 mm"
 *   sizeMm    [width, height] in millimetres, used by the visualizer
 *   price     price per square metre (showroom currency)
 *   tags      keywords for search
 *   texture   parameters consumed by texture.js to paint the swatch
 */
window.TILES = [
  {
    id: 'carrara-bianco',
    name: 'Carrara Bianco',
    material: 'marble',
    color: 'white',
    finish: 'Polished',
    size: '800 x 800 mm',
    sizeMm: [800, 800],
    price: 89,
    tags: ['premium', 'living room', 'classic', 'veined'],
    texture: { kind: 'marble', base: '#f4f2ee', vein: '#b9bcc4', veinAlt: '#d8d4cc' }
  },
  {
    id: 'nero-marquina',
    name: 'Nero Marquina',
    material: 'marble',
    color: 'black',
    finish: 'Polished',
    size: '600 x 600 mm',
    sizeMm: [600, 600],
    price: 110,
    tags: ['premium', 'luxury', 'dramatic', 'veined'],
    texture: { kind: 'marble', base: '#1c1c20', vein: '#e9e6df', veinAlt: '#8d8f97' }
  },
  {
    id: 'calacatta-gold',
    name: 'Calacatta Gold',
    material: 'marble',
    color: 'white',
    finish: 'Polished',
    size: '1200 x 600 mm',
    sizeMm: [1200, 600],
    price: 165,
    tags: ['premium', 'luxury', 'gold', 'statement', 'veined'],
    texture: { kind: 'marble', base: '#f6f3ea', vein: '#caa45a', veinAlt: '#cfd2d8' }
  },
  {
    id: 'imperial-granite',
    name: 'Imperial Granite',
    material: 'granite',
    color: 'grey',
    finish: 'Matte',
    size: '600 x 600 mm',
    sizeMm: [600, 600],
    price: 72,
    tags: ['durable', 'kitchen', 'speckled'],
    texture: { kind: 'granite', base: '#6f6c69', fleck1: '#3a3835', fleck2: '#cfcac2' }
  },
  {
    id: 'sahara-beige',
    name: 'Sahara Beige',
    material: 'ceramic',
    color: 'beige',
    finish: 'Matte',
    size: '600 x 600 mm',
    sizeMm: [600, 600],
    price: 38,
    tags: ['warm', 'living room', 'neutral'],
    texture: { kind: 'stone', base: '#d8c7a8', spot: '#c2ad86' }
  },
  {
    id: 'walnut-plank',
    name: 'Walnut Plank',
    material: 'wood',
    color: 'brown',
    finish: 'Matte',
    size: '1200 x 200 mm',
    sizeMm: [1200, 200],
    price: 54,
    tags: ['warm', 'bedroom', 'wood look', 'plank'],
    texture: { kind: 'wood', base: '#6b4327', grain: '#4a2c16' }
  },
  {
    id: 'oak-natural',
    name: 'Natural Oak',
    material: 'wood',
    color: 'brown',
    finish: 'Textured',
    size: '900 x 150 mm',
    sizeMm: [900, 150],
    price: 47,
    tags: ['warm', 'bedroom', 'wood look', 'plank', 'light'],
    texture: { kind: 'wood', base: '#b48a5c', grain: '#8a6238' }
  },
  {
    id: 'azure-mosaic',
    name: 'Azure Mosaic',
    material: 'mosaic',
    color: 'blue',
    finish: 'Glossy',
    size: '300 x 300 mm',
    sizeMm: [300, 300],
    price: 64,
    tags: ['bathroom', 'pool', 'accent', 'glossy'],
    texture: { kind: 'mosaic', base: '#1f7fa6', alt: '#2aa1c9', grout: '#eef3f5' }
  },
  {
    id: 'emerald-mosaic',
    name: 'Emerald Mosaic',
    material: 'mosaic',
    color: 'green',
    finish: 'Glossy',
    size: '300 x 300 mm',
    sizeMm: [300, 300],
    price: 66,
    tags: ['bathroom', 'accent', 'glossy'],
    texture: { kind: 'mosaic', base: '#1f7a5a', alt: '#27946d', grout: '#eef5f0' }
  },
  {
    id: 'venetian-terrazzo',
    name: 'Venetian Terrazzo',
    material: 'terrazzo',
    color: 'beige',
    finish: 'Polished',
    size: '600 x 600 mm',
    sizeMm: [600, 600],
    price: 58,
    tags: ['retro', 'living room', 'speckled', 'design'],
    texture: { kind: 'terrazzo', base: '#ece6da', chips: ['#c44', '#3a7', '#39c', '#fc3', '#555'] }
  },
  {
    id: 'urban-cement',
    name: 'Urban Cement',
    material: 'cement',
    color: 'grey',
    finish: 'Matte',
    size: '600 x 600 mm',
    sizeMm: [600, 600],
    price: 41,
    tags: ['industrial', 'modern', 'concrete'],
    texture: { kind: 'cement', base: '#9a9a98', mottle: '#86867f' }
  },
  {
    id: 'graphite-cement',
    name: 'Graphite Cement',
    material: 'cement',
    color: 'black',
    finish: 'Matte',
    size: '900 x 900 mm',
    sizeMm: [900, 900],
    price: 49,
    tags: ['industrial', 'modern', 'concrete', 'dark'],
    texture: { kind: 'cement', base: '#41434a', mottle: '#33343a' }
  }
];
