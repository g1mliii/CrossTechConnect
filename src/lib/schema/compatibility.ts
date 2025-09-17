/**
 * Extensible Compatibility Rule Framework
 * Handles compatibility checking between devices based on their specifications
 */

import { 
  CategorySchema, 
  DeviceSpecification, 
  CompatibilityRuleDefinition,
  FieldDefinition 
} from './types';
import { schemaRegistry } from './registry';

export interface CompatibilityResult {
  compatible: 'full' | 'partial' | 'none';
  confidence: number;
  details: string;
  limitations: string[];
  recommendations: string[];
  matchedRules: string[];
  fieldCompatibility: Record<string, FieldCompatibilityResult>;
}

export interface FieldCompatibilityResult {
  compatible: 'full' | 'partial' | 'none';
  sourceValue: any;
  targetValue: any;
  message: string;
  weight: number;
}

export interface CompatibilityContext {
  sourceDevice: DeviceSpecification;
  targetDevice: DeviceSpecification;
  sourceSchema: CategorySchema;
  targetSchema: CategorySchema;
  connectionType?: string;
  useCase?: string;
}

export class CompatibilityEngine {
  private ruleProcessors: Map<string, CompatibilityRuleProcessor> = new Map();

  constructor() {
    this.initializeBuiltInProcessors();
  }

  /**
   * Check compatibility between two devices
   */
  async checkCompatibility(
    sourceDeviceId: string,
    targetDeviceId: string,
    context?: Partial<CompatibilityContext>
  ): Promise<CompatibilityResult> {
    // Load device specifications and schemas
    const sourceSpec = await this.loadDeviceSpecification(sourceDeviceId);
    const targetSpec = await this.loadDeviceSpecification(targetDeviceId);
    
    const sourceSchema = schemaRegistry.getSchema(sourceSpec.categoryId, sourceSpec.schemaVersion);
    const targetSchema = schemaRegistry.getSchema(targetSpec.categoryId, targetSpec.schemaVersion);

    if (!sourceSchema || !targetSchema) {
      throw new Error('Schema not found for one or both devices');
    }

    const compatibilityContext: CompatibilityContext = {
      sourceDevice: sourceSpec,
      targetDevice: targetSpec,
      sourceSchema,
      targetSchema,
      ...context
    };

    return this.evaluateCompatibility(compatibilityContext);
  }

  /**
   * Evaluate compatibility using all applicable rules
   */
  private async evaluateCompatibility(context: CompatibilityContext): Promise<CompatibilityResult> {
    const result: CompatibilityResult = {
      compatible: 'full',
      confidence: 1.0,
      details: '',
      limitations: [],
      recommendations: [],
      matchedRules: [],
      fieldCompatibility: {}
    };

    // Get all applicable compatibility rules
    const rules = this.getApplicableRules(context);

    // Evaluate each rule
    for (const rule of rules) {
      const ruleResult = await this.evaluateRule(rule, context);
      
      if (ruleResult) {
        result.matchedRules.push(rule.id);
        
        // Update overall compatibility based on rule result
        if (ruleResult.compatible === 'none') {
          result.compatible = 'none';
        } else if (ruleResult.compatible === 'partial' && result.compatible === 'full') {
          result.compatible = 'partial';
        }

        // Merge limitations and recommendations
        result.limitations.push(...ruleResult.limitations);
        result.recommendations.push(...ruleResult.recommendations);

        // Update confidence (take minimum)
        result.confidence = Math.min(result.confidence, ruleResult.confidence);
      }
    }

    // Evaluate field-level compatibility
    result.fieldCompatibility = await this.evaluateFieldCompatibility(context);

    // Calculate overall compatibility from field results
    const fieldResults = Object.values(result.fieldCompatibility);
    if (fieldResults.length > 0) {
      const weightedScore = fieldResults.reduce((sum, field) => {
        const score = field.compatible === 'full' ? 1 : field.compatible === 'partial' ? 0.5 : 0;
        return sum + (score * field.weight);
      }, 0);
      
      const totalWeight = fieldResults.reduce((sum, field) => sum + field.weight, 0);
      const averageScore = totalWeight > 0 ? weightedScore / totalWeight : 0;

      if (averageScore >= 0.8) {
        result.compatible = result.compatible === 'none' ? 'none' : 'full';
      } else if (averageScore >= 0.3) {
        result.compatible = result.compatible === 'none' ? 'none' : 'partial';
      } else {
        result.compatible = 'none';
      }
    }

    // Generate summary details
    result.details = this.generateCompatibilityDetails(result, context);

    return result;
  }

