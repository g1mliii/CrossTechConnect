// Content Moderation Service - Manages content quality and moderation

import { createClient } from '@supabase/supabase-js';
import type { ContentModerationQueue, ModerationStatus } from '@/types/documentation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Report content for moderation
 */
export async function reportContent(data: {
  contentType: string;
  contentId: string;
  reason: string;
  reportedById?: string;
}): Promise<ContentModerationQueue | null> {
  try {
    const id = `mod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const { data: moderation, error } = await supabase
      .from('content_moderation_queue')
      .insert({
        id,
        content_type: data.contentType,
        content_id: data.contentId,
        reason: data.reason,
        reported_by: data.reportedById,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Error reporting content:', error);
      return null;
    }

    return transformModerationQueue(moderation);
  } catch (error) {
    console.error('Error in reportContent:', error);
    return null;
  }
}

/**
 * Get moderation queue
 */
export async function getModerationQueue(
  status?: ModerationStatus,
  limit: number = 50
): Promise<ContentModerationQueue[]> {
  try {
    let query = supabase
      .from('content_moderation_queue')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching moderation queue:', error);
      return [];
    }

    return data.map(transformModerationQueue);
  } catch (error) {
    console.error('Error in getModerationQueue:', error);
    return [];
  }
}

/**
 * Moderate content
 */
export async function moderateContent(
  id: string,
  moderatorId: string,
  status: ModerationStatus,
  notes?: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('content_moderation_queue')
      .update({
        status,
        moderated_by: moderatorId,
        moderated_at: new Date().toISOString(),
        moderator_notes: notes
      })
      .eq('id', id);

    if (error) {
      console.error('Error moderating content:', error);
      return false;
    }

    // If content is removed, update the original content
    if (status === 'removed') {
      const moderation = await getModerationById(id);
      if (moderation) {
        await removeContent(moderation.contentType, moderation.contentId);
      }
    }

    return true;
  } catch (error) {
    console.error('Error in moderateContent:', error);
    return false;
  }
}

/**
 * Get moderation item by ID
 */
async function getModerationById(id: string): Promise<ContentModerationQueue | null> {
  try {
    const { data, error } = await supabase
      .from('content_moderation_queue')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching moderation item:', error);
      return null;
    }

    return transformModerationQueue(data);
  } catch (error) {
    console.error('Error in getModerationById:', error);
    return null;
  }
}

/**
 * Remove content based on type
 */
async function removeContent(contentType: string, contentId: string): Promise<void> {
  try {
    if (contentType === 'documentation') {
      await supabase
        .from('device_documentation')
        .delete()
        .eq('id', contentId);
    }
    // Add other content types as needed
  } catch (error) {
    console.error('Error removing content:', error);
  }
}

/**
 * Get moderation statistics
 */
export async function getModerationStats(): Promise<{
  pending: number;
  approved: number;
  rejected: number;
  removed: number;
  total: number;
}> {
  try {
    const { data, error } = await supabase
      .from('content_moderation_queue')
      .select('status');

    if (error) {
      console.error('Error fetching moderation stats:', error);
      return { pending: 0, approved: 0, rejected: 0, removed: 0, total: 0 };
    }

    const stats = {
      pending: 0,
      approved: 0,
      rejected: 0,
      removed: 0,
      total: data.length
    };

    for (const item of data) {
      if (item.status === 'pending') stats.pending++;
      else if (item.status === 'approved') stats.approved++;
      else if (item.status === 'rejected') stats.rejected++;
      else if (item.status === 'removed') stats.removed++;
    }

    return stats;
  } catch (error) {
    console.error('Error in getModerationStats:', error);
    return { pending: 0, approved: 0, rejected: 0, removed: 0, total: 0 };
  }
}

/**
 * Transform database record to ContentModerationQueue type
 */
function transformModerationQueue(data: any): ContentModerationQueue {
  return {
    id: data.id,
    contentType: data.content_type,
    contentId: data.content_id,
    reason: data.reason,
    reportedById: data.reported_by,
    status: data.status,
    moderatorNotes: data.moderator_notes,
    moderatedAt: data.moderated_at ? new Date(data.moderated_at) : undefined,
    moderatedById: data.moderated_by,
    createdAt: new Date(data.created_at)
  };
}
