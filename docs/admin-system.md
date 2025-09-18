# Device Category Management and Admin System

## Overview

The Device Category Management and Admin System provides a comprehensive interface for managing device categories, schemas, and system configuration. It includes features for creating new categories, managing schema migrations, monitoring performance, and extending functionality through plugins.

## Features

### 1. Category Management
- **Create Categories**: Define new device categories with custom specifications
- **Schema Management**: Manage field definitions, validation rules, and compatibility rules
- **Template System**: Use predefined templates or create custom ones
- **Inheritance**: Support for category hierarchies with field inheritance
- **Import/Export**: Import and export category definitions as JSON

### 2. Migration System
- **Automatic Migrations**: Handle schema changes with automatic migration generation
- **Version Control**: Track schema versions and migration history
- **Rollback Support**: Ability to rollback migrations (planned)
- **Index Management**: Automatic database index creation and optimization

### 3. Plugin System
- **Extensible Architecture**: Add custom specification processors and validators
- **Built-in Plugins**: Unit converter, text normalizer, and validation plugins
- **Hook System**: Execute custom code at specific lifecycle events
- **Plugin Management**: Enable/disable plugins and manage configurations

### 4. Performance Monitoring
- **Query Performance**: Track and analyze query performance metrics
- **Index Optimization**: Monitor index usage and effectiveness
- **Data Quality**: Track validation errors and confidence scores
- **Recommendations**: Automated optimization recommendations

### 5. Analytics and Reporting
- **Usage Analytics**: Track category usage, search patterns, and user interactions
- **Performance Reports**: Generate detailed performance and optimization reports
- **Export Capabilities**: Export analytics data for external analysis

## Architecture

### Core Components

```
Admin System
├── Category Management
│   ├── Schema Registry
│   ├── Template Manager
│   └── Migration Manager
├── Plugin System
│   ├── Processor Plugins
│   ├── Validator Plugins
│   └── Hook System
├── Performance Monitor
│   ├── Metrics Collection
│   ├── Optimization Analysis
│   └── Recommendation Engine
└── Analytics System
    ├── Usage Tracking
    ├── Report Generation
    └── Data Export
```

### Database Schema

The admin system extends the core database schema with additional tables:

- `device_category_schemas`: Stores schema definitions and versions
- `schema_migrations`: Tracks migration operations and history
- `category_templates`: Predefined and custom category templates
- `dynamic_indexes`: Manages dynamically created database indexes

## API Endpoints

### Schema Management
- `GET /api/schemas` - List all schemas
- `POST /api/schemas` - Create new schema
- `GET /api/schemas/{id}` - Get specific schema
- `PUT /api/schemas/{id}` - Update schema (creates new version)
- `DELETE /api/schemas/{id}` - Deprecate schema
- `POST /api/schemas/{id}/validate` - Validate specification against schema
- `GET /api/schemas/{id}/export` - Export schema as JSON

### Migration Management
- `GET /api/admin/migrations` - List migrations
- `POST /api/admin/migrations` - Create migration
- `POST /api/admin/migrations/{id}/apply` - Apply migration

### Template Management
- `GET /api/admin/templates` - List templates
- `POST /api/admin/templates` - Create/import template
- `GET /api/admin/templates/{id}/export` - Export template

### Performance Monitoring
- `GET /api/admin/performance` - Get performance metrics
- `POST /api/admin/performance` - Track performance or clear cache

## Usage Guide

### Creating a New Category

1. **Access Admin Interface**
   ```
   Navigate to /admin/categories/new
   ```

2. **Choose Template (Optional)**
   - Select from predefined templates
   - Templates provide common field definitions
   - Can be customized after selection

3. **Define Basic Information**
   - Category name and description
   - Parent category (for inheritance)
   - Version information

4. **Configure Fields**
   - Add field definitions with types and constraints
   - Set validation rules and metadata
   - Configure search and indexing options

5. **Review and Create**
   - Preview the schema
   - Validate field definitions
   - Create the category

### Managing Schema Migrations

1. **Automatic Migration Creation**
   ```typescript
   // When updating a schema, migrations are created automatically
   const updatedSchema = await schemaRegistry.updateSchema(
     categoryId,
     updates,
     migrationOperations
   );
   ```

