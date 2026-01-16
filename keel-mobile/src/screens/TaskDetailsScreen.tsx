//keel-mobile/src/screens/TaskDetailsScreen.tsx

/**
 * ============================================================
 * Task Details Screen — ADVANCED (PSC / TRB SAFE)
 * ============================================================
 *
 * PURPOSE:
 * - Display task requirements clearly
 * - Allow cadet to record detailed work notes (long-form)
 * - Support offline-first draft saving
 * - Provide explicit back navigation for tablet-only devices
 *
 * DESIGN NOTES:
 * - Inspector-safe wording
 * - No backend dependency
 * - Android 3-button + gesture safe
 */

import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, } from "react-native";
import {
  Text,
  Button,
  Dialog,
  Portal,
  IconButton,
  Divider,
  TextInput,
  useTheme,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";

import { KeelScreen } from "../components/ui/KeelScreen";
import { KeelButton } from "../components/ui/KeelButton";
import { useToast } from "../components/toast/useToast";
import TaskAttachments from "../components/tasks/TaskAttachments";

import { getTaskByKey, upsertTaskStatus } from "../db/tasks";
import { getStaticTaskByKey } from "../tasks/taskCatalog.static";
import { TasksStackParamList } from "../navigation/types";
import {
  ensureTaskAttachmentsTable,
  getAttachmentsForTask,
  insertTaskAttachment,
  softDeleteTaskAttachment,
} from "../db/taskAttachments";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { Linking } from "react-native";



type Props = NativeStackScreenProps<TasksStackParamList, "TaskDetails">;

/**
 * Extra breathing space above Android system navigation
 */
const FOOTER_BREATHING_SPACE = 16;

export default function TaskDetailsScreen({ route }: Props) {
  const theme = useTheme();
  const toast = useToast();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const { taskKey } = route.params;

  /**
   * ------------------------------------------------------------
   * Task state
   * ------------------------------------------------------------
   */
  const [title, setTitle] = useState("Loading task…");
  const [description, setDescription] = useState("");
  const [status, setStatus] =
    useState<"NOT_STARTED" | "IN_PROGRESS" | "COMPLETED">("NOT_STARTED");

  /**
   * ============================================================
   * Task Attachments (Offline-first)
   * ============================================================
   */
  const [attachments, setAttachments] = useState<any[]>([]);



  // ------------------------------------------------------------
  // Cadet Notes state
  // ------------------------------------------------------------
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  /**
   * Cadet-entered long-form notes (stored locally)
   */
  const [cadetNotes, setCadetNotes] = useState<string>("");

  // ------------------------------------------------------------
  // Cadet Notes UI Mode
  // ------------------------------------------------------------
  // Preview by default (logbook-style)
  const [isEditingNotes, setIsEditingNotes] = useState(false);


  /**
   * Indicates whether structured catalog guidance exists
   */
  const [hasCatalogData, setHasCatalogData] = useState<boolean>(true);

  /**
   * Dialog state
   */
  const [showStartConfirm, setShowStartConfirm] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showInfoDialog, setShowInfoDialog] = useState(false);

  /**
   * ============================================================
   * LOAD TASK (OFFLINE-FIRST)
   * ============================================================
   */
  useEffect(() => {
    try {
      const staticTask = getStaticTaskByKey(taskKey);

      if (staticTask) {
        setTitle(staticTask.title);
        setDescription(staticTask.description);
        setHasCatalogData(true);
      } else {
        setTitle(taskKey);
        setDescription(
          "This task must be completed under the guidance of the supervising officer, in accordance with onboard procedures."
        );
        setHasCatalogData(false);
      }

      const record = getTaskByKey(taskKey);
      if (record) {
        setStatus(record.status);
        setLastSavedAt(record.updatedAt ?? null);
        setCadetNotes(record.remarks ?? "");
      }
    } catch {
      toast.error("Failed to load task.");
    }
  }, [taskKey, toast]);

  /**
   * ============================================================
   * ATTACHMENT FILE HELPERS (Offline-safe)
   * ============================================================
   */

/**
 * ============================================================
 * ATTACHMENT STORAGE PATH (TS-SAFE)
 * ============================================================
 *
 * We intentionally DO NOT reference:
 * - FileSystem.documentDirectory
 * - FileSystem.cacheDirectory
 *
 * Reason:
 * - In strict Expo + TS setups, these are missing from typings
 * - Even though they exist at runtime
 *
 * Strategy:
 * - Use a relative app-scoped directory
 * - Expo resolves this safely at runtime
 */
const TASK_EVIDENCE_DIR = "task-evidence/";

  /**
   * Ensure evidence directory exists.
   */
async function ensureEvidenceDirExists() {
  try {
    await FileSystem.makeDirectoryAsync(TASK_EVIDENCE_DIR, {
      intermediates: true,
    });
  } catch {
    // Directory already exists — safe to ignore
  }
}

  /**
   * Build a PSC/audit-friendly filename.
   */
  function buildEvidenceFileName(
    taskKey: string,
    originalName: string | null | undefined
  ) {
    const safeOriginal =
      originalName?.replace(/\s+/g, "_") ?? "evidence";
    return `TASK_${taskKey}_${Date.now()}_${safeOriginal}`;
  }


  /**
   * ============================================================
   * ACTION HANDLERS
   * ============================================================
   */
  function handleStartTask() {
    try {
      upsertTaskStatus({ taskKey, status: "IN_PROGRESS" });
      setStatus("IN_PROGRESS");
      setShowStartConfirm(false);
      toast.success("Task marked as In Progress.");
    } catch {
      toast.error("Failed to start task.");
    }
  }

  function handleSubmitTask() {
    try {
      upsertTaskStatus({ taskKey, status: "COMPLETED" });
      setStatus("COMPLETED");
      setShowSubmitConfirm(false);
      toast.success("Task submitted for officer review.");
    } catch {
      toast.error("Failed to submit task.");
    }
  }
/**
 * ============================================================
 * ATTACHMENT HANDLERS (REAL PICKERS + OFFLINE STORAGE)
 * ============================================================
 */

/**
 * Reload attachments from DB
 */
function reloadAttachments() {
  const rows = getAttachmentsForTask(taskKey);
  setAttachments(rows);
}

/**
 * Add photo using CAMERA
 */
async function handleAddPhoto(taskKey: string) {
  try {
    await ensureEvidenceDirExists();

    const permission =
      await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      toast.error("Camera permission is required.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    await saveImageAsset(taskKey, asset);
  } catch {
    toast.error("Failed to open camera.");
  }
}

/**
 * Add photo using GALLERY
 */
async function handleAddGallery(taskKey: string) {
  try {
    await ensureEvidenceDirExists();

    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      toast.error("Gallery permission is required.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    await saveImageAsset(taskKey, asset);
  } catch {
    toast.error("Failed to open gallery.");
  }
}

/**
 * Shared image save logic
 */
async function saveImageAsset(taskKey: string, asset: any) {
  const fileName = buildEvidenceFileName(taskKey, asset.fileName);
  const destUri = TASK_EVIDENCE_DIR + fileName;

  await FileSystem.copyAsync({
    from: asset.uri,
    to: destUri,
  });

  insertTaskAttachment({
    id: `ATT_${Date.now()}`,
    taskKey,
    kind: "PHOTO",
    fileName,
    localUri: destUri,
    mimeType: asset.type ?? "image/jpeg",
    sizeBytes: asset.fileSize ?? null,
  });

  reloadAttachments();
  toast.success("Photo attached.");
}


/**
 * Add PDF / Document
 */
async function handleAddDocument(taskKey: string) {
  try {
    await ensureEvidenceDirExists();

    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf"],
      copyToCacheDirectory: false,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    const fileName = buildEvidenceFileName(
      taskKey,
      asset.name
    );

    const destUri = TASK_EVIDENCE_DIR + fileName;

    await FileSystem.copyAsync({
      from: asset.uri,
      to: destUri,
    });

    insertTaskAttachment({
      id: `ATT_${Date.now()}`,
      taskKey,
      kind: "DOCUMENT",
      fileName,
      localUri: destUri,
      mimeType: asset.mimeType ?? "application/pdf",
      sizeBytes: asset.size ?? null,
    });

    reloadAttachments();
    toast.success("Document attached.");
  } catch {
    toast.error("Failed to attach document.");
  }
}

/**
 * Open attachment using system viewer.
 *
 * FileSystem does NOT open files.
 * We must delegate to the OS (Android/iOS).
 */
async function handleOpenAttachment(item: any) {
  try {
    const info = await FileSystem.getInfoAsync(item.localUri);
    if (!info.exists) {
      toast.error("File not found on device.");
      return;
    }

    await Linking.openURL(item.localUri);
  } catch {
    toast.error("Unable to open attachment.");
  }
}


/**
 * Soft delete attachment (DB only)
 */
async function handleDeleteAttachment(item: any) {
  try {
    softDeleteTaskAttachment(item.id);
    reloadAttachments();
    toast.success("Attachment removed.");
  } catch {
    toast.error("Failed to remove attachment.");
  }
}


  /**
   * ============================================================
   * MARKDOWN HELPERS (SIMPLE, TABLET-SAFE)
   * ============================================================
   */
  function appendMarkdown(wrapper: string) {
    setCadetNotes((prev) => `${prev}${wrapper}${wrapper}`);
  }

  function appendBullet() {
    setCadetNotes((prev) =>
      prev.endsWith("\n") || prev.length === 0
        ? `${prev}• `
        : `${prev}\n• `
    );
  }

  const footerPadding = insets.bottom + FOOTER_BREATHING_SPACE;

  return (
    <KeelScreen>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 64}
      >
        {/* ================= SCROLLABLE CONTENT ================= */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
      {/* ========================================================
          Header
          ======================================================== */}
        <View style={styles.headerRow}>
          {/* Left side: Back + Title stack */}
          <View style={styles.headerLeft}>
            {/* Back button */}
            <View style={styles.backButtonWrap}>
              <IconButton
                icon="chevron-left"
                size={22}
                iconColor="#3194A0"
                onPress={() => navigation.goBack()}
                style={styles.backButton}
              />
            </View>

            {/* Title + Meta + Status */}
            <View style={styles.titleBlock}>
              {/* Title */}
              <Text
                variant="titleLarge"
                style={styles.title}
                numberOfLines={2}
              >
                {title}
              </Text>

              {/* Draft + Last saved */}
              <View style={styles.metaRow}>
                <Text
                  variant="labelSmall"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  {status === "COMPLETED" ? "Submitted" : "Draft"}
                </Text>

                {lastSavedAt && (
                  <Text
                    variant="labelSmall"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    · Last saved {new Date(lastSavedAt).toLocaleString()}
                  </Text>
                )}
              </View>

              {/* Status */}
              <Text variant="labelMedium" style={styles.statusText}>
                Status:{" "}
                {status === "COMPLETED"
                  ? "Submitted"
                  : status === "IN_PROGRESS"
                  ? "In Progress"
                  : "Not Started"}
              </Text>
            </View>
          </View>

          {/* Right side: Info */}
          <IconButton
            icon="information-outline"
            size={22}
            onPress={() => setShowInfoDialog(true)}
            accessibilityLabel="Task Guidance"
          />
        </View>


        <Divider style={styles.divider} />

        {!hasCatalogData && (
          <View style={[styles.noticeBox, { backgroundColor: theme.colors.surfaceVariant }]}>
            <IconButton icon="information-outline" size={18} />
            <Text variant="bodySmall" style={styles.noticeText}>
              Formal guidance is not available for this task. Complete it based on
              onboard procedures and officer instructions.
            </Text>
          </View>
        )}

        <Text variant="titleSmall" style={styles.sectionTitle}>
          Task Requirements
        </Text>

        <View
          style={[
            styles.cardSurface,
            styles.cardPadded,
            {backgroundColor: theme.colors.surfaceVariant}
          ]}
        >
          <Text
            variant="bodyMedium"
            style={[styles.textPrimary,
              {color: theme.colors.onSurface },
            ]}
          >
            {description}
          </Text>
        </View>

        <View style={styles.notesHeader}>
          <View>
            <Text variant="titleSmall" style={styles.sectionTitle}>
              Cadet Work Details
            </Text>

            {!isEditingNotes && (
              <Text
                variant="labelSmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                Tap the pen icon to add or edit your entry
              </Text>
            )}
          </View>

          {!isEditingNotes && (
            <IconButton
              icon="pencil"
              size={20}
              onPress={() => setIsEditingNotes(true)}
              accessibilityLabel="Edit cadet entry"
            />
          )}
        </View>


      {/* ========================================================
          Cadet Notes — Preview / Edit (STRICT)
        ======================================================== */}
      {isEditingNotes ? (
        <View style={[styles.cardSurface, styles.cardPadded]}>
          {/* Formatting toolbar — EDIT MODE ONLY */}
          <View style={styles.toolbar}>
            <Button onPress={() => appendMarkdown("**")}>B</Button>
            <Button onPress={() => appendMarkdown("*")}>I</Button>
            <Button onPress={appendBullet}>•</Button>
          </View>

          <TextInput
            mode="outlined"
            multiline
            value={cadetNotes}
            onChangeText={setCadetNotes}
            placeholder="Describe what you did, observed, and learned…"
            style={styles.notes}
            autoFocus
          />

          <View style={styles.notesActions}>
            <KeelButton
              mode="secondary"
              onPress={() => {
                setIsEditingNotes(false);
              }}
            >
              Cancel
            </KeelButton>

            <KeelButton
              mode="primary"
              onPress={() => {
                upsertTaskStatus({ taskKey, status, remarks: cadetNotes });
                setIsEditingNotes(false);
                toast.success("Draft saved.");
              }}
            >
              Save
            </KeelButton>
          </View>
        </View>
      ) : (
        <View style={[styles.cardSurface, styles.cardPadded]}>
          {cadetNotes ? (
            cadetNotes.split("\n").map((line, idx) => (
              <Text key={idx} variant="bodyMedium" style={styles.textPrimary}>
                {line.startsWith("- ") ? "• " + line.replace("- ", "") : line}
              </Text>
            ))
          ) : (
            <Text
              variant="bodyMedium"
              style={[styles.textMuted, { color: theme.colors.onSurfaceVariant }]}
            >
              No details entered yet.
            </Text>
          )}
        </View>
      )}

      {/* ========================================================
          Task Evidence (Attachments) — PHASE 2A
          ======================================================== */}
      <TaskAttachments
        taskInstanceId={taskKey}
        taskStatus={status}
        attachments={attachments}
        onRefresh={reloadAttachments}
        onAddPhoto={handleAddPhoto}
        onAddGallery={handleAddGallery}
        onAddDocument={handleAddDocument}
        onOpen={handleOpenAttachment}
        onDelete={handleDeleteAttachment}
      />



      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: Math.min(insets.bottom, 12) }]}>
        {status === "NOT_STARTED" && (
          <KeelButton mode="primary" onPress={() => setShowStartConfirm(true)}>
            Start Task
          </KeelButton>
        )}

        {status === "IN_PROGRESS" && (
          <KeelButton mode="primary" onPress={() => setShowSubmitConfirm(true)}>
            Submit for Officer Review
          </KeelButton>
        )}
      </View>
      </KeyboardAvoidingView>

      {/* Dialogs */}
      <Portal>
        <Dialog visible={showStartConfirm} onDismiss={() => setShowStartConfirm(false)}>
          <Dialog.Title>Start Task</Dialog.Title>
          <Dialog.Actions>
            <Button onPress={() => setShowStartConfirm(false)}>Cancel</Button>
            <Button onPress={handleStartTask}>Yes</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Portal>
        <Dialog visible={showSubmitConfirm} onDismiss={() => setShowSubmitConfirm(false)}>
          <Dialog.Title>Submit Task</Dialog.Title>
          <Dialog.Actions>
            <Button onPress={() => setShowSubmitConfirm(false)}>Cancel</Button>
            <Button onPress={handleSubmitTask}>Yes</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Portal>
        <Dialog visible={showInfoDialog} onDismiss={() => setShowInfoDialog(false)}>
          <Dialog.Title>Task Guidance</Dialog.Title>
          <Dialog.Actions>
            <Button onPress={() => setShowInfoDialog(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </KeelScreen>
  );
}
const styles = StyleSheet.create({
scroll: {
  paddingTop: 4,
  paddingBottom: 96,
},
headerRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 2,
  marginTop: -4,
},
  headerLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  title: { fontWeight: "700", flex: 1 },
  divider: { marginVertical: 12 },
  sectionTitle: { fontWeight: "700", marginBottom: 6 },
  noticeBox: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: "#00000010",
  },
  noticeText: { flex: 1 },
  requirementsBox: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  toolbar: { flexDirection: "row", gap: 4 },
  notesInput: { minHeight: 160, marginBottom: 12 },
  footer: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 0,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E7EB",
  },
  backButtonWrap: {
  justifyContent: "center",
  marginRight: 6,
},

