# Extensible Database Schema System

## Overview

The Extensible Database Schema System is a flexible framework that allows the Device Compatibility Platform to support any device category with dynamic specification fields, type validation, and compatibility rules. This system enables easy addition of new device types without requiring database schema changes or code modifications.

## Key Features

### 1. Dynamic Specification Fields
- **Type System**: Supports string, number, boolean, enum, array, object, date, url, and email field types
- **Validation**: Comprehensive constraint validation (min/max values, length limits, patterns, enums)
- **Metadata**: Rich field metadata including labels, descriptions, importance weights, and search configuration

### 2. Category Templates
- **Pre-built Templates**: Ready-to-use templates for common device categories (gaming consoles, monitors, audio devices, etc.)
- **Customizable**: Templates can be customized and extended for specific needs
- **Inheritance**: Support for category inheritance with field merging

### 3. Schema Versioning
- **Semantic Versioning**: Full semver support for schema versions
- **Migration System**: Automated migration between schema versions
- **Backward Compatibility**: Safe migration paths with breaking change detection

### 4. Compatibility Engine
- **Rule-based**: Extensible compatibility rules framework
- **Field-level Analysis**: Detailed compatibility analysis for each specification field
- **Custom Processors**: Support for custom compatibility rule processors

### 5. Automatic Indexing
- **Dynamic Indexes**: Automatic database index generation for searchable fields
- **Performance Optimization**: Optimized queries for large datasets

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Schema Registry                              │
├─────────────────────────────────────────────────────────────────┤
│ • Schema Management    • Template System    • Version Control  │
│ • Validation          • Inheritance        • Migration         │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Compatibility Engine                           │
├─────────────────────────────────────────────────────────────────┤
│ • Rule Processing     • Field Comparison   • Result Caching    │
│ • Custom Processors   • Confidence Scoring • Recommendations   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Database Layer                               │
├─────────────────────────────────────────────────────────────────┤
│ • Schema Storage      • Specification Data • Dynamic Indexes   │
│ • Migration History   • Compatibility Cache • Performance Opts │
└─────────────────────────────────────────────────────────────────┘
```

## Database Schema

### Core Tables

#### `device_category_schemas`
Stores schema definitions for device categories:
- `id`: Unique schema identifier
- `category_id`: Reference to device category
- `version`: Semantic version string
- `fields`: JSON field definitions with types and constraints
- `required_fields`: Array of required field names
- `validation_rules`: Custom validation rules
- `compatibility_rules`: Compatibility checking rules

#### `device_specifications`
Stores actual device specification data:
- `device_id`: Reference to device
- `category_id`: Reference to category
- `schema_version`: Schema version used
- `specifications`: JSON specification values
- `confidence_scores`: AI extraction confidence per field
- `verification_status`: Crowdsourced verification status

#### `schema_migrations`
Tracks schema version migrations:
- `from_version` / `to_version`: Version transition
- `operations`: Migration operations to apply
- `applied_at`: When migration was executed

## Usage Examples

### 1. Creating a New Device Category

```typescript
import { schemaRegistry, templateManager } from '@/lib/schema';

// Option 1: From template
const template = templateManager.getTemplate('gaming-console');
const customSchema = await schemaRegistry.createCategoryFromTemplate(template, {
  name: 'Handheld Gaming Console',
  fields: {
    ...template.baseSchema.fields,
    batteryLife: {
      type: 'number',
      constraints: { min: 1, max: 20, unit: 'hours' },
      metadata: {
        label: 'Battery Life',
        description: 'Battery life in hours',
        importance: 'high',
        weight: 0.8
      }
    }
  }
});

