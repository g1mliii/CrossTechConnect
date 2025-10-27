// Software Compatibility Service - Manages OS, driver, and software requirements

import { createClient } from '@supabase/supabase-js';
import type { SoftwareCompatibility, SoftwareType } from '@/types/documentation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Add software compatibility requirement for a device
 */
export async function addSoftwareCompatibility(data: {
  deviceId: string;
  softwareType: SoftwareType;
  name: string;
  version?: string;
  minVersion?: string;
  maxVersion?: string;
  platform?: string;
  architecture?: string;
  required?: boolean;
  downloadUrl?: string;
  notes?: string;
}): Promise<SoftwareCompatibility | null> {
  try {
    const id = `sw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const { data: compatibility, error } = await supabase
      .from('software_compatibility')
      .insert({
        id,
        device_id: data.deviceId,
        software_type: data.softwareType,
        name: data.name,
        version: data.version,
        min_version: data.minVersion,
        max_version: data.maxVersion,
        platform: data.platform,
        architecture: data.architecture,
        required: data.required ?? true,
        download_url: data.downloadUrl,
        notes: data.notes,
        verified: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding software compatibility:', error);
      return null;
    }

    return transformSoftwareCompatibility(compatibility);
  } catch (error) {
    console.error('Error in addSoftwareCompatibility:', error);
    return null;
  }
}

/**
 * Get software compatibility requirements for a device
 */
export async function getDeviceSoftwareCompatibility(
  deviceId: string,
  softwareType?: SoftwareType
): Promise<SoftwareCompatibility[]> {
  try {
    let query = supabase
      .from('software_compatibility')
      .select('*')
      .eq('device_id', deviceId);

    if (softwareType) {
      query = query.eq('software_type', softwareType);
    }

    query = query.order('required', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching software compatibility:', error);
      return [];
    }

    return data.map(transformSoftwareCompatibility);
  } catch (error) {
    console.error('Error in getDeviceSoftwareCompatibility:', error);
    return [];
  }
}

/**
 * Update software compatibility
 */
export async function updateSoftwareCompatibility(
  id: string,
  updates: Partial<SoftwareCompatibility>
): Promise<boolean> {
  try {
    const updateData: any = {};

    if (updates.version !== undefined) updateData.version = updates.version;
    if (updates.minVersion !== undefined) updateData.min_version = updates.minVersion;
    if (updates.maxVersion !== undefined) updateData.max_version = updates.maxVersion;
    if (updates.platform !== undefined) updateData.platform = updates.platform;
    if (updates.architecture !== undefined) updateData.architecture = updates.architecture;
    if (updates.required !== undefined) updateData.required = updates.required;
    if (updates.downloadUrl !== undefined) updateData.download_url = updates.downloadUrl;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.verified !== undefined) updateData.verified = updates.verified;

    const { error } = await supabase
      .from('software_compatibility')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Error updating software compatibility:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateSoftwareCompatibility:', error);
    return false;
  }
}

/**
 * Delete software compatibility
 */
export async function deleteSoftwareCompatibility(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('software_compatibility')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting software compatibility:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteSoftwareCompatibility:', error);
    return false;
  }
}

/**
 * Check if device is compatible with user's system
 */
export async function checkSystemCompatibility(
  deviceId: string,
  userSystem: {
    os: string;
    osVersion: string;
    architecture: string;
  }
): Promise<{
  compatible: boolean;
  requirements: SoftwareCompatibility[];
  missingRequirements: SoftwareCompatibility[];
  warnings: string[];
}> {
  try {
    const requirements = await getDeviceSoftwareCompatibility(deviceId);
    const missingRequirements: SoftwareCompatibility[] = [];
    const warnings: string[] = [];

    for (const req of requirements) {
      if (!req.required) continue;

      // Check platform compatibility
      if (req.platform && req.platform.toLowerCase() !== userSystem.os.toLowerCase()) {
        missingRequirements.push(req);
        warnings.push(`Requires ${req.platform}, but you have ${userSystem.os}`);
        continue;
      }

      // Check architecture compatibility
      if (req.architecture && req.architecture !== userSystem.architecture) {
        warnings.push(`Optimized for ${req.architecture}, you have ${userSystem.architecture}`);
      }

      // Check version compatibility
      if (req.minVersion && compareVersions(userSystem.osVersion, req.minVersion) < 0) {
        missingRequirements.push(req);
        warnings.push(`Requires ${req.name} ${req.minVersion} or higher, you have ${userSystem.osVersion}`);
      }

      if (req.maxVersion && compareVersions(userSystem.osVersion, req.maxVersion) > 0) {
        warnings.push(`May not be compatible with ${req.name} ${userSystem.osVersion} (max supported: ${req.maxVersion})`);
      }
    }

    return {
      compatible: missingRequirements.length === 0,
      requirements,
      missingRequirements,
      warnings
    };
  } catch (error) {
    console.error('Error in checkSystemCompatibility:', error);
    return {
      compatible: false,
      requirements: [],
      missingRequirements: [],
      warnings: ['Error checking compatibility']
    };
  }
}

/**
 * Simple version comparison (major.minor.patch)
 */
function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;

    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }

  return 0;
}

/**
 * Transform database record to SoftwareCompatibility type
 */
function transformSoftwareCompatibility(data: any): SoftwareCompatibility {
  return {
    id: data.id,
    deviceId: data.device_id,
    softwareType: data.software_type,
    name: data.name,
    version: data.version,
    minVersion: data.min_version,
    maxVersion: data.max_version,
    platform: data.platform,
    architecture: data.architecture,
    required: data.required,
    downloadUrl: data.download_url,
    notes: data.notes,
    verified: data.verified,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at)
  };
}
