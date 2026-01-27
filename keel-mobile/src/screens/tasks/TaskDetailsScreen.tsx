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

import { getTaskByKey, upsertTaskStatus } from "../../db/tasks";
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
  const [status, setStatus] = useState<"NOT_STARTED" | "IN_PROGRESS" | "COMPLETED">("NOT_STARTED");

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

  // ✅ VALIDATION LOGIC
  const handleRequestComplete = () => {
    // 1. Journal Check
    if (!cadetNotes || cadetNotes.trim().length < 5) {
        toast.error("Journal entry is required.");
        return;
    }

    // 2. Evidence Check
    // If evidenceType is present AND not "NONE", we require at least 1 attachment
    const requiresEvidence = evidenceType && evidenceType !== 'NONE';
    if (requiresEvidence && attachments.length === 0) {
        toast.error("Evidence (Photo/Document) is required.");
        return;
    }

    // If all good, show confirmation
    setShowSubmitConfirm(true);
  };

  const handleSubmitTask = () => {
    upsertTaskStatus({ taskKey, status: "COMPLETED", remarks: cadetNotes });
    setStatus("COMPLETED");
    setShowSubmitConfirm(false);
    toast.success("Task Completed");
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

  // --- JOURNAL FORMATTING TOOLS ---
  const insertText = (wrapper: string) => {
    setCadetNotes(prev => `${prev} ${wrapper} `);
  };

  const formatTools = [
    { icon: "format-bold", action: () => insertText("**") },
    { icon: "format-italic", action: () => insertText("_") },
    { icon: "format-list-bulleted", action: () => setCadetNotes(prev => prev + "\n• ") },
  ];

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
    toast.success("Attached");
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

  // --- UI CONSTANTS & HELPERS ---
  const FOOTER_HEIGHT = 80;
  const isTaskActive = status !== 'NOT_STARTED';

  const getSafetyColor = (l: string | null) => {
    if (!l || l === 'None') return theme.colors.primary;
    if (l.toLowerCase().includes('high')) return theme.colors.error;
    if (l.toLowerCase().includes('med')) return '#F59E0B';
    return '#10B981';
  };

  // ✅ LOCKED CARD COMPONENT (Reusable)
  const LockedCard = ({ text, icon = "lock-outline" }: { text: string, icon?: string }) => (
    <Surface 
        style={{ 
            borderRadius: 12, 
            borderWidth: 2, 
            borderColor: '#E5E7EB', 
            borderStyle: 'dashed', // Dashed border for "Slot" feel
            backgroundColor: '#F9FAFB',
            alignItems: 'center', 
            justifyContent: 'center',
            paddingVertical: 24,
            opacity: 0.8
        }}
        elevation={0}
    >
        <View style={{ 
            width: 40, height: 40, borderRadius: 20, 
            backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center', marginBottom: 8 
        }}>
            <IconButton icon={icon} size={20} iconColor="#9CA3AF" style={{ margin: 0 }} />
        </View>
        <Text variant="bodySmall" style={{ color: '#6B7280', fontWeight: '600' }}>
            {text}
        </Text>
    </Surface>
  );

  return (
    <KeelScreen style={{ paddingHorizontal: 0 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0} 
      >
        {/* ================= HEADER ================= */}
        <Surface style={[styles.headerContainer, { paddingTop: 4 }]} elevation={1}>
           <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingRight: 16 }}>
               <IconButton icon="arrow-left" onPress={() => navigation.goBack()} size={24} style={{ margin: 0, marginLeft: -8 }} />
               <View style={[styles.statusBadge, { 
                    backgroundColor: status === 'COMPLETED' ? '#D1FAE5' : status === 'IN_PROGRESS' ? '#FEF3C7' : '#F3F4F6',
               }]}>
                   <Text style={{ 
                       fontSize: 10, fontWeight: '800', 
                       color: status === 'COMPLETED' ? '#065F46' : status === 'IN_PROGRESS' ? '#92400E' : '#6B7280'
                   }}>
                       {status.replace('_', ' ')}
                   </Text>
               </View>
           </View>
           <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
               <Text variant="labelMedium" style={{ color: theme.colors.secondary, fontWeight: '700', marginBottom: 2 }}>
                   {taskTitle.toUpperCase()}
               </Text>
               <Text variant="headlineSmall" style={{ fontWeight: '800', lineHeight: 28, color: '#1F2937' }}>
                   {competence}
               </Text>
           </View>
        </Surface>

        {/* ================= SCROLL CONTENT ================= */}
        <ScrollView 
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: FOOTER_HEIGHT + insets.bottom + 40 }}
            showsVerticalScrollIndicator={false}
        >
            {/* 1. STATS GRID */}
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

            {/* 2. INSTRUCTIONS */}
            <TouchableRipple onPress={toggleInstructions} style={styles.instructionContainer}>
                <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                        <Text variant="titleSmall" style={{ fontWeight: '700', color: theme.colors.onSurface }}>Task Information</Text>
                        <IconButton icon={showFullInstructions ? "chevron-up" : "chevron-down"} size={16} style={{ margin: 0 }} />
                    </View>
                    <Text 
                        variant="bodyMedium" 
                        style={{ color: theme.colors.onSurfaceVariant, lineHeight: 20 }}
                        numberOfLines={showFullInstructions ? undefined : 2}
                    >
                        {instructions}
                    </Text>
                </View>
            </TouchableRipple>

            {/* 3. TRAINEE JOURNAL */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 8 }}>
                <Text variant="titleMedium" style={styles.sectionHeader}>Trainee Journal</Text>
                {!isEditingNotes && isTaskActive && (
                    <IconButton icon="pencil" mode="contained-tonal" size={18} iconColor={theme.colors.primary} onPress={() => setIsEditingNotes(true)} />
                )}
            </View>

            {isTaskActive ? (
                isEditingNotes ? (
                    <View style={[styles.editorContainer, { borderColor: theme.colors.primary }]}>
                        <View style={styles.toolbar}>
                            {formatTools.map((tool, idx) => (
                                <TouchableOpacity key={idx} onPress={tool.action} style={styles.toolBtn}>
                                    <IconButton icon={tool.icon} size={20} iconColor={theme.colors.onSurface} style={{ margin: 0 }} />
                                </TouchableOpacity>
                            ))}
                            <View style={{ flex: 1 }} />
                            <Button compact onPress={() => setIsEditingNotes(false)}>Done</Button>
                        </View>
                        <NativeTextInput 
                            ref={notesInputRef}
                            multiline 
                            style={[styles.textArea, { color: theme.colors.onSurface }]} 
                            value={cadetNotes} 
                            onChangeText={setCadetNotes} 
                            placeholder="Type your journal entry here..."
                            placeholderTextColor={theme.colors.onSurfaceDisabled}
                            autoFocus
                        />
                        <View style={styles.editorFooter}>
                            <Button mode="contained" onPress={handleSaveJournal} style={{ borderRadius: 8 }}>Save Entry</Button>
                        </View>
                    </View>
                ) : (
                    <KeelCard onPress={() => setIsEditingNotes(true)} style={{ minHeight: 120, justifyContent: 'center', borderColor: theme.colors.outlineVariant }}>
                        {cadetNotes ? (
                            <Text variant="bodyMedium" style={{ lineHeight: 22 }}>{cadetNotes}</Text>
                        ) : (
                            <View style={{ alignItems: 'center', opacity: 0.5, paddingVertical: 12 }}>
                                <IconButton icon="notebook-edit-outline" size={28} />
                                <Text variant="bodySmall">Tap to write your journal entry...</Text>
                            </View>
                        )}
                    </KeelCard>
                )
            ) : (
                <LockedCard text="Start task to enable journal" icon="lock-outline" />
            )}

            {/* 4. EVIDENCE */}
            {(!evidenceType || evidenceType.includes('PHOTO') || evidenceType.includes('DOCUMENT')) && (
                <>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 8 }}>
                        <Text variant="titleMedium" style={styles.sectionHeader}>Evidence & Attachments</Text>
                        {/* Show requirement badge if evidence is mandatory */}
                        {evidenceType && evidenceType !== 'NONE' && (
                             <View style={{ backgroundColor: '#FEF2F2', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#FECACA' }}>
                                 <Text style={{ fontSize: 10, fontWeight: '700', color: '#DC2626' }}>REQUIRED</Text>
                             </View>
                        )}
                    </View>

                    {isTaskActive ? (
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
                    ) : (
                        <LockedCard text="Start task to upload evidence" icon="camera-off" />
                    )}
                </>
            )}

        </ScrollView>

        {/* ================= FOOTER ================= */}
        <Surface style={[styles.footer, { paddingBottom: insets.bottom + 16 }]} elevation={4}>
            {status === 'NOT_STARTED' && (
                <KeelButton mode="primary" onPress={() => setShowStartConfirm(true)}>
                    Start Task
                </KeelButton>
            )}
            {status === 'IN_PROGRESS' && (
                <KeelButton mode="primary" onPress={handleRequestComplete}>
                    Mark as Complete
                </KeelButton>
            )}
            {status === 'COMPLETED' && (
                <KeelButton mode="outline" disabled onPress={() => {}}>
                    Pending Officer Verification
                </KeelButton>
            )}
        </Surface>

      </KeyboardAvoidingView>

      {/* ================= DIALOGS ================= */}
      <Portal>
        <Dialog visible={showStartConfirm} onDismiss={() => setShowStartConfirm(false)}>
            <Dialog.Title>Start Task?</Dialog.Title>
            <Dialog.Content><Text variant="bodyMedium">This will unlock the journal and allow you to upload evidence.</Text></Dialog.Content>
            <Dialog.Actions>
                <Button onPress={() => setShowStartConfirm(false)}>Cancel</Button>
                <Button onPress={handleStartTask}>Start</Button>
            </Dialog.Actions>
        </Dialog>
        <Dialog visible={showSubmitConfirm} onDismiss={() => setShowSubmitConfirm(false)}>
            <Dialog.Title>Complete Task?</Dialog.Title>
            <Dialog.Content><Text variant="bodyMedium">Are you sure you want to submit this task?</Text></Dialog.Content>
            <Dialog.Actions>
                <Button onPress={() => setShowSubmitConfirm(false)}>Cancel</Button>
                <Button onPress={handleSubmitTask}>Complete</Button>
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
  headerContainer: { 
      backgroundColor: 'white', 
      borderBottomWidth: 1, 
      borderBottomColor: '#F3F4F6',
  },
  sectionHeader: { 
      fontWeight: '700', 
      color: '#1F2937', 
  },
  statusBadge: { 
      paddingHorizontal: 12, 
      paddingVertical: 6, 
      borderRadius: 12,
  },
  
  // STATS GRID
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: {
      flex: 1, borderRadius: 12, padding: 12, borderWidth: 1,
      alignItems: 'flex-start', minHeight: 90, justifyContent: 'space-between'
  },
  statIcon: { margin: 0, marginLeft: -4, marginTop: -4 },
  statLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginTop: 4 },
  statValue: { fontSize: 13, fontWeight: '800', marginTop: 2 },

  // INSTRUCTIONS
  instructionContainer: {
      backgroundColor: '#F9FAFB', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB'
  },

  // EDITOR
  editorContainer: { borderWidth: 1, borderRadius: 12, backgroundColor: '#FFFFFF', overflow: 'hidden', marginBottom: 16 },
  toolbar: { flexDirection: 'row', alignItems: 'center', padding: 8, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', backgroundColor: '#F9FAFB' },
  toolBtn: { padding: 4, marginRight: 4 },
  textArea: { padding: 16, minHeight: 140, fontSize: 16, textAlignVertical: 'top' },
  editorFooter: { alignItems: 'flex-end', padding: 8, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  
  // FOOTER
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#E5E7EB', backgroundColor: 'white' },
});