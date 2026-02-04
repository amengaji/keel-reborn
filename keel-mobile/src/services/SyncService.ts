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
import { getAllWatches } from '../db/watchkeeping'; 
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

let isSyncing = false;
let syncStatusListener: ((syncing: boolean) => void) | null = null;

/**
 * Sync Engine: Optimized for VSAT/Iridium with Auth Guard
 */
export const SyncService = {
  onSyncStatusChange: (callback: (syncing: boolean) => void) => {
    syncStatusListener = callback;
  },

  /**
   * ✅ Connectivity Ping
   */
  checkSatelliteConnectivity: async (): Promise<boolean> => {
    try {
      // Short timeout to prevent app hanging on dead links
      await api.get('/health-check', { timeout: 3000 }); 
      return true;
    } catch (error: any) {
      // If the health check itself returns 401, we are technically "connected" 
      // but unauthorized. We let runSync handle the auth state.
      if (error.response?.status === 401) return true;
      console.log("🛰️ Shore office unreachable (Offline).");
      return false;
    }
  },

  runSync: async () => {
    if (isSyncing) return;
    
    // 1. Guard: Check if we even have a token before trying
    const token = await AsyncStorage.getItem('keel_token');
    if (!token) {
        console.log("🚫 Sync Aborted: No valid security token found.");
        return;
    }

    const isOnline = await SyncService.checkSatelliteConnectivity();
    if (!isOnline) return;

    isSyncing = true;
    if (syncStatusListener) syncStatusListener(true);
    
    console.log("🔄 Starting Priority Sync Engine...");
    
    try {
        ensureTaskAttachmentsTable();

        // --- PHASE 1: PRIORITY DAILY LOGS ---
        const allLogs = getAllDailyLogs();
        const dirtyLogs = allLogs.filter(log => log.syncState === 'DIRTY');

        if (dirtyLogs.length > 0) {
            console.log(`📡 Phase 1: Pushing ${dirtyLogs.length} logs...`);
            for (const log of dirtyLogs) {
                try {
                    const res = await api.post('/daily-logs/sync', log);
                    if (res.status === 200 || res.status === 201) {
                        upsertDailyLog({ ...log, syncState: 'SYNCED' });
                    }
                } catch (e: any) {
                    // CRITICAL: Stop if session expired
                    if (e.message === "SESSION_EXPIRED") {
                        console.error("🛑 Sync Emergency Stop: Session Expired.");
                        return; 
                    }
                    console.error("⚠️ Phase 1 Interrupted (Signal Drop).");
                    return; 
                }
            }
            await SecureStore.setItemAsync('last_sync_logs', new Date().toISOString());
        }

        // --- PHASE 2: EVIDENCE ATTACHMENTS (HEAVY DATA) ---
        const pendingAttachments = getPendingAttachments();
        if (pendingAttachments.length > 0) {
            console.log(`📡 Phase 2: Uploading ${pendingAttachments.length} items...`);
            for (const item of pendingAttachments) {
                const info = await FileSystem.getInfoAsync(item.localUri);
                if (!info.exists) continue; 

                const result = await uploadSingleAttachment(item);
                
                if (result === "AUTH_FAIL") return; // Kill sync engine
                if (result === "NETWORK_FAIL") break; // Stop this phase, try next time
            }
            await SecureStore.setItemAsync('last_sync_attachments', new Date().toISOString());
        }

        // --- PHASE 3: WATCHKEEPING LOGS ---
        const allWatches = getAllWatches();
        if (allWatches.length > 0) {
            console.log(`📡 Phase 3: Syncing ${allWatches.length} watch records...`);
            try {
                await api.post('/watchkeeping/sync', { logs: allWatches });
                console.log("✅ Watchkeeping synced.");
            } catch (e: any) {
                if (e.message === "SESSION_EXPIRED") return;
                console.error("Failed to sync watchkeeping:", e);
            }
        }

    } catch (error: any) {
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
 * Returns "SUCCESS", "AUTH_FAIL", or "NETWORK_FAIL"
 */
const uploadSingleAttachment = async (item: TaskAttachmentRecord): Promise<string> => {
    try {
        let uploadUri = item.localUri;

        // Image Compression
        if (item.kind === 'PHOTO' || item.mimeType?.startsWith('image/')) {
            try {
                const manipulatedImage = await ImageManipulator.manipulateAsync(
                    item.localUri,
                    [{ resize: { width: 1000 } }], // Reduced size for satellite optimization
                    { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
                );
                uploadUri = manipulatedImage.uri;
            } catch (manipError) {
                console.warn("Compression failed.");
            }
        }

        const formData = new FormData();
        formData.append('taskId', item.taskKey);
        formData.append('description', `Uploaded via Keel Mobile`);
        
        formData.append('file', {
            uri: uploadUri,
            name: item.fileName.endsWith('.jpg') ? item.fileName : `${item.fileName}.jpg`,
            type: 'image/jpeg'
        } as any);

        const res = await api.post('/tasks/evidence', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 90000 // Extended timeout for large uploads over satellite
        });

        if (res.status === 200 || res.status === 201) {
            markAttachmentAsSynced(item.id);
            return "SUCCESS";
        }
        return "NETWORK_FAIL";
    } catch (error: any) {
        if (error.message === "SESSION_EXPIRED") {
            return "AUTH_FAIL";
        }
        console.error(`❌ Upload failed for ${item.id}`, error);
        return "NETWORK_FAIL"; 
    }
};