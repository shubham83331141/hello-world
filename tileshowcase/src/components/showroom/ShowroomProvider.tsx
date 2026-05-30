"use client";

import React, { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import type { PersistedShowroomState } from "@/lib/types";
import {
  getServerSnapshot,
  getSnapshot,
  showroomActions,
  subscribe,
} from "./showroomStore";

type ShowroomContextValue = {
  hydrated: boolean;
  state: PersistedShowroomState;
  actions: typeof showroomActions;
};

const ShowroomContext = createContext<ShowroomContextValue | undefined>(
  undefined,
);

export function ShowroomProvider({ children }: { children: React.ReactNode }) {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const hydrated = typeof window !== "undefined";

  const value = useMemo<ShowroomContextValue>(
    () => ({ hydrated, state, actions: showroomActions }),
    [hydrated, state],
  );

  return (
    <ShowroomContext.Provider value={value}>
      {children}
    </ShowroomContext.Provider>
  );
}

export function useShowroom(): ShowroomContextValue {
  const value = useContext(ShowroomContext);
  if (!value) {
    throw new Error("useShowroom must be used within ShowroomProvider");
  }
  return value;
}

