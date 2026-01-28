// keel-mobile/src/services/SyncService.ts

import api from './api';
import { 
  getPendingAttachments, 
  markAttachmentAsSynced, 
  TaskAttachmentRecord,
  ensureTaskAttachmentsTable
} from '../db/taskAttachments';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import { getAllDailyLogs, upsertDailyLog } from '../db/dailyLogs';
import * as SecureStore from 'expo-secure-store';

let isSyncing = false;
let syncStatusListener: ((syncing: boolean) => void) | null = null;

/**
 * Sync Engine with Priority Queue
 * 1. Text-based Daily Logs (High Priority / Low Bandwidth)
 * 2. Compressed Image Evidence (Medium Priority / High Bandwidth)
 */
export const SyncService = {
  onSyncStatusChange: (callback: (syncing: boolean) => void) => {
    syncStatusListener = callback;
  },

  runSync: async () => {
    if (isSyncing) return;
    isSyncing = true;
    if (syncStatusListener) syncStatusListener(true);
    
    console.log("🔄 Starting Priority Sync Engine...");
    
    try {
        ensureTaskAttachmentsTable();

        // --- PHASE 1: PRIORITY DAILY LOGS (TEXT) ---
        // We do this first because text data is tiny and critical for compliance.
        const allLogs = getAllDailyLogs();
        const dirtyLogs = allLogs.filter(log => log.syncState === 'DIRTY');

        if (dirtyLogs.length > 0) {
            console.log(`📡 Phase 1: Pushing ${dirtyLogs.length} priority logs...`);
            for (const log of dirtyLogs) {
                try {
                    const res = await api.post('/daily-logs/sync', log);
                    if (res.status === 200 || res.status === 201) {
                        upsertDailyLog({ ...log, syncState: 'SYNCED' });
                    } else {
                        console.warn("Log sync rejected by server, pausing queue.");
                        break; 
                    }
                } catch (e) {
                    console.error("Network lost during Phase 1. Logs will resume later.");
                    // Return early to prevent trying to upload heavy images without network
                    return; 
                }
            }
            await SecureStore.setItemAsync('last_sync_logs', new Date().toISOString());
            console.log("✅ Phase 1 Complete.");
        }

        // --- PHASE 2: EVIDENCE ATTACHMENTS (HEAVY DATA) ---
        // Only starts if Phase 1 didn't crash or lose connection.
        const pendingAttachments = getPendingAttachments();
        
        if (pendingAttachments.length > 0) {
            console.log(`📡 Phase 2: Uploading ${pendingAttachments.length} attachments...`);
            for (const item of pendingAttachments) {
                const info = await FileSystem.getInfoAsync(item.localUri);
                if (!info.exists) {
                    console.warn(`File ${item.id} missing locally, skipping.`);
                    continue; 
                }

                const success = await uploadSingleAttachment(item);
                if (!success) {
                    console.log("🛰️ Connection unstable in Phase 2. Stopping to preserve data.");
                    break; 
                }
                await SecureStore.setItemAsync('last_sync_attachments', new Date().toISOString());
            }
            console.log("✅ Phase 2 Complete.");
        }

        // --- PHASE 3: METADATA & REFRESH ---
        await SecureStore.setItemAsync('last_sync_tasks', new Date().toISOString());

    } catch (error) {
        console.error("Critical Sync Failure:", error);
    } finally {
      isSyncing = false;
      if (syncStatusListener) syncStatusListener(false);
      console.log("🏁 Global Sync Cycle Finished.");
    }
  }
};

/**
 * Helper: Compresses (if image) and Uploads
 */
const uploadSingleAttachment = async (item: TaskAttachmentRecord): Promise<boolean> => {
    try {
        let uploadUri = item.localUri;

        // Smart Compression
        if (item.kind === 'PHOTO' || item.mimeType?.startsWith('image/')) {
            try {
                const manipulatedImage = await ImageManipulator.manipulateAsync(
                    item.localUri,
                    [{ resize: { width: 1200 } }],
                    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
                );
                uploadUri = manipulatedImage.uri;
            } catch (manipError) {
                console.warn("Compression failed, sending original.");
            }
        }

        const formData = new FormData();
        formData.append('taskId', item.taskKey);
        formData.append('description', `Uploaded from Keel Mobile (${item.kind})`);
        
        const fileData = {
            uri: uploadUri,
            name: item.fileName.endsWith('.jpg') ? item.fileName : `${item.fileName}.jpg`,
            type: 'image/jpeg'
        } as any;
        
        formData.append('file', fileData);

        const res = await api.post('/tasks/evidence', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 60000 
        });

        if (res.status === 200 || res.status === 201) {
            markAttachmentAsSynced(item.id);
            return true;
        }
        return false;
    } catch (error) {
        console.error(`❌ Upload failed for ${item.id}`, error);
        return false; 
    }
};