// keel-mobile/src/components/tasks/TaskAttachments.tsx
/**
 * ============================================================
 * TaskAttachments — Evidence Panel (PSC-Safe, Offline-First Ready)
 * ============================================================
 *
 * PURPOSE (Maritime / TRB / PSC):
 * - Provide a single, consistent UI surface to manage TASK EVIDENCE
 * - Evidence = Photos + PDFs/documents that prove the cadet performed the task
 * - Must be audit-safe: once task is SUBMITTED / SIGNED-OFF, evidence is LOCKED
 *
 * IMPORTANT DESIGN CONSTRAINTS:
 * - NO backend assumptions (no upload/sync logic here)
 * - Offline-first behavior is achieved by wiring this component to SQLite handlers
 * - Tablet friendly touch targets (big buttons, clear spacing)
 * - Light/Dark mode compatible via React Native Paper theme
 * - Toast feedback (success/error/blocked actions) via local Snackbar
 *
 * HOW THIS COMPONENT IS WIRED (NEXT STEP):
 * - Parent screen (usually TaskDetailsScreen) provides:
 *   1) current attachments array from SQLite
 *   2) handlers to add/open/delete attachments
 *   3) the task status string (from your taskStatusMachine)
 *
 * WHY THIS FILE DOES NOT DIRECTLY ACCESS SQLITE:
 * - Your rule: "Use existing SQLite schema where possible" + "No assumptions"
 * - We will wire this component to your existing db layer after you share the relevant file.
 */

/* ============================================================
   Types
   ============================================================ */

export type TaskAttachmentKind = "PHOTO" | "DOCUMENT";

export type TaskAttachmentItem = {
  /** Stable local id (UUID from SQLite recommended) */
  id: string;

  /** PHOTO or DOCUMENT */
  kind: TaskAttachmentKind;

  /** Friendly display name (e.g. "pump_room_valve.jpg" or "permit.pdf") */
  filename: string;

  /** Local file URI or file path that can be opened offline */
  localUri: string;

  /** ISO string or epoch ms; keep as string here for UI display stability */
  createdAtIso?: string;

  /** Optional: file size */
  sizeBytes?: number;

  /** Optional: mime type (image/jpeg, application/pdf, etc.) */
  mimeType?: string;
};

type Props = {
  /**
   * The specific task instance this evidence belongs to.
   * (Example: user’s task record for a given voyage/day/ship)
   */
  taskInstanceId: string;

  /**
   * Task status string (exact values live in your taskStatusMachine).
   * This component treats certain statuses as "locked".
   */
  taskStatus?: string;

  /**
   * If true, evidence UI becomes view-only regardless of status.
   * Useful for audit view or “signed-off archive” views.
   */
  readonly?: boolean;

  /**
   * Evidence list, loaded from SQLite (offline-first).
   * Parent provides it; this component only renders it.
   */
  attachments: TaskAttachmentItem[];

  /**
   * Refresh handler (optional). If provided, we show a refresh action.
   * Parent should re-query SQLite and pass updated attachments.
   */
  onRefresh?: () => Promise<void> | void;

  /**
   * Add handlers (no assumptions about pickers/storage here).
   * Parent decides how to pick a photo/document and store it offline.
   */
  onAddPhoto?: (taskInstanceId: string) => Promise<void>;
  onAddDocument?: (taskInstanceId: string) => Promise<void>;
  
    /** Add photo from gallery */
  onAddGallery: (taskKey: string) => void;

  /**
   * Open handler (parent decides how to open localUri).
   * Example: use Linking.openURL(localUri) or FileViewer library.
   */
  onOpen?: (item: TaskAttachmentItem) => Promise<void>;

  /**
   * Delete handler (parent performs SQLite delete + optional file cleanup).
   * This component enforces LOCK RULES before calling onDelete.
   */
  onDelete?: (item: TaskAttachmentItem) => Promise<void>;
};

/* ============================================================
   Imports
   ============================================================ */

import React, { useMemo, useState,  } from "react";
import { View, StyleSheet, Pressable, useWindowDimensions } from "react-native";
import {
  Card,
  Text,
  Button,
  IconButton,
  Menu,
  useTheme,
  Divider,
  Snackbar,
} from "react-native-paper";

/* ============================================================
   PSC / Audit Lock Rules
   ============================================================ */

/**
 * Determines whether evidence should be locked based on status.
 *
 * IMPORTANT:
 * - We do NOT assume exact status strings here because you told me
 *   to avoid assumptions and to use your existing status machine.
 * - Therefore: we use a conservative match (SUBMIT/SIGN/APPROV/COMPLETE).
 * - Next step: we will replace this logic with exact status constants
 *   after you paste the contents of taskStatusMachine.ts.
 */
