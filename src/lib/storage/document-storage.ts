// Document Storage Service - Manages file uploads and storage with Supabase

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BUCKET_NAME = 'device-documents';

/**
 * Initialize storage bucket if it doesn't exist
 */
export async function initializeStorageBucket(): Promise<boolean> {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    
    const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME);
    
    if (!bucketExists) {
      const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: false,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: [
          'application/pdf',
          'text/plain',
          'text/markdown',
          'application/json'
        ]
      });

      if (error) {
        console.error('Error creating storage bucket:', error);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error in initializeStorageBucket:', error);
    return false;
  }
}

/**
 * Upload document file to storage
 */
export async function uploadDocument(
  file: File | Buffer,
  deviceId: string,
  fileName: string
): Promise<string | null> {
  try {
    await initializeStorageBucket();

    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${deviceId}/${timestamp}_${sanitizedFileName}`;

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Error uploading document:', error);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadDocument:', error);
    return null;
  }
}

/**
 * Download document from storage
 */
export async function downloadDocument(filePath: string): Promise<Blob | null> {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(filePath);

    if (error) {
      console.error('Error downloading document:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in downloadDocument:', error);
    return null;
  }
}

/**
 * Delete document from storage
 */
export async function deleteDocument(filePath: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error('Error deleting document:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteDocument:', error);
    return false;
  }
}

/**
 * Get signed URL for temporary access
 */
export async function getSignedUrl(
  filePath: string,
  expiresIn: number = 3600
): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      console.error('Error creating signed URL:', error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Error in getSignedUrl:', error);
    return null;
  }
}

/**
 * List documents for a device
 */
export async function listDeviceDocuments(deviceId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(deviceId);

    if (error) {
      console.error('Error listing documents:', error);
      return [];
    }

    return data.map(file => `${deviceId}/${file.name}`);
  } catch (error) {
    console.error('Error in listDeviceDocuments:', error);
    return [];
  }
}

/**
 * Move document to archive (cold storage)
 */
export async function archiveDocument(
  filePath: string
): Promise<string | null> {
  try {
    const archivePath = `archive/${filePath}`;

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .move(filePath, archivePath);

    if (error) {
      console.error('Error archiving document:', error);
      return null;
    }

    return archivePath;
  } catch (error) {
    console.error('Error in archiveDocument:', error);
    return null;
  }
}

/**
 * Get storage statistics
 */
export async function getStorageStats(): Promise<{
  totalFiles: number;
  totalSize: number;
  byDevice: Record<string, number>;
}> {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list();

    if (error) {
      console.error('Error getting storage stats:', error);
      return { totalFiles: 0, totalSize: 0, byDevice: {} };
    }

    const stats = {
      totalFiles: data.length,
      totalSize: data.reduce((sum, file) => sum + (file.metadata?.size || 0), 0),
      byDevice: {} as Record<string, number>
    };

    // Count files by device
    for (const file of data) {
      const deviceId = file.name.split('/')[0];
      stats.byDevice[deviceId] = (stats.byDevice[deviceId] || 0) + 1;
    }

    return stats;
  } catch (error) {
    console.error('Error in getStorageStats:', error);
    return { totalFiles: 0, totalSize: 0, byDevice: {} };
  }
}
