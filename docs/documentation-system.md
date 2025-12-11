# Documentation and Content Management System

## Overview

The Documentation and Content Management System provides a comprehensive solution for managing device documentation, manuals, guides, and user-contributed content. The system features **schema-aware AI extraction** that dynamically extracts device specifications based on category schemas, ensuring accurate and validated data extraction.

## Key Features

### 1. Schema-Aware AI Extraction

The system's most critical feature is its ability to extract device specifications from PDFs and manuals based on the device's category schema:

- **Dynamic Field Extraction**: AI fetches the category schema before extraction and only extracts fields defined in that schema
- **Type Validation**: Validates extracted values against schema constraints (min/max, patterns, enum options)
- **Per-Field Confidence**: Tracks confidence scores for each individual field, not just the overall document
- **Missing Field Detection**: Flags fields that couldn't be found in the document for manual review
- **Validation Errors**: Reports validation errors for fields that don't meet schema constraints

#### Example Flow:

```typescript
// 1. Fetch category schema
const schema = await fetchCategorySchema('gaming-console', '1.0');
// Schema defines: refreshRate, resolution, hdmiVersion, etc.

// 2. Extract specifications from manual
const result = await extractSpecificationsFromDocument({
  documentUrl: 'ps5-manual.pdf',
  deviceId: 'ps5-id',
  categoryId: 'gaming-console',
  schemaVersion: '1.0'
});

// 3. Result includes per-field confidence and validation
{
  extractedFields: {
    refreshRate: 120,
    resolution: '4K',
    hdmiVersion: '2.1'
  },
  fieldConfidence: {
    refreshRate: 0.95,
    resolution: 0.98,
    hdmiVersion: 0.92
  },
  missingFields: ['weight', 'dimensions'],
  validationErrors: {}
}
```

### 2. Tiered Storage System

Documents are managed with a three-tier caching strategy:

- **Hot**: Frequently accessed (last 24 hours) - stored in database
- **Warm**: Occasionally accessed (last week) - stored in CDN
- **Cold**: Rarely accessed - archived in Supabase storage

### 3. Content Types

The system supports multiple content types:

- **manual**: Official device manuals
- **guide**: Setup and usage guides
- **review**: User reviews and experiences
- **tip**: Quick tips and tricks
- **troubleshooting**: Problem-solving guides
- **advanced_features**: Advanced usage documentation

### 4. Software Compatibility Tracking

Track OS, driver, and software requirements:

```typescript
await addSoftwareCompatibility({
  deviceId: 'ps5-id',
  softwareType: 'firmware',
  name: 'System Software',
  minVersion: '23.01-07.40.00',
  platform: 'PlayStation',
  required: true
});
```

### 5. Content Rating and Moderation

- User ratings (helpful/not helpful)
- Content moderation queue
- Quality control system
- Spam and inappropriate content detection

## Database Schema

### Core Tables

#### device_documentation
Stores all documentation content:
- `id`: Unique identifier
- `device_id`: Associated device
- `title`: Document title
- `content_type`: Type of content
- `content`: Markdown formatted content
- `source_type`: ai_extracted, user_contributed, official
- `confidence_score`: AI extraction confidence
- `cache_status`: hot, warm, cold
- `helpful_votes`, `not_helpful_votes`: User ratings
- `view_count`: Access tracking

#### documentation_extractions
Schema-aware AI extraction results:
- `id`: Unique identifier
- `documentation_id`: Associated documentation
- `device_id`: Associated device
- `category_id`: Device category
- `schema_version`: Schema version used
- `extracted_fields`: JSON of extracted values
- `field_confidence`: JSON of per-field confidence scores
- `missing_fields`: Array of fields not found
- `validation_errors`: JSON of validation errors
- `ai_model`: AI model used for extraction
- `processing_time`: Extraction duration
- `review_status`: pending, approved, rejected, needs_review

#### software_compatibility
OS and software requirements:
- `device_id`: Associated device
- `software_type`: os, driver, firmware, app
- `name`: Software name
- `min_version`, `max_version`: Version constraints
- `platform`: windows, macos, linux, etc.
- `architecture`: x64, arm64, etc.
- `required`: Boolean flag

#### content_moderation_queue
Content moderation tracking:
- `content_type`: Type of content
- `content_id`: Content identifier
- `reason`: Moderation reason
- `status`: pending, approved, rejected, removed

## API Endpoints

### Documentation Management

#### GET /api/documentation
Search and filter documentation:
```
Query Parameters:
- deviceId: Filter by device
- contentType: Filter by type (comma-separated)
- sourceType: Filter by source (comma-separated)
- verified: Filter by verification status
- minConfidence: Minimum confidence score
- tags: Filter by tags (comma-separated)
- q: Search query
- limit: Results per page (default: 20)
- offset: Pagination offset
```

#### POST /api/documentation
Create new documentation:
```json
{
  "deviceId": "device-id",
  "title": "Setup Guide",
  "contentType": "guide",
  "content": "# Setup Instructions\n...",
  "summary": "Quick setup guide",
  "sourceType": "user_contributed",
  "tags": ["setup", "beginner"]
}
```

#### GET /api/documentation/[id]
Get specific documentation:
```
Query Parameters:
- incrementView: Increment view count (default: true)
```

#### POST /api/documentation/[id]/rate
Rate documentation:
```json
{
  "userId": "user-id",
  "rating": "helpful",
  "comment": "Very helpful guide!"
}
```

### AI Extraction

