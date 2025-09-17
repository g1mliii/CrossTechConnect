/**
 * Tests for the Compatibility Engine
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CompatibilityEngine } from '@/lib/schema/compatibility';
import { DeviceSpecification, CategorySchema } from '@/lib/schema/types';

// Mock the schema registry
vi.mock('@/lib/schema/registry', () => ({
  schemaRegistry: {
    getSchema: vi.fn().mockReturnValue(null)
  }
}));

describe('CompatibilityEngine', () => {
  let engine: CompatibilityEngine;

  beforeEach(() => {
    engine = new CompatibilityEngine();
  });

  describe('Field Compatibility', () => {
    it('should detect full compatibility for exact matches', () => {
      const result = engine['compareFieldValues'](
        'resolution',
        '1920x1080',
        '1920x1080',
        {
          type: 'string',
          constraints: {},
          metadata: { label: 'Resolution', importance: 'high', weight: 0.9 }
        },
        {
          type: 'string',
          constraints: {},
          metadata: { label: 'Resolution', importance: 'high', weight: 0.9 }
        }
      );

      expect(result.compatible).toBe('full');
      expect(result.weight).toBe(0.9);
      expect(result.message).toContain('match exactly');
    });

    it('should handle numeric value compatibility with tolerance', () => {
      const result = engine['compareNumericValues'](
        'power',
        100,
        105, // 5% difference, within tolerance
        {
          type: 'number',
          constraints: {},
          metadata: { label: 'Power', importance: 'medium', weight: 0.7 }
        },
        0.7
      );

      expect(result.compatible).toBe('full');
      expect(result.weight).toBe(0.7);
    });

    it('should detect partial compatibility for minor numeric differences', () => {
      const result = engine['compareNumericValues'](
        'power',
        100,
        115, // 15% difference, partial compatibility
        {
          type: 'number',
          constraints: {},
          metadata: { label: 'Power', importance: 'medium', weight: 0.7 }
        },
        0.7
      );

      expect(result.compatible).toBe('partial');
      expect(result.message).toContain('minor difference');
    });

    it('should detect incompatibility for major numeric differences', () => {
      const result = engine['compareNumericValues'](
        'power',
        100,
        200, // 100% difference, incompatible
        {
          type: 'number',
          constraints: {},
          metadata: { label: 'Power', importance: 'medium', weight: 0.7 }
        },
        0.7
      );

      expect(result.compatible).toBe('none');
      expect(result.message).toContain('differ significantly');
    });

    it('should handle string partial matches', () => {
      const result = engine['compareStringValues'](
        'connector',
        'USB-C',
        'usb-c', // Case difference
        {
          type: 'string',
          constraints: {},
          metadata: { label: 'Connector', importance: 'high', weight: 0.8 }
        },
        0.8
      );

      expect(result.compatible).toBe('full');
      expect(result.message).toContain('case-insensitive');
    });

    it('should handle array overlap compatibility', () => {
      const result = engine['compareArrayValues'](
        'features',
        ['feature1', 'feature2', 'feature3'],
        ['feature2', 'feature3', 'feature4'], // 2/4 overlap = 50%
        {
          type: 'array',
          constraints: {},
          metadata: { label: 'Features', importance: 'medium', weight: 0.6 }
        },
        0.6
      );

      expect(result.compatible).toBe('partial');
      expect(result.message).toContain('partial overlap');
    });

    it('should handle enum adjacency', () => {
      const result = engine['compareEnumValues'](
        'quality',
        'medium',
        'high',
        {
          type: 'enum',
          constraints: { enum: ['low', 'medium', 'high', 'ultra'] },
          metadata: { label: 'Quality', importance: 'medium', weight: 0.5 }
        },
        0.5
      );

      expect(result.compatible).toBe('partial');
      expect(result.message).toContain('adjacent in enum');
    });
  });

  describe('Rule Processors', () => {
    it('should process power compatibility rules correctly', async () => {
      const powerProcessor = engine['ruleProcessors'].get('power_compatibility');
      expect(powerProcessor).toBeDefined();

      const rule = {
        id: 'power-test',
        name: 'power_compatibility',
        description: 'Test power compatibility',
        sourceField: 'powerRequirement',
        targetField: 'powerOutput',
        condition: 'source <= target',
        compatibilityType: 'full' as const,
        message: 'Power is sufficient'
      };

      const context = {
        sourceDevice: {
          deviceId: 'device1',
          categoryId: 'category1',
          schemaVersion: '1.0.0',
          specifications: { powerRequirement: 100 },
          createdAt: new Date(),
          updatedAt: new Date()
        },
        targetDevice: {
          deviceId: 'device2',
          categoryId: 'category2',
          schemaVersion: '1.0.0',
          specifications: { powerOutput: 120 },
          createdAt: new Date(),
          updatedAt: new Date()
        },
        sourceSchema: {} as CategorySchema,
        targetSchema: {} as CategorySchema
      };

      const result = await powerProcessor!.process(rule, context);

      expect(result.compatible).toBe('full');
      expect(result.confidence).toBeGreaterThan(0.9);
      expect(result.limitations).toHaveLength(0);
    });

    it('should handle insufficient power scenarios', async () => {
      const powerProcessor = engine['ruleProcessors'].get('power_compatibility');
      
      const rule = {
        id: 'power-test',
        name: 'power_compatibility',
        description: 'Test power compatibility',
        sourceField: 'powerRequirement',
        targetField: 'powerOutput',
        condition: 'source <= target',
        compatibilityType: 'full' as const,
        message: 'Power is sufficient'
      };

      const context = {
        sourceDevice: {
          deviceId: 'device1',
          categoryId: 'category1',
          schemaVersion: '1.0.0',
          specifications: { powerRequirement: 150 },
          createdAt: new Date(),
          updatedAt: new Date()
        },
        targetDevice: {
          deviceId: 'device2',
          categoryId: 'category2',
          schemaVersion: '1.0.0',
          specifications: { powerOutput: 100 }, // Insufficient
          createdAt: new Date(),
          updatedAt: new Date()
        },
        sourceSchema: {} as CategorySchema,
        targetSchema: {} as CategorySchema
      };

      const result = await powerProcessor!.process(rule, context);

      expect(result.compatible).toBe('none');
      expect(result.limitations.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Compatibility Details Generation', () => {
    it('should generate comprehensive compatibility details', () => {
      const result = {
        compatible: 'partial' as const,
        confidence: 0.75,
        details: '',
        limitations: ['Limited power delivery', 'Resolution mismatch'],
        recommendations: ['Use higher wattage adapter', 'Check display settings'],
        matchedRules: ['power-rule', 'display-rule'],
        fieldCompatibility: {}
      };

      const context = {
        sourceDevice: {
          deviceId: 'device1',
          categoryId: 'category1',
          schemaVersion: '1.0.0',
          specifications: { name: 'Source Device' },
          createdAt: new Date(),
          updatedAt: new Date()
        },
        targetDevice: {
          deviceId: 'device2',
          categoryId: 'category2',
          schemaVersion: '1.0.0',
          specifications: { name: 'Target Device' },
          createdAt: new Date(),
          updatedAt: new Date()
        },
        sourceSchema: {} as CategorySchema,
        targetSchema: {} as CategorySchema
      };

      const details = engine['generateCompatibilityDetails'](result, context);

      expect(details).toContain('Source Device');
      expect(details).toContain('Target Device');
      expect(details).toContain('PARTIAL');
      expect(details).toContain('75%');
      expect(details).toContain('Limitations:');
      expect(details).toContain('Limited power delivery');
      expect(details).toContain('Recommendations:');
      expect(details).toContain('Use higher wattage adapter');
    });
  });

  describe('Rule Applicability', () => {
    it('should correctly identify applicable rules', () => {
      const rule = {
        id: 'test-rule',
        name: 'test_rule',
        description: 'Test rule',
        sourceField: 'power',
        targetField: 'maxPower',
        condition: 'source <= target',
        compatibilityType: 'full' as const,
        message: 'Compatible'
      };

      const context = {
        sourceDevice: {
          deviceId: 'device1',
          categoryId: 'category1',
          schemaVersion: '1.0.0',
          specifications: { power: 100 }, // Has source field
          createdAt: new Date(),
          updatedAt: new Date()
        },
        targetDevice: {
          deviceId: 'device2',
          categoryId: 'category2',
          schemaVersion: '1.0.0',
          specifications: { maxPower: 150 }, // Has target field
          createdAt: new Date(),
          updatedAt: new Date()
        },
        sourceSchema: {} as CategorySchema,
        targetSchema: {} as CategorySchema
      };

      const isApplicable = engine['isRuleApplicable'](rule, context);
      expect(isApplicable).toBe(true);

      // Test with missing field
      const contextWithoutField = {
        ...context,
        targetDevice: {
          ...context.targetDevice,
          specifications: { ...context.targetDevice.specifications }
        }
      };
      delete (contextWithoutField.targetDevice.specifications as any).maxPower;
      const isNotApplicable = engine['isRuleApplicable'](rule, contextWithoutField);
      expect(isNotApplicable).toBe(false);
    });
  });

  describe('Custom Rule Processors', () => {
    it('should allow registration of custom rule processors', () => {
      const customProcessor = {
        async process(_rule: any, _context: any) {
          return {
            compatible: 'full' as const,
            confidence: 1.0,
            limitations: [],
            recommendations: []
          };
        }
      };

      engine.registerRuleProcessor('custom_rule', customProcessor);

      const registeredProcessor = engine['ruleProcessors'].get('custom_rule');
      expect(registeredProcessor).toBe(customProcessor);
    });
  });
});