  /**
   * Get applicable compatibility rules for the given context
   */
  private getApplicableRules(context: CompatibilityContext): CompatibilityRuleDefinition[] {
    const rules: CompatibilityRuleDefinition[] = [];

    // Get rules from source schema
    if (context.sourceSchema.compatibilityRules) {
      rules.push(...context.sourceSchema.compatibilityRules);
    }

    // Get rules from target schema
    if (context.targetSchema.compatibilityRules) {
      rules.push(...context.targetSchema.compatibilityRules);
    }

    // Filter rules based on context
    return rules.filter(rule => this.isRuleApplicable(rule, context));
  }

  /**
   * Check if a rule is applicable to the current context
   */
  private isRuleApplicable(rule: CompatibilityRuleDefinition, context: CompatibilityContext): boolean {
    // Check if source and target fields exist
    const hasSourceField = rule.sourceField in context.sourceDevice.specifications;
    const hasTargetField = rule.targetField in context.targetDevice.specifications;

    return hasSourceField && hasTargetField;
  }

  /**
   * Evaluate a single compatibility rule
   */
  private async evaluateRule(
    rule: CompatibilityRuleDefinition, 
    context: CompatibilityContext
  ): Promise<{
    compatible: 'full' | 'partial' | 'none';
    confidence: number;
    limitations: string[];
    recommendations: string[];
  } | null> {
    try {
      const processor = this.ruleProcessors.get(rule.name) || this.ruleProcessors.get('default');
      if (!processor) {
        console.warn(`No processor found for rule: ${rule.name}`);
        return null;
      }

      return await processor.process(rule, context);
    } catch (error) {
      console.error(`Error evaluating rule ${rule.id}:`, error);
      return null;
    }
  }

  /**
   * Evaluate field-level compatibility
   */
  private async evaluateFieldCompatibility(context: CompatibilityContext): Promise<Record<string, FieldCompatibilityResult>> {
    const results: Record<string, FieldCompatibilityResult> = {};

    // Get common fields between schemas
    const sourceFields = context.sourceSchema.fields;
    const targetFields = context.targetSchema.fields;

    for (const [fieldName, sourceFieldDef] of Object.entries(sourceFields)) {
      const targetFieldDef = targetFields[fieldName];
      if (!targetFieldDef) continue;

      const sourceValue = context.sourceDevice.specifications[fieldName];
      const targetValue = context.targetDevice.specifications[fieldName];

      if (sourceValue !== undefined && targetValue !== undefined) {
        results[fieldName] = this.compareFieldValues(
          fieldName,
          sourceValue,
          targetValue,
          sourceFieldDef,
          targetFieldDef
        );
      }
    }

    return results;
  }

