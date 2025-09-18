/**
 * Plugin System - Extensible system for custom specification processors and validators
 */

import { FieldDefinition, ValidationError, DeviceSpecification } from './types';

// Plugin interfaces
export interface SpecificationProcessor {
  id: string;
  name: string;
  description: string;
  version: string;
  supportedTypes: string[];
  process(value: any, field: FieldDefinition, context: ProcessingContext): Promise<ProcessingResult>;
}

export interface SpecificationValidator {
  id: string;
  name: string;
  description: string;
  version: string;
  supportedTypes: string[];
  validate(value: any, field: FieldDefinition, context: ValidationContext): Promise<ValidationResult>;
}

export interface ProcessingContext {
  deviceId?: string;
  categoryId: string;
  allSpecifications: Record<string, any>;
  sourceType: 'manual' | 'ai_extraction' | 'import';
  confidence?: number;
}

export interface ValidationContext {
  deviceId?: string;
  categoryId: string;
  allSpecifications: Record<string, any>;
  isUpdate: boolean;
}

export interface ProcessingResult {
  success: boolean;
  processedValue?: any;
  confidence?: number;
  metadata?: Record<string, any>;
  errors?: string[];
  warnings?: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors?: ValidationError[];
  warnings?: ValidationError[];
  suggestions?: string[];
}

export interface Plugin {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  enabled: boolean;
  processors?: SpecificationProcessor[];
  validators?: SpecificationValidator[];
  hooks?: PluginHook[];
}

export interface PluginHook {
  event: 'before_save' | 'after_save' | 'before_validate' | 'after_validate';
  handler: (data: any, context: any) => Promise<any>;
}

