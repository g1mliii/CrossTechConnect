# Mock Implementations - TODO for Future Tasks

## Overview

This document tracks all mock implementations in the admin system that need to be replaced with actual functionality when corresponding database tables and features are implemented in future tasks.

## Database Schema Dependencies

The following database tables are referenced but not yet implemented in the Prisma schema:

### 1. `schemaMigration` Table
**Status**: 🔴 Not Implemented  
**Required for**: Schema versioning and migration system  
**Files affected**:
- `src/app/api/admin/migrations/route.ts`
- `src/lib/schema/migration-manager.ts`
- `src/app/api/schemas/[id]/export/route.ts`

**Schema needed**:
```prisma
model SchemaMigration {
  id          String    @id @default(cuid())
  categoryId  String    @map("category_id")
  fromVersion String    @map("from_version") @db.VarChar(20)
  toVersion   String    @map("to_version") @db.VarChar(20)
  operations  Json      // Migration operations to apply
  createdAt   DateTime  @default(now()) @map("created_at")
  appliedAt   DateTime? @map("applied_at")

  // Relations
  category    DeviceCategory @relation(fields: [categoryId], references: [id], onDelete: Cascade)

  @@index([categoryId])
  @@index([fromVersion])
  @@index([toVersion])
  @@map("schema_migrations")
}
```

### 2. `categoryTemplate` Table
**Status**: 🔴 Not Implemented  
**Required for**: Template import/export system  
**Files affected**:
- `src/app/api/admin/templates/route.ts`
- `src/app/api/admin/templates/[id]/export/route.ts`

**Schema needed**:
```prisma
model CategoryTemplate {
  id             String   @id @default(cuid())
  name           String   @db.VarChar(100)
  description    String
  baseSchema     Json     @map("base_schema")
  exampleDevices String[] @map("example_devices")
  tags           String[]
  popularity     Int      @default(0)
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  @@index([tags], type: Gin)
  @@index([popularity])
  @@map("category_templates")
}
```

### 3. `deviceSpecification` Table
**Status**: 🔴 Not Implemented  
**Required for**: Device specification storage and validation  
**Files affected**:
- `src/lib/monitoring/performance-monitor.ts`
- `src/lib/schema/migration-manager.ts`
- `src/app/api/schemas/[id]/export/route.ts`

**Schema needed**:
```prisma
model DeviceSpecification {
  id                   String   @id @default(cuid())
  deviceId             String   @unique @map("device_id")
  categoryId           String   @map("category_id")
  schemaVersion        String   @map("schema_version") @db.VarChar(20)
  specifications       Json     // Actual specification values
  computedValues       Json?    @map("computed_values")
  validationErrors     Json?    @map("validation_errors")
  confidenceScores     Json?    @map("confidence_scores")
  sources              Json?    // Source URLs/references for each field
  verificationStatus   Json?    @map("verification_status")
  createdAt            DateTime @default(now()) @map("created_at")
  updatedAt            DateTime @updatedAt @map("updated_at")

  // Relations
  device               Device               @relation(fields: [deviceId], references: [id], onDelete: Cascade)
  category             DeviceCategory       @relation(fields: [categoryId], references: [id])

  @@index([deviceId])
  @@index([categoryId])
  @@index([schemaVersion])
  @@map("device_specifications")
}
```

### 4. `dynamicIndex` Table
**Status**: 🔴 Not Implemented  
**Required for**: Dynamic database index management  
**Files affected**:
- `src/lib/monitoring/performance-monitor.ts`
- `src/lib/schema/migration-manager.ts`

**Schema needed**:
```prisma
model DynamicIndex {
  id               String   @id @default(cuid())
  categoryId       String   @map("category_id")
  fieldName        String   @map("field_name") @db.VarChar(100)
  indexType        String   @map("index_type") @db.VarChar(20) // btree, gin, gist, hash
  indexName        String   @map("index_name") @db.VarChar(100)
  uniqueConstraint Boolean  @default(false) @map("unique_constraint")
  partialCondition String?  @map("partial_condition")
  expression       String?  // For expression indexes
  createdAt        DateTime @default(now()) @map("created_at")

  // Relations
  category         DeviceCategory @relation(fields: [categoryId], references: [id], onDelete: Cascade)

  @@unique([categoryId, fieldName])
  @@index([categoryId])
  @@index([fieldName])
  @@map("dynamic_indexes")
}
```

### 5. `deviceCategorySchema` Table
**Status**: 🔴 Not Implemented  
**Required for**: Schema definition storage  
**Files affected**:
- Various schema registry files

