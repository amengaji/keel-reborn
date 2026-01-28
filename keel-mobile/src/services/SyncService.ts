// keel-mobile/src/services/SyncService.ts

import api from './api';
import { 
  getPendingAttachments, 
  markAttachmentAsSynced, 
  TaskAttachmentRecord,
  ensureTaskAttachmentsTable
} from '../db/taskAttachments';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator'; // ✅ New Import
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
    
    console.log("🔄 Starting Resumable Sync with Smart Compression...");
    
    try {
        ensureTaskAttachmentsTable();

        // --- 1. RESUMABLE ATTACHMENTS (Images compressed on-the-fly) ---
        const pendingAttachments = getPendingAttachments();
        for (const item of pendingAttachments) {
            const info = await FileSystem.getInfoAsync(item.localUri);
            if (!info.exists) continue; 

            const success = await uploadSingleAttachment(item);
            if (!success) break; 
            
            await SecureStore.setItemAsync('last_sync_attachments', new Date().toISOString());
        }

        // --- 2. RESUMABLE DAILY LOGS ---
        const dirtyLogs = getAllDailyLogs().filter(log => log.syncState === 'DIRTY');
        for (const log of dirtyLogs) {
            try {
                const res = await api.post('/daily-logs/sync', log);
                if (res.status === 200 || res.status === 201) {
                    upsertDailyLog({ ...log, syncState: 'SYNCED' });
                } else break;
            } catch (e) { break; }
        }
        await SecureStore.setItemAsync('last_sync_logs', new Date().toISOString());
        await SecureStore.setItemAsync('last_sync_tasks', new Date().toISOString());

    } catch (error) {
        console.error("Critical Sync Error:", error);
    } finally {
      isSyncing = false;
      if (syncStatusListener) syncStatusListener(false);
    }
  }
};

/**
 * Helper: Compresses and Uploads
 */
const uploadSingleAttachment = async (item: TaskAttachmentRecord): Promise<boolean> => {
    try {
        let uploadUri = item.localUri;

        // ✅ SMART COMPRESSION LOGIC
        // Only compress if it's a photo. Documents (PDFs) are skipped.
        if (item.kind === 'PHOTO' || item.mimeType?.startsWith('image/')) {
            console.log(`🗜️ Compressing ${item.fileName}...`);
            try {
                const manipulatedImage = await ImageManipulator.manipulateAsync(
                    item.localUri,
                    [{ resize: { width: 1200 } }], // Resize to max 1200px width
                    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
                );
                uploadUri = manipulatedImage.uri;
                console.log(`✅ Compressed: ${item.fileName}`);
            } catch (manipError) {
                console.warn("Compression failed, uploading original:", manipError);
                // Fallback to original if compression fails
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
            timeout: 60000 // Extended timeout for satellite
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