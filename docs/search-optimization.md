# Search & Filter Optimization Guide

## Overview
The dynamic search and filter system is optimized for large-scale databases with millions of devices. This document explains the optimization strategies implemented.

## Performance Optimizations

### 1. Caching Strategy
- **Search Results**: 5-minute TTL cache for search results
- **Facets**: Separate 5-minute cache for facets (categories, brands, verified counts)
- **Category Schemas**: Cached separately to avoid repeated lookups
- **Cache Keys**: Include all filter parameters for precise cache hits

### 2. Database Query Optimization

#### Efficient Field Selection
```typescript
// Only select fields needed for list view
select(`
  id, name, brand, model, category_id,
  width_cm, height_cm, depth_cm, weight_kg, power_watts,
  verified, confidence_score,
  device_categories!inner(id, name)
`)
```

#### Lazy Loading Specifications
- Device specifications are only loaded when category-specific filters are applied
- Specifications are fetched separately and mapped to devices
- Avoids loading large JSON fields unnecessarily

#### Indexed Queries
```sql
-- Text search indexes using pg_trgm
CREATE INDEX idx_devices_name_trgm ON devices USING gin (name gin_trgm_ops);
CREATE INDEX idx_devices_brand_trgm ON devices USING gin (brand gin_trgm_ops);

-- Composite indexes for common filter combinations
CREATE INDEX idx_devices_category_verified ON devices(category_id, verified);
CREATE INDEX idx_devices_category_brand ON devices(category_id, brand);

-- GIN index for JSON specifications
CREATE INDEX idx_device_specs_specifications ON device_specifications USING gin (specifications);
```

### 3. Facet Aggregation

#### PostgreSQL Functions
Custom PostgreSQL functions for efficient facet aggregation:

```sql
-- Category facets with counts
get_category_facets(search_query TEXT)

-- Brand facets with counts
get_brand_facets(category_filter TEXT, search_query TEXT)

-- Verified/unverified counts
get_verified_facets(category_filter TEXT)
```

These functions:
- Run aggregations at the database level
- Use optimized query plans
- Return only necessary data
- Support filtering and search parameters

### 4. Pagination
- Default limit: 20 devices per page
- Maximum limit: 100 devices per page (capped)
- Cursor-based pagination for efficient large dataset traversal
- Offset-based pagination for simpler UI (can be upgraded to cursor-based)

### 5. Client-Side Optimizations

#### Debouncing
```typescript
// Search debounce: 300ms
// URL update debounce: 500ms
```
Prevents excessive API calls during rapid filter changes.

#### URL State Management
- All filters persisted in URL query parameters
- Enables bookmarking and sharing of searches
- Browser back/forward navigation support

### 6. Asynchronous Operations
```typescript
// Search tracking runs asynchronously
trackSearch(...).catch(err => console.error(err));
```
Non-critical operations don't block the response.

## Database Schema Requirements

### Required Extensions
```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;  -- Trigram text search
```

### Required Indexes
See `prisma/migrations/add_search_facet_functions.sql` for complete index definitions.

## API Response Format

```typescript
{
  success: true,
  data: Device[],
  facets: {
    categories: Array<{ id: string; name: string; count: number }>,
    brands: Array<{ name: string; count: number }>,
    verified: { true: number; false: number },
    specifications: Record<string, SpecificationFacet>
  },
  pagination: {
    total: number,
    limit: number,
    offset: number,
    hasMore: boolean
  },
  cached: boolean
}
```

## Filter Types

### Standard Filters
- **Text Search**: Name, brand, model (uses trigram indexes)
- **Category**: Exact match on category_id
- **Brand**: Exact match on brand
- **Verified**: Boolean filter

### Range Filters
- **Dimensions**: width_cm, height_cm, depth_cm (min/max)
- **Power**: power_watts (min/max)
- **Weight**: weight_kg (min/max)

### Category-Specific Filters
Dynamic filters based on device category schema:
- **Enum**: Dropdown selection
- **Range**: Min/max numeric inputs
- **Boolean**: Checkbox

## Saved Searches

### Storage
- Currently: localStorage (client-side)
- Future: Database table with user authentication

### Structure
```typescript
{
  id: string,
  name: string,
  query: string,
  filters: SearchFilters,
  savedAt: string
}
```

## Performance Metrics

### Target Performance
- Search query execution: < 200ms
- Facet aggregation: < 100ms
- Total API response: < 500ms
- Cache hit rate: > 70%

### Monitoring
Track these metrics:
- Query execution time
- Cache hit/miss ratio
- Search result counts
- Popular search terms
- Filter usage patterns

## Future Optimizations

### 1. Elasticsearch Integration
For very large datasets (> 10M devices):
- Full-text search with Elasticsearch
- Real-time indexing
- Advanced relevance scoring
- Faceted search at scale

### 2. Materialized Views
```sql
CREATE MATERIALIZED VIEW device_search_index AS
SELECT 
  d.id, d.name, d.brand, d.model,
  d.category_id, dc.name as category_name,
  d.verified, d.confidence_score,
  -- Pre-computed search vectors
  to_tsvector('english', d.name || ' ' || d.brand || ' ' || COALESCE(d.model, '')) as search_vector
FROM devices d
JOIN device_categories dc ON d.category_id = dc.id;

CREATE INDEX idx_device_search_vector ON device_search_index USING gin(search_vector);
```

### 3. Redis Caching
Replace in-memory cache with Redis:
- Distributed caching across instances
- Persistent cache across deployments
- Advanced cache invalidation strategies
- Cache warming on deployment

### 4. Query Result Streaming
For very large result sets:
- Stream results to client
- Progressive rendering
- Infinite scroll with virtual scrolling

## Troubleshooting

### Slow Queries
1. Check if indexes exist: `\d+ devices`
2. Analyze query plan: `EXPLAIN ANALYZE SELECT ...`
3. Check cache hit rate
4. Monitor database connection pool

### High Memory Usage
1. Reduce result limit
2. Implement pagination
3. Clear old cache entries
4. Optimize specification JSON size

### Cache Invalidation
Cache is automatically invalidated:
- After 5 minutes (TTL)
- When devices are created/updated (manual clear)
- On deployment (in-memory cache reset)

## Migration Guide

### Applying Search Optimizations
```bash
# Run the migration SQL
psql $DATABASE_URL -f prisma/migrations/add_search_facet_functions.sql

# Verify functions exist
psql $DATABASE_URL -c "\df get_*_facets"

# Test a function
psql $DATABASE_URL -c "SELECT * FROM get_category_facets(NULL);"
```

### Rollback
```sql
DROP FUNCTION IF EXISTS get_category_facets(TEXT);
DROP FUNCTION IF EXISTS get_brand_facets(TEXT, TEXT);
DROP FUNCTION IF EXISTS get_verified_facets(TEXT);
```