**Schema needed**:
```prisma
model DeviceCategorySchema {
  id                  String   @id @default(cuid())
  categoryId          String   @map("category_id")
  version             String   @db.VarChar(20)
  name                String   @db.VarChar(100)
  description         String?
  parentId            String?  @map("parent_id")
  fields              Json     // Field definitions with types, constraints, and metadata
  requiredFields      String[] @map("required_fields")
  inheritedFields     String[] @map("inherited_fields")
  computedFields      Json?    @map("computed_fields")
  validationRules     Json?    @map("validation_rules")
  compatibilityRules  Json?    @map("compatibility_rules")
  deprecated          Boolean  @default(false)
  deprecationMessage  String?  @map("deprecation_message")
  createdAt           DateTime @default(now()) @map("created_at")
  updatedAt           DateTime @updatedAt @map("updated_at")
  createdBy           String   @map("created_by")

  // Relations
  category            DeviceCategory        @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  parent              DeviceCategorySchema? @relation("SchemaInheritance", fields: [parentId], references: [id])
  children            DeviceCategorySchema[] @relation("SchemaInheritance")
  creator             User                  @relation(fields: [createdBy], references: [id])

  @@unique([categoryId, version])
  @@index([categoryId])
  @@index([version])
  @@index([parentId])
  @@map("device_category_schemas")
}
```

## Mock Implementation Locations

### API Routes

#### `/api/admin/migrations/route.ts`
```typescript
// Lines 25-30: Mock migration data
// TODO: Replace with actual prisma.schemaMigration.findMany() when table exists
const migrations: any[] = []; 

// Lines 41-45: Mock migration filtering
// TODO: Implement actual status filtering when table exists
```

#### `/api/admin/templates/route.ts`
```typescript
// Lines 28-35: Mock custom templates
// TODO: Replace with actual prisma.categoryTemplate.findMany() when table exists
const customTemplates: any[] = [];

// Lines 106-120: Mock template existence check
// TODO: Replace with actual prisma.categoryTemplate.findUnique() when table exists

// Lines 142-155: Mock template creation
// TODO: Replace with actual prisma.categoryTemplate.create() when table exists
```

#### `/api/schemas/[id]/export/route.ts`
```typescript
// Lines 70-85: Mock device specifications
// TODO: Replace with actual device query including deviceSpecification relation

// Lines 88-95: Mock migration history
// TODO: Replace with actual prisma.schemaMigration.findMany() when table exists
```

### Core Libraries

#### `src/lib/schema/migration-manager.ts`
```typescript
// Lines 31-40: Mock migration creation
// TODO: Replace with actual prisma.schemaMigration.create() when table exists

// Lines 59-70: Mock migration record retrieval
// TODO: Replace with actual prisma.schemaMigration.findUnique() when table exists

// Lines 168-170: Mock affected devices count
// TODO: Replace with actual prisma.deviceSpecification.count() when table exists

// Lines 260-270: Mock dynamic index creation
// TODO: Replace with actual prisma.dynamicIndex.create() when table exists
```

#### `src/lib/monitoring/performance-monitor.ts`
```typescript
// Lines 151-153: Mock device count
// TODO: Replace with actual prisma.device.count() when table exists

// Lines 156-160: Mock device specifications
// TODO: Replace with actual prisma.deviceSpecification.findMany() when table exists

// Lines 225-230: Mock index usage data
// TODO: Replace with actual prisma.dynamicIndex.findMany() when table exists
```

## Task Dependencies

### Task 7: Database Schema Extensions
**Priority**: 🔴 High  
**Blocks**: All admin system functionality  
**Description**: Add the missing database tables to the Prisma schema  
**Files to update**:
- `prisma/schema.prisma` - Add all missing table definitions
- Run `npx prisma generate` and `npx prisma db push` after schema updates

### Task 8: Migration System Implementation
**Priority**: 🟡 Medium  
**Depends on**: Task 7 (Database Schema)  
**Description**: Replace migration mocks with actual database operations  
**Files to update**:
- `src/lib/schema/migration-manager.ts`
- `src/app/api/admin/migrations/route.ts`

### Task 9: Template System Implementation
**Priority**: 🟡 Medium  
**Depends on**: Task 7 (Database Schema)  
**Description**: Replace template mocks with actual database operations  
**Files to update**:
- `src/app/api/admin/templates/route.ts`
- `src/app/api/admin/templates/[id]/export/route.ts`

### Task 10: Performance Monitoring Implementation
**Priority**: 🟢 Low  
**Depends on**: Task 7 (Database Schema)  
**Description**: Replace performance monitoring mocks with actual metrics  
**Files to update**:
- `src/lib/monitoring/performance-monitor.ts`

## Validation Checklist

When implementing the actual functionality, ensure:

- [ ] All database tables are created with proper indexes
- [ ] Foreign key relationships are correctly established
- [ ] Migration operations are atomic and reversible
- [ ] Performance monitoring doesn't impact system performance
- [ ] Template import/export maintains data integrity
- [ ] All existing tests continue to pass
- [ ] New integration tests are added for database operations

## Search Pattern for Mocks

To find all mock implementations, search for:
- `// TODO: Replace with actual`
- `// Mock for now since table doesn't exist`
- `const mockData`
- `// await prisma.` (commented out database calls)

## Notes

- All mocks are clearly marked with TODO comments
- The system is fully functional with mocks for development and testing
- Database schema changes should be coordinated with the team
- Consider using database migrations for schema updates in production
- Performance impact should be measured when replacing mocks with actual database operations