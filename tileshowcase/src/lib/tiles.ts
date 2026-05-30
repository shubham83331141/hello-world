import type { Tile } from "@/lib/types";

const TILES: Tile[] = [
  {
    id: "calacatta-oro-polished-600x1200",
    name: "Calacatta Oro",
    brand: "Atelier Ceramics",
    collection: "Signature Marble",
    size: "600×1200 mm",
    finish: "Polished",
    color: "White / Gold Veins",
    material: "Porcelain",
    pattern: "Marble look",
    pricePerSqm: 3499,
    stock: "in_stock",
    tags: ["premium", "large-format", "statement"],
  },
  {
    id: "noir-nero-matt-600x600",
    name: "Noir Nero",
    brand: "Atelier Ceramics",
    collection: "Monochrome",
    size: "600×600 mm",
    finish: "Matt",
    color: "Deep Black",
    material: "Porcelain",
    pattern: "Solid",
    pricePerSqm: 2399,
    stock: "limited",
    tags: ["luxury", "hotel", "minimal"],
  },
  {
    id: "travertine-sand-honed-600x1200",
    name: "Travertine Sand",
    brand: "Linea Stone",
    collection: "Travertine",
    size: "600×1200 mm",
    finish: "Honed",
    color: "Warm Beige",
    material: "Porcelain",
    pattern: "Stone look",
    pricePerSqm: 2899,
    stock: "in_stock",
    tags: ["warm", "timeless", "villa"],
  },
  {
    id: "sage-terrazzo-satin-600x600",
    name: "Sage Terrazzo",
    brand: "Linea Stone",
    collection: "Terrazzo",
    size: "600×600 mm",
    finish: "Satin",
    color: "Soft Green",
    material: "Porcelain",
    pattern: "Terrazzo",
    pricePerSqm: 2599,
    stock: "in_stock",
    tags: ["designer", "texture", "premium"],
  },
  {
    id: "oak-beige-plank-200x1200",
    name: "Oak Beige Plank",
    brand: "Nordic Surfaces",
    collection: "Woodline",
    size: "200×1200 mm",
    finish: "Matt",
    color: "Natural Oak",
    material: "Porcelain",
    pattern: "Wood look",
    pricePerSqm: 2199,
    stock: "out_of_stock",
    tags: ["wood-look", "living", "warm"],
  },
  {
    id: "carrara-cloud-polished-800x1600",
    name: "Carrara Cloud",
    brand: "Nordic Surfaces",
    collection: "Cloud Marble",
    size: "800×1600 mm",
    finish: "Polished",
    color: "Cool White / Grey Veins",
    material: "Porcelain",
    pattern: "Marble look",
    pricePerSqm: 4499,
    stock: "limited",
    tags: ["ultra-large", "luxury", "penthouse"],
  },
];

export function getTiles(): Tile[] {
  return TILES;
}

export function getTileById(id: string): Tile | undefined {
  return TILES.find((tile) => tile.id === id);
}