// Option 2: From scratch
const customSchema = await schemaRegistry.registerSchema({
  id: 'smart-watch',
  name: 'Smart Watch',
  version: '1.0.0',
  fields: {
    displaySize: {
      type: 'number',
      constraints: { min: 0.5, max: 3.0, unit: 'inches' },
      metadata: {
        label: 'Display Size',
        importance: 'high',
        weight: 0.9
      }
    },
    waterResistance: {
      type: 'enum',
      constraints: { enum: ['None', 'IPX4', 'IPX7', 'IPX8', '5ATM', '10ATM'] },
      metadata: {
        label: 'Water Resistance',
        importance: 'medium',
        weight: 0.6
      }
    }
  },
  requiredFields: ['displaySize'],
  createdBy: 'admin'
});
```

### 2. Validating Device Specifications

```typescript
import { SchemaValidator } from '@/lib/schema/validator';

const validator = new SchemaValidator();
const schema = schemaRegistry.getSchema('smart-watch');

const specification = {
  deviceId: 'apple-watch-series-9',
  categoryId: 'smart-watch',
  schemaVersion: '1.0.0',
  specifications: {
    displaySize: 1.9,
    waterResistance: '5ATM',
    batteryLife: 18
  }
};

const result = validator.validateSpecification(specification, schema);

if (!result.isValid) {
  console.log('Validation errors:', result.fieldErrors);
}
```

### 3. Checking Device Compatibility

```typescript
import { compatibilityEngine } from '@/lib/schema/compatibility';

const result = await compatibilityEngine.checkCompatibility(
  'iphone-15-pro',
  'magsafe-charger',
  {
    connectionType: 'wireless',
    useCase: 'charging'
  }
);

console.log(`Compatibility: ${result.compatible}`);
console.log(`Confidence: ${result.confidence * 100}%`);
console.log(`Details: ${result.details}`);

if (result.limitations.length > 0) {
  console.log('Limitations:', result.limitations);
}

if (result.recommendations.length > 0) {
  console.log('Recommendations:', result.recommendations);
}
```

### 4. Schema Evolution and Migration

```typescript
// Update schema with new field
const updatedSchema = await schemaRegistry.updateSchema('smart-watch', {
  fields: {
    ...existingSchema.fields,
    heartRateMonitor: {
      type: 'boolean',
      metadata: {
        label: 'Heart Rate Monitor',
        importance: 'medium',
        weight: 0.5
      }
    }
  }
}, [
  {
    type: 'add_field',
    field: 'heartRateMonitor',
    definition: {
      type: 'boolean',
      metadata: {
        label: 'Heart Rate Monitor',
        importance: 'medium',
        weight: 0.5
      }
    }
  }
]);

// Migrate existing device specifications
const migration = await getMigration('smart-watch', '1.0.0', '1.1.0');
const migratedSpec = versionManager.migrateSpecification(oldSpec, migration);
```

## API Endpoints

### Schema Management
- `GET /api/schemas` - List all schemas
- `POST /api/schemas` - Create new schema
- `GET /api/schemas/{id}` - Get specific schema
- `PUT /api/schemas/{id}` - Update schema (creates new version)
- `DELETE /api/schemas/{id}` - Deprecate schema

### Validation
- `POST /api/schemas/{id}/validate` - Validate specification against schema

### Compatibility
- `POST /api/compatibility` - Check device compatibility
- `GET /api/compatibility` - Get cached compatibility results

### Templates
- `GET /api/schemas?template=true` - List available templates

## Field Types and Constraints

### String Fields
```typescript
{
  type: 'string',
  constraints: {
    required: true,
    minLength: 1,
    maxLength: 100,
    pattern: '^[A-Z][a-z]+$'
  }
}
```

### Number Fields
```typescript
{
  type: 'number',
  constraints: {
    min: 0,
    max: 1000,
    unit: 'watts',
    precision: 2
  }
}
```

### Enum Fields
```typescript
{
  type: 'enum',
  constraints: {
    enum: ['low', 'medium', 'high', 'ultra']
  }
}
```

### Array Fields
```typescript
{
  type: 'array',
  constraints: {
    minLength: 1,
    maxLength: 10
  }
}
```

## Built-in Templates

### Gaming Console
- Generation, resolution support, HDR formats
- Storage capacity, wireless standards
- Console-TV compatibility rules

### Monitor/Display
- Screen size, resolution, refresh rates
- Panel technology, color gamut, HDR support
- Input ports, VESA mounting

### Audio Device
- Driver size, frequency response, impedance
- Connection types, wireless codecs
- Noise cancellation, microphone specs

### Cable/Connector
- Connector types, cable length
- Data rates, power delivery
- Signal types, compatibility rules

### Smartphone
- Operating system, screen size, battery
- Charging ports, wireless capabilities
- Storage options, camera specs

### Laptop Computer
- Processor, memory, storage, graphics
- Screen size, battery life, ports
- Operating system compatibility

## Compatibility Rule Framework

### Built-in Rule Processors

#### Power Compatibility
```typescript
{
  id: 'power-rule',
  name: 'power_compatibility',
  sourceField: 'powerRequirement',
  targetField: 'powerOutput',
  condition: 'source <= target',
  compatibilityType: 'full'
}
```

#### Dimension Compatibility
```typescript
{
  id: 'size-rule',
  name: 'dimension_compatibility',
  sourceField: 'dimensions',
  targetField: 'maxDimensions',
  condition: 'this.fitsWithin(source, target)',
  compatibilityType: 'full'
}
```

#### Connector Compatibility
```typescript
{
  id: 'connector-rule',
  name: 'connector_compatibility',
  sourceField: 'outputConnector',
  targetField: 'inputPorts',
  condition: 'target.includes(source)',
  compatibilityType: 'full'
}
```

### Custom Rule Processors
```typescript
import { CompatibilityRuleProcessor } from '@/lib/schema/compatibility';

