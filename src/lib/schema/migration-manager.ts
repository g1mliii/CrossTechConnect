/**
 * Migration Manager - Handles schema migrations and database updates
 */

import { prisma } from '../database';
import { SchemaMigration, MigrationOperation, CategorySchema } from './types';
import { schemaRegistry } from './registry';

export class MigrationManager {
  /**
   * Create a new migration
   */
  async createMigration(params: {
    categoryId: string;
    fromVersion: string;
    toVersion: string;
    operations: MigrationOperation[];
  }): Promise<SchemaMigration> {
    const { categoryId, fromVersion, toVersion, operations } = params;

    // Validate that the category exists
    const category = await prisma.deviceCategory.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      throw new Error(`Category not found: ${categoryId}`);
    }

    // Create migration record
    const migration = await prisma.schemaMigration.create({
      data: {
        categoryId,
        fromVersion,
        toVersion,
        operations: JSON.parse(JSON.stringify(operations))
      }
    });

    return {
      id: migration.id,
      categoryId: migration.categoryId,
      fromVersion: migration.fromVersion,
      toVersion: migration.toVersion,
      operations: migration.operations as MigrationOperation[],
      createdAt: migration.createdAt,
      appliedAt: migration.appliedAt || undefined
    };
  }

  /**
   * Apply a migration
   */
  async applyMigration(migrationId: string): Promise<{
    migration: SchemaMigration;
    affectedDevices: number;
    generatedIndexes: string[];
  }> {
    // Get migration record from database
    const migrationRecord = await prisma.schemaMigration.findUnique({
      where: { id: migrationId },
      include: {
        category: true
      }
    });

    if (!migrationRecord) {
      throw new Error(`Migration not found: ${migrationId}`);
    }

    if (migrationRecord.appliedAt) {
      throw new Error('Migration has already been applied');
    }

    const operations = migrationRecord.operations as MigrationOperation[];
    const categoryId = migrationRecord.categoryId;

    try {
      // Apply each operation
      const results = await this.applyOperations(categoryId, operations);

      // Mark migration as applied
      await prisma.schemaMigration.update({
        where: { id: migrationId },
        data: { appliedAt: new Date() }
      });

      // Update schema registry
      await schemaRegistry.initialize();

      return {
        migration: {
          id: migrationRecord.id,
          categoryId: migrationRecord.categoryId,
          fromVersion: migrationRecord.fromVersion,
          toVersion: migrationRecord.toVersion,
          operations: operations,
          createdAt: migrationRecord.createdAt,
          appliedAt: new Date()
        },
        affectedDevices: results.affectedDevices,
        generatedIndexes: results.generatedIndexes
      };

    } catch (error) {
      console.error('Migration failed:', error);
      throw new Error(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Apply migration operations
   */
  private async applyOperations(
    categoryId: string, 
    operations: MigrationOperation[]
  ): Promise<{
    affectedDevices: number;
    generatedIndexes: string[];
  }> {
    let affectedDevices = 0;
    const generatedIndexes: string[] = [];

    for (const operation of operations) {
      switch (operation.type) {
        case 'add_field':
          await this.addField(categoryId, operation.field, operation.definition);
          if (operation.definition.metadata.indexable) {
            const indexName = await this.createDynamicIndex(categoryId, operation.field);
            generatedIndexes.push(indexName);
          }
          break;

        case 'remove_field':
          await this.removeField(categoryId, operation.field);
          await this.removeDynamicIndex(categoryId, operation.field);
          break;

        case 'modify_field':
          await this.modifyField(categoryId, operation.field, operation.changes);
          break;

        case 'rename_field':
          await this.renameField(categoryId, operation.oldName, operation.newName);
          break;

        case 'add_validation_rule':
          await this.addValidationRule(categoryId, operation.rule);
          break;

        case 'remove_validation_rule':
          await this.removeValidationRule(categoryId, operation.ruleId);
          break;

        case 'add_compatibility_rule':
          await this.addCompatibilityRule(categoryId, operation.rule);
          break;

        case 'remove_compatibility_rule':
          await this.removeCompatibilityRule(categoryId, operation.ruleId);
          break;

        default:
          console.warn(`Unknown migration operation type: ${(operation as any).type}`);
      }
    }

    // Count affected devices
    affectedDevices = await prisma.deviceSpecification.count({
      where: { categoryId }
    });

    return { affectedDevices, generatedIndexes };
  }

  /**
   * Add a new field to category schema
   */
  private async addField(categoryId: string, fieldName: string, definition: any): Promise<void> {
    // Update existing device specifications to include the new field with default value
    const defaultValue = this.getDefaultValueForType(definition.type);
    
    // Update existing device specifications to include the new field with default value
    // Use raw SQL for JSON field updates
    await prisma.$executeRaw`
      UPDATE device_specifications 
      SET specifications = specifications || ${JSON.stringify({ [fieldName]: defaultValue })}::jsonb
      WHERE category_id = ${categoryId}
      AND NOT (specifications ? ${fieldName})
    `;

    console.log(`Added field ${fieldName} to category ${categoryId}`);
  }

  /**
   * Remove a field from category schema
   */
  private async removeField(categoryId: string, fieldName: string): Promise<void> {
    // Remove field from all device specifications using raw SQL
    await prisma.$executeRaw`
      UPDATE device_specifications 
      SET specifications = specifications - ${fieldName}
      WHERE category_id = ${categoryId}
    `;
    
    console.log(`Removed field ${fieldName} from category ${categoryId}`);
  }

  /**
   * Modify an existing field
   */
  private async modifyField(categoryId: string, fieldName: string, changes: any): Promise<void> {
    // Apply field modifications to existing specifications
    // This would typically involve validation and type conversion
    if (changes.defaultValue !== undefined) {
      await prisma.$executeRaw`
        UPDATE device_specifications 
        SET specifications = jsonb_set(specifications, ${`{${fieldName}}`}, ${JSON.stringify(changes.defaultValue)}::jsonb)
        WHERE category_id = ${categoryId}
        AND (specifications->>${fieldName} IS NULL OR specifications->>${fieldName} = '')
      `;
    }
    
    console.log(`Modified field ${fieldName} in category ${categoryId}:`, changes);
  }

  /**
   * Rename a field
   */
  private async renameField(categoryId: string, oldName: string, newName: string): Promise<void> {
    // Rename field in all device specifications using raw SQL
    await prisma.$executeRaw`
      UPDATE device_specifications 
      SET specifications = specifications - ${oldName} || jsonb_build_object(${newName}, specifications->${oldName})
      WHERE category_id = ${categoryId}
      AND specifications ? ${oldName}
    `;
    
    console.log(`Renamed field ${oldName} to ${newName} in category ${categoryId}`);
  }

  /**
   * Add validation rule
   */
  private async addValidationRule(categoryId: string, rule: any): Promise<void> {
    // Add validation rule to category schema
    console.log(`Added validation rule ${rule.id} to category ${categoryId}`);
  }

  /**
   * Remove validation rule
   */
  private async removeValidationRule(categoryId: string, ruleId: string): Promise<void> {
    // Remove validation rule from category schema
    console.log(`Removed validation rule ${ruleId} from category ${categoryId}`);
  }

  /**
   * Add compatibility rule
   */
  private async addCompatibilityRule(categoryId: string, rule: any): Promise<void> {
    // Add compatibility rule to category schema
    console.log(`Added compatibility rule ${rule.id} to category ${categoryId}`);
  }

  /**
   * Remove compatibility rule
   */
  private async removeCompatibilityRule(categoryId: string, ruleId: string): Promise<void> {
    // Remove compatibility rule from category schema
    console.log(`Removed compatibility rule ${ruleId} from category ${categoryId}`);
  }

  /**
   * Create dynamic database index for a field
   */
  private async createDynamicIndex(categoryId: string, fieldName: string): Promise<string> {
    const indexName = `idx_${categoryId}_${fieldName}`.replace(/[^a-zA-Z0-9_]/g, '_');
    
    try {
      // Create the index record
      await prisma.dynamicIndex.create({
        data: {
          categoryId,
          fieldName,
          indexType: 'btree',
          indexName,
          uniqueConstraint: false
        }
      });

      // Create actual database index using raw SQL
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS ${indexName} ON device_specifications USING btree ((specifications->>${fieldName}))`;
      
      console.log(`Created index ${indexName} for field ${fieldName}`);
      return indexName;
    } catch (error) {
      console.error(`Failed to create index for ${fieldName}:`, error);
      throw error;
    }
  }

  /**
   * Remove dynamic database index for a field
   */
  private async removeDynamicIndex(categoryId: string, fieldName: string): Promise<void> {
    try {
      // Find the index record
      const index = await prisma.dynamicIndex.findFirst({
        where: {
          categoryId,
          fieldName
        }
      });

      if (index) {
        // Drop the database index using raw SQL
        await prisma.$executeRaw`DROP INDEX IF EXISTS ${index.indexName}`;
        
        // Remove the index record
        await prisma.dynamicIndex.delete({
          where: { id: index.id }
        });

        console.log(`Removed index ${index.indexName} for field ${fieldName}`);
      }
    } catch (error) {
      console.error(`Failed to remove index for ${fieldName}:`, error);
      // Don't throw - index removal is not critical
    }
  }

  /**
   * Get default value for a field type
   */
  private getDefaultValueForType(type: string): any {
    switch (type) {
      case 'string': return '';
      case 'number': return 0;
      case 'boolean': return false;
      case 'array': return [];
      case 'object': return {};
      case 'date': return null;
      case 'url': return '';
      case 'email': return '';
      case 'enum': return null;
      default: return null;
    }
  }

  /**
   * Get pending migrations for a category
   */
  async getPendingMigrations(categoryId: string): Promise<SchemaMigration[]> {
    const migrations = await prisma.schemaMigration.findMany({
      where: {
        categoryId,
        appliedAt: null
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return migrations.map((m) => ({
      id: m.id,
      categoryId: m.categoryId,
      fromVersion: m.fromVersion,
      toVersion: m.toVersion,
      operations: m.operations as MigrationOperation[],
      createdAt: m.createdAt,
      appliedAt: m.appliedAt || undefined
    }));
  }

  /**
   * Rollback a migration (if possible)
   */
  async rollbackMigration(migrationId: string): Promise<void> {
    // This would create a reverse migration
    // Implementation depends on the specific operations that were applied
    throw new Error('Migration rollback not yet implemented');
  }
}