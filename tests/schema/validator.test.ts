/**
 * Tests for the Schema Validator
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SchemaValidator } from '@/lib/schema/validator';
import { CategorySchema, DeviceSpecification, FieldDefinition } from '@/lib/schema/types';

describe('SchemaValidator', () => {
  let validator: SchemaValidator;

  beforeEach(() => {
    validator = new SchemaValidator();
  });

  describe('Schema Validation', () => {
    it('should validate a correct schema', () => {
      const schema: CategorySchema = {
        id: 'test-schema',
        name: 'Test Schema',
        version: '1.0.0',
        fields: {
          name: {
            type: 'string',
            constraints: { required: true, maxLength: 100 },
            metadata: {
              label: 'Name',
              description: 'Device name',
              importance: 'critical',
              weight: 1.0
            }
          },
          power: {
            type: 'number',
            constraints: { min: 0, max: 1000, unit: 'watts' },
            metadata: {
              label: 'Power',
              importance: 'medium',
              weight: 0.7
            }
          }
        },
        requiredFields: ['name'],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'test-user'
      };

      const result = validator.validateSchema(schema);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject schema with invalid field types', () => {
      const schema: CategorySchema = {
        id: 'test-schema',
        name: 'Test Schema',
        version: '1.0.0',
        fields: {
          invalidField: {
            type: 'invalid-type' as any,
            constraints: {},
            metadata: { label: 'Invalid', importance: 'low', weight: 0.1 }
          }
        },
        requiredFields: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'test-user'
      };

      const result = validator.validateSchema(schema);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('invalid type'))).toBe(true);
    });

    it('should reject schema with required field not in fields definition', () => {
      const schema: CategorySchema = {
        id: 'test-schema',
        name: 'Test Schema',
        version: '1.0.0',
        fields: {
          name: {
            type: 'string',
            constraints: {},
            metadata: { label: 'Name', importance: 'critical', weight: 1.0 }
          }
        },
        requiredFields: ['name', 'missingField'],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'test-user'
      };

      const result = validator.validateSchema(schema);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('missingField'))).toBe(true);
    });

    it('should validate enum field constraints', () => {
      const schema: CategorySchema = {
        id: 'test-schema',
        name: 'Test Schema',
        version: '1.0.0',
        fields: {
          status: {
            type: 'enum',
            constraints: { enum: ['active', 'inactive', 'pending'] },
            metadata: { label: 'Status', importance: 'medium', weight: 0.5 }
          }
        },
        requiredFields: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'test-user'
      };

      const result = validator.validateSchema(schema);
      expect(result.isValid).toBe(true);
    });

    it('should reject enum field without enum constraint', () => {
      const schema: CategorySchema = {
        id: 'test-schema',
        name: 'Test Schema',
        version: '1.0.0',
        fields: {
          status: {
            type: 'enum',
            constraints: {}, // Missing enum constraint
            metadata: { label: 'Status', importance: 'medium', weight: 0.5 }
          }
        },
        requiredFields: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'test-user'
      };

      const result = validator.validateSchema(schema);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('enum constraint'))).toBe(true);
    });
  });

  describe('Specification Validation', () => {
    const testSchema: CategorySchema = {
      id: 'test-schema',
      name: 'Test Schema',
      version: '1.0.0',
      fields: {
        name: {
          type: 'string',
          constraints: { required: true, minLength: 1, maxLength: 100 },
          metadata: { label: 'Name', importance: 'critical', weight: 1.0 }
        },
        power: {
          type: 'number',
          constraints: { min: 0, max: 1000 },
          metadata: { label: 'Power', importance: 'medium', weight: 0.7 }
        },
        status: {
          type: 'enum',
          constraints: { enum: ['active', 'inactive'] },
          metadata: { label: 'Status', importance: 'low', weight: 0.3 }
        },
        features: {
          type: 'array',
          constraints: {},
          metadata: { label: 'Features', importance: 'medium', weight: 0.5 }
        }
      },
      requiredFields: ['name'],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'test-user'
    };

    it('should validate correct specification', () => {
      const specification: DeviceSpecification = {
        deviceId: 'device-1',
        categoryId: 'test-schema',
        schemaVersion: '1.0.0',
        specifications: {
          name: 'Test Device',
          power: 100,
          status: 'active',
          features: ['feature1', 'feature2']
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = validator.validateSpecification(specification, testSchema);
      expect(result.isValid).toBe(true);
      expect(result.fieldErrors.filter(e => e.severity === 'error')).toHaveLength(0);
    });

    it('should reject specification missing required fields', () => {
      const specification: DeviceSpecification = {
        deviceId: 'device-1',
        categoryId: 'test-schema',
        schemaVersion: '1.0.0',
        specifications: {
          power: 100
          // Missing required 'name' field
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = validator.validateSpecification(specification, testSchema);
      expect(result.isValid).toBe(false);
      expect(result.fieldErrors.some(e => 
        e.field === 'name' && e.code === 'REQUIRED_FIELD_MISSING'
      )).toBe(true);
    });

    it('should validate string constraints', () => {
      const specification: DeviceSpecification = {
        deviceId: 'device-1',
        categoryId: 'test-schema',
        schemaVersion: '1.0.0',
        specifications: {
          name: 'A'.repeat(150), // Exceeds maxLength of 100
          power: 100
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = validator.validateSpecification(specification, testSchema);
      expect(result.isValid).toBe(false);
      expect(result.fieldErrors.some(e => 
        e.field === 'name' && e.code === 'MAX_LENGTH_VIOLATION'
      )).toBe(true);
    });

    it('should validate number constraints', () => {
      const specification: DeviceSpecification = {
        deviceId: 'device-1',
        categoryId: 'test-schema',
        schemaVersion: '1.0.0',
        specifications: {
          name: 'Test Device',
          power: -50 // Below minimum of 0
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = validator.validateSpecification(specification, testSchema);
      expect(result.isValid).toBe(false);
      expect(result.fieldErrors.some(e => 
        e.field === 'power' && e.code === 'MIN_VALUE_VIOLATION'
      )).toBe(true);
    });

    it('should validate enum constraints', () => {
      const specification: DeviceSpecification = {
        deviceId: 'device-1',
        categoryId: 'test-schema',
        schemaVersion: '1.0.0',
        specifications: {
          name: 'Test Device',
          status: 'invalid-status' // Not in enum values
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = validator.validateSpecification(specification, testSchema);
      expect(result.isValid).toBe(false);
      expect(result.fieldErrors.some(e => 
        e.field === 'status' && e.code === 'ENUM_VIOLATION'
      )).toBe(true);
    });

    it('should validate type mismatches', () => {
      const specification: DeviceSpecification = {
        deviceId: 'device-1',
        categoryId: 'test-schema',
        schemaVersion: '1.0.0',
        specifications: {
          name: 'Test Device',
          power: 'not-a-number', // Should be number
          features: 'not-an-array' // Should be array
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = validator.validateSpecification(specification, testSchema);
      expect(result.isValid).toBe(false);
      expect(result.fieldErrors.some(e => 
        e.field === 'power' && e.code === 'INVALID_TYPE'
      )).toBe(true);
      expect(result.fieldErrors.some(e => 
        e.field === 'features' && e.code === 'INVALID_TYPE'
      )).toBe(true);
    });

    it('should warn about undefined fields', () => {
      const specification: DeviceSpecification = {
        deviceId: 'device-1',
        categoryId: 'test-schema',
        schemaVersion: '1.0.0',
        specifications: {
          name: 'Test Device',
          undefinedField: 'some value' // Not defined in schema
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = validator.validateSpecification(specification, testSchema);
      expect(result.fieldErrors.some(e => 
        e.field === 'undefinedField' && e.code === 'UNDEFINED_FIELD' && e.severity === 'warning'
      )).toBe(true);
    });
  });

  describe('Field Type Validation', () => {
    it('should validate URL fields', () => {
      const fieldDef: FieldDefinition = {
        type: 'url',
        constraints: {},
        metadata: { label: 'Website', importance: 'low', weight: 0.2 }
      };

      const validUrl = validator['validateFieldType']('website', 'https://example.com', 'url');
      const invalidUrl = validator['validateFieldType']('website', 'not-a-url', 'url');

      expect(validUrl).toHaveLength(0);
      expect(invalidUrl).toHaveLength(1);
      expect(invalidUrl[0].code).toBe('INVALID_FORMAT');
    });

    it('should validate email fields', () => {
      const validEmail = validator['validateFieldType']('email', 'test@example.com', 'email');
      const invalidEmail = validator['validateFieldType']('email', 'not-an-email', 'email');

      expect(validEmail).toHaveLength(0);
      expect(invalidEmail).toHaveLength(1);
      expect(invalidEmail[0].code).toBe('INVALID_FORMAT');
    });

    it('should validate date fields', () => {
      const validDate1 = validator['validateFieldType']('date', new Date(), 'date');
      const validDate2 = validator['validateFieldType']('date', '2023-12-01', 'date');
      const invalidDate = validator['validateFieldType']('date', 'not-a-date', 'date');

      expect(validDate1).toHaveLength(0);
      expect(validDate2).toHaveLength(0);
      expect(invalidDate).toHaveLength(1);
      expect(invalidDate[0].code).toBe('INVALID_TYPE');
    });
  });

  describe('Pattern Validation', () => {
    it('should validate regex patterns', () => {
      const specification: DeviceSpecification = {
        deviceId: 'device-1',
        categoryId: 'test-schema',
        schemaVersion: '1.0.0',
        specifications: {
          name: 'Test Device',
          serialNumber: 'ABC123' // Should match pattern
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

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
          serialNumber: {
            type: 'string',
            constraints: { pattern: '^[A-Z]{3}[0-9]{3}$' },
            metadata: { label: 'Serial Number', importance: 'medium', weight: 0.6 }
          }
        },
        requiredFields: ['name'],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'test-user'
      };

      const result = validator.validateSpecification(specification, schema);
      expect(result.isValid).toBe(true);

      // Test invalid pattern
      specification.specifications.serialNumber = 'invalid';
      const invalidResult = validator.validateSpecification(specification, schema);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.fieldErrors.some(e => 
        e.field === 'serialNumber' && e.code === 'PATTERN_VIOLATION'
      )).toBe(true);
    });
  });
});