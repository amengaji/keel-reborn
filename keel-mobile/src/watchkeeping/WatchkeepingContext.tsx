//keel-mobile/src/watchkeeping/WatchkeepingContext.tsx

/**
 * ============================================================
 * Watchkeeping Context — Single Source of Truth
 * ============================================================
 *
 * PURPOSE:
 * - Centralise access to Watchkeeping records
 * - Expose inspector-safe, derived status
 * - Remain DB-agnostic for now
 *
 * IMPORTANT:
 * - NO UI code
 * - NO DB logic yet
 * - NO backend logic
 *
 * This context mirrors:
 * - SeaServiceContext
 * - DailyLogsContext
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

import {
  WatchEntry,
  WatchkeepingStatus,
  getWatchkeepingStatus,
  getLastWatchDate,
} from "./watchkeepingDomain";


import {
  getAllWatches,
} from "../db/watchkeeping";


/* ============================================================
 * Context Types
 * ============================================================ */

interface WatchkeepingContextValue {
  /** All watch entries (raw) */
  watches: WatchEntry[];

  /** Derived compliance status */
  status: WatchkeepingStatus;

  /** Most recent watch end time */
  lastWatchDate: Date | null;

  /** Reload watches (DB hookup later) */
  refreshWatches: () => Promise<void>;

  /** Loading indicator */
  loading: boolean;
}

/* ============================================================
 * Context Setup
 * ============================================================ */

const WatchkeepingContext = createContext<
  WatchkeepingContextValue | undefined
>(undefined);

/* ============================================================
 * Provider
 * ============================================================ */

export function WatchkeepingProvider({
  children,
}: {
  children: ReactNode;
}) {
  /**
   * Watches are empty for now.
   * DB wiring happens in Step 26C.
   */
  const [watches, setWatches] = useState<WatchEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  /**
   * ----------------------------------------------------------
   * Refresh watches
   * ----------------------------------------------------------
   *
   * Placeholder implementation.
   * Will be replaced with DB logic later.
   */
const refreshWatches = async () => {
  try {
    setLoading(true);

    const rows = getAllWatches();

    const normalised: WatchEntry[] = rows.map((r) => ({
      id: r.id,
      startTime: new Date(r.start_time),
      endTime: new Date(r.end_time),
      watchType: r.watch_type as any,
      shipState: r.ship_state as any,
      location: r.location as any,
      cargoOps: Boolean(r.cargo_ops),
      cadetDiscipline: r.cadet_discipline as any,
      remarks: r.remarks ?? undefined,
      createdAt: new Date(r.created_at),
    }));

    setWatches(normalised);
  } catch (err) {
    console.error("Failed to load watchkeeping records", err);
    setWatches([]);
  } finally {
    setLoading(false);
  }
};


  /**
   * Initial load hook.
   * Does nothing until DB wiring exists.
   */
  useEffect(() => {
    refreshWatches();
  }, []);

  /* ============================================================
   * Derived values (PURE)
   * ============================================================ */

  const status = getWatchkeepingStatus(watches);
  const lastWatchDate = getLastWatchDate(watches);

  /* ============================================================
   * Context Value
   * ============================================================ */

  const value: WatchkeepingContextValue = {
    watches,
    status,
    lastWatchDate,
    refreshWatches,
    loading,
  };

  return (
    <WatchkeepingContext.Provider value={value}>
      {children}
    </WatchkeepingContext.Provider>
  );
}

/* ============================================================
 * Hook
 * ============================================================ */

export function useWatchkeeping() {
  const ctx = useContext(WatchkeepingContext);

  if (!ctx) {
    throw new Error(
      "useWatchkeeping must be used within a WatchkeepingProvider"
    );
  }

  return ctx;
}