export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private processors: Map<string, SpecificationProcessor> = new Map();
  private validators: Map<string, SpecificationValidator> = new Map();
  private hooks: Map<string, PluginHook[]> = new Map();

  constructor() {
    this.initializeBuiltInPlugins();
  }

  /**
   * Register a plugin
   */
  registerPlugin(plugin: Plugin): void {
    this.plugins.set(plugin.id, plugin);

    // Register processors
    if (plugin.processors) {
      plugin.processors.forEach(processor => {
        this.processors.set(processor.id, processor);
      });
    }

    // Register validators
    if (plugin.validators) {
      plugin.validators.forEach(validator => {
        this.validators.set(validator.id, validator);
      });
    }

    // Register hooks
    if (plugin.hooks) {
      plugin.hooks.forEach(hook => {
        const eventHooks = this.hooks.get(hook.event) || [];
        eventHooks.push(hook);
        this.hooks.set(hook.event, eventHooks);
      });
    }

    console.log(`✅ Registered plugin: ${plugin.name} v${plugin.version}`);
  }

  /**
   * Unregister a plugin
   */
  unregisterPlugin(pluginId: string): void {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return;

    // Remove processors
    if (plugin.processors) {
      plugin.processors.forEach(processor => {
        this.processors.delete(processor.id);
      });
    }

    // Remove validators
    if (plugin.validators) {
      plugin.validators.forEach(validator => {
        this.validators.delete(validator.id);
      });
    }

    // Remove hooks
    if (plugin.hooks) {
      plugin.hooks.forEach(hook => {
        const eventHooks = this.hooks.get(hook.event) || [];
        const filtered = eventHooks.filter(h => h !== hook);
        this.hooks.set(hook.event, filtered);
      });
    }

    this.plugins.delete(pluginId);
    console.log(`🗑️ Unregistered plugin: ${plugin.name}`);
  }

  /**
   * Process a specification value using registered processors
   */
  async processSpecification(
    fieldName: string,
    value: any,
    field: FieldDefinition,
    context: ProcessingContext
  ): Promise<ProcessingResult> {
    const applicableProcessors = Array.from(this.processors.values())
      .filter(p => p.supportedTypes.includes(field.type) || p.supportedTypes.includes('*'));

    if (applicableProcessors.length === 0) {
      return {
        success: true,
        processedValue: value,
        confidence: context.confidence || 1.0
      };
    }

    let result: ProcessingResult = {
      success: true,
      processedValue: value,
      confidence: context.confidence || 1.0
    };

    // Apply processors in sequence
    for (const processor of applicableProcessors) {
      try {
        const processorResult = await processor.process(result.processedValue, field, context);
        
        if (!processorResult.success) {
          result.success = false;
          result.errors = [...(result.errors || []), ...(processorResult.errors || [])];
        } else {
          result.processedValue = processorResult.processedValue;
          result.confidence = Math.min(result.confidence || 1, processorResult.confidence || 1);
          result.metadata = { ...result.metadata, ...processorResult.metadata };
        }

        result.warnings = [...(result.warnings || []), ...(processorResult.warnings || [])];
      } catch (error) {
        console.error(`Processor ${processor.id} failed:`, error);
        result.errors = [...(result.errors || []), `Processor ${processor.id} failed`];
      }
    }

    return result;
  }

  /**
   * Validate a specification value using registered validators
   */
  async validateSpecification(
    fieldName: string,
    value: any,
    field: FieldDefinition,
    context: ValidationContext
  ): Promise<ValidationResult> {
    const applicableValidators = Array.from(this.validators.values())
      .filter(v => v.supportedTypes.includes(field.type) || v.supportedTypes.includes('*'));

    let result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    // Apply validators
    for (const validator of applicableValidators) {
      try {
        const validationResult = await validator.validate(value, field, context);
        
        if (!validationResult.isValid) {
          result.isValid = false;
        }

        result.errors = [...(result.errors || []), ...(validationResult.errors || [])];
        result.warnings = [...(result.warnings || []), ...(validationResult.warnings || [])];
        result.suggestions = [...(result.suggestions || []), ...(validationResult.suggestions || [])];
      } catch (error) {
        console.error(`Validator ${validator.id} failed:`, error);
        result.errors = [...(result.errors || []), {
          field: fieldName,
          message: `Validator ${validator.id} failed`,
          severity: 'error' as const,
          code: 'VALIDATOR_ERROR'
        }];
      }
    }

    return result;
  }

  /**
   * Execute hooks for an event
   */
  async executeHooks(event: string, data: any, context: any): Promise<any> {
    const eventHooks = this.hooks.get(event) || [];
    let result = data;

    for (const hook of eventHooks) {
      try {
        result = await hook.handler(result, context);
      } catch (error) {
        console.error(`Hook execution failed for event ${event}:`, error);
      }
    }

    return result;
  }

  /**
   * Get all registered plugins
   */
  getPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get plugin by ID
   */
  getPlugin(id: string): Plugin | undefined {
    return this.plugins.get(id);
  }

  /**
   * Enable/disable a plugin
   */
  setPluginEnabled(pluginId: string, enabled: boolean): void {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      plugin.enabled = enabled;
      console.log(`${enabled ? '✅' : '❌'} Plugin ${plugin.name} ${enabled ? 'enabled' : 'disabled'}`);
    }
  }

  /**
   * Initialize built-in plugins
   */
  private initializeBuiltInPlugins(): void {
    // Unit Converter Plugin
    this.registerPlugin({
      id: 'unit-converter',
      name: 'Unit Converter',
      description: 'Converts and normalizes units to standard formats',
      version: '1.0.0',
      author: 'System',
      enabled: true,
      processors: [{
        id: 'unit-converter-processor',
        name: 'Unit Converter Processor',
        description: 'Converts units to standard formats',
        version: '1.0.0',
        supportedTypes: ['number'],
        async process(value: any, field: FieldDefinition, context: ProcessingContext): Promise<ProcessingResult> {
          if (typeof value !== 'number' || !field.constraints?.unit) {
            return { success: true, processedValue: value };
          }

          // Convert common units to standard formats
          const unit = field.constraints.unit.toLowerCase();
          let convertedValue = value;
          let confidence = 1.0;

          const getStandardUnit = (unit: string): string => {
            const unitMap: Record<string, string> = {
              'inches': 'cm',
              'feet': 'cm',
              'lbs': 'kg',
              'oz': 'kg'
            };
            return unitMap[unit.toLowerCase()] || unit;
          };

          switch (unit) {
            case 'inches':
              convertedValue = value * 2.54; // Convert to cm
              break;
            case 'feet':
              convertedValue = value * 30.48; // Convert to cm
              break;
            case 'lbs':
              convertedValue = value * 0.453592; // Convert to kg
              break;
            case 'oz':
              convertedValue = value * 0.0283495; // Convert to kg
              break;
          }

          return {
            success: true,
            processedValue: convertedValue,
            confidence,
            metadata: {
              originalValue: value,
              originalUnit: field.constraints.unit,
              convertedUnit: getStandardUnit(unit)
            }
          };
        }
      }],
      validators: [{
        id: 'range-validator',
        name: 'Range Validator',
        description: 'Validates numeric values are within acceptable ranges',
        version: '1.0.0',
        supportedTypes: ['number'],
        async validate(value: any, field: FieldDefinition, context: ValidationContext): Promise<ValidationResult> {
          if (typeof value !== 'number') {
            return { isValid: true };
          }

          const errors: ValidationError[] = [];
          const warnings: ValidationError[] = [];

          if (field.constraints?.min !== undefined && value < field.constraints.min) {
            errors.push({
              field: field.metadata.label,
              message: `Value ${value} is below minimum ${field.constraints.min}`,
              severity: 'error',
              code: 'MIN_VALUE_ERROR',
              value
            });
          }

          if (field.constraints?.max !== undefined && value > field.constraints.max) {
            errors.push({
              field: field.metadata.label,
              message: `Value ${value} is above maximum ${field.constraints.max}`,
              severity: 'error',
              code: 'MAX_VALUE_ERROR',
              value
            });
          }

          // Add warnings for suspicious values
          if (field.constraints?.unit === 'cm' && value > 1000) {
            warnings.push({
              field: field.metadata.label,
              message: `Value ${value}cm seems unusually large for a device dimension`,
              severity: 'warning',
              code: 'SUSPICIOUS_VALUE',
              value
            });
          }

          return {
            isValid: errors.length === 0,
            errors,
            warnings
          };
        }
      }]
    });

    // Text Normalizer Plugin
    this.registerPlugin({
      id: 'text-normalizer',
      name: 'Text Normalizer',
      description: 'Normalizes and cleans text values',
      version: '1.0.0',
      author: 'System',
      enabled: true,
      processors: [{
        id: 'text-normalizer-processor',
        name: 'Text Normalizer Processor',
        description: 'Cleans and normalizes text values',
        version: '1.0.0',
        supportedTypes: ['string'],
        async process(value: any, field: FieldDefinition, context: ProcessingContext): Promise<ProcessingResult> {
          if (typeof value !== 'string') {
            return { success: true, processedValue: value };
          }

          let processedValue = value;
          const warnings: string[] = [];

          const normalizeBrandName = (brand: string): string => {
            // Common brand name normalizations
            const brandMap: Record<string, string> = {
              'sony': 'Sony',
              'microsoft': 'Microsoft',
              'nintendo': 'Nintendo',
              'apple': 'Apple',
              'samsung': 'Samsung',
              'lg': 'LG',
              'dell': 'Dell',
              'hp': 'HP',
              'lenovo': 'Lenovo'
            };

            const normalized = brandMap[brand.toLowerCase()];
            return normalized || brand;
          };

          const normalizeModelName = (model: string): string => {
            // Remove common prefixes/suffixes and normalize spacing
            return model
              .replace(/\s+/g, ' ')
              .replace(/^(model|mod\.?)\s+/i, '')
              .trim();
          };

          // Trim whitespace
          processedValue = processedValue.trim();

          // Normalize brand names
          if (field.metadata.label?.toLowerCase().includes('brand')) {
            processedValue = normalizeBrandName(processedValue);
          }

          // Clean up model names
          if (field.metadata.label?.toLowerCase().includes('model')) {
            processedValue = normalizeModelName(processedValue);
          }

          // Check for potential issues
          if (processedValue.length === 0 && field.constraints?.required) {
            return {
              success: false,
              errors: ['Required field cannot be empty']
            };
          }

          if (processedValue !== value) {
            warnings.push(`Text normalized from "${value}" to "${processedValue}"`);
          }

          return {
            success: true,
            processedValue,
            confidence: 0.95,
            warnings,
            metadata: {
              originalValue: value,
              normalized: processedValue !== value
            }
          };
        }
      }]
    });
  }
}

// Export singleton instance
export const pluginManager = new PluginManager();