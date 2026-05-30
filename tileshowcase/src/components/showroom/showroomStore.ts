"use client";

import { clampNumber } from "@/lib/format";
import { createId } from "@/lib/id";
import type {
  DealDraft,
  PersistedShowroomState,
  SavedDeal,
} from "@/lib/types";
import { readLocalStorageJson, writeLocalStorageJson } from "./storage";

const STORAGE_KEY = "tileshowcase:v1";

type Listener = () => void;

const listeners = new Set<Listener>();

let initialized = false;
let state: PersistedShowroomState | null = null;

function createEmptyDraft(): DealDraft {
  return {
    id: createId(),
    createdAt: new Date().toISOString(),
    customerName: "",
    customerPhone: "",
    notes: "",
    discountPct: 0,
    items: [],
  };
}

function createDefaultState(): PersistedShowroomState {
  return {
    shortlist: [],
    compare: [],
    dealDraft: createEmptyDraft(),
    savedDeals: [],
  };
}

function initIfNeeded() {
  if (initialized) return;
  initialized = true;
  const loaded = readLocalStorageJson<PersistedShowroomState>(STORAGE_KEY);
  state = loaded ?? createDefaultState();
}

function emit() {
  for (const listener of listeners) listener();
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot(): PersistedShowroomState {
  initIfNeeded();
  return state ?? createDefaultState();
}

export function getServerSnapshot(): PersistedShowroomState {
  return {
    shortlist: [],
    compare: [],
    dealDraft: {
      id: "draft",
      createdAt: "server",
      customerName: "",
      customerPhone: "",
      notes: "",
      discountPct: 0,
      items: [],
    },
    savedDeals: [],
  };
}

function persist(next: PersistedShowroomState) {
  writeLocalStorageJson(STORAGE_KEY, next);
}

export function updateState(
  updater:
    | PersistedShowroomState
    | ((previous: PersistedShowroomState) => PersistedShowroomState),
) {
  const previous = getSnapshot();
  const next = typeof updater === "function" ? updater(previous) : updater;
  state = next;
  persist(next);
  emit();
}

export const showroomActions = {
  toggleShortlist(tileId: string) {
    updateState((previous) => {
      const exists = previous.shortlist.includes(tileId);
      return {
        ...previous,
        shortlist: exists
          ? previous.shortlist.filter((id) => id !== tileId)
          : [...previous.shortlist, tileId],
      };
    });
  },
  toggleCompare(tileId: string) {
    updateState((previous) => {
      const exists = previous.compare.includes(tileId);
      if (exists) {
        return { ...previous, compare: previous.compare.filter((id) => id !== tileId) };
      }
      if (previous.compare.length >= 4) return previous;
      return { ...previous, compare: [...previous.compare, tileId] };
    });
  },
  clearCompare() {
    updateState((previous) => ({ ...previous, compare: [] }));
  },
  addDealArea(tileId: string, deltaSqm: number) {
    updateState((previous) => {
      const items = [...previous.dealDraft.items];
      const index = items.findIndex((item) => item.tileId === tileId);
      if (index >= 0) {
        items[index] = {
          ...items[index],
          areaSqm: clampNumber(items[index].areaSqm + deltaSqm, 0, 10_000),
        };
      } else {
        items.push({ tileId, areaSqm: clampNumber(deltaSqm, 0, 10_000) });
      }
      return { ...previous, dealDraft: { ...previous.dealDraft, items } };
    });
  },
  setDealItemArea(tileId: string, areaSqm: number) {
    updateState((previous) => {
      const items = [...previous.dealDraft.items];
      const index = items.findIndex((item) => item.tileId === tileId);
      if (index < 0) return previous;
      items[index] = { ...items[index], areaSqm: clampNumber(areaSqm, 0, 10_000) };
      return { ...previous, dealDraft: { ...previous.dealDraft, items } };
    });
  },
  removeDealItem(tileId: string) {
    updateState((previous) => ({
      ...previous,
      dealDraft: {
        ...previous.dealDraft,
        items: previous.dealDraft.items.filter((item) => item.tileId !== tileId),
      },
    }));
  },
  setDealCustomerName(name: string) {
    updateState((previous) => ({
      ...previous,
      dealDraft: { ...previous.dealDraft, customerName: name },
    }));
  },
  setDealCustomerPhone(phone: string) {
    updateState((previous) => ({
      ...previous,
      dealDraft: { ...previous.dealDraft, customerPhone: phone },
    }));
  },
  setDealNotes(notes: string) {
    updateState((previous) => ({
      ...previous,
      dealDraft: { ...previous.dealDraft, notes },
    }));
  },
  setDealDiscountPct(pct: number) {
    updateState((previous) => ({
      ...previous,
      dealDraft: { ...previous.dealDraft, discountPct: clampNumber(pct, 0, 90) },
    }));
  },
  startNewDeal() {
    updateState((previous) => ({ ...previous, dealDraft: createEmptyDraft() }));
  },
  saveDeal() {
    updateState((previous) => {
      const saved: SavedDeal = {
        ...previous.dealDraft,
        savedAt: new Date().toISOString(),
      };
      return {
        ...previous,
        savedDeals: [saved, ...previous.savedDeals].slice(0, 50),
        dealDraft: createEmptyDraft(),
      };
    });
  },
  loadSavedDeal(dealId: string) {
    updateState((previous) => {
      const deal = previous.savedDeals.find((d) => d.id === dealId);
      if (!deal) return previous;
      return {
        ...previous,
        dealDraft: {
          id: deal.id,
          createdAt: deal.createdAt,
          customerName: deal.customerName,
          customerPhone: deal.customerPhone,
          notes: deal.notes,
          discountPct: deal.discountPct,
          items: deal.items,
        },
      };
    });
  },
  deleteSavedDeal(dealId: string) {
    updateState((previous) => ({
      ...previous,
      savedDeals: previous.savedDeals.filter((d) => d.id !== dealId),
    }));
  },
};

