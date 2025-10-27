// Documentation and Content Management System Types

export type ContentType = 'manual' | 'guide' | 'review' | 'tip' | 'troubleshooting' | 'advanced_features';
export type SourceType = 'ai_extracted' | 'user_contributed' | 'official';
export type ExtractionMethod = 'ai_pdf' | 'ai_scrape' | 'manual';
export type CacheStatus = 'hot' | 'warm' | 'cold';
export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'needs_review';
export type RatingType = 'helpful' | 'not_helpful';
export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'removed';
export type SoftwareType = 'os' | 'driver' | 'firmware' | 'app';

export interface DeviceDocumentation {
  id: string;
  deviceId: string;
  title: string;
  contentType: ContentType;
  content: string;
  summary?: string;
  sourceType: SourceType;
  sourceUrl?: string;
  originalFileUrl?: string;
  extractionMethod?: ExtractionMethod;
  confidenceScore?: number;
  verified: boolean;
  helpfulVotes: number;
  notHelpfulVotes: number;
  viewCount: number;
  cacheStatus: CacheStatus;
  lastAccessedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdById?: string;
}

export interface DocumentationExtraction {
  id: string;
  documentationId: string;
  deviceId: string;
  categoryId: string;
  schemaVersion: string;
  extractedFields: Record<string, any>;
  fieldConfidence: Record<string, number>;
  missingFields: string[];
  validationErrors?: Record<string, string>;
  extractionContext?: Record<string, any>;
  aiModel: string;
  processingTime: number;
  reviewStatus: ReviewStatus;
  reviewedAt?: Date;
  reviewedById?: string;
  createdAt: Date;
}

export interface ContentRating {
  id: string;
  documentationId: string;
  userId: string;
  rating: RatingType;
  comment?: string;
  createdAt: Date;
}

export interface DocumentationTag {
  id: string;
  documentationId: string;
  tag: string;
  createdAt: Date;
}

export interface SoftwareCompatibility {
  id: string;
  deviceId: string;
  softwareType: SoftwareType;
  name: string;
  version?: string;
  minVersion?: string;
  maxVersion?: string;
  platform?: string;
  architecture?: string;
  required: boolean;
  downloadUrl?: string;
  notes?: string;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentModerationQueue {
  id: string;
  contentType: string;
  contentId: string;
  reason: string;
  reportedById?: string;
  status: ModerationStatus;
  moderatorNotes?: string;
  moderatedAt?: Date;
  moderatedById?: string;
  createdAt: Date;
}

// Schema-aware extraction request
export interface ExtractionRequest {
  documentUrl: string;
  deviceId: string;
  categoryId: string;
  schemaVersion: string;
  extractionMethod: ExtractionMethod;
  aiModel?: string;
}

// Schema-aware extraction response
export interface ExtractionResponse {
  extractionId: string;
  extractedFields: Record<string, any>;
  fieldConfidence: Record<string, number>;
  missingFields: string[];
  validationErrors?: Record<string, string>;
  processingTime: number;
  overallConfidence: number;
}

// Field extraction result
export interface FieldExtractionResult {
  fieldName: string;
  value: any;
  confidence: number;
  found: boolean;
  validationError?: string;
  sourceContext?: string;
}

// Documentation search filters
export interface DocumentationSearchFilters {
  deviceId?: string;
  contentType?: ContentType[];
  sourceType?: SourceType[];
  verified?: boolean;
  minConfidence?: number;
  tags?: string[];
  searchQuery?: string;
}

// Documentation with relations
export interface DocumentationWithRelations extends DeviceDocumentation {
  device?: {
    id: string;
    name: string;
    brand: string;
  };
  extractions?: DocumentationExtraction[];
  ratings?: ContentRating[];
  tags?: DocumentationTag[];
}