2. **Manual Migration Creation**
   ```typescript
   const migration = await migrationManager.createMigration({
     categoryId: 'gaming-console',
     fromVersion: '1.0.0',
     toVersion: '1.1.0',
     operations: [
       {
         type: 'add_field',
         field: 'hdrSupport',
         definition: {
           type: 'array',
           metadata: { label: 'HDR Support', importance: 'medium', weight: 0.6 }
         }
       }
     ]
   });
   ```

3. **Applying Migrations**
   ```typescript
   const result = await migrationManager.applyMigration(migrationId);
   ```

### Using the Plugin System

1. **Creating a Custom Processor**
   ```typescript
   const customProcessor: SpecificationProcessor = {
     id: 'custom-processor',
     name: 'Custom Processor',
     description: 'Processes custom data format',
     version: '1.0.0',
     supportedTypes: ['string'],
     async process(value, field, context) {
       // Custom processing logic
       return {
         success: true,
         processedValue: processedValue,
         confidence: 0.9
       };
     }
   };
   ```

2. **Registering a Plugin**
   ```typescript
   pluginManager.registerPlugin({
     id: 'my-plugin',
     name: 'My Plugin',
     description: 'Custom plugin for specific processing',
     version: '1.0.0',
     author: 'Developer',
     enabled: true,
     processors: [customProcessor]
   });
   ```

### Monitoring Performance

1. **View Performance Metrics**
   ```
   Navigate to /admin/analytics
   ```

2. **Get Optimization Recommendations**
   ```typescript
   const recommendations = await performanceMonitor.getOptimizationRecommendations();
   ```

3. **Track Custom Metrics**
   ```typescript
   await performanceMonitor.trackQuery(
     categoryId,
     'search',
     queryDuration,
     success
   );
   ```

## Configuration

### Environment Variables

```env
# Admin System Configuration
ADMIN_ENABLED=true
ADMIN_SECRET_KEY=your-secret-key
PERFORMANCE_MONITORING=true
PLUGIN_SYSTEM_ENABLED=true

# Database Configuration
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# Monitoring Configuration
METRICS_RETENTION_DAYS=30
CACHE_TTL_MINUTES=5
```

### Plugin Configuration

```json
{
  "plugins": {
    "unit-converter": {
      "enabled": true,
      "config": {
        "defaultUnits": {
          "length": "cm",
          "weight": "kg",
          "power": "watts"
        }
      }
    },
    "text-normalizer": {
      "enabled": true,
      "config": {
        "brandNormalization": true,
        "modelCleaning": true
      }
    }
  }
}
```

## Security Considerations

### Authentication and Authorization
- Admin routes require authentication
- Role-based access control (admin, moderator, user)
- API key authentication for external integrations
- Rate limiting on admin endpoints

### Data Protection
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- Audit logging for admin actions

### Migration Safety
- Backup creation before migrations
- Rollback capabilities
- Validation before applying changes
- Transaction-based operations

## Testing

### Unit Tests
```bash
npm run test tests/admin/
```

### Integration Tests
```bash
npm run test tests/api/admin-endpoints.test.ts
```

### Performance Tests
```bash
npm run test:performance
```

## Troubleshooting

### Common Issues

1. **Migration Failures**
   - Check database connectivity
   - Verify schema compatibility
   - Review migration operations
   - Check for data conflicts

2. **Plugin Errors**
   - Verify plugin registration
   - Check supported types
   - Review error logs
   - Validate plugin configuration

3. **Performance Issues**
   - Monitor query performance
   - Check index usage
   - Review cache configuration
   - Analyze slow queries

### Debug Mode

Enable debug logging:
```env
DEBUG=admin:*
LOG_LEVEL=debug
```

### Health Checks

Monitor system health:
```typescript
const health = await performanceMonitor.getSystemSummary();
console.log('System Health:', health.systemHealth);
```

## Future Enhancements

### Planned Features
- Advanced analytics dashboard
- Real-time performance monitoring
- Automated optimization suggestions
- Plugin marketplace
- Advanced migration tools
- Multi-tenant support

### API Improvements
- GraphQL endpoint for complex queries
- Webhook system for real-time updates
- Batch operations for bulk changes
- Advanced filtering and sorting

## Support

For issues and questions:
- Check the troubleshooting guide
- Review error logs
- Contact system administrators
- Submit bug reports through the issue tracker