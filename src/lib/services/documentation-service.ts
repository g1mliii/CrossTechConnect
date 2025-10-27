// Documentation Service - Manages device documentation and content

import { createClient } from '@supabase/supabase-js';
import type {
  DeviceDocumentation,
  DocumentationExtraction,
  ContentRating,
  DocumentationSearchFilters,
  DocumentationWithRelations,
  ContentType,
  SourceType,
  CacheStatus
} from '@/types/documentation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Create new device documentation
 */
export async function createDocumentation(data: {
  deviceId: string;
  title: string;
  contentType: ContentType;
  content: string;
  summary?: string;
  sourceType: SourceType;
  sourceUrl?: string;
  originalFileUrl?: string;
  extractionMethod?: string;
  confidenceScore?: number;
  createdById?: string;
  tags?: string[];
}): Promise<DeviceDocumentation | null> {
  try {
    const docId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const { data: doc, error } = await supabase
      .from('device_documentation')
      .insert({
        id: docId,
        device_id: data.deviceId,
        title: data.title,
        content_type: data.contentType,
        content: data.content,
        summary: data.summary,
        source_type: data.sourceType,
        source_url: data.sourceUrl,
        original_file_url: data.originalFileUrl,
        extraction_method: data.extractionMethod,
        confidence_score: data.confidenceScore,
        created_by: data.createdById,
        verified: false,
        helpful_votes: 0,
        not_helpful_votes: 0,
        view_count: 0,
        cache_status: 'hot'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating documentation:', error);
      return null;
    }

    // Add tags if provided
    if (data.tags && data.tags.length > 0) {
      await addDocumentationTags(docId, data.tags);
    }

    return transformDocumentation(doc);
  } catch (error) {
    console.error('Error in createDocumentation:', error);
    return null;
  }
}

/**
 * Get documentation by ID
 */
export async function getDocumentationById(
  id: string,
  incrementView: boolean = true
): Promise<DocumentationWithRelations | null> {
  try {
    // Increment view count if requested
    if (incrementView) {
      await supabase.rpc('increment_view_count', { doc_id: id });
      await supabase
        .from('device_documentation')
        .update({
          last_accessed_at: new Date().toISOString()
        })
        .eq('id', id);
    }

    const { data, error } = await supabase
      .from('device_documentation')
      .select(`
        *,
        device:devices(id, name, brand),
        extractions:documentation_extractions(*),
        ratings:content_ratings(*),
        tags:documentation_tags(tag)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching documentation:', error);
      return null;
    }

    return transformDocumentationWithRelations(data);
  } catch (error) {
    console.error('Error in getDocumentationById:', error);
    return null;
  }
}

/**
 * Search documentation with filters
 */
export async function searchDocumentation(
  filters: DocumentationSearchFilters,
  limit: number = 20,
  offset: number = 0
): Promise<DocumentationWithRelations[]> {
  try {
    let query = supabase
      .from('device_documentation')
      .select(`
        *,
        device:devices(id, name, brand),
        tags:documentation_tags(tag)
      `);

    if (filters.deviceId) {
      query = query.eq('device_id', filters.deviceId);
    }

    if (filters.contentType && filters.contentType.length > 0) {
      query = query.in('content_type', filters.contentType);
    }

    if (filters.sourceType && filters.sourceType.length > 0) {
      query = query.in('source_type', filters.sourceType);
    }

    if (filters.verified !== undefined) {
      query = query.eq('verified', filters.verified);
    }

    if (filters.minConfidence !== undefined) {
      query = query.gte('confidence_score', filters.minConfidence);
    }

    if (filters.searchQuery) {
      query = query.or(`title.ilike.%${filters.searchQuery}%,content.ilike.%${filters.searchQuery}%`);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error('Error searching documentation:', error);
      return [];
    }

    return data.map(transformDocumentationWithRelations);
  } catch (error) {
    console.error('Error in searchDocumentation:', error);
    return [];
  }
}

/**
 * Get documentation for a device
 */
export async function getDeviceDocumentation(
  deviceId: string
): Promise<DocumentationWithRelations[]> {
  return searchDocumentation({ deviceId });
}

/**
 * Add tags to documentation
 */
export async function addDocumentationTags(
  documentationId: string,
  tags: string[]
): Promise<boolean> {
  try {
    const tagRecords = tags.map(tag => ({
      id: `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      documentation_id: documentationId,
      tag: tag.toLowerCase()
    }));

    const { error } = await supabase
      .from('documentation_tags')
      .insert(tagRecords);

    if (error) {
      console.error('Error adding tags:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in addDocumentationTags:', error);
    return false;
  }
}