  /**
   * Compare two field values for compatibility
   */
  private compareFieldValues(
    fieldName: string,
    sourceValue: any,
    targetValue: any,
    sourceFieldDef: FieldDefinition,
    targetFieldDef: FieldDefinition
  ): FieldCompatibilityResult {
    const weight = sourceFieldDef.metadata.weight || 1.0;

    // Exact match
    if (sourceValue === targetValue) {
      return {
        compatible: 'full',
        sourceValue,
        targetValue,
        message: `${fieldName} values match exactly`,
        weight
      };
    }

    // Type-specific compatibility checks
    switch (sourceFieldDef.type) {
      case 'number':
        return this.compareNumericValues(fieldName, sourceValue, targetValue, sourceFieldDef, weight);
      
      case 'string':
        return this.compareStringValues(fieldName, sourceValue, targetValue, sourceFieldDef, weight);
      
      case 'enum':
        return this.compareEnumValues(fieldName, sourceValue, targetValue, sourceFieldDef, weight);
      
      case 'array':
        return this.compareArrayValues(fieldName, sourceValue, targetValue, sourceFieldDef, weight);
      
      default:
        return {
          compatible: 'none',
          sourceValue,
          targetValue,
          message: `${fieldName} values do not match`,
          weight
        };
    }
  }

  /**
   * Compare numeric values with tolerance
   */
  private compareNumericValues(
    fieldName: string,
    sourceValue: number,
    targetValue: number,
    _fieldDef: FieldDefinition,
    weight: number
  ): FieldCompatibilityResult {
    const tolerance = 0.1; // 10% tolerance by default
    const difference = Math.abs(sourceValue - targetValue);
    const relativeDifference = difference / Math.max(sourceValue, targetValue);

    if (relativeDifference <= tolerance) {
      return {
        compatible: 'full',
        sourceValue,
        targetValue,
        message: `${fieldName} values are within acceptable tolerance`,
        weight
      };
    } else if (relativeDifference <= tolerance * 2) {
      return {
        compatible: 'partial',
        sourceValue,
        targetValue,
        message: `${fieldName} values have minor difference`,
        weight
      };
    } else {
      return {
        compatible: 'none',
        sourceValue,
        targetValue,
        message: `${fieldName} values differ significantly`,
        weight
      };
    }
  }

  /**
   * Compare string values
   */
  private compareStringValues(
    fieldName: string,
    sourceValue: string,
    targetValue: string,
    _fieldDef: FieldDefinition,
    weight: number
  ): FieldCompatibilityResult {
    // Case-insensitive comparison
    if (sourceValue.toLowerCase() === targetValue.toLowerCase()) {
      return {
        compatible: 'full',
        sourceValue,
        targetValue,
        message: `${fieldName} values match (case-insensitive)`,
        weight
      };
    }

    // Partial match (contains)
    if (sourceValue.toLowerCase().includes(targetValue.toLowerCase()) ||
        targetValue.toLowerCase().includes(sourceValue.toLowerCase())) {
      return {
        compatible: 'partial',
        sourceValue,
        targetValue,
        message: `${fieldName} values partially match`,
        weight
      };
    }

    return {
      compatible: 'none',
      sourceValue,
      targetValue,
      message: `${fieldName} values do not match`,
      weight
    };
  }

  /**
   * Compare enum values
   */
  private compareEnumValues(
    fieldName: string,
    sourceValue: string,
    targetValue: string,
    fieldDef: FieldDefinition,
    weight: number
  ): FieldCompatibilityResult {
    if (sourceValue === targetValue) {
      return {
        compatible: 'full',
        sourceValue,
        targetValue,
        message: `${fieldName} values match exactly`,
        weight
      };
    }

    // Check if values are in same enum category (if defined)
    const enumValues = fieldDef.constraints?.enum || [];
    const sourceIndex = enumValues.indexOf(sourceValue);
    const targetIndex = enumValues.indexOf(targetValue);

    if (sourceIndex !== -1 && targetIndex !== -1) {
      const indexDifference = Math.abs(sourceIndex - targetIndex);
      if (indexDifference <= 1) {
        return {
          compatible: 'partial',
          sourceValue,
          targetValue,
          message: `${fieldName} values are adjacent in enum`,
          weight
        };
      }
    }

    return {
      compatible: 'none',
      sourceValue,
      targetValue,
      message: `${fieldName} enum values are incompatible`,
      weight
    };
  }