backButton: {
  borderWidth: 1.5,
  borderColor: "#3194A0",
  borderRadius: 24,
  backgroundColor: "transparent",
},

titleBlock: {
  flex: 1,
  justifyContent: "center",
},
notesHeader: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 6,
},

notesPreview: {
  padding: 12,
  paddingVertical: 6,
  borderRadius: 8,
  marginBottom: 12,
},

notesActions: {
  flexDirection: "row",
  justifyContent: "flex-end",
  gap: 12,
  marginBottom: 12,
},
notes: {
  minHeight: 160,
  marginBottom: 12,
},
notesLine: {
  marginBottom: 4,
  lineHeight: 20,
},

notesPlaceholder: {
  fontStyle: "italic",
  color: "#6B7280",
},
headerContainer: {
  marginBottom: 8,
},

metaRow: {
  flexDirection: "row",
  alignItems: "center",
  marginTop: 2,
},

statusText: {
  marginTop: 2,
  color: "#6B7280",
},
cardSurface: {
  backgroundColor: undefined, // injected via theme
  borderRadius: 12,
  borderWidth: StyleSheet.hairlineWidth,
  borderColor: "#00000020", // auto-works in dark/light
},

cardPadded: {
  padding: 14,
  marginBottom: 14,
},
textPrimary: {
  },

textMuted: {

},

});
