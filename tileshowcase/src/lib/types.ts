export type TileStock = "in_stock" | "limited" | "out_of_stock";

export type Tile = {
  id: string;
  name: string;
  brand: string;
  collection?: string;
  size: string;
  finish: string;
  color: string;
  material?: string;
  pattern?: string;
  pricePerSqm: number;
  stock: TileStock;
  tags: string[];
};

export type DealItem = {
  tileId: string;
  areaSqm: number;
};

export type DealDraft = {
  id: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  notes: string;
  discountPct: number;
  items: DealItem[];
};

export type SavedDeal = DealDraft & {
  savedAt: string;
};

export type PersistedShowroomState = {
  shortlist: string[];
  compare: string[];
  dealDraft: DealDraft;
  savedDeals: SavedDeal[];
};