#### POST /api/documentation/extract
Extract specifications from document:
```json
{
  "documentUrl": "https://example.com/manual.pdf",
  "deviceId": "device-id",
  "categoryId": "category-id",
  "schemaVersion": "1.0",
  "extractionMethod": "ai_pdf",
  "aiModel": "gpt-4"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "extractionId": "ext_123",
    "extractedFields": { ... },
    "fieldConfidence": { ... },
    "missingFields": [ ... ],
    "validationErrors": { ... },
    "processingTime": 2500,
    "overallConfidence": 0.87
  }
}
```

### Software Compatibility

#### GET /api/devices/[id]/software-compatibility
Get software requirements:
```
Query Parameters:
- type: Filter by software type
- checkSystem: Check compatibility with user's system
- os, osVersion, architecture: User's system info (if checkSystem=true)
```

#### POST /api/devices/[id]/software-compatibility
Add software requirement:
```json
{
  "softwareType": "driver",
  "name": "Graphics Driver",
  "minVersion": "23.10.1",
  "platform": "windows",
  "architecture": "x64",
  "required": true,
  "downloadUrl": "https://..."
}
```

## Usage Examples

### Creating Documentation with Data Extraction

```typescript
// 1. Upload document to storage
const fileUrl = await uploadDocument(pdfFile, deviceId, 'manual.pdf');

// 2. Extract specifications using schema
const extraction = await extractSpecificationsFromDocument({
  documentUrl: fileUrl,
  deviceId: deviceId,
  categoryId: 'gaming-console',
  schemaVersion: '1.0',
  extractionMethod: 'ai_pdf'
});

// 3. Create documentation record
const doc = await createDocumentation({
  deviceId: deviceId,
  title: 'Official Manual',
  contentType: 'manual',
  content: extractedMarkdown,
  sourceType: 'ai_extracted',
  sourceUrl: fileUrl,
  originalFileUrl: fileUrl,
  extractionMethod: 'ai_pdf',
  confidenceScore: extraction.overallConfidence,
  tags: ['official', 'manual']
});
```

### Checking System Compatibility

```typescript
const compatibility = await checkSystemCompatibility(deviceId, {
  os: 'windows',
  osVersion: '11.0',
  architecture: 'x64'
});

if (!compatibility.compatible) {
  console.log('Missing requirements:', compatibility.missingRequirements);
  console.log('Warnings:', compatibility.warnings);
}
```

### Content Moderation

```typescript
// Report content
await reportContent({
  contentType: 'documentation',
  contentId: 'doc-id',
  reason: 'spam',
  reportedById: 'user-id'
});

// Moderate content (admin)
await moderateContent(
  moderationId,
  adminId,
  'removed',
  'Spam content removed'
);
```

## Schema-Aware Extraction Details

### How It Works

1. **Fetch Schema**: System retrieves the category schema for the device
2. **Build Prompt**: Creates AI prompt with schema field definitions
3. **Extract**: AI extracts only fields defined in schema
4. **Validate**: Each field is validated against schema constraints
5. **Score**: Per-field confidence scores are calculated
6. **Flag**: Missing fields and validation errors are flagged
7. **Store**: Results are stored for review

### Field Types Supported

- `string`: Text values
- `number`: Numeric values with min/max constraints
- `boolean`: True/false values
- `enum`: Predefined options
- `array`: Lists of values
- `object`: Nested structures
- `date`: Date values
- `url`: URL validation
- `email`: Email validation

### Validation Rules

- **Type checking**: Ensures correct data type
- **Range validation**: Min/max for numbers
- **Pattern matching**: Regex for strings
- **Enum validation**: Value must be in allowed options
- **Required fields**: Flags missing required fields

## Performance Considerations

### Caching Strategy

- Hot content: Database storage for fast access
- Warm content: CDN caching for moderate access
- Cold content: Archive storage for rare access
- Automatic cache status updates based on access patterns

### Indexing

- Full-text search on title and content
- Indexes on device_id, content_type, source_type
- Indexes on cache_status for tiered storage queries
- Indexes on created_at for chronological queries

### Storage Optimization

- PDF files stored in Supabase storage
- Extracted markdown stored in database
- Original files archived after extraction
- Automatic cleanup of old cold storage files

## Future Enhancements

1. **Multi-language Support**: Translate documentation to multiple languages
2. **Version Control**: Track documentation versions and changes
3. **Collaborative Editing**: Allow multiple users to contribute
4. **AI Summarization**: Auto-generate summaries from long documents
5. **Video Documentation**: Support for video guides and tutorials
6. **Interactive Guides**: Step-by-step interactive tutorials
7. **Community Q&A**: Question and answer system for devices
8. **Documentation Analytics**: Track which docs are most helpful

## Integration with Other Systems

- **Device Management**: Links to device records
- **Category Schemas**: Uses schemas for extraction
- **User System**: Tracks contributors and ratings
- **Verification System**: Integrates with crowdsourced verification
- **Search System**: Full-text search across all documentation
- **Admin Panel**: Management interface for moderation

## Best Practices

1. **Always use schema-aware extraction** for consistent data quality
2. **Review low-confidence extractions** before publishing
3. **Tag documentation appropriately** for better discoverability
4. **Update cache status regularly** to optimize storage costs
5. **Monitor moderation queue** to maintain content quality
6. **Validate software compatibility** before publishing
7. **Provide source attribution** for legal compliance
8. **Encourage user ratings** to identify helpful content
