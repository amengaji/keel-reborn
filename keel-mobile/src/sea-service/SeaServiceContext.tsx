//keel-mobile/src/sea-service/SeaServiceContext.tsx

/**
 * ============================================================
 * Sea Service Context (SQLite-Backed, Draft-Safe)
 * ============================================================
 *
 * RESPONSIBILITIES:
 * - Hold ACTIVE Sea Service draft payload in memory (DRAFT only)
 * - Load ACTIVE draft from SQLite on mount
 * - Load FINAL Sea Service history list from SQLite on mount
 * - Auto-save DRAFT on payload changes (draft-safe)
 * - Central authority for finalization (DRAFT → FINAL)
 * - EXPLICITLY create DRAFT from StartSeaServiceScreen (Phase 4)
 *
 * NOT RESPONSIBLE FOR:
 * - UI rendering
 * - Navigation
 * - Backend sync (future)
 */

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useRef,
} from "react";

import {
  SeaServicePayload,
  DEFAULT_SEA_SERVICE_PAYLOAD,
} from "./seaServiceDefaults";

import type { SeaServiceRecord } from "../db/seaService";

import {
  createSeaServiceDraft,
  getActiveSeaServiceDraft,
  getSeaServiceFinalHistory,
  upsertSeaServiceDraft,
  finalizeSeaService,
  discardSeaServiceDraft,
} from "../db/seaService";

import { useToast } from "../components/toast/useToast";
import { canFinalizeSeaService } from "./seaServiceStatus";

/**
 * Context shape exposed to consumers.
 */
interface SeaServiceContextType {
  /**
   * ACTIVE draft payload only (if seaServiceId exists).
   * When there is no active draft, payload is the default empty payload.
   */
  payload: SeaServicePayload;

  /**
   * Active Sea Service DB record id (null if no active draft exists).
   */
  seaServiceId: string | null;

  /**
   * FINAL history list (read-only).
   * Multiple records, sorted latest-first.
   */
  finalHistory: SeaServiceRecord[];

  /**
   * Finalization eligibility (central authority).
   */
  canFinalize: boolean;

  /**
   * EXPLICIT creation (transaction) from StartSeaServiceScreen.
   * This is the ONLY correct way to start a Sea Service.
   */
  startSeaServiceDraft: (args: {
    shipType: string;
    signOnDate: string;
    signOnPort: string;
  }) => Promise<void>;

  /**
   * Actions
   */
  updateSection: (
    sectionKey: keyof SeaServicePayload["sections"],
    data: Record<string, any>
  ) => void;

  updateServicePeriod: (period: SeaServicePayload["servicePeriod"]) => void;
  setShipType: (shipTypeCode: string) => void;

  /**
   * Central finalize action (DRAFT → FINAL).
   * UI must call via confirmation dialog.
   */
  finalizeSeaService: () => Promise<void>;

  /**
   * Discard ACTIVE draft (DRAFT only).
   * Must never delete FINAL records.
   */
  discardDraft: () => Promise<void>;

  /**
   * Refresh FINAL history list from DB (useful after finalize).
   */
  refreshFinalHistory: () => void;
}

/**
 * Internal React context.
 */
const SeaServiceContext = createContext<SeaServiceContextType | undefined>(
  undefined
);

