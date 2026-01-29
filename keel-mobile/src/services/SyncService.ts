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
import { getAllWatches } from '../db/watchkeeping'; // ✅ Import Watchkeeping DB
import * as SecureStore from 'expo-secure-store';

let isSyncing = false;
let syncStatusListener: ((syncing: boolean) => void) | null = null;




/**
 * Sync Engine with Priority Queue & Connectivity Guard
 */
export const SyncService = {
  onSyncStatusChange: (callback: (syncing: boolean) => void) => {
    syncStatusListener = callback;
  },

  /**
   * ✅ Connectivity Ping
   * Verifies if the Shore API is actually reachable over VSAT/Iridium
   */
  checkSatelliteConnectivity: async (): Promise<boolean> => {
    try {
      await api.get('/health-check', { timeout: 5000 }); 
      return true;
    } catch (error) {
      console.log("🛰️ Satellite link check failed. Shore office unreachable.");
      return false;
    }
  },

  runSync: async () => {
    if (isSyncing) return;
    
    const isOnline = await SyncService.checkSatelliteConnectivity();
    if (!isOnline) return;

    isSyncing = true;
    if (syncStatusListener) syncStatusListener(true);
    
    console.log("🔄 Starting Priority Sync Engine...");
    
    try {
        ensureTaskAttachmentsTable();

        // --- PHASE 1: PRIORITY DAILY LOGS (TEXT) ---
        const allLogs = getAllDailyLogs();
        const dirtyLogs = allLogs.filter(log => log.syncState === 'DIRTY');

        if (dirtyLogs.length > 0) {
            console.log(`📡 Phase 1: Pushing ${dirtyLogs.length} priority logs...`);
            for (const log of dirtyLogs) {
                try {
                    const res = await api.post('/daily-logs/sync', log);
                    if (res.status === 200 || res.status === 201) {
                        upsertDailyLog({ ...log, syncState: 'SYNCED' });
                    }
                } catch (e) {
                    console.error("Link lost during Phase 1.");
                    return; 
                }
            }
            await SecureStore.setItemAsync('last_sync_logs', new Date().toISOString());
        }

        // --- PHASE 2: EVIDENCE ATTACHMENTS (HEAVY DATA) ---
        const pendingAttachments = getPendingAttachments();
        
        if (pendingAttachments.length > 0) {
            console.log(`📡 Phase 2: Uploading ${pendingAttachments.length} attachments...`);
            for (const item of pendingAttachments) {
                const info = await FileSystem.getInfoAsync(item.localUri);
                if (!info.exists) continue; 

                const success = await uploadSingleAttachment(item);
                if (!success) {
                    console.log("🛰️ Connection unstable in Phase 2. Pausing.");
                    break; 
                }
            }
            await SecureStore.setItemAsync('last_sync_attachments', new Date().toISOString());
        }

        // --- PHASE 3: METADATA REFRESH ---
        await SecureStore.setItemAsync('last_sync_tasks', new Date().toISOString());

        // --- PHASE 4: WATCHKEEPING LOGS (NEW) ---
        // We sync ALL logs because SQLite doesn't track 'dirty' for watches yet.
        // The backend handles deduplication via 'local_id'.
        const allWatches = getAllWatches();
        if (allWatches.length > 0) {
            console.log(`📡 Phase 4: Syncing ${allWatches.length} watch records...`);
            try {
                // Send in bulk to save bandwidth
                await api.post('/watchkeeping/sync', { logs: allWatches });
                console.log("✅ Watchkeeping synced.");
            } catch (e) {
                console.error("Failed to sync watchkeeping:", e);
            }
        }

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
 * Helper: Compresses and Uploads
 */
const uploadSingleAttachment = async (item: TaskAttachmentRecord): Promise<boolean> => {
    try {
        let uploadUri = item.localUri;

        if (item.kind === 'PHOTO' || item.mimeType?.startsWith('image/')) {
            try {
                const manipulatedImage = await ImageManipulator.manipulateAsync(
                    item.localUri,
                    [{ resize: { width: 1200 } }],
                    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
                );
                uploadUri = manipulatedImage.uri;
            } catch (manipError) {
                console.warn("Compression failed.");
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