function isEvidenceLockedByStatus(taskStatus?: string): boolean {
  if (!taskStatus) return false;

  const s = String(taskStatus).trim().toUpperCase();

  // Conservative audit-safe locking:
  // - Submitted / signed / approved / completed => lock evidence.
  // - You can tighten this to exact status constants in the next step.
  if (s.includes("SUBMIT")) return true;
  if (s.includes("SIGN")) return true;
  if (s.includes("APPROV")) return true;
  if (s.includes("COMPLETE")) return true;

  return false;
}

/* ============================================================
   Component
   ============================================================ */

export default function TaskAttachments({
  taskInstanceId,
  taskStatus,
  readonly,
  attachments,
  onRefresh,
  onAddPhoto,
  onAddDocument,
  onOpen,
  onDelete,
}: Props) {
  const theme = useTheme();
  const { width } = useWindowDimensions();

  // Tablet heuristic: adjust spacing and button layout.
  const isTablet = width >= 768;

  // LOCK RULE: readonly OR status implies lock
  const evidenceLocked = useMemo(() => {
    if (readonly === true) return true;
    return isEvidenceLockedByStatus(taskStatus);
  }, [readonly, taskStatus]);

  /* ----------------------------
     Local Toast / Snackbar
     ---------------------------- */
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastIsError, setToastIsError] = useState(false);
  /**
   * Controls the attachment action dropdown (paperclip menu)
   */
  const [menuVisible, setMenuVisible] = useState(false);

  function showToast(message: string, isError = false) {
    setToastMessage(message);
    setToastIsError(isError);
    setToastVisible(true);
  }

  

  /* ----------------------------
     Button guards (audit safe)
     ---------------------------- */
  async function handleAddPhoto() {
    if (evidenceLocked) {
      showToast("Evidence is locked after submission/sign-off.", true);
      return;
    }
    if (!onAddPhoto) {
      showToast("Add Photo is not wired yet (needs SQLite handler).", true);
      return;
    }

    try {
      await onAddPhoto(taskInstanceId);
      showToast("Photo added to evidence.");
    } catch (err: any) {
      showToast(err?.message || "Failed to add photo.", true);
    }
  }

  async function handleAddDocument() {
    if (evidenceLocked) {
      showToast("Evidence is locked after submission/sign-off.", true);
      return;
    }
    if (!onAddDocument) {
      showToast("Add Document is not wired yet (needs SQLite handler).", true);
      return;
    }

    try {
      await onAddDocument(taskInstanceId);
      showToast("Document added to evidence.");
    } catch (err: any) {
      showToast(err?.message || "Failed to add document.", true);
    }
  }

  async function handleOpen(item: TaskAttachmentItem) {
    if (!onOpen) {
      showToast("Open action is not wired yet.", true);
      return;
    }

    try {
      await onOpen(item);
    } catch (err: any) {
      showToast(err?.message || "Failed to open attachment.", true);
    }
  }

  async function handleDelete(item: TaskAttachmentItem) {
    if (evidenceLocked) {
      // PSC-safe hard block
      showToast("Cannot delete evidence after submission/sign-off.", true);
      return;
    }
    if (!onDelete) {
      showToast("Delete is not wired yet (needs SQLite handler).", true);
      return;
    }

    try {
      await onDelete(item);
      showToast("Attachment removed.");
    } catch (err: any) {
      showToast(err?.message || "Failed to delete attachment.", true);
    }
  }

  async function handleRefresh() {
    if (!onRefresh) return;
    try {
      await onRefresh();
      showToast("Evidence refreshed.");
    } catch (err: any) {
      showToast(err?.message || "Failed to refresh.", true);
    }
  }

  /* ============================================================
     UI
     ============================================================ */

  return (
    <Card
      style={[
        styles.card,
        { backgroundColor: theme.colors.elevation.level1 },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
            Evidence (Attachments)
          </Text>

          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}
          >
            Add photos or documents to prove the task was performed.
          </Text>
        </View>

        {onRefresh ? (
          <IconButton
            icon="refresh"
            onPress={handleRefresh}
            accessibilityLabel="Refresh evidence"
          />
        ) : null}
      </View>

      {/* LOCKED BANNER (Audit clarity) */}
      {evidenceLocked ? (
        <View
          style={[
            styles.lockBanner,
            { backgroundColor: theme.colors.secondaryContainer },
          ]}
        >
          <Text style={{ color: theme.colors.onSecondaryContainer }}>
            Evidence is locked after submission/sign-off (PSC-safe).
          </Text>
        </View>
      ) : null}

        {/* ========================================================
            Evidence Actions — Compact (Paperclip + Menu)
            ======================================================== */}
        <View style={styles.actionsCompactRow}>
        <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant }}
        >
            Attach evidence
        </Text>

        {/* Paperclip anchored menu (React Native Paper–correct pattern) */}
        <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            contentStyle={{
            borderRadius: 12,
            backgroundColor: theme.colors.elevation.level2,
            }}
            anchor={
            <IconButton
                icon="paperclip"
                size={24}
                disabled={evidenceLocked}
                onPress={() => setMenuVisible(true)}
                accessibilityLabel="Add evidence"
            />
            }
        >
            <Menu.Item
            leadingIcon="camera"
            title="Camera"
            onPress={() => {
                setMenuVisible(false);
                handleAddPhoto();
            }}
            />

            <Menu.Item
            leadingIcon="image"
            title="Gallery"
            onPress={() => {
                setMenuVisible(false);
                handleAddPhoto();
            }}
            />

            <Menu.Item
            leadingIcon="file-pdf-box"
            title="PDF / Document"
            onPress={() => {
                setMenuVisible(false);
                handleAddDocument();
            }}
            />
        </Menu>
        </View>

      <Divider style={{ marginTop: 12, marginBottom: 12 }} />

      {/* LIST / EMPTY STATE */}
      {attachments.length === 0 ? (
        <View style={styles.emptyState}>
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            No evidence added yet.
          </Text>

          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant, marginTop: 6 }}
          >
            Tip: For PSC readiness, attach at least one clear photo or a signed
            document where applicable.
          </Text>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {attachments.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => handleOpen(item)}
              style={({ pressed }) => [
                styles.itemRow,
                {
                  backgroundColor: theme.colors.elevation.level2,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <View style={styles.itemLeft}>
                <IconButton
                  icon={item.kind === "PHOTO" ? "image" : "file-pdf-box"}
                  size={22}
                  onPress={() => handleOpen(item)}
                  accessibilityLabel="Open attachment"
                />

                <View style={{ flex: 1 }}>
                  <Text
                    variant="bodyMedium"
                    numberOfLines={1}
                    style={{ color: theme.colors.onSurface }}
                  >
                    {item.filename || "(Unnamed file)"}
                  </Text>

                  <Text
                    variant="bodySmall"
                    numberOfLines={1}
                    style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}
                  >
                    {item.kind}
                    {item.createdAtIso ? ` • ${item.createdAtIso}` : ""}
                    {typeof item.sizeBytes === "number"
                      ? ` • ${formatBytes(item.sizeBytes)}`
                      : ""}
                  </Text>
                </View>
              </View>

              <View style={styles.itemRight}>
                {/* Delete button is visible but disabled by lock rule to make policy obvious */}
                <IconButton
                  icon="delete"
                  disabled={evidenceLocked}
                  onPress={() => handleDelete(item)}
                  accessibilityLabel="Delete attachment"
                />
              </View>
            </Pressable>
          ))}
        </View>
      )}

      {/* Toast / Snackbar */}
      <Snackbar
        visible={toastVisible}
        onDismiss={() => setToastVisible(false)}
        duration={2500}
        style={[
          styles.snackbar,
          toastIsError
            ? { backgroundColor: theme.colors.errorContainer }
            : { backgroundColor: theme.colors.inverseSurface },
        ]}
      >
        <Text
          style={
            toastIsError
              ? { color: theme.colors.onErrorContainer }
              : { color: theme.colors.inverseOnSurface }
          }
        >
          {toastMessage}
        </Text>
      </Snackbar>
    </Card>
  );
}

/* ============================================================
   Helpers
   ============================================================ */

/**
 * Human-readable file size for UI.
 * Example: 1240000 => "1.18 MB"
 */
function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const k = 1024;
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  return `${value.toFixed(value >= 10 ? 0 : 2)} ${units[i]}`;
}

/* ============================================================
   Styles (Tablet friendly)
   ============================================================ */

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 12,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },

  lockBanner: {
    marginTop: 10,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },

  actionsRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  actionsRowTablet: {
    // On tablets, we keep buttons roomy and aligned
    justifyContent: "flex-start",
  },

  actionButton: {
    flex: 1,
    borderRadius: 12,
  },

  actionButtonContent: {
    paddingVertical: 8,
  },

  emptyState: {
    paddingVertical: 10,
    paddingHorizontal: 6,
  },

  itemRow: {
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
  },

  itemLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  itemRight: {
    flexDirection: "row",
    alignItems: "center",
  },

  snackbar: {
    marginTop: 14,
    borderRadius: 12,
  },
  actionsCompactRow: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  marginTop: 8,
  marginBottom: 8,
},

});
