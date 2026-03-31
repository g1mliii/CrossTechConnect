/**
 * Database type definitions based on Prisma schema
 * These types match the actual database structure for type-safe Supabase queries
 */

// User Activity Types
export interface UserActivity {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  timestamp: string;
}

// Search Tracking Types
export interface SearchTracking {
  id: string;
  user_id: string | null;
  query: string;
  filters: Record<string, unknown> | null;
  results_count: number;
  category_id: string | null;
  created_at: string;
}

// Device Types
export interface Device {
  id: string;
  name: string;
  brand: string;
  model: string | null;
  category_id: string;
  width_cm: number | null;
  height_cm: number | null;
  depth_cm: number | null;
  weight_kg: number | null;
  power_watts: number | null;
  power_type: string | null;
  manual_url: string | null;
  image_urls: string[];
  description: string | null;
  verified: boolean;
  confidence_score: number;
  source_url: string | null;
  extraction_method: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

// Device Category Types
export interface DeviceCategory {
  id: string;
  name: string;
  parent_id: string | null;
  attributes: Record<string, unknown> | null;
}

// Device Specification Types
export interface DeviceSpecification {
  id: string;
  device_id: string;
  category_id: string;
  schema_version: string;
  specifications: Record<string, unknown>;
  computed_values: Record<string, unknown> | null;
  validation_errors: Record<string, unknown> | null;
  confidence_scores: Record<string, unknown> | null;
  sources: Record<string, unknown> | null;
  verification_status: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

// Admin Audit Log Types
export interface AdminAuditLog {
  id: string;
  admin_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  changes: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  success: boolean;
  error_message: string | null;
  created_at: string;
}

// Performance Metrics Types
export interface PerformanceMetric {
  id: string;
  metric_type: string;
  metric_name: string;
  value: number;
  unit: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

// Device Documentation Types
export interface DeviceDocumentation {
  id: string;
  device_id: string;
  title: string;
  content_type: string;
  content: string;
  summary: string | null;
  source_type: string;
  source_url: string | null;
  original_file_url: string | null;
  extraction_method: string | null;
  confidence_score: number | null;
  verified: boolean;
  helpful_votes: number;
  not_helpful_votes: number;
  view_count: number;
  cache_status: string;
  last_accessed_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

// Documentation Extraction Types
export interface DocumentationExtraction {
  id: string;
  documentation_id: string;
  device_id: string;
  category_id: string;
  schema_version: string;
  extracted_fields: Record<string, unknown>;
  field_confidence: Record<string, number>;
  missing_fields: string[];
  validation_errors: Record<string, unknown> | null;
  extraction_context: Record<string, unknown> | null;
  ai_model: string;
  processing_time: number;
  review_status: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
}

// Software Compatibility Types
export interface SoftwareCompatibility {
  id: string;
  device_id: string;
  software_type: string;
  name: string;
  version: string | null;
  min_version: string | null;
  max_version: string | null;
  platform: string | null;
  architecture: string | null;
  required: boolean;
  download_url: string | null;
  notes: string | null;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

// Analytics Aggregation Types
export interface TimelineStats {
  [date: string]: number;
}

export interface CountStats {
  [key: string]: number;
}

export interface ActivityTypeStats extends CountStats {}
export interface EntityTypeStats extends CountStats {}
export interface CategoryStats extends CountStats {}
export interface QueryStats extends CountStats {}

// API Response Types
export interface AnalyticsResult {
  totalActivities: number;
  uniqueUsers: number;
  activityTypeStats: ActivityTypeStats;
  entityTypeStats: EntityTypeStats;
  timeline: TimelineStats;
  recentActivities: UserActivity[];
}

export interface SearchTrackingResult {
  totalSearches: number;
  uniqueUsers: number;
  categoryStats: CategoryStats;
  queryStats: QueryStats;
  timeline: TimelineStats;
  recentSearches: SearchTracking[];
}

// Verification Types
export interface VerificationItem {
  id: string;
  device_id: string;
  field_name: string;
  current_value: string | null;
  proposed_value: string | null;
  source_type: string | null;
  confidence_score: number | null;
  status: string;
  created_at: string;
}

export interface VerificationVote {
  id: string;
  verification_item_id: string;
  user_id: string;
  vote: string;
  suggested_value: string | null;
  comment: string | null;
  created_at: string;
}

// Template Types
export interface CategoryTemplate {
  id: string;
  name: string;
  description: string;
  base_schema: Record<string, unknown>;
  example_devices: string[];
  tags: string[];
  popularity: number;
  created_at: string;
  updated_at: string;
}

// Schema Migration Types
export interface SchemaMigration {
  id: string;
  category_id: string;
  from_version: string;
  to_version: string;
  operations: Record<string, unknown>;
  created_at: string;
  applied_at: string | null;
}