export function SeaServiceProvider({ children }: { children: ReactNode }) {
  const toast = useToast();

  /**
   * In-memory payload state.
   * This represents ONLY the ACTIVE draft payload.
   */
  const [payload, setPayload] = useState<SeaServicePayload>(() => ({
    ...DEFAULT_SEA_SERVICE_PAYLOAD,
    sections: { ...DEFAULT_SEA_SERVICE_PAYLOAD.sections },
  }));

  /**
   * DB record id for the active DRAFT (null if none).
   */
  const [seaServiceId, setSeaServiceId] = useState<string | null>(null);

  /**
   * FINAL records history list.
   */
  const [finalHistory, setFinalHistory] = useState<SeaServiceRecord[]>([]);

  /**
   * Track whether initial DB hydration is done.
   * Prevents accidental overwrite during first render.
   */
  const hasHydratedRef = useRef(false);

  /**
   * ============================================================
   * Helper: refresh FINAL history (read-only)
   * ============================================================
   */
  const refreshFinalHistory = () => {
    try {
      const finals = getSeaServiceFinalHistory();
      setFinalHistory(finals);
    } catch (err) {
      console.error("Failed to load Sea Service history:", err);
      toast.error("Failed to load Sea Service history.");
    }
  };

  /**
   * ============================================================
   * INITIAL LOAD — SQLite → Context
   * ============================================================
   *
   * IMPORTANT:
   * - Context holds ACTIVE draft only.
   * - FINAL records are shown via finalHistory[].
   */
  useEffect(() => {
    try {
      // 1) Load FINAL history (always)
      refreshFinalHistory();

      // 2) Load ACTIVE draft (if any)
      const draft = getActiveSeaServiceDraft();

      if (draft) {
        setSeaServiceId(draft.id);
        setPayload({
          ...draft.payload,
          sections: { ...draft.payload.sections },
        });
      } else {
        setSeaServiceId(null);
        setPayload({
          ...DEFAULT_SEA_SERVICE_PAYLOAD,
          sections: { ...DEFAULT_SEA_SERVICE_PAYLOAD.sections },
        });
      }

      hasHydratedRef.current = true;
    } catch (err) {
      console.error("Failed to hydrate Sea Service:", err);
      toast.error("Failed to load Sea Service.");
      hasHydratedRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * ============================================================
   * AUTO-SAVE — Context → SQLite (DRAFT only)
   * ============================================================
   *
   * Triggered on ANY payload change AFTER hydration.
   * Only saves when seaServiceId exists (active DRAFT exists).
   */
  useEffect(() => {
    if (!hasHydratedRef.current) return;

    try {
      if (!seaServiceId) return;
      upsertSeaServiceDraft(seaServiceId, payload);
      // silent success (no toast spam)
    } catch (err) {
      console.error("Auto-save Sea Service failed:", err);
      toast.error("Auto-save failed. Your draft may not be saved.");
    }
  }, [payload, seaServiceId, toast]);

  /**
   * ============================================================
   * EXPLICIT START (Phase 4 – Step 2)
   * ============================================================
   *
   * This is the fix for:
   * - "Add Sea Service not saving to draft after sign-on"
   *
   * Guarantees:
   * - Creates the DRAFT row immediately
   * - Hydrates context from DB record (single source of truth)
   */
  const startSeaServiceDraft = async (args: {
    shipType: string;
    signOnDate: string;
    signOnPort: string;
  }) => {
    try {
      if (!hasHydratedRef.current) {
        // Defensive: ensure provider has mounted properly
        toast.error("Sea Service is not ready yet. Please try again.");
        return;
      }

      if (seaServiceId) {
        toast.info("An active Sea Service draft already exists.");
        return;
      }

      const created = createSeaServiceDraft(args);

      setSeaServiceId(created.id);
      setPayload({
        ...created.payload,
        sections: { ...created.payload.sections },
      });

      toast.success("Sea Service draft started.");
    } catch (err: any) {
      console.error("Failed to start Sea Service draft:", err);

      /**
       * Most common reason:
       * - DB unique index prevented a second DRAFT
       */
      toast.error(
        "Failed to start Sea Service. Please ensure no active draft exists."
      );
    }
  };

/**
 * ============================================================
 * Update data for a given section (AUDIT-SAFE)
 * ============================================================
 *
 * RULES:
 * - NOT_STARTED → no fields filled
 * - IN_PROGRESS → some fields filled
 * - COMPLETE → all fields filled
 *
 * This logic is CENTRAL and must never be duplicated in UI.
 */
const updateSection = (
  sectionKey: keyof SeaServicePayload["sections"],
  data: Record<string, any>
) => {
  setPayload((prev) => {
    const mergedSection = {
      ...(prev.sections as any)[sectionKey],
      ...data,
    };

    /**
     * ============================================================
     * STATUS AUTHORITY — SINGLE SOURCE OF TRUTH
     * ============================================================
     *
     * We DO NOT compute completion here using "all fields filled".
     * That approach breaks:
     * - optional fields
     * - toggle/checkbox “not applicable” logic
     * - gated fields (required only if toggle is ON)
     *
     * Instead, we delegate to seaServiceStatus.ts which holds the
     * audit-grade rules for each section.
     */
    const { getSeaServiceSectionStatus } = require("./seaServiceStatus");

    const statusFromRules:
      | "NOT_STARTED"
      | "IN_PROGRESS"
      | "COMPLETED" = getSeaServiceSectionStatus(
      sectionKey,
      mergedSection,
      prev.shipType
    );

    /**
     * Wizard expects: NOT_STARTED | IN_PROGRESS | COMPLETE
     * Status engine returns: NOT_STARTED | IN_PROGRESS | COMPLETED
     * We map it here.
     */
    const mappedStatus: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETE" =
      statusFromRules === "COMPLETED"
        ? "COMPLETE"
        : statusFromRules;

    return {
      ...prev,
      lastUpdatedAt: Date.now(),
      sectionStatus: {
        ...(prev as any).sectionStatus,
        [sectionKey]: mappedStatus,
      },
      sections: {
        ...prev.sections,
        [sectionKey]: mergedSection,
      },
    };
  });
};



  /**
   * Update service period (sign on/off).
   * Stored at top-level.
   */
  const updateServicePeriod = (period: SeaServicePayload["servicePeriod"]) => {
    setPayload((prev) => ({
      ...prev,
      lastUpdatedAt: Date.now(),
      servicePeriod: {
        ...(prev as any).servicePeriod,
        ...(period as any),
      },
    }));
  };

  /**
   * Set ship type selected by cadet.
   * (Editable via the metadata edit sheet later.)
   */
  const setShipType = (shipTypeCode: string) => {
    setPayload((prev) => ({
      ...prev,
      shipType: shipTypeCode,
      lastUpdatedAt: Date.now(),
    }));
  };


/**
 * ============================================================
 * FINALIZATION ELIGIBILITY (CENTRAL AUTHORITY)
 * ============================================================
 *
 * IMPORTANT:
 * - canFinalizeSeaService needs shipType to correctly ignore
 *   ship-type-disabled sections (e.g. IGS on non-tankers).
 */
const canFinalize = canFinalizeSeaService(payload, payload.shipType ?? undefined);

  /**
   * ============================================================
   * FINALIZE SEA SERVICE (CENTRAL AUTHORITY)
   * ============================================================
   *
   * - Validates eligibility (canFinalize)
   * - Updates DB status DRAFT → FINAL
   * - Clears active draft id + resets payload
   * - Refreshes FINAL history list
   */
  const finalizeSeaServiceAction = async () => {
    try {
      if (!seaServiceId) {
        toast.error("No active Sea Service to finalize.");
        return;
      }

      /**
       * ============================================================
       * FINALIZATION ELIGIBILITY — SEA SERVICE ONLY (CORRECTED)
       * ============================================================
       *
       * IMPORTANT:
       * - Daily Logs, Tasks, Familiarisation are NOT blockers
       * - Only Sea Service lifecycle + sections matter here
       */
      if (
        !payload.shipType ||
        !payload.servicePeriod?.signOnDate ||
        !payload.servicePeriod?.signOnPort ||
        !payload.servicePeriod?.signOffDate ||
        !payload.servicePeriod?.signOffPort
      ) {
        toast.error(
          "Sea Service cannot be finalized. Sign-On and Sign-Off details are mandatory."
        );
      }

/**
 * Section completion is already validated separately
 * via sectionStatus map.
 */


      // DB: DRAFT → FINAL (authoritative lifecycle transition)
      finalizeSeaService(seaServiceId);

      // Clear active draft in memory
      setSeaServiceId(null);
      setPayload({
        ...DEFAULT_SEA_SERVICE_PAYLOAD,
        sections: { ...DEFAULT_SEA_SERVICE_PAYLOAD.sections },
      });

      // Refresh history list
      refreshFinalHistory();

      toast.success("Sea Service finalized successfully.");
    } catch (err) {
      console.error("Failed to finalize Sea Service:", err);
      toast.error("Failed to finalize Sea Service. Please try again.");
    }
  };

  /**
   * ============================================================
   * DISCARD DRAFT (DRAFT ONLY — CENTRAL AUTHORITY)
   * ============================================================
   *
   * - Deletes the ACTIVE DRAFT from DB
   * - Clears active draft id + resets payload
   * - FINAL records remain untouched (immutable)
   */
  const discardDraftAction = async () => {
    try {
      if (!seaServiceId) {
        toast.error("No active draft to discard.");
        return;
      }

      discardSeaServiceDraft(seaServiceId);

      setSeaServiceId(null);
      setPayload({
        ...DEFAULT_SEA_SERVICE_PAYLOAD,
        sections: { ...DEFAULT_SEA_SERVICE_PAYLOAD.sections },
      });

      toast.success("Draft discarded successfully.");
    } catch (err) {
      console.error("Failed to discard Sea Service draft:", err);
      toast.error("Failed to discard draft. Please try again.");
    }
  };

  return (
    <SeaServiceContext.Provider
      value={{
        payload,
        seaServiceId,
        finalHistory,
        canFinalize,
        startSeaServiceDraft,
        updateSection,
        updateServicePeriod,
        setShipType,
        finalizeSeaService: finalizeSeaServiceAction,
        discardDraft: discardDraftAction,
        refreshFinalHistory,
      }}
    >
      {children}
    </SeaServiceContext.Provider>
  );
}

/**
 * Hook
 */
export function useSeaService() {
  const ctx = useContext(SeaServiceContext);
  if (!ctx) {
    throw new Error("useSeaService must be used within a SeaServiceProvider");
  }
  return ctx;
}
