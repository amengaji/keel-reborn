//keel-mobile/src/screens/tasks/TaskDetailsScreen.tsx

import React, { useEffect, useState, useRef } from "react";
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform, 
  TextInput as NativeTextInput,
  TouchableOpacity,
  LayoutAnimation,
  UIManager
} from "react-native";
import {
  Text,
  Button,
  Dialog,
  Portal,
  IconButton,
  Divider,
  useTheme,
  Surface,
  TouchableRipple,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";

import { KeelScreen } from "../../components/ui/KeelScreen";
import { KeelButton } from "../../components/ui/KeelButton";
import { KeelCard } from "../../components/ui/KeelCard";
import { useToast } from "../../components/toast/useToast";
import TaskAttachments from "../../components/tasks/TaskAttachments";

// Import the updated TaskStatus type
import { getTaskByKey, upsertTaskStatus, TaskStatus } from "../../db/tasks";
import { getStaticTaskByKey } from "../../tasks/taskCatalog.static";

import {
  ensureTaskAttachmentsTable,
  getAttachmentsForTask,
  insertTaskAttachment,
  softDeleteTaskAttachment,
} from "../../db/taskAttachments";

import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

// Enable Layout Animation for Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

type TaskDetailsParams = {
  TaskDetails: {
    taskKey: string;
  };
};

type Props = NativeStackScreenProps<TaskDetailsParams, "TaskDetails">;

export default function TaskDetailsScreen({ route }: Props) {
  const theme = useTheme();
  const toast = useToast();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { taskKey } = route.params;

  // --- Task State ---
  const [taskTitle, setTaskTitle] = useState(""); 
  const [competence, setCompetence] = useState("Loading..."); 
  const [instructions, setInstructions] = useState("");
  const [status, setStatus] = useState<TaskStatus>("NOT_STARTED");

  // Metadata
  const [stcwCode, setStcwCode] = useState<string | null>(null);
  const [safetyLevel, setSafetyLevel] = useState<string | null>(null);
  const [frequency, setFrequency] = useState<string | null>(null);
  const [evidenceType, setEvidenceType] = useState<string | null>(null);

  // UI State
  const [showFullInstructions, setShowFullInstructions] = useState(false);
  const [cadetNotes, setCadetNotes] = useState<string>("");
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const notesInputRef = useRef<NativeTextInput>(null);
  
  // Attachments
  const [attachments, setAttachments] = useState<any[]>([]);
  const processingRef = useRef(false);

  // Dialogs
  const [showStartConfirm, setShowStartConfirm] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  // --- INIT ---
  useEffect(() => {
    try { ensureTaskAttachmentsTable(); } catch {}
    loadTaskData();
  }, [taskKey]);

  const loadTaskData = () => {
    try {
      const record = getTaskByKey(taskKey);
      const staticTask = getStaticTaskByKey(taskKey);

      if (record) {
        setTaskTitle(record.taskTitle);
        setCompetence(record.taskDescription || record.taskTitle);
        setInstructions(record.instructions || staticTask?.description || "Refer to onboard procedures.");
        
        setStatus(record.status);
        setCadetNotes(record.remarks || ""); 
        
        setStcwCode(record.stcwCode);
        setSafetyLevel(record.safetyLevel);
        setFrequency(record.frequency);
        setEvidenceType(record.evidenceType);

      } else {
        setCompetence(taskKey);
        setInstructions("This task must be completed under officer guidance.");
      }
      reloadAttachments();
    } catch {
      toast.error("Failed to load task.");
    }
  };

  // --- ACTION HANDLERS ---
  const handleStartTask = () => {
    upsertTaskStatus({ taskKey, status: "IN_PROGRESS", remarks: cadetNotes });
    setStatus("IN_PROGRESS");
    setShowStartConfirm(false);
    toast.success("Task Started");
  };

  /**
   * Validation Logic: Ensures Journal and Evidence are present before submission.
   */
  const handleRequestApproval = () => {
    // 1. Journal Check: Minimum 10 characters for a valid entry
    if (!cadetNotes || cadetNotes.trim().length < 10) {
        toast.error("A detailed journal entry is required for approval.");
        return;
    }

    // 2. Evidence Check: Required if task metadata specifies PHOTO/DOCUMENT
    const requiresEvidence = evidenceType && evidenceType !== 'NONE';
    if (requiresEvidence && attachments.length === 0) {
        toast.error("At least one photo or document is required as evidence.");
        return;
    }

    setShowSubmitConfirm(true);
  };

  const handleSubmitForReview = () => {
    // Transition to PENDING_REVIEW instead of COMPLETED
    upsertTaskStatus({ taskKey, status: "PENDING_REVIEW", remarks: cadetNotes });
    setStatus("PENDING_REVIEW");
    setShowSubmitConfirm(false);
    toast.success("Submitted for Officer Review");
  };

  const handleSaveJournal = () => {
    upsertTaskStatus({ taskKey, status, remarks: cadetNotes });
    setIsEditingNotes(false);
    toast.success("Journal Entry Saved");
  };

  const toggleInstructions = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowFullInstructions(!showFullInstructions);
  };

  // --- ATTACHMENTS ---
  function reloadAttachments() {
    const rows = getAttachmentsForTask(taskKey);
    setAttachments(rows.map((row: any) => ({ ...row, name: row.fileName })));
  }

  async function handleAddPhoto() {
    if (processingRef.current) return;
    processingRef.current = true;
    try {
      await ensureEvidenceDirExists();
      const res = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
      if (!res.canceled && res.assets?.[0]) await saveAsset(res.assets[0], "PHOTO");
    } catch { toast.error("Camera failed"); } finally { processingRef.current = false; }
  }

  async function handleAddGallery() {
    if (processingRef.current) return;
    processingRef.current = true;
    try {
      await ensureEvidenceDirExists();
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
      if (!res.canceled && res.assets?.[0]) await saveAsset(res.assets[0], "PHOTO");
    } catch { toast.error("Gallery failed"); } finally { processingRef.current = false; }
  }

  async function handleAddDocument() {
    if (processingRef.current) return;
    processingRef.current = true;
    try {
      await ensureEvidenceDirExists();
      const res = await DocumentPicker.getDocumentAsync({ type: "application/pdf", copyToCacheDirectory: true });
      if (!res.canceled && res.assets?.[0]) await saveAsset(res.assets[0], "DOCUMENT");
    } catch { toast.error("File failed"); } finally { processingRef.current = false; }
  }

  async function saveAsset(asset: any, kind: "PHOTO" | "DOCUMENT") {
    const docDir = FileSystem.documentDirectory + "task-evidence/";
    const name = `TASK_${taskKey}_${Date.now()}.${kind === 'PHOTO' ? 'jpg' : 'pdf'}`;
    await FileSystem.copyAsync({ from: asset.uri, to: docDir + name });
    insertTaskAttachment({
      id: `ATT_${Date.now()}`, taskKey, kind, fileName: asset.name || "Evidence", 
      localUri: docDir + name, mimeType: kind === 'PHOTO' ? 'image/jpeg' : 'application/pdf', sizeBytes: 0
    });
    reloadAttachments();
    toast.success("Evidence Attached");
  }

  async function ensureEvidenceDirExists() {
    await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + "task-evidence/", { intermediates: true });
  }

  const handleOpenAttachment = async (item: any) => {
     if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(item.localUri);
  };

  const handleRequestDelete = async (item: any) => {
    setDeleteTarget(item);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) softDeleteTaskAttachment(deleteTarget.id);
    reloadAttachments();
    setShowDeleteConfirm(false);
  };

  // --- UI HELPERS ---
  const FOOTER_HEIGHT = 90;
  const isEditable = status === 'IN_PROGRESS';
  const isLocked = status === 'PENDING_REVIEW' || status === 'COMPLETED';

  const getStatusConfig = (s: TaskStatus) => {
    switch(s) {
      case 'COMPLETED': return { label: 'VERIFIED', bg: '#D1FAE5', text: '#065F46' };
      case 'PENDING_REVIEW': return { label: 'PENDING REVIEW', bg: '#E0F2FE', text: '#0369A1' };
      case 'IN_PROGRESS': return { label: 'IN PROGRESS', bg: '#FEF3C7', text: '#92400E' };
      default: return { label: 'NOT STARTED', bg: '#F3F4F6', text: '#6B7280' };
    }
  };

  const getSafetyColor = (l: string | null) => {
    if (!l || l === 'None') return theme.colors.primary;
    if (l.toLowerCase().includes('high')) return theme.colors.error;
    if (l.toLowerCase().includes('med')) return '#F59E0B';
    return '#10B981';
  };

  const LockedCard = ({ text, icon = "lock-outline" }: { text: string, icon?: string }) => (
    <Surface style={styles.lockedCard} elevation={0}>
        <View style={styles.lockedIconCircle}>
            <IconButton icon={icon} size={20} iconColor="#9CA3AF" style={{ margin: 0 }} />
        </View>
        <Text variant="bodySmall" style={{ color: '#6B7280', fontWeight: '600' }}>{text}</Text>
    </Surface>
  );

  return (
    <KeelScreen style={{ paddingHorizontal: 0 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* ================= HEADER ================= */}
        <Surface style={styles.headerContainer} elevation={1}>
           <View style={styles.headerTopRow}>
               <IconButton icon="arrow-left" onPress={() => navigation.goBack()} size={24} style={{ marginLeft: -8 }} />
               <View style={[styles.statusBadge, { backgroundColor: getStatusConfig(status).bg }]}>
                   <Text style={[styles.statusBadgeText, { color: getStatusConfig(status).text }]}>
                       {getStatusConfig(status).label}
                   </Text>
               </View>
           </View>
           <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
               <Text variant="labelMedium" style={{ color: theme.colors.secondary, fontWeight: '700' }}>
                   {taskKey}
               </Text>
               <Text variant="headlineSmall" style={styles.competenceTitle}>
                   {competence}
               </Text>
           </View>
        </Surface>

        {/* ================= SCROLL CONTENT ================= */}
        <ScrollView 
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: FOOTER_HEIGHT + insets.bottom + 40 }}
            showsVerticalScrollIndicator={false}
        >
            {/* STATS GRID */}
            <View style={styles.statsGrid}>
                <View style={[styles.statCard, { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' }]}>
                    <IconButton icon="book-open-page-variant" size={20} iconColor="#0284C7" style={styles.statIcon} />
                    <Text style={[styles.statLabel, { color: '#0369A1' }]}>STCW</Text>
                    <Text style={[styles.statValue, { color: '#0C4A6E' }]}>{stcwCode || "N/A"}</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#F3E8FF', borderColor: '#DDD6FE' }]}>
                    <IconButton icon="repeat" size={20} iconColor="#7C3AED" style={styles.statIcon} />
                    <Text style={[styles.statLabel, { color: '#6D28D9' }]}>FREQ</Text>
                    <Text style={[styles.statValue, { color: '#4C1D95' }]}>{frequency ? frequency.replace('_', ' ') : "Once"}</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: getSafetyColor(safetyLevel) + '10', borderColor: getSafetyColor(safetyLevel) + '30' }]}>
                    <IconButton icon="shield-check" size={20} iconColor={getSafetyColor(safetyLevel)} style={styles.statIcon} />
                    <Text style={[styles.statLabel, { color: getSafetyColor(safetyLevel) }]}>SAFETY</Text>
                    <Text style={[styles.statValue, { color: getSafetyColor(safetyLevel) }]}>{safetyLevel || "None"}</Text>
                </View>
            </View>

            {/* INSTRUCTIONS */}
            <TouchableRipple onPress={toggleInstructions} style={styles.instructionContainer}>
                <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                        <Text variant="titleSmall" style={{ fontWeight: '700' }}>Task Information</Text>
                        <IconButton icon={showFullInstructions ? "chevron-up" : "chevron-down"} size={16} />
                    </View>
                    <Text variant="bodyMedium" style={{ lineHeight: 20 }} numberOfLines={showFullInstructions ? undefined : 2}>
                        {instructions}
                    </Text>
                </View>
            </TouchableRipple>

            {/* TRAINEE JOURNAL */}
            <View style={styles.sectionHeaderRow}>
                <Text variant="titleMedium" style={styles.sectionHeaderText}>Trainee Journal</Text>
                {isEditable && !isEditingNotes && (
                    <IconButton icon="pencil" mode="contained-tonal" size={18} iconColor={theme.colors.primary} onPress={() => setIsEditingNotes(true)} />
                )}
            </View>

            {status === 'NOT_STARTED' ? (
                <LockedCard text="Start task to enable journal" />
            ) : isEditingNotes ? (
                <View style={[styles.editorContainer, { borderColor: theme.colors.primary }]}>
                    <NativeTextInput 
                        ref={notesInputRef}
                        multiline 
                        style={styles.textArea} 
                        value={cadetNotes} 
                        onChangeText={setCadetNotes} 
                        placeholder="Detail your practical performance..."
                        autoFocus
                    />
                    <View style={styles.editorFooter}>
                        <Button mode="contained" onPress={handleSaveJournal}>Save Entry</Button>
                    </View>
                </View>
            ) : (
                <KeelCard onPress={() => isEditable && setIsEditingNotes(true)} style={styles.journalDisplayCard}>
                    {cadetNotes ? (
                        <Text variant="bodyMedium" style={{ lineHeight: 22 }}>{cadetNotes}</Text>
                    ) : (
                        <View style={styles.emptyJournalPlaceholder}>
                            <IconButton icon="notebook-edit-outline" size={28} />
                            <Text variant="bodySmall">Tap to write your journal entry...</Text>
                        </View>
                    )}
                </KeelCard>
            )}

            {/* EVIDENCE SECTION */}
            {(!evidenceType || evidenceType !== 'NONE') && (
                <>
                    <View style={styles.sectionHeaderRow}>
                        <Text variant="titleMedium" style={styles.sectionHeaderText}>Evidence & Attachments</Text>
                        {evidenceType && (
                             <View style={styles.requiredBadge}>
                                 <Text style={styles.requiredBadgeText}>REQUIRED</Text>
                             </View>
                        )}
                    </View>

                    {status === 'NOT_STARTED' ? (
                        <LockedCard text="Start task to upload evidence" icon="camera-off" />
                    ) : (
                        <TaskAttachments 
                            taskInstanceId={taskKey} 
                            taskStatus={status} 
                            attachments={attachments} 
                            onRefresh={reloadAttachments} 
                            onAddPhoto={handleAddPhoto} 
                            onAddGallery={handleAddGallery} 
                            onAddDocument={handleAddDocument} 
                            onOpen={handleOpenAttachment} 
                            onDelete={handleRequestDelete} 
                        />
                    )}
                </>
            )}
        </ScrollView>

        {/* ================= FOOTER ================= */}
        <Surface style={[styles.footer, { paddingBottom: insets.bottom + 16 }]} elevation={4}>
            {status === 'NOT_STARTED' && (
                <KeelButton mode="primary" onPress={() => setShowStartConfirm(true)}>Start Task</KeelButton>
            )}
            {status === 'IN_PROGRESS' && (
                <KeelButton mode="primary" onPress={handleRequestApproval}>Submit for Approval</KeelButton>
            )}
            {status === 'PENDING_REVIEW' && (
                <KeelButton mode="outline" disabled icon="clock-outline" onPress={() => {}}>Pending Officer Review</KeelButton>
            )}
            {status === 'COMPLETED' && (
                <KeelButton mode="outline" disabled icon="check-decagram" onPress={() => {}}>Task Verified</KeelButton>
            )}
        </Surface>

      </KeyboardAvoidingView>

      {/* ================= DIALOGS ================= */}
      <Portal>
        <Dialog visible={showStartConfirm} onDismiss={() => setShowStartConfirm(false)}>
            <Dialog.Title>Start Task?</Dialog.Title>
            <Dialog.Content><Text>This will unlock the journal and allow evidence upload.</Text></Dialog.Content>
            <Dialog.Actions>
                <Button onPress={() => setShowStartConfirm(false)}>Cancel</Button>
                <Button onPress={handleStartTask}>Start</Button>
            </Dialog.Actions>
        </Dialog>
        <Dialog visible={showSubmitConfirm} onDismiss={() => setShowSubmitConfirm(false)}>
            <Dialog.Title>Submit for Approval?</Dialog.Title>
            <Dialog.Content><Text>Once submitted, you cannot edit your journal or evidence until reviewed.</Text></Dialog.Content>
            <Dialog.Actions>
                <Button onPress={() => setShowSubmitConfirm(false)}>Cancel</Button>
                <Button onPress={handleSubmitForReview}>Submit</Button>
            </Dialog.Actions>
        </Dialog>
        <Dialog visible={showDeleteConfirm} onDismiss={() => setShowDeleteConfirm(false)}>
            <Dialog.Title>Delete Evidence?</Dialog.Title>
            <Dialog.Actions>
                <Button onPress={() => setShowDeleteConfirm(false)}>Cancel</Button>
                <Button textColor="red" onPress={handleConfirmDelete}>Delete</Button>
            </Dialog.Actions>
        </Dialog>
      </Portal>
    </KeelScreen>
  );
}

