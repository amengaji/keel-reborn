// keel-mobile/src/services/SyncService.ts

import api from './api';
import { 
  getPendingAttachments, 
  markAttachmentAsSynced, 
  TaskAttachmentRecord,
  ensureTaskAttachmentsTable
} from '../db/taskAttachments';
import * as FileSystem from 'expo-file-system/legacy';
import { getAllDailyLogs, upsertDailyLog } from '../db/dailyLogs';
import * as SecureStore from 'expo-secure-store';

let isSyncing = false;
let syncStatusListener: ((syncing: boolean) => void) | null = null;

export const SyncService = {
  onSyncStatusChange: (callback: (syncing: boolean) => void) => {
    syncStatusListener = callback;
  },

  runSync: async () => {
    if (isSyncing) return;
    isSyncing = true;
    if (syncStatusListener) syncStatusListener(true);
    
    console.log("🔄 Starting Resumable Global Sync...");
    
    try {
        ensureTaskAttachmentsTable();

        // --- 1. RESUMABLE ATTACHMENTS ---
        // We fetch only LOCAL_ONLY or DIRTY items. 
        // Once marked SYNCED, getPendingAttachments will naturally skip them on resume.
        const pendingAttachments = getPendingAttachments();
        
        for (const item of pendingAttachments) {
            // Pre-flight check: skip if file no longer exists
            const info = await FileSystem.getInfoAsync(item.localUri);
            if (!info.exists) {
                console.warn(`File missing for ${item.id}, marking skipped.`);
                continue; 
            }

            const success = await uploadSingleAttachment(item);
            if (!success) {
                console.log("🛰️ Connection interrupted. Stopping queue to resume later.");
                break; // Exit loop, keeping items as DIRTY/LOCAL_ONLY for next run
            }
            await SecureStore.setItemAsync('last_sync_attachments', new Date().toISOString());
        }

        // --- 2. RESUMABLE DAILY LOGS ---
        const dirtyLogs = getAllDailyLogs().filter(log => log.syncState === 'DIRTY');
        
        for (const log of dirtyLogs) {
            try {
                const res = await api.post('/daily-logs/sync', log);
                if (res.status === 200 || res.status === 201) {
                    upsertDailyLog({ ...log, syncState: 'SYNCED' });
                } else {
                    break; // stop on server error or timeout
                }
            } catch (e) {
                console.error(`Failed to push log for ${log.date}. Network likely lost.`);
                break; // STOP loop here. Remaining logs stay DIRTY and resume next time.
            }
        }
        await SecureStore.setItemAsync('last_sync_logs', new Date().toISOString());

        await SecureStore.setItemAsync('last_sync_tasks', new Date().toISOString());

    } catch (error) {
        console.error("Critical Sync Cycle Error:", error);
    } finally {
      isSyncing = false;
      if (syncStatusListener) syncStatusListener(false);
      console.log("✅ Sync Cycle Paused or Finished.");
    }
  }
};

/**
 * Helper: Uploads a single file. Returns boolean for success.
 */
const uploadSingleAttachment = async (item: TaskAttachmentRecord): Promise<boolean> => {
    try {
        const formData = new FormData();
        formData.append('taskId', item.taskKey);
        formData.append('description', `Uploaded from mobile (${item.kind})`);
        
        const fileData = {
            uri: item.localUri,
            name: item.fileName,
            type: item.mimeType || 'image/jpeg'
        } as any;
        
        formData.append('file', fileData);

        console.log(`Uploading ${item.fileName}...`);
        const res = await api.post('/tasks/evidence', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 45000 // Increased timeout for slow VSAT
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