  /**
   * Compare array values
   */
  private compareArrayValues(
    fieldName: string,
    sourceValue: any[],
    targetValue: any[],
    _fieldDef: FieldDefinition,
    weight: number
  ): FieldCompatibilityResult {
    const intersection = sourceValue.filter(item => targetValue.includes(item));
    const union = [...new Set([...sourceValue, ...targetValue])];

    const overlapRatio = intersection.length / union.length;

    if (overlapRatio >= 0.8) {
      return {
        compatible: 'full',
        sourceValue,
        targetValue,
        message: `${fieldName} arrays have high overlap`,
        weight
      };
    } else if (overlapRatio >= 0.3) {
      return {
        compatible: 'partial',
        sourceValue,
        targetValue,
        message: `${fieldName} arrays have partial overlap`,
        weight
      };
    } else {
      return {
        compatible: 'none',
        sourceValue,
        targetValue,
        message: `${fieldName} arrays have minimal overlap`,
        weight
      };
    }
  }

  /**
   * Generate compatibility details summary
   */
  private generateCompatibilityDetails(result: CompatibilityResult, context: CompatibilityContext): string {
    const sourceDevice = context.sourceDevice;
    const targetDevice = context.targetDevice;

    let details = `Compatibility between devices:\n`;
    details += `Source: ${sourceDevice.specifications.name || 'Unknown'}\n`;
    details += `Target: ${targetDevice.specifications.name || 'Unknown'}\n`;
    details += `Overall: ${result.compatible.toUpperCase()} (${Math.round(result.confidence * 100)}% confidence)\n`;

    if (result.limitations.length > 0) {
      details += `\nLimitations:\n${result.limitations.map(l => `- ${l}`).join('\n')}`;
    }

    if (result.recommendations.length > 0) {
      details += `\nRecommendations:\n${result.recommendations.map(r => `- ${r}`).join('\n')}`;
    }

    return details;
  }

  /**
   * Register a custom rule processor
   */
  registerRuleProcessor(name: string, processor: CompatibilityRuleProcessor): void {
    this.ruleProcessors.set(name, processor);
  }

  /**
   * Load device specification (placeholder - would load from database)
   */
  private async loadDeviceSpecification(_deviceId: string): Promise<DeviceSpecification> {
    // This would load from database in real implementation
    throw new Error('Device specification loading not implemented');
  }

  /**
   * Initialize built-in rule processors
   */
  private initializeBuiltInProcessors(): void {
    // Default processor for simple expression-based rules
    this.registerRuleProcessor('default', new DefaultRuleProcessor());
    
    // Specialized processors
    this.registerRuleProcessor('power_compatibility', new PowerCompatibilityProcessor());
    this.registerRuleProcessor('dimension_compatibility', new DimensionCompatibilityProcessor());
    this.registerRuleProcessor('connector_compatibility', new ConnectorCompatibilityProcessor());
  }
}

/**
 * Base interface for rule processors
 */
export interface CompatibilityRuleProcessor {
  process(rule: CompatibilityRuleDefinition, context: CompatibilityContext): Promise<{
    compatible: 'full' | 'partial' | 'none';
    confidence: number;
    limitations: string[];
    recommendations: string[];
  }>;
}

/**
 * Default rule processor using expression evaluation
 */
