/**
 * Schema Version Manager - Handles schema versioning and migrations
 */

import { 
  CategorySchema, 
  SchemaMigration, 
  MigrationOperation, 
  DeviceSpecification 
} from './types';

export class SchemaVersionManager {
  /**
   * Increment version number using semantic versioning
   */
  incrementVersion(currentVersion: string, type: 'major' | 'minor' | 'patch' = 'minor'): string {
    const [major, minor, patch] = currentVersion.split('.').map(Number);
    
    switch (type) {
      case 'major':
        return `${major + 1}.0.0`;
      case 'minor':
        return `${major}.${minor + 1}.0`;
      case 'patch':
        return `${major}.${minor}.${patch + 1}`;
      default:
        return `${major}.${minor + 1}.0`;
    }
  }

  /**
   * Compare two version strings
   */
  compareVersions(version1: string, version2: string): number {
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;
      
      if (v1Part > v2Part) return 1;
      if (v1Part < v2Part) return -1;
    }
    
    return 0;
  }

  /**
   * Check if version is compatible (within same major version)
   */
  isCompatibleVersion(currentVersion: string, targetVersion: string): boolean {
    const [currentMajor] = currentVersion.split('.').map(Number);
    const [targetMajor] = targetVersion.split('.').map(Number);
    
    return currentMajor === targetMajor;
  }

  /**
   * Generate migration operations between two schemas
   */
  generateMigrationOperations(
    fromSchema: CategorySchema, 
    toSchema: CategorySchema
  ): MigrationOperation[] {
    const operations: MigrationOperation[] = [];

    // Compare fields
    const fromFields = fromSchema.fields;
    const toFields = toSchema.fields;

    // Find added fields
    for (const [fieldName, fieldDef] of Object.entries(toFields)) {
      if (!fromFields[fieldName]) {
        operations.push({
          type: 'add_field',
          field: fieldName,
          definition: fieldDef
        });
      } else if (JSON.stringify(fromFields[fieldName]) !== JSON.stringify(fieldDef)) {
        // Field modified
        operations.push({
          type: 'modify_field',
          field: fieldName,
          changes: this.calculateFieldChanges(fromFields[fieldName], fieldDef)
        });
      }
    }

    // Find removed fields
    for (const fieldName of Object.keys(fromFields)) {
      if (!toFields[fieldName]) {
        operations.push({
          type: 'remove_field',
          field: fieldName
        });
      }
    }

    // Compare validation rules
    const fromRules = fromSchema.validationRules || [];
    const toRules = toSchema.validationRules || [];

    // Find added validation rules
    for (const rule of toRules) {
      if (!fromRules.find(r => r.id === rule.id)) {
        operations.push({
          type: 'add_validation_rule',
          rule
        });
      }
    }

    // Find removed validation rules
    for (const rule of fromRules) {
      if (!toRules.find(r => r.id === rule.id)) {
        operations.push({
          type: 'remove_validation_rule',
          ruleId: rule.id
        });
      }
    }

    // Compare compatibility rules
    const fromCompatRules = fromSchema.compatibilityRules || [];
    const toCompatRules = toSchema.compatibilityRules || [];

    // Find added compatibility rules
    for (const rule of toCompatRules) {
      if (!fromCompatRules.find(r => r.id === rule.id)) {
        operations.push({
          type: 'add_compatibility_rule',
          rule
        });
      }
    }

    // Find removed compatibility rules
    for (const rule of fromCompatRules) {
      if (!toCompatRules.find(r => r.id === rule.id)) {
        operations.push({
          type: 'remove_compatibility_rule',
          ruleId: rule.id
        });
      }
    }

    return operations;
  }

  /**
   * Apply migration operations to a schema
   */
  applyMigrationOperations(
    schema: CategorySchema, 
    operations: MigrationOperation[]
  ): CategorySchema {
    const migratedSchema = JSON.parse(JSON.stringify(schema)); // Deep clone

    for (const operation of operations) {
      switch (operation.type) {
        case 'add_field':
          migratedSchema.fields[operation.field] = operation.definition;
          break;

        case 'remove_field':
          delete migratedSchema.fields[operation.field];
          // Remove from required fields if present
          migratedSchema.requiredFields = migratedSchema.requiredFields.filter(
            (f: string) => f !== operation.field
          );
          break;

        case 'modify_field':
          if (migratedSchema.fields[operation.field]) {
            migratedSchema.fields[operation.field] = {
              ...migratedSchema.fields[operation.field],
              ...operation.changes
            };
          }
          break;

        case 'rename_field':
          if (migratedSchema.fields[operation.oldName]) {
            migratedSchema.fields[operation.newName] = migratedSchema.fields[operation.oldName];
            delete migratedSchema.fields[operation.oldName];
            
            // Update required fields
            const requiredIndex = migratedSchema.requiredFields.indexOf(operation.oldName);
            if (requiredIndex !== -1) {
              migratedSchema.requiredFields[requiredIndex] = operation.newName;
            }
          }
          break;

        case 'add_validation_rule':
          if (!migratedSchema.validationRules) {
            migratedSchema.validationRules = [];
          }
          migratedSchema.validationRules.push(operation.rule);
          break;

        case 'remove_validation_rule':
          if (migratedSchema.validationRules) {
            migratedSchema.validationRules = migratedSchema.validationRules.filter(
              (r: any) => r.id !== operation.ruleId
            );
          }
          break;

        case 'add_compatibility_rule':
          if (!migratedSchema.compatibilityRules) {
            migratedSchema.compatibilityRules = [];
          }
          migratedSchema.compatibilityRules.push(operation.rule);
          break;

        case 'remove_compatibility_rule':
          if (migratedSchema.compatibilityRules) {
            migratedSchema.compatibilityRules = migratedSchema.compatibilityRules.filter(
              (r: any) => r.id !== operation.ruleId
            );
          }
          break;
      }
    }

    return migratedSchema;
  }

  /**
   * Migrate device specification to new schema version
   */
  migrateSpecification(
    specification: DeviceSpecification,
    migration: SchemaMigration
  ): DeviceSpecification {
    const migratedSpec = JSON.parse(JSON.stringify(specification)); // Deep clone
    migratedSpec.schemaVersion = migration.toVersion;

    for (const operation of migration.operations) {
      switch (operation.type) {
        case 'add_field':
          // Add default value if specified
          if (operation.definition.defaultValue !== undefined) {
            migratedSpec.specifications[operation.field] = operation.definition.defaultValue;
          }
          break;

        case 'remove_field':
          delete migratedSpec.specifications[operation.field];
          if (migratedSpec.computedValues) {
            delete migratedSpec.computedValues[operation.field];
          }
          if (migratedSpec.confidenceScores) {
            delete migratedSpec.confidenceScores[operation.field];
          }
          if (migratedSpec.sources) {
            delete migratedSpec.sources[operation.field];
          }
          if (migratedSpec.verificationStatus) {
            delete migratedSpec.verificationStatus[operation.field];
          }
          break;

        case 'rename_field':
          if (operation.oldName in migratedSpec.specifications) {
            migratedSpec.specifications[operation.newName] = migratedSpec.specifications[operation.oldName];
            delete migratedSpec.specifications[operation.oldName];

            // Migrate related data
            if (migratedSpec.computedValues && operation.oldName in migratedSpec.computedValues) {
              migratedSpec.computedValues[operation.newName] = migratedSpec.computedValues[operation.oldName];
              delete migratedSpec.computedValues[operation.oldName];
            }

            if (migratedSpec.confidenceScores && operation.oldName in migratedSpec.confidenceScores) {
              migratedSpec.confidenceScores[operation.newName] = migratedSpec.confidenceScores[operation.oldName];
              delete migratedSpec.confidenceScores[operation.oldName];
            }

            if (migratedSpec.sources && operation.oldName in migratedSpec.sources) {
              migratedSpec.sources[operation.newName] = migratedSpec.sources[operation.oldName];
              delete migratedSpec.sources[operation.oldName];
            }

            if (migratedSpec.verificationStatus && operation.oldName in migratedSpec.verificationStatus) {
              migratedSpec.verificationStatus[operation.newName] = migratedSpec.verificationStatus[operation.oldName];
              delete migratedSpec.verificationStatus[operation.oldName];
            }
          }
          break;

        case 'modify_field':
          // Handle field modifications that might require data transformation
          if (operation.field in migratedSpec.specifications) {
            const currentValue = migratedSpec.specifications[operation.field];
            const transformedValue = this.transformFieldValue(currentValue, operation.changes);
            if (transformedValue !== currentValue) {
              migratedSpec.specifications[operation.field] = transformedValue;
            }
          }
          break;
      }
    }

    migratedSpec.updatedAt = new Date();
    return migratedSpec;
  }

  /**
   * Get migration path between two versions
   */
  getMigrationPath(
    fromVersion: string, 
    toVersion: string, 
    availableMigrations: SchemaMigration[]
  ): SchemaMigration[] {
    // Simple implementation - in production, this would use graph algorithms
    // to find the optimal migration path
    
    const path: SchemaMigration[] = [];
    let currentVersion = fromVersion;

    while (currentVersion !== toVersion) {
      const nextMigration = availableMigrations.find(
        m => m.fromVersion === currentVersion
      );

      if (!nextMigration) {
        throw new Error(`No migration path found from ${fromVersion} to ${toVersion}`);
      }

      path.push(nextMigration);
      currentVersion = nextMigration.toVersion;

      // Prevent infinite loops
      if (path.length > 100) {
        throw new Error('Migration path too long - possible circular dependency');
      }
    }

    return path;
  }

  /**
   * Check if migration is safe (non-breaking)
   */
  isSafeMigration(operations: MigrationOperation[]): boolean {
    for (const operation of operations) {
      switch (operation.type) {
        case 'remove_field':
          return false; // Removing fields is breaking

        case 'modify_field':
          // Check if modification is breaking
          if (this.isBreakingFieldChange(operation.changes)) {
            return false;
          }
          break;

        case 'remove_validation_rule':
        case 'remove_compatibility_rule':
          return false; // Removing rules might be breaking

        // Adding fields, rules are generally safe
        case 'add_field':
        case 'add_validation_rule':
        case 'add_compatibility_rule':
        case 'rename_field':
          break;
      }
    }

    return true;
  }

  /**
   * Private helper methods
   */

  private calculateFieldChanges(oldField: any, newField: any): Partial<any> {
    const changes: any = {};

    // Compare each property
    for (const key of Object.keys(newField)) {
      if (JSON.stringify(oldField[key]) !== JSON.stringify(newField[key])) {
        changes[key] = newField[key];
      }
    }

    return changes;
  }

  private transformFieldValue(value: any, changes: Partial<any>): any {
    // Handle common field transformations
    if (changes.type) {
      // Type conversion
      switch (changes.type) {
        case 'string':
          return String(value);
        case 'number':
          return Number(value);
        case 'boolean':
          return Boolean(value);
        default:
          return value;
      }
    }

    return value;
  }

  private isBreakingFieldChange(changes: Partial<any>): boolean {
    // Check for breaking changes
    if (changes.type) {
      return true; // Type changes are breaking
    }

    if (changes.constraints) {
      const constraints = changes.constraints;
      
      // Making field required is breaking
      if (constraints.required === true) {
        return true;
      }

      // Reducing limits is breaking
      if (constraints.min !== undefined || constraints.max !== undefined) {
        return true;
      }

      // Adding pattern constraint is breaking
      if (constraints.pattern) {
        return true;
      }
    }

    return false;
  }
}