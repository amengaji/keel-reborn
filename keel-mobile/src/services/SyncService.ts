// keel-mobile/src/services/SyncService.ts

import api from './api';
import { 
  getPendingAttachments, 
  markAttachmentAsSynced, 
  TaskAttachmentRecord 
} from '../db/taskAttachments';
import * as FileSystem from 'expo-file-system/legacy';

/**
 * Sync Engine
 * Handles uploading offline data to the backend.
 */
export const SyncService = {
  
  /**
   * Main Sync Function
   * Call this when:
   * 1. App opens (DataSyncScreen)
   * 2. User pulls to refresh
   * 3. Network connection is restored
   */
  runSync: async () => {
    console.log("🔄 Starting Sync...");
    
    try {
        // 1. Sync Attachments
        // NOTE: This DB call is now synchronous (Offline-First Adapter)
        const pendingItems = getPendingAttachments();

        if (pendingItems.length === 0) {
            console.log("✅ No pending attachments.");
            return;
        }

        console.log(`Found ${pendingItems.length} pending attachments. Uploading...`);
        
        // Upload one by one to ensure reliability
        for (const item of pendingItems) {
            await uploadSingleAttachment(item);
        }

        // Future: Sync Daily Logs here...

    } catch (error) {
        console.error("Sync Cycle Error:", error);
    }
  }
};

/**
 * Helper: Uploads a single file to the backend
 */
const uploadSingleAttachment = async (item: TaskAttachmentRecord) => {
    try {
        // 1. Check if file exists locally
        // Using legacy API because we used it to save the file
        const info = await FileSystem.getInfoAsync(item.localUri);
        
        if (!info.exists) {
            console.warn(`⚠️ File missing for ${item.id}, skipping.`);
            // Optional: Mark as failed or deleted in DB to prevent infinite retry loops
            return;
        }

        // 2. Prepare Form Data
        const formData = new FormData();
        formData.append('taskId', item.taskKey);
        formData.append('description', `Uploaded from mobile (${item.kind})`);
        
        // Append the file properly for React Native
        const fileData = {
            uri: item.localUri,
            name: item.fileName,
            type: item.mimeType || 'image/jpeg'
        } as any;
        
        formData.append('file', fileData);

        // 3. Upload
        console.log(`Uploading ${item.fileName}...`);
        const res = await api.post('/tasks/evidence', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            timeout: 30000 // 30s timeout for satellite connections
        });

        // 4. Update Local DB on Success
        if (res.status === 200 || res.status === 201) {
            markAttachmentAsSynced(item.id);
            console.log(`✅ Uploaded ${item.fileName}`);
        } else {
            console.warn(`⚠️ Upload failed for ${item.fileName} (Status: ${res.status})`);
        }

    } catch (error) {
        console.error(`❌ Failed to upload ${item.id}`, error);
        // We leave it as 'LOCAL_ONLY' / 'DIRTY' to try again next sync
    }
};