# Database Implementation

This document describes the database schema, utilities, and management for the Device Compatibility Platform.

## Overview

The database is built using PostgreSQL with Prisma ORM, providing a robust foundation for device management, compatibility analysis, and user data. The schema supports:

- **Device Catalog**: Comprehensive device information with technical specifications
- **Standards Management**: Technical standards and compatibility rules
- **User Management**: Authentication, device libraries, and reputation system
- **Verification System**: Crowdsourced data quality assurance
- **Performance Optimization**: Strategic indexing for fast search and queries

## Schema Structure

### Core Tables

#### Users (`users`)
- User authentication and profile information
- Reputation scoring for verification contributions
- Links to user device libraries and verification activities

#### Device Categories (`device_categories`)
- Hierarchical categorization system
- Category-specific attributes stored as JSON
- Supports nested categories (parent/child relationships)

#### Technical Standards (`standards`)
- Technical specifications (HDMI, USB-C, Bluetooth, etc.)
- Version tracking and capability definitions
- Used for compatibility analysis

#### Devices (`devices`)
- Main device catalog with comprehensive specifications
- Physical dimensions, power consumption, documentation links
- Data quality tracking (verification status, confidence scores)
- Links to categories, standards, and verification items

#### Device Standards (`device_standards`)
- Many-to-many relationship between devices and standards
- Port counts and implementation notes
- Verification status for each device-standard relationship

#### Compatibility Rules (`compatibility_rules`)
- Defines compatibility between different standards
- Supports full, partial, and no compatibility classifications
- Includes limitations and descriptions

#### User Devices (`user_devices`)
- Personal device libraries for users
- Custom nicknames, notes, and purchase tracking
- Links users to their owned devices

#### Verification System (`verification_items`, `verification_votes`)
- Queue system for data verification
- User voting on AI-extracted or user-submitted data
- Tracks verification history and contributor reputation

## Database Utilities

### Connection Management (`src/lib/database.ts`)

```typescript
import { db, prisma } from '../lib/database';

// Singleton database manager with connection pooling
await db.connect();
const client = db.getClient();

// Transaction support
await db.executeTransaction(async (tx) => {
  // Your transactional operations
});

// Health checking
const isHealthy = await db.healthCheck();
```

### Search and Query Utilities (`src/lib/db-utils.ts`)

```typescript
import { searchDevices, getDeviceById, checkDeviceCompatibility } from '../lib/db-utils';

// Advanced device search
const results = await searchDevices({
  query: 'PlayStation',
  categoryId: 'gaming-category-id',
  minWidth: 30,
  maxWidth: 50,
  standards: ['hdmi-2.1-id'],
  verified: true,
  limit: 20
});

// Device compatibility analysis
const compatibility = await checkDeviceCompatibility(device1Id, device2Id);
```

### Health Monitoring (`src/lib/db-health.ts`)

```typescript
import { performHealthCheck, getConnectionInfo, getTableSizes } from '../lib/db-health';

// Comprehensive health check
const health = await performHealthCheck();
console.log('Database Status:', health.status);

// Connection and performance info
const info = await getConnectionInfo();
const sizes = await getTableSizes();
```

## Performance Optimization

### Indexes

The database includes strategic indexes for optimal performance:

**Devices Table:**
- `devices_category_id_idx`: Fast category filtering
- `devices_brand_idx`: Brand-based searches
- `devices_width_cm_height_cm_depth_cm_idx`: Dimension-based filtering
- `devices_power_watts_idx`: Power consumption queries
- `devices_verified_idx`: Verified content prioritization

**Device Standards:**
- `device_standards_device_id_idx`: Device → standards lookup
- `device_standards_standard_id_idx`: Standard → devices lookup

**User Devices:**
- `user_devices_user_id_idx`: User library queries

### Query Optimization

- Connection pooling with configurable limits
- Prepared statement caching
- Strategic use of `include` vs `select` for data fetching
- Pagination support for large result sets

## Development Commands

```bash
# Database setup
npm run db:generate    # Generate Prisma client
npm run db:push        # Push schema changes
npm run db:migrate     # Create and run migrations
npm run db:seed        # Populate with initial data

# Database management
npm run db:studio      # Open Prisma Studio
npm run db:test        # Run database tests
npm run db:verify      # Verify indexes and health

# Docker database
npm run docker:dev     # Start PostgreSQL container
npm run docker:down    # Stop containers
```

## Migration Strategy

### Development
1. Modify `prisma/schema.prisma`
2. Run `npm run db:migrate` to create migration
3. Migration is automatically applied to development database

### Production
1. Migrations are applied using `npx prisma migrate deploy`
2. Zero-downtime migrations using shadow database
3. Rollback support for failed migrations

## Data Seeding

The seed script (`prisma/seed.ts`) populates the database with:

- **Device Categories**: Gaming, PC Components, Monitors
- **Technical Standards**: HDMI 2.1, HDMI 2.0, USB-C PD
- **Sample Devices**: PlayStation 5, LG C1 OLED
- **Compatibility Rules**: Standard compatibility matrices

Run seeding:
```bash
npm run db:seed
```

## Error Handling

### Custom Error Types

```typescript
import { DatabaseError, ValidationError, NotFoundError } from '../lib/database';

try {
  await someOperation();
} catch (error) {
  if (error instanceof ValidationError) {
    // Handle validation error
  } else if (error instanceof NotFoundError) {
    // Handle not found
  } else if (error instanceof DatabaseError) {
    // Handle database error
  }
}
```

### Retry Logic

```typescript
import { withRetry } from '../lib/database';

// Automatic retry with exponential backoff
const result = await withRetry(
  () => someUnreliableOperation(),
  3, // max retries
  1000 // initial delay
);
```

## Monitoring and Maintenance

### Health Checks

Regular health monitoring includes:
- Database connectivity and response time
- Migration status verification
- Index presence and performance
- Connection pool utilization

### Performance Monitoring

- Query performance tracking
- Table size monitoring
- Index usage analysis
- Connection pool metrics

### Backup Strategy

- Automated daily backups
- Point-in-time recovery capability
- Cross-region backup replication
- Backup integrity verification

## Security Considerations

### Access Control
- Role-based database access
- Connection string encryption
- SSL/TLS for all connections
- Prepared statements for SQL injection prevention

### Data Privacy
- PII encryption at rest
- Audit logging for sensitive operations
- Data retention policies
- GDPR compliance features

## Troubleshooting

### Common Issues

**Connection Failures:**
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Restart database container
npm run docker:down && npm run docker:dev
```

**Migration Errors:**
```bash
# Reset database (development only)
npx prisma migrate reset

# Check migration status
npx prisma migrate status
```

**Performance Issues:**
```bash
# Analyze query performance
npm run db:verify

# Check table sizes and indexes
npm run db:test
```

### Debug Mode

Enable detailed logging:
```bash
# Set environment variable
export DEBUG=prisma:*

# Or in .env file
DATABASE_LOGGING=true
```

## Future Enhancements

### Planned Features
- Full-text search with PostgreSQL's built-in capabilities
- Materialized views for complex aggregations
- Partitioning for large tables
- Read replicas for scaling
- Advanced analytics and reporting tables

### Scalability Considerations
- Horizontal sharding strategy
- Caching layer integration
- Connection pooling optimization
- Query optimization and monitoring