class CustomRuleProcessor implements CompatibilityRuleProcessor {
  async process(rule, context) {
    // Custom compatibility logic
    return {
      compatible: 'full',
      confidence: 0.95,
      limitations: [],
      recommendations: []
    };
  }
}

compatibilityEngine.registerRuleProcessor('custom_rule', new CustomRuleProcessor());
```

## Performance Considerations

### Automatic Indexing
The system automatically creates database indexes for:
- Searchable fields (`metadata.searchable = true`)
- Indexable fields (`metadata.indexable = true`)
- High-importance fields (`metadata.importance = 'critical'`)

### Caching Strategy
- Schema definitions cached in memory
- Compatibility results cached with TTL
- Computed field values cached per device

### Query Optimization
- GIN indexes on JSONB specification fields
- Partial indexes for filtered queries
- Expression indexes for computed values

## Security and Validation

### Input Sanitization
- All user inputs validated against schema constraints
- XSS prevention for string fields
- SQL injection prevention through parameterized queries

### Schema Validation
- Comprehensive schema structure validation
- Field definition consistency checks
- Circular inheritance detection

### Migration Safety
- Breaking change detection
- Safe migration path validation
- Rollback capability for failed migrations

## Testing

The system includes comprehensive test coverage:
- **Registry Tests**: Schema registration, inheritance, versioning
- **Validator Tests**: Field validation, constraint checking, error handling
- **Compatibility Tests**: Rule processing, field comparison, result generation
- **Versioning Tests**: Migration operations, specification updates
- **Template Tests**: Built-in templates, field definitions, compatibility rules

Run tests with:
```bash
npx vitest run tests/schema
```

## Future Enhancements

### Planned Features
1. **GraphQL Schema Generation**: Auto-generate GraphQL schemas from category definitions
2. **Real-time Validation**: WebSocket-based real-time specification validation
3. **Machine Learning Integration**: AI-powered compatibility prediction
4. **Visual Schema Editor**: Web-based schema design interface
5. **Import/Export**: Schema import/export in various formats (JSON, YAML, CSV)

### Performance Improvements
1. **Lazy Loading**: On-demand schema loading for better startup performance
2. **Distributed Caching**: Redis-based distributed caching for multi-instance deployments
3. **Query Optimization**: Advanced query optimization for complex compatibility checks
4. **Batch Processing**: Bulk operations for large-scale data migrations

This extensible schema system provides a robust foundation for supporting unlimited device categories while maintaining data integrity, performance, and ease of use.