class DefaultRuleProcessor implements CompatibilityRuleProcessor {
  async process(rule: CompatibilityRuleDefinition, context: CompatibilityContext): Promise<{
    compatible: 'full' | 'partial' | 'none';
    confidence: number;
    limitations: string[];
    recommendations: string[];
  }> {
    const sourceValue = context.sourceDevice.specifications[rule.sourceField];
    const targetValue = context.targetDevice.specifications[rule.targetField];

    // Simple expression evaluation
    const expressionContext = {
      source: sourceValue,
      target: targetValue,
      sourceDevice: context.sourceDevice.specifications,
      targetDevice: context.targetDevice.specifications
    };

    try {
      const result = this.evaluateExpression(rule.condition, expressionContext);
      
      return {
        compatible: result ? rule.compatibilityType : 'none',
        confidence: 0.8,
        limitations: result ? [] : rule.limitations || [],
        recommendations: []
      };
    } catch (error) {
      console.error(`Error evaluating rule condition: ${rule.condition}`, error);
      return {
        compatible: 'none',
        confidence: 0.0,
        limitations: ['Rule evaluation failed'],
        recommendations: []
      };
    }
  }

  private evaluateExpression(expression: string, context: Record<string, any>): boolean {
    // Simple expression evaluator - in production, use a proper library
    let evaluableExpression = expression;
    
    for (const [key, value] of Object.entries(context)) {
      const regex = new RegExp(`\\b${key}\\b`, 'g');
      evaluableExpression = evaluableExpression.replace(regex, JSON.stringify(value));
    }

    try {
      return new Function(`return ${evaluableExpression}`)();
    } catch (error) {
      throw new Error(`Failed to evaluate expression: ${expression}`);
    }
  }
}

/**
 * Specialized processor for power compatibility
 */
class PowerCompatibilityProcessor implements CompatibilityRuleProcessor {
  async process(rule: CompatibilityRuleDefinition, context: CompatibilityContext): Promise<{
    compatible: 'full' | 'partial' | 'none';
    confidence: number;
    limitations: string[];
    recommendations: string[];
  }> {
    const sourcePower = context.sourceDevice.specifications[rule.sourceField];
    const targetPower = context.targetDevice.specifications[rule.targetField];

    if (typeof sourcePower !== 'number' || typeof targetPower !== 'number') {
      return {
        compatible: 'none',
        confidence: 0.0,
        limitations: ['Power values must be numeric'],
        recommendations: []
      };
    }

    const powerRatio = targetPower / sourcePower;

    if (powerRatio >= 1.0) {
      return {
        compatible: 'full',
        confidence: 0.95,
        limitations: [],
        recommendations: []
      };
    } else if (powerRatio >= 0.8) {
      return {
        compatible: 'partial',
        confidence: 0.8,
        limitations: [`Target power (${targetPower}W) is lower than source requirement (${sourcePower}W)`],
        recommendations: ['Consider using a higher wattage power supply']
      };
    } else {
      return {
        compatible: 'none',
        confidence: 0.9,
        limitations: [`Insufficient power: target ${targetPower}W < required ${sourcePower}W`],
        recommendations: ['Use a power supply with at least ' + Math.ceil(sourcePower * 1.2) + 'W capacity']
      };
    }
  }
}

/**
 * Specialized processor for dimension compatibility
 */
class DimensionCompatibilityProcessor implements CompatibilityRuleProcessor {
  async process(_rule: CompatibilityRuleDefinition, _context: CompatibilityContext): Promise<{
    compatible: 'full' | 'partial' | 'none';
    confidence: number;
    limitations: string[];
    recommendations: string[];
  }> {
    // Implementation for dimension compatibility checking
    return {
      compatible: 'full',
      confidence: 0.8,
      limitations: [],
      recommendations: []
    };
  }
}

/**
 * Specialized processor for connector compatibility
 */
class ConnectorCompatibilityProcessor implements CompatibilityRuleProcessor {
  async process(_rule: CompatibilityRuleDefinition, _context: CompatibilityContext): Promise<{
    compatible: 'full' | 'partial' | 'none';
    confidence: number;
    limitations: string[];
    recommendations: string[];
  }> {
    // Implementation for connector compatibility checking
    return {
      compatible: 'full',
      confidence: 0.9,
      limitations: [],
      recommendations: []
    };
  }
}

// Export singleton instance
export const compatibilityEngine = new CompatibilityEngine();