//keel-mobile/src/daily-logs/DailyLogsContext.tsx

/**
 * ============================================================
 * Daily Logs Context — Single Source of Truth
 * ============================================================
 *
 * PURPOSE:
 * - Centralise access to Daily Logs
 * - Wrap existing DB helpers safely
 * - Provide read-only consumers (Home dashboard)
 *
 * IMPORTANT (ARCHITECTURE RULES):
 * - NO UI logic here
 * - NO backend sync logic here
 * - YES: domain-safe normalisation (string → Date)
 * - YES: derived calculations that are data-only (STCW compliance status)
 *
 * WHY STCW IS OK HERE:
 * - We compute a single compliance status from already-loaded logs
 * - We do NOT render UI, and do NOT modify DB schema
 * - HomeScreen should read a stable "truth" from context
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

import {
  DailyLogEntry,
  getDailyLogsStatus,
  getLastDailyLogDate,
  DailyLogsStatus,
} from "./dailyLogsDomain";

import {
  checkStcwCompliance,
  StcwComplianceStatus,
} from "../db/watchkeeping";

/**
 * IMPORTANT:
 * We intentionally import DB helpers ONLY here.
 * Screens must NOT import DB helpers directly.
 *
 * Adjust the import path below ONLY if your
 * existing file is named differently.
 */
import { getAllDailyLogs } from "../db/dailyLogs";

/* ============================================================
 * Context Types
 * ============================================================ */

interface DailyLogsContextValue {
  /** All daily logs (domain-safe) */
  logs: DailyLogEntry[];

  /** Derived compliance status for Daily Logs completeness */
  status: DailyLogsStatus;

  /** Most recent log date (for inspectors) */
  lastLogDate: Date | null;

  /** STCW Rest-Hours compliance status (Home dashboard uses this) */
  stcwComplianceStatus: StcwComplianceStatus;

  /** Reload logs from DB */
  refreshLogs: () => Promise<void>;

  /** Loading indicator */
  loading: boolean;
}

/* ============================================================
 * Context Setup
 * ============================================================ */

const DailyLogsContext = createContext<DailyLogsContextValue | undefined>(
  undefined
);

/* ============================================================
 * Provider
 * ============================================================ */

export function DailyLogsProvider({ children }: { children: ReactNode }) {
  // ------------------------------
  // Primary state
  // ------------------------------
  const [logs, setLogs] = useState<DailyLogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // ------------------------------
  // STCW compliance state (Home uses this)
  // Default COMPLIANT to avoid alarming users during first boot.
  // If there are no logs, Home can still display "Not enough data" later.
  // ------------------------------
  const [stcwComplianceStatus, setStcwComplianceStatus] =
    useState<StcwComplianceStatus>("COMPLIANT");

  /**
   * ----------------------------------------------------------
   * Load logs from DB
   * ----------------------------------------------------------
   *
   * NOTE:
   * - SQLite returns strings (ISO)
   * - We normalise ONCE here into Date objects
   * - STCW logic REQUIRES Date objects to be midnight-safe
   */
  const loadLogs = async () => {
    try {
      setLoading(true);

      // 1) Pull from DB (snake_case already aliased in query)
      const result = await getAllDailyLogs();

      /**
       * ----------------------------------------------------------
       * Normalise DB logs into DOMAIN-SAFE DailyLogEntry
       * ----------------------------------------------------------
       *
       * CRITICAL:
       * - STCW logic REQUIRES Date objects
       * - SQLite returns strings
       * - We normalise ONCE here
       */
      const normalised: DailyLogEntry[] = (result ?? []).map((log: any) => ({
        ...log,

        // Primary log date (used for grouping / listing)
        date: log.date ? new Date(log.date) : new Date(),

        // Work period times (CRITICAL for STCW)
        startTime: log.startTime ? new Date(log.startTime) : undefined,
        endTime: log.endTime ? new Date(log.endTime) : undefined,

        // Metadata (if present in your domain model)
        createdAt: log.createdAt ? new Date(log.createdAt) : new Date(),
        updatedAt: log.updatedAt ? new Date(log.updatedAt) : undefined,
      }));

      // 2) Update logs state (single source of truth)
      setLogs(normalised);

      // 3) Compute STCW compliance status from the same normalised logs
      //    (Pure calculation, no UI concerns)
      // ----------------------------------------------------------
      // Prepare minimal work-period shape for STCW engine
      // We intentionally read from the normalised object using
      // defensive access to avoid domain-type coupling.
      // ----------------------------------------------------------
      const workEntries = normalised.map((log: any) => ({
        startTime: log.startTime ?? log.start_time ?? null,
        endTime: log.endTime ?? log.end_time ?? null,
      }));

      const compliance = checkStcwCompliance(workEntries, new Date());

    setStcwComplianceStatus(compliance);
    } catch (err) {
      console.error("Failed to load daily logs", err);

      // Fail-safe: empty logs + conservative compliance state
      setLogs([]);
      setStcwComplianceStatus("COMPLIANT");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Initial load (on mount)
   */
  useEffect(() => {
    loadLogs();
  }, []);

  /* ============================================================
   * Derived values (PURE)
   * ============================================================
   *
   * These values depend ONLY on "logs".
   * They do not touch DB and do not do UI.
   */

  const status = getDailyLogsStatus(logs);
  const lastLogDate = getLastDailyLogDate(logs);

  /* ============================================================
   * Context Value
   * ============================================================ */

  const value: DailyLogsContextValue = {
    logs,
    status,
    lastLogDate,

    // STCW rest-hours compliance (Home dashboard)
    stcwComplianceStatus,

    // Consumer-triggered reload
    refreshLogs: loadLogs,

    loading,
  };

  return (
    <DailyLogsContext.Provider value={value}>
      {children}
    </DailyLogsContext.Provider>
  );
}

/* ============================================================
 * Hook
 * ============================================================ */

export function useDailyLogs() {
  const ctx = useContext(DailyLogsContext);

  if (!ctx) {
    throw new Error("useDailyLogs must be used within a DailyLogsProvider");
  }

  return ctx;
}