const styles = StyleSheet.create({
  headerContainer: { backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 16 },
  headerTitle: { fontWeight: '700', color: '#1F2937' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusBadgeText: { fontSize: 10, fontWeight: '800' },
  competenceTitle: { fontWeight: '800', lineHeight: 28, color: '#1F2937' },
  
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: { flex: 1, borderRadius: 12, padding: 12, borderWidth: 1, alignItems: 'flex-start', minHeight: 90, justifyContent: 'space-between' },
  statIcon: { margin: 0, marginLeft: -4, marginTop: -4 },
  statLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  statValue: { fontSize: 13, fontWeight: '800' },

  instructionContainer: { backgroundColor: '#F9FAFB', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' },

  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 8 },
  sectionHeaderText: { fontWeight: '700', color: '#1F2937' },
  requiredBadge: { backgroundColor: '#FEF2F2', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#FECACA' },
  requiredBadgeText: { fontSize: 10, fontWeight: '700', color: '#DC2626' },

  editorContainer: { borderWidth: 1, borderRadius: 12, backgroundColor: '#FFFFFF', overflow: 'hidden' },
  textArea: { padding: 16, minHeight: 140, fontSize: 16, textAlignVertical: 'top' },
  editorFooter: { alignItems: 'flex-end', padding: 8, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  
  journalDisplayCard: { minHeight: 120, justifyContent: 'center', borderColor: '#F3F4F6' },
  emptyJournalPlaceholder: { alignItems: 'center', opacity: 0.5, paddingVertical: 12 },

  lockedCard: { borderRadius: 12, borderWidth: 2, borderColor: '#E5E7EB', borderStyle: 'dashed', backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center', paddingVertical: 24, opacity: 0.8 },
  lockedIconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#E5E7EB', backgroundColor: 'white' },
});