/**
 * Tests for the Category Template Manager
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CategoryTemplateManager } from '@/lib/schema/templates';
import { CategoryTemplate } from '@/lib/schema/types';

describe('CategoryTemplateManager', () => {
  let templateManager: CategoryTemplateManager;

  beforeEach(() => {
    templateManager = new CategoryTemplateManager();
  });

  describe('Built-in Templates', () => {
    it('should have gaming console template', () => {
      const template = templateManager.getTemplate('gaming-console');
      
      expect(template).toBeDefined();
      expect(template!.name).toBe('Gaming Console');
      expect(template!.baseSchema.fields).toHaveProperty('generation');
      expect(template!.baseSchema.fields).toHaveProperty('maxResolution');
      expect(template!.baseSchema.requiredFields).toContain('name');
      expect(template!.baseSchema.requiredFields).toContain('brand');
      expect(template!.tags).toContain('gaming');
    });

    it('should have monitor display template', () => {
      const template = templateManager.getTemplate('monitor-display');
      
      expect(template).toBeDefined();
      expect(template!.name).toBe('Monitor/Display');
      expect(template!.baseSchema.fields).toHaveProperty('screenSize');
      expect(template!.baseSchema.fields).toHaveProperty('resolution');
      expect(template!.baseSchema.fields).toHaveProperty('refreshRate');
      expect(template!.tags).toContain('display');
    });

    it('should have audio device template', () => {
      const template = templateManager.getTemplate('audio-device');
      
      expect(template).toBeDefined();
      expect(template!.name).toBe('Audio Device');
      expect(template!.baseSchema.fields).toHaveProperty('driverSize');
      expect(template!.baseSchema.fields).toHaveProperty('impedance');
      expect(template!.baseSchema.fields).toHaveProperty('connectionType');
      expect(template!.tags).toContain('audio');
    });

    it('should have cable connector template', () => {
      const template = templateManager.getTemplate('cable-connector');
      
      expect(template).toBeDefined();
      expect(template!.name).toBe('Cable/Connector');
      expect(template!.baseSchema.fields).toHaveProperty('connectorA');
      expect(template!.baseSchema.fields).toHaveProperty('connectorB');
      expect(template!.baseSchema.fields).toHaveProperty('cableLength');
      expect(template!.tags).toContain('cable');
    });

    it('should have smartphone template', () => {
      const template = templateManager.getTemplate('smartphone');
      
      expect(template).toBeDefined();
      expect(template!.name).toBe('Smartphone');
      expect(template!.baseSchema.fields).toHaveProperty('operatingSystem');
      expect(template!.baseSchema.fields).toHaveProperty('batteryCapacity');
      expect(template!.baseSchema.fields).toHaveProperty('chargingPorts');
      expect(template!.tags).toContain('mobile');
    });

    it('should have laptop template', () => {
      const template = templateManager.getTemplate('laptop');
      
      expect(template).toBeDefined();
      expect(template!.name).toBe('Laptop Computer');
      expect(template!.baseSchema.fields).toHaveProperty('processor');
      expect(template!.baseSchema.fields).toHaveProperty('memory');
      expect(template!.baseSchema.fields).toHaveProperty('storage');
      expect(template!.tags).toContain('computer');
    });
  });

  describe('Template Management', () => {
    it('should register new templates', () => {
      const customTemplate: CategoryTemplate = {
        id: 'custom-template',
        name: 'Custom Template',
        description: 'A custom template for testing',
        baseSchema: {
          fields: {
            customField: {
              type: 'string',
              constraints: { required: true },
              metadata: { label: 'Custom Field', importance: 'high', weight: 0.8 }
            }
          },
          requiredFields: ['customField']
        },
        tags: ['custom', 'test'],
        popularity: 10
      };

      templateManager.registerTemplate(customTemplate);

      const retrieved = templateManager.getTemplate('custom-template');
      expect(retrieved).toEqual(customTemplate);
    });

    it('should return all templates', () => {
      const allTemplates = templateManager.getAllTemplates();
      
      expect(allTemplates.length).toBeGreaterThan(0);
      expect(allTemplates.some(t => t.id === 'gaming-console')).toBe(true);
      expect(allTemplates.some(t => t.id === 'monitor-display')).toBe(true);
      expect(allTemplates.some(t => t.id === 'audio-device')).toBe(true);
    });

    it('should return null for non-existent template', () => {
      const template = templateManager.getTemplate('non-existent');
      expect(template).toBeNull();
    });
  });

  describe('Template Search', () => {
    it('should search templates by name', () => {
      const results = templateManager.searchTemplates('gaming');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(t => t.id === 'gaming-console')).toBe(true);
    });

    it('should search templates by description', () => {
      const results = templateManager.searchTemplates('monitor');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(t => t.id === 'monitor-display')).toBe(true);
    });

    it('should search templates by tags', () => {
      const results = templateManager.searchTemplates('', ['audio']);
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(t => t.id === 'audio-device')).toBe(true);
      expect(results.every(t => t.tags?.includes('audio'))).toBe(true);
    });

    it('should combine query and tag filters', () => {
      const results = templateManager.searchTemplates('device', ['audio']);
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(t => t.id === 'audio-device')).toBe(true);
    });

    it('should return empty array for no matches', () => {
      const results = templateManager.searchTemplates('nonexistent-query');
      expect(results).toHaveLength(0);
    });

    it('should return all templates for empty query and no tags', () => {
      const results = templateManager.searchTemplates('');
      const allTemplates = templateManager.getAllTemplates();
      
      expect(results.length).toBe(allTemplates.length);
    });
  });

  describe('Template Field Validation', () => {
    it('should have valid field definitions in gaming console template', () => {
      const template = templateManager.getTemplate('gaming-console');
      const fields = template!.baseSchema.fields!;

      // Check generation field
      expect(fields.generation.type).toBe('string');
      expect(fields.generation.constraints?.required).toBe(true);
      expect(fields.generation.metadata.importance).toBe('high');

      // Check maxResolution field
      expect(fields.maxResolution.type).toBe('enum');
      expect(fields.maxResolution.constraints?.enum).toContain('4K');
      expect(fields.maxResolution.metadata.importance).toBe('high');
    });

    it('should have valid field definitions in monitor template', () => {
      const template = templateManager.getTemplate('monitor-display');
      const fields = template!.baseSchema.fields!;

      // Check screenSize field
      expect(fields.screenSize.type).toBe('number');
      expect(fields.screenSize.constraints?.min).toBe(1);
      expect(fields.screenSize.constraints?.max).toBe(200);
      expect(fields.screenSize.constraints?.unit).toBe('inches');

      // Check panelType field
      expect(fields.panelType.type).toBe('enum');
      expect(fields.panelType.constraints?.enum).toContain('OLED');
      expect(fields.panelType.constraints?.enum).toContain('IPS');
    });

    it('should have valid field definitions in audio template', () => {
      const template = templateManager.getTemplate('audio-device');
      const fields = template!.baseSchema.fields!;

      // Check impedance field
      expect(fields.impedance.type).toBe('number');
      expect(fields.impedance.constraints?.min).toBe(1);
      expect(fields.impedance.constraints?.max).toBe(1000);
      expect(fields.impedance.constraints?.unit).toBe('ohms');

      // Check connectionType field
      expect(fields.connectionType.type).toBe('enum');
      expect(fields.connectionType.constraints?.enum).toContain('3.5mm');
      expect(fields.connectionType.constraints?.enum).toContain('Bluetooth');
    });
  });

  describe('Template Compatibility Rules', () => {
    it('should have compatibility rules in gaming console template', () => {
      const template = templateManager.getTemplate('gaming-console');
      const compatibilityRules = template!.baseSchema.compatibilityRules;

      expect(compatibilityRules).toBeDefined();
      expect(compatibilityRules!.length).toBeGreaterThan(0);
      
      const resolutionRule = compatibilityRules!.find(r => r.id === 'console-tv-resolution');
      expect(resolutionRule).toBeDefined();
      expect(resolutionRule!.sourceField).toBe('maxResolution');
      expect(resolutionRule!.targetField).toBe('maxResolution');
    });

    it('should have compatibility rules in audio template', () => {
      const template = templateManager.getTemplate('audio-device');
      const compatibilityRules = template!.baseSchema.compatibilityRules;

      expect(compatibilityRules).toBeDefined();
      expect(compatibilityRules!.length).toBeGreaterThan(0);
      
      const impedanceRule = compatibilityRules!.find(r => r.id === 'audio-impedance-power');
      expect(impedanceRule).toBeDefined();
      expect(impedanceRule!.sourceField).toBe('impedance');
      expect(impedanceRule!.targetField).toBe('maxImpedance');
    });

    it('should have compatibility rules in cable template', () => {
      const template = templateManager.getTemplate('cable-connector');
      const compatibilityRules = template!.baseSchema.compatibilityRules;

      expect(compatibilityRules).toBeDefined();
      expect(compatibilityRules!.length).toBeGreaterThan(0);
      
      const connectorRule = compatibilityRules!.find(r => r.id === 'cable-connector-match');
      expect(connectorRule).toBeDefined();
      expect(connectorRule!.sourceField).toBe('connectorA');
      expect(connectorRule!.targetField).toBe('inputPorts');
    });
  });

  describe('Base Device Fields', () => {
    it('should include base fields in all templates', () => {
      const templates = templateManager.getAllTemplates();

      for (const template of templates) {
        const fields = template.baseSchema.fields!;
        
        // All templates should have base fields
        expect(fields).toHaveProperty('name');
        expect(fields).toHaveProperty('brand');
        expect(fields).toHaveProperty('model');
        
        // Check field properties
        expect(fields.name.type).toBe('string');
        expect(fields.name.constraints?.required).toBe(true);
        expect(fields.name.metadata.importance).toBe('critical');
        
        expect(fields.brand.type).toBe('string');
        expect(fields.brand.constraints?.required).toBe(true);
        expect(fields.brand.metadata.importance).toBe('high');
      }
    });

    it('should have consistent base field definitions', () => {
      const template1 = templateManager.getTemplate('gaming-console');
      const template2 = templateManager.getTemplate('monitor-display');

      const fields1 = template1!.baseSchema.fields!;
      const fields2 = template2!.baseSchema.fields!;

      // Base fields should be identical across templates
      expect(JSON.stringify(fields1.name)).toBe(JSON.stringify(fields2.name));
      expect(JSON.stringify(fields1.brand)).toBe(JSON.stringify(fields2.brand));
      expect(JSON.stringify(fields1.model)).toBe(JSON.stringify(fields2.model));
    });
  });

  describe('Template Popularity', () => {
    it('should have popularity scores for templates', () => {
      const templates = templateManager.getAllTemplates();

      for (const template of templates) {
        expect(typeof template.popularity).toBe('number');
        expect(template.popularity).toBeGreaterThanOrEqual(0);
      }
    });

    it('should have high popularity for common templates', () => {
      const gamingTemplate = templateManager.getTemplate('gaming-console');
      const smartphoneTemplate = templateManager.getTemplate('smartphone');
      const laptopTemplate = templateManager.getTemplate('laptop');

      expect(gamingTemplate!.popularity).toBeGreaterThanOrEqual(90);
      expect(smartphoneTemplate!.popularity).toBeGreaterThanOrEqual(90);
      expect(laptopTemplate!.popularity).toBeGreaterThanOrEqual(90);
    });
  });
});