/**
 * Rate documentation
 */
export async function rateDocumentation(
  documentationId: string,
  userId: string,
  rating: 'helpful' | 'not_helpful',
  comment?: string
): Promise<boolean> {
  try {
    const ratingId = `rating_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const { error } = await supabase
      .from('content_ratings')
      .insert({
        id: ratingId,
        documentation_id: documentationId,
        user_id: userId,
        rating,
        comment
      });

    if (error) {
      console.error('Error rating documentation:', error);
      return false;
    }

    // Update vote counts
    const rpcName = rating === 'helpful' ? 'increment_helpful_votes' : 'increment_not_helpful_votes';
    await supabase.rpc(rpcName, { doc_id: documentationId });

    return true;
  } catch (error) {
    console.error('Error in rateDocumentation:', error);
    return false;
  }
}

/**
 * Update cache status based on access patterns
 */
export async function updateCacheStatus(): Promise<void> {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Hot: accessed in last 24 hours
    await supabase
      .from('device_documentation')
      .update({ cache_status: 'hot' })
      .gte('last_accessed_at', oneDayAgo.toISOString());

    // Warm: accessed in last week but not last 24 hours
    await supabase
      .from('device_documentation')
      .update({ cache_status: 'warm' })
      .lt('last_accessed_at', oneDayAgo.toISOString())
      .gte('last_accessed_at', oneWeekAgo.toISOString());

    // Cold: not accessed in last week
    await supabase
      .from('device_documentation')
      .update({ cache_status: 'cold' })
      .lt('last_accessed_at', oneWeekAgo.toISOString());
  } catch (error) {
    console.error('Error updating cache status:', error);
  }
}

/**
 * Get popular documentation
 */
export async function getPopularDocumentation(
  limit: number = 10
): Promise<DocumentationWithRelations[]> {
  try {
    const { data, error } = await supabase
      .from('device_documentation')
      .select(`
        *,
        device:devices(id, name, brand),
        tags:documentation_tags(tag)
      `)
      .eq('verified', true)
      .order('view_count', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching popular documentation:', error);
      return [];
    }

    return data.map(transformDocumentationWithRelations);
  } catch (error) {
    console.error('Error in getPopularDocumentation:', error);
    return [];
  }
}

/**
 * Get total count of documentation matching filters
 */
export async function getDocumentationCount(
  filters: DocumentationSearchFilters
): Promise<number> {
  try {
    let query = supabase
      .from('device_documentation')
      .select('id', { count: 'exact', head: true });

    if (filters.deviceId) {
      query = query.eq('device_id', filters.deviceId);
    }

    if (filters.contentType && filters.contentType.length > 0) {
      query = query.in('content_type', filters.contentType);
    }

    if (filters.sourceType && filters.sourceType.length > 0) {
      query = query.in('source_type', filters.sourceType);
    }

    if (filters.verified !== undefined) {
      query = query.eq('verified', filters.verified);
    }

    if (filters.minConfidence !== undefined) {
      query = query.gte('confidence_score', filters.minConfidence);
    }

    if (filters.searchQuery) {
      query = query.or(`title.ilike.%${filters.searchQuery}%,content.ilike.%${filters.searchQuery}%`);
    }

    const { count, error } = await query;

    if (error) {
      console.error('Error counting documentation:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error in getDocumentationCount:', error);
    return 0;
  }
}

/**
 * Transform database record to DeviceDocumentation type
 */
function transformDocumentation(data: any): DeviceDocumentation {
  return {
    id: data.id,
    deviceId: data.device_id,
    title: data.title,
    contentType: data.content_type,
    content: data.content,
    summary: data.summary,
    sourceType: data.source_type,
    sourceUrl: data.source_url,
    originalFileUrl: data.original_file_url,
    extractionMethod: data.extraction_method,
    confidenceScore: data.confidence_score ? parseFloat(data.confidence_score) : undefined,
    verified: data.verified,
    helpfulVotes: data.helpful_votes,
    notHelpfulVotes: data.not_helpful_votes,
    viewCount: data.view_count,
    cacheStatus: data.cache_status,
    lastAccessedAt: data.last_accessed_at ? new Date(data.last_accessed_at) : undefined,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    createdById: data.created_by
  };
}

/**
 * Transform database record with relations
 */
function transformDocumentationWithRelations(data: any): DocumentationWithRelations {
  const doc = transformDocumentation(data);

  return {
    ...doc,
    device: Array.isArray(data.device) ? data.device[0] : data.device,
    extractions: data.extractions,
    ratings: data.ratings,
    tags: data.tags?.map((t: any) => ({ ...t, tag: t.tag }))
  };
}
