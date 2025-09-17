/**
 * Tests for the Schema Version Manager
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SchemaVersionManager } from '@/lib/schema/versioning';
import { CategorySchema, SchemaMigration, DeviceSpecification } from '@/lib/schema/types';

describe('SchemaVersionManager', () => {
  let versionManager: SchemaVersionManager;

  beforeEach(() => {
    versionManager = new SchemaVersionManager();
  });

  describe('Version Increment', () => {
    it('should increment major version correctly', () => {
      const newVersion = versionManager.incrementVersion('1.2.3', 'major');
      expect(newVersion).toBe('2.0.0');
    });

    it('should increment minor version correctly', () => {
      const newVersion = versionManager.incrementVersion('1.2.3', 'minor');
      expect(newVersion).toBe('1.3.0');
    });

    it('should increment patch version correctly', () => {
      const newVersion = versionManager.incrementVersion('1.2.3', 'patch');
      expect(newVersion).toBe('1.2.4');
    });

    it('should default to minor version increment', () => {
      const newVersion = versionManager.incrementVersion('1.2.3');
      expect(newVersion).toBe('1.3.0');
    });
  });

  describe('Version Comparison', () => {
    it('should compare versions correctly', () => {
      expect(versionManager.compareVersions('1.0.0', '1.0.0')).toBe(0);
      expect(versionManager.compareVersions('1.0.1', '1.0.0')).toBe(1);
      expect(versionManager.compareVersions('1.0.0', '1.0.1')).toBe(-1);
      expect(versionManager.compareVersions('2.0.0', '1.9.9')).toBe(1);
      expect(versionManager.compareVersions('1.2.3', '1.10.0')).toBe(-1);
    });

    it('should handle version compatibility checking', () => {
      expect(versionManager.isCompatibleVersion('1.0.0', '1.5.0')).toBe(true);
      expect(versionManager.isCompatibleVersion('1.0.0', '2.0.0')).toBe(false);
      expect(versionManager.isCompatibleVersion('2.1.0', '2.0.0')).toBe(true);
    });
  });

  describe('Migration Operations Generation', () => {
    it('should generate operations for added fields', () => {
      const fromSchema: CategorySchema = {
        id: 'test-schema',
        name: 'Test Schema',
        version: '1.0.0',
        fields: {
          name: {
            type: 'string',
            constraints: { required: true },
            metadata: { label: 'Name', importance: 'critical', weight: 1.0 }
          }
        },
        requiredFields: ['name'],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'test-user'
      };

      const toSchema: CategorySchema = {
        ...fromSchema,
        version: '1.1.0',
        fields: {
          ...fromSchema.fields,
          newField: {
            type: 'string',
            constraints: {},
            metadata: { label: 'New Field', importance: 'low', weight: 0.3 }
          }
        }
      };

      const operations = versionManager.generateMigrationOperations(fromSchema, toSchema);

      expect(operations).toHaveLength(1);
      expect(operations[0].type).toBe('add_field');
      expect((operations[0] as any).field).toBe('newField');
    });

    it('should generate operations for removed fields', () => {
      const fromSchema: CategorySchema = {
        id: 'test-schema',
        name: 'Test Schema',
        version: '1.0.0',
        fields: {
          name: {
            type: 'string',
            constraints: { required: true },
            metadata: { label: 'Name', importance: 'critical', weight: 1.0 }
          },
          oldField: {
            type: 'string',
            constraints: {},
            metadata: { label: 'Old Field', importance: 'low', weight: 0.3 }
          }
        },
        requiredFields: ['name'],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'test-user'
      };

      const toSchema: CategorySchema = {
        ...fromSchema,
        version: '1.1.0',
        fields: {
          name: fromSchema.fields.name
        }
      };

      const operations = versionManager.generateMigrationOperations(fromSchema, toSchema);

      expect(operations).toHaveLength(1);
      expect(operations[0].type).toBe('remove_field');
      expect((operations[0] as any).field).toBe('oldField');
    });

    it('should generate operations for modified fields', () => {
      const fromSchema: CategorySchema = {
        id: 'test-schema',
        name: 'Test Schema',
        version: '1.0.0',
        fields: {
          name: {
            type: 'string',
            constraints: { required: true, maxLength: 50 },
            metadata: { label: 'Name', importance: 'critical', weight: 1.0 }
          }
        },
        requiredFields: ['name'],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'test-user'
      };

      const toSchema: CategorySchema = {
        ...fromSchema,
        version: '1.1.0',
        fields: {
          name: {
            type: 'string',
            constraints: { required: true, maxLength: 100 }, // Changed constraint
            metadata: { label: 'Name', importance: 'critical', weight: 1.0 }
          }
        }
      };

      const operations = versionManager.generateMigrationOperations(fromSchema, toSchema);

      expect(operations).toHaveLength(1);
      expect(operations[0].type).toBe('modify_field');
      expect((operations[0] as any).field).toBe('name');
    });
  });

  describe('Migration Application', () => {
    it('should apply add field operations', () => {
      const schema: CategorySchema = {
        id: 'test-schema',
        name: 'Test Schema',
        version: '1.0.0',
        fields: {
          name: {
            type: 'string',
            constraints: { required: true },
            metadata: { label: 'Name', importance: 'critical', weight: 1.0 }
          }
        },
        requiredFields: ['name'],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'test-user'
      };

      const operations = [
        {
          type: 'add_field' as const,
          field: 'newField',
          definition: {
            type: 'string' as const,
            constraints: {},
            metadata: { label: 'New Field', importance: 'low' as const, weight: 0.3 }
          }
        }
      ];

      const migratedSchema = versionManager.applyMigrationOperations(schema, operations);

      expect(migratedSchema.fields).toHaveProperty('newField');
      expect(migratedSchema.fields.newField.type).toBe('string');
    });

    it('should apply remove field operations', () => {
      const schema: CategorySchema = {
        id: 'test-schema',
        name: 'Test Schema',
        version: '1.0.0',
        fields: {
          name: {
            type: 'string',
            constraints: { required: true },
            metadata: { label: 'Name', importance: 'critical', weight: 1.0 }
          },
          oldField: {
            type: 'string',
            constraints: {},
            metadata: { label: 'Old Field', importance: 'low', weight: 0.3 }
          }
        },
        requiredFields: ['name', 'oldField'],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'test-user'
      };

      const operations = [
        {
          type: 'remove_field' as const,
          field: 'oldField'
        }
      ];

      const migratedSchema = versionManager.applyMigrationOperations(schema, operations);

      expect(migratedSchema.fields).not.toHaveProperty('oldField');
      expect(migratedSchema.requiredFields).not.toContain('oldField');
    });

    it('should apply rename field operations', () => {
      const schema: CategorySchema = {
        id: 'test-schema',
        name: 'Test Schema',
        version: '1.0.0',
        fields: {
          oldName: {
            type: 'string',
            constraints: { required: true },
            metadata: { label: 'Old Name', importance: 'critical', weight: 1.0 }
          }
        },
        requiredFields: ['oldName'],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'test-user'
      };

      const operations = [
        {
          type: 'rename_field' as const,
          oldName: 'oldName',
          newName: 'newName'
        }
      ];

      const migratedSchema = versionManager.applyMigrationOperations(schema, operations);

      expect(migratedSchema.fields).not.toHaveProperty('oldName');
      expect(migratedSchema.fields).toHaveProperty('newName');
      expect(migratedSchema.requiredFields).toContain('newName');
      expect(migratedSchema.requiredFields).not.toContain('oldName');
    });
  });

  describe('Specification Migration', () => {
    it('should migrate device specifications', () => {
      const specification: DeviceSpecification = {
        deviceId: 'device-1',
        categoryId: 'test-schema',
        schemaVersion: '1.0.0',
        specifications: {
          name: 'Test Device',
          oldField: 'old value'
        },
        confidenceScores: {
          oldField: 0.8
        },
        sources: {
          oldField: 'source-url'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const migration: SchemaMigration = {
        id: 'migration-1',
        categoryId: 'test-schema',
        fromVersion: '1.0.0',
        toVersion: '1.1.0',
        operations: [
          {
            type: 'rename_field',
            oldName: 'oldField',
            newName: 'newField'
          },
          {
            type: 'add_field',
            field: 'addedField',
            definition: {
              type: 'string',
              constraints: {},
              metadata: { label: 'Added Field', importance: 'low', weight: 0.3 },
              defaultValue: 'default'
            }
          }
        ],
        createdAt: new Date()
      };

      const migratedSpec = versionManager.migrateSpecification(specification, migration);

      expect(migratedSpec.schemaVersion).toBe('1.1.0');
      expect(migratedSpec.specifications).not.toHaveProperty('oldField');
      expect(migratedSpec.specifications).toHaveProperty('newField');
      expect(migratedSpec.specifications.newField).toBe('old value');
      expect(migratedSpec.specifications).toHaveProperty('addedField');
      expect(migratedSpec.specifications.addedField).toBe('default');
      expect(migratedSpec.confidenceScores).toHaveProperty('newField');
      expect(migratedSpec.sources).toHaveProperty('newField');
    });
  });

  describe('Migration Safety', () => {
    it('should identify safe migrations', () => {
      const safeOperations = [
        {
          type: 'add_field' as const,
          field: 'newField',
          definition: {
            type: 'string' as const,
            constraints: {},
            metadata: { label: 'New Field', importance: 'low' as const, weight: 0.3 }
          }
        }
      ];

      expect(versionManager.isSafeMigration(safeOperations)).toBe(true);
    });

    it('should identify unsafe migrations', () => {
      const unsafeOperations = [
        {
          type: 'remove_field' as const,
          field: 'importantField'
        }
      ];

      expect(versionManager.isSafeMigration(unsafeOperations)).toBe(false);
    });

    it('should identify breaking field changes', () => {
      const breakingOperations = [
        {
          type: 'modify_field' as const,
          field: 'existingField',
          changes: {
            type: 'number' as any // Type change is breaking
          }
        }
      ];

      expect(versionManager.isSafeMigration(breakingOperations)).toBe(false);
    });
  });

  describe('Migration Path Finding', () => {
    it('should find direct migration path', () => {
      const migrations: SchemaMigration[] = [
        {
          id: 'migration-1',
          categoryId: 'test-schema',
          fromVersion: '1.0.0',
          toVersion: '1.1.0',
          operations: [],
          createdAt: new Date()
        }
      ];

      const path = versionManager.getMigrationPath('1.0.0', '1.1.0', migrations);

      expect(path).toHaveLength(1);
      expect(path[0].id).toBe('migration-1');
    });

    it('should find multi-step migration path', () => {
      const migrations: SchemaMigration[] = [
        {
          id: 'migration-1',
          categoryId: 'test-schema',
          fromVersion: '1.0.0',
          toVersion: '1.1.0',
          operations: [],
          createdAt: new Date()
        },
        {
          id: 'migration-2',
          categoryId: 'test-schema',
          fromVersion: '1.1.0',
          toVersion: '1.2.0',
          operations: [],
          createdAt: new Date()
        }
      ];

      const path = versionManager.getMigrationPath('1.0.0', '1.2.0', migrations);

      expect(path).toHaveLength(2);
      expect(path[0].id).toBe('migration-1');
      expect(path[1].id).toBe('migration-2');
    });

    it('should throw error for missing migration path', () => {
      const migrations: SchemaMigration[] = [];

      expect(() => {
        versionManager.getMigrationPath('1.0.0', '2.0.0', migrations);
      }).toThrow('No migration path found');
    });
  });
});