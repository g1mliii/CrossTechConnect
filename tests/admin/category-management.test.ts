/**
 * Tests for Category Management System
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CategorySchema, MigrationOperation } from '@/lib/schema/types';

// Mock the database and dependencies
vi.mock('@/lib/database', () => ({
  prisma: {
    deviceCategory: {
      findMany: vi.fn().mockResolvedValue([
        { id: 'test-1', name: 'Test Category 1' },
        { id: 'test-2', name: 'Test Category 2' }
      ]),
      findUnique: vi.fn().mockImplementation((params) => {
        if (params.where.id === 'non-existent-category') {
          return Promise.resolve(null);
        }
        return Promise.resolve({
          id: params.where.id,
          name: 'Test Category 1'
        });
      }),
      upsert: vi.fn().mockResolvedValue({
        id: 'test-1',
        name: 'Test Category 1'
      })
    },
    device: {
      count: vi.fn().mockResolvedValue(10)
    },
    schemaMigration: {
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockImplementation((params) => {
        return Promise.resolve({
          id: 'migration-1',
          categoryId: params.data.categoryId,
          fromVersion: params.data.fromVersion,
          toVersion: params.data.toVersion,
          operations: params.data.operations,
          createdAt: new Date(),
          appliedAt: null
        });
      }),
      update: vi.fn().mockResolvedValue({
        id: 'migration-1',
        appliedAt: new Date()
      }),
      findUnique: vi.fn().mockResolvedValue({
        id: 'migration-1',
        categoryId: 'test-1',
        fromVersion: '1.0.0',
        toVersion: '1.1.0',
        operations: [],
        createdAt: new Date(),
        appliedAt: null,
        category: { name: 'Test Category' }
      })
    },
    deviceSpecification: {
      count: vi.fn().mockResolvedValue(10),
      findMany: vi.fn().mockResolvedValue([
        {
          validationErrors: [],
          confidenceScores: { name: 0.9, brand: 0.8 },
          verificationStatus: { name: 'verified', brand: 'pending' }
        }
      ]),
      updateMany: vi.fn().mockResolvedValue({ count: 0 })
    },
    dynamicIndex: {
      create: vi.fn().mockResolvedValue({
        id: 'index-1',
        indexName: 'test_index'
      }),
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      delete: vi.fn().mockResolvedValue({})
    }
  },
  handlePrismaError: vi.fn()
}));

// Import after mocking
const { schemaRegistry } = await import('@/lib/schema/registry');
const { MigrationManager } = await import('@/lib/schema/migration-manager');
const { pluginManager } = await import('@/lib/schema/plugin-system');
const { performanceMonitor } = await import('@/lib/monitoring/performance-monitor');

describe('Category Management System', () => {
  beforeEach(async () => {
    // Initialize test environment
    await schemaRegistry.initialize();
  });

  afterEach(() => {
    // Clean up
    performanceMonitor.clearCache();
  });

  describe('Schema Registry', () => {
    it('should register a new schema', async () => {
      const testSchema: CategorySchema = {
        id: 'test-category',
        name: 'Test Category',
        version: '1.0.0',
        description: 'Test category for unit tests',
        fields: {
          name: {
            type: 'string',
            constraints: { required: true },
            metadata: {
              label: 'Name',
              importance: 'critical',
              weight: 1.0
            }
          }
        },
        requiredFields: ['name'],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'test'
      };

      await schemaRegistry.registerSchema(testSchema);
      const retrieved = schemaRegistry.getSchema('test-category');
      
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('Test Category');
      expect(retrieved?.fields.name.type).toBe('string');
    });

    it('should handle schema inheritance', async () => {
      const parentSchema: CategorySchema = {
        id: 'parent-category',
        name: 'Parent Category',
        version: '1.0.0',
        fields: {
          name: {
            type: 'string',
            constraints: { required: true },
            metadata: { label: 'Name', importance: 'critical', weight: 1.0 }
          },
          brand: {
            type: 'string',
            constraints: { required: true },
            metadata: { label: 'Brand', importance: 'high', weight: 0.8 }
          }
        },
        requiredFields: ['name', 'brand'],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'test'
      };

      const childSchema: CategorySchema = {
        id: 'child-category',
        name: 'Child Category',
        version: '1.0.0',
        parentId: 'parent-category',
        fields: {
          model: {
            type: 'string',
            metadata: { label: 'Model', importance: 'medium', weight: 0.6 }
          }
        },
        requiredFields: ['model'],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'test'
      };

      await schemaRegistry.registerSchema(parentSchema);
      await schemaRegistry.registerSchema(childSchema);

      const inheritedSchema = await schemaRegistry.inheritFromParent(childSchema);
      
      expect(inheritedSchema.fields.name).toBeDefined();
      expect(inheritedSchema.fields.brand).toBeDefined();
      expect(inheritedSchema.fields.model).toBeDefined();
      expect(inheritedSchema.requiredFields).toContain('name');
      expect(inheritedSchema.requiredFields).toContain('brand');
      expect(inheritedSchema.requiredFields).toContain('model');
    });
  });

  describe('Migration Manager', () => {
    it('should create a migration', async () => {
      const migrationManager = new MigrationManager();
      
      const operations: MigrationOperation[] = [
        {
          type: 'add_field',
          field: 'newField',
          definition: {
            type: 'string',
            metadata: { label: 'New Field', importance: 'low', weight: 0.3 }
          }
        }
      ];

      const migration = await migrationManager.createMigration({
        categoryId: 'test-category',
        fromVersion: '1.0.0',
        toVersion: '1.1.0',
        operations
      });

      expect(migration.id).toBeDefined();
      expect(migration.fromVersion).toBe('1.0.0');
      expect(migration.toVersion).toBe('1.1.0');
      expect(migration.operations).toHaveLength(1);
    });

    it('should validate migration operations', async () => {
      const migrationManager = new MigrationManager();
      
      // Test invalid category ID
      await expect(migrationManager.createMigration({
        categoryId: 'non-existent-category',
        fromVersion: '1.0.0',
        toVersion: '1.1.0',
        operations: []
      })).rejects.toThrow('Category not found');
    });
  });

  describe('Plugin System', () => {
    it('should register and use processors', async () => {
      const testProcessor = {
        id: 'test-processor',
        name: 'Test Processor',
        description: 'Test processor for unit tests',
        version: '1.0.0',
        supportedTypes: ['string'],
        async process(value: any) {
          return {
            success: true,
            processedValue: value.toUpperCase(),
            confidence: 0.9
          };
        }
      };

      pluginManager.registerPlugin({
        id: 'test-plugin',
        name: 'Test Plugin',
        description: 'Test plugin',
        version: '1.0.0',
        author: 'test',
        enabled: true,
        processors: [testProcessor]
      });

      const result = await pluginManager.processSpecification(
        'testField',
        'hello world',
        {
          type: 'string',
          metadata: { label: 'Test', importance: 'low', weight: 0.5 }
        },
        {
          categoryId: 'test-category',
          allSpecifications: {},
          sourceType: 'manual'
        }
      );

      expect(result.success).toBe(true);
      expect(result.processedValue).toBe('HELLO WORLD');
      expect(result.confidence).toBe(0.9);
    });

    it('should validate specifications', async () => {
      const testValidator = {
        id: 'test-validator',
        name: 'Test Validator',
        description: 'Test validator for unit tests',
        version: '1.0.0',
        supportedTypes: ['number'],
        async validate(value: any) {
          return {
            isValid: value > 0,
            errors: value <= 0 ? [{
              field: 'test',
              message: 'Value must be positive',
              severity: 'error' as const,
              code: 'POSITIVE_VALUE_REQUIRED'
            }] : []
          };
        }
      };

      pluginManager.registerPlugin({
        id: 'test-validator-plugin',
        name: 'Test Validator Plugin',
        description: 'Test validator plugin',
        version: '1.0.0',
        author: 'test',
        enabled: true,
        validators: [testValidator]
      });

      const validResult = await pluginManager.validateSpecification(
        'testField',
        5,
        {
          type: 'number',
          metadata: { label: 'Test', importance: 'low', weight: 0.5 }
        },
        {
          categoryId: 'test-category',
          allSpecifications: {},
          isUpdate: false
        }
      );

      expect(validResult.isValid).toBe(true);

      const invalidResult = await pluginManager.validateSpecification(
        'testField',
        -1,
        {
          type: 'number',
          metadata: { label: 'Test', importance: 'low', weight: 0.5 }
        },
        {
          categoryId: 'test-category',
          allSpecifications: {},
          isUpdate: false
        }
      );

      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toHaveLength(1);
    });
  });

  describe('Performance Monitor', () => {
    it('should generate optimization recommendations', async () => {
      const recommendations = await performanceMonitor.getOptimizationRecommendations();
      
      expect(Array.isArray(recommendations)).toBe(true);
      
      if (recommendations.length > 0) {
        const rec = recommendations[0];
        expect(rec.type).toBeDefined();
        expect(rec.priority).toBeDefined();
        expect(rec.title).toBeDefined();
        expect(rec.description).toBeDefined();
      }
    });

    it('should track query performance', async () => {
      // This should not throw
      await expect(performanceMonitor.trackQuery(
        'test-category',
        'search',
        150,
        true
      )).resolves.not.toThrow();
    });

    it('should provide system summary', async () => {
      const summary = await performanceMonitor.getSystemSummary();
      
      expect(summary.totalCategories).toBeTypeOf('number');
      expect(summary.avgQueryTime).toBeTypeOf('number');
      expect(summary.totalRecommendations).toBeTypeOf('number');
      expect(summary.criticalIssues).toBeTypeOf('number');
      expect(['good', 'warning', 'critical']).toContain(summary.systemHealth);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete category lifecycle', async () => {
      // 1. Create schema
      const schema: CategorySchema = {
        id: 'integration-test-category',
        name: 'Integration Test Category',
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
        createdBy: 'test'
      };

      await schemaRegistry.registerSchema(schema);

      // 2. Create migration
      const migrationManager = new MigrationManager();
      const migration = await migrationManager.createMigration({
        categoryId: 'integration-test-category',
        fromVersion: '1.0.0',
        toVersion: '1.1.0',
        operations: [{
          type: 'add_field',
          field: 'description',
          definition: {
            type: 'string',
            metadata: { label: 'Description', importance: 'low', weight: 0.3 }
          }
        }]
      });

      expect(migration.id).toBeDefined();

      // 3. Get performance metrics
      const metrics = await performanceMonitor.getCategoryMetrics('integration-test-category');
      expect(metrics.categoryId).toBe('integration-test-category');

      // 4. Process specification with plugins
      const result = await pluginManager.processSpecification(
        'name',
        'test device',
        schema.fields.name,
        {
          categoryId: 'integration-test-category',
          allSpecifications: {},
          sourceType: 'manual'
        }
      );

      expect(result.success).toBe(true);
    });
  });
});