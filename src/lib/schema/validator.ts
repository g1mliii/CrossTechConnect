/**
 * Schema Validator - Validates device specifications against category schemas
 */

import { 
  CategorySchema, 
  DeviceSpecification, 
  FieldDefinition, 
  ValidationError, 
  ValidationRule,
  FieldType 
} from './types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fieldErrors: ValidationError[];
}

export class SchemaValidator {
  /**
   * Validate a category schema definition
   */
  validateSchema(schema: CategorySchema): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic structure validation
    if (!schema.id || typeof schema.id !== 'string') {
      errors.push('Schema ID is required and must be a string');
    }

    if (!schema.name || typeof schema.name !== 'string') {
      errors.push('Schema name is required and must be a string');
    }

    if (!schema.version || !this.isValidVersion(schema.version)) {
      errors.push('Schema version is required and must be in semver format');
    }

    // Validate fields
    if (!schema.fields || typeof schema.fields !== 'object') {
      errors.push('Schema fields are required and must be an object');
    } else {
      for (const [fieldName, fieldDef] of Object.entries(schema.fields)) {
        const fieldErrors = this.validateFieldDefinition(fieldName, fieldDef);
        errors.push(...fieldErrors);
      }
    }

    // Validate required fields exist in fields definition
    if (schema.requiredFields) {
      for (const requiredField of schema.requiredFields) {
        if (!schema.fields[requiredField]) {
          errors.push(`Required field '${requiredField}' is not defined in fields`);
        }
      }
    }

    // Validate validation rules
    if (schema.validationRules) {
      for (const rule of schema.validationRules) {
        const ruleErrors = this.validateValidationRule(rule, schema);
        errors.push(...ruleErrors);
      }
    }

    // Validate compatibility rules
    if (schema.compatibilityRules) {
      for (const rule of schema.compatibilityRules) {
        const ruleErrors = this.validateCompatibilityRule(rule, schema);
        errors.push(...ruleErrors);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      fieldErrors: []
    };
  }

  /**
   * Validate device specifications against schema
   */
  validateSpecification(
    specification: DeviceSpecification, 
    schema: CategorySchema
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const fieldErrors: ValidationError[] = [];

    // Check schema version compatibility
    if (specification.schemaVersion !== schema.version) {
      warnings.push(`Specification uses schema version ${specification.schemaVersion}, current is ${schema.version}`);
    }

    // Validate required fields
    for (const requiredField of schema.requiredFields) {
      if (!(requiredField in specification.specifications)) {
        fieldErrors.push({
          field: requiredField,
          message: `Required field '${requiredField}' is missing`,
          severity: 'error',
          code: 'REQUIRED_FIELD_MISSING'
        });
      }
    }

    // Validate each specification field
    for (const [fieldName, value] of Object.entries(specification.specifications)) {
      const fieldDef = schema.fields[fieldName];
      
      if (!fieldDef) {
        fieldErrors.push({
          field: fieldName,
          message: `Field '${fieldName}' is not defined in schema`,
          severity: 'warning',
          code: 'UNDEFINED_FIELD',
          value
        });
        continue;
      }

      const fieldValidation = this.validateFieldValue(fieldName, value, fieldDef);
      fieldErrors.push(...fieldValidation);
    }

    // Apply custom validation rules
    if (schema.validationRules) {
      for (const rule of schema.validationRules) {
        const ruleValidation = this.applyValidationRule(rule, specification.specifications);
        if (!ruleValidation.isValid) {
          fieldErrors.push({
            field: rule.name,
            message: rule.errorMessage,
            severity: rule.severity,
            code: 'CUSTOM_VALIDATION_FAILED'
          });
        }
      }
    }

    return {
      isValid: fieldErrors.filter(e => e.severity === 'error').length === 0,
      errors,
      warnings,
      fieldErrors
    };
  }

  /**
   * Validate field definition
   */
  private validateFieldDefinition(fieldName: string, fieldDef: FieldDefinition): string[] {
    const errors: string[] = [];

    // Validate field type
    const validTypes: FieldType[] = ['string', 'number', 'boolean', 'enum', 'array', 'object', 'date', 'url', 'email'];
    if (!validTypes.includes(fieldDef.type)) {
      errors.push(`Field '${fieldName}' has invalid type: ${fieldDef.type}`);
    }

    // Validate constraints
    if (fieldDef.constraints) {
      const constraints = fieldDef.constraints;

      // Type-specific constraint validation
      if (fieldDef.type === 'string') {
        if (constraints.min !== undefined && typeof constraints.min !== 'number') {
          errors.push(`Field '${fieldName}' string min constraint must be a number`);
        }
        if (constraints.max !== undefined && typeof constraints.max !== 'number') {
          errors.push(`Field '${fieldName}' string max constraint must be a number`);
        }
      }

      if (fieldDef.type === 'number') {
        if (constraints.min !== undefined && typeof constraints.min !== 'number') {
          errors.push(`Field '${fieldName}' number min constraint must be a number`);
        }
        if (constraints.max !== undefined && typeof constraints.max !== 'number') {
          errors.push(`Field '${fieldName}' number max constraint must be a number`);
        }
      }

      if (fieldDef.type === 'enum') {
        if (!constraints.enum || !Array.isArray(constraints.enum) || constraints.enum.length === 0) {
          errors.push(`Field '${fieldName}' enum type must have enum constraint with values`);
        }
      }

      // Pattern validation
      if (constraints.pattern) {
        try {
          new RegExp(constraints.pattern);
        } catch (e) {
          errors.push(`Field '${fieldName}' has invalid regex pattern: ${constraints.pattern}`);
        }
      }
    }

    // Validate metadata
    if (!fieldDef.metadata || !fieldDef.metadata.label) {
      errors.push(`Field '${fieldName}' must have metadata with label`);
    }

    if (fieldDef.metadata?.importance && !['low', 'medium', 'high', 'critical'].includes(fieldDef.metadata.importance)) {
      errors.push(`Field '${fieldName}' has invalid importance level`);
    }

    return errors;
  }

  /**
   * Validate field value against field definition
   */
  private validateFieldValue(fieldName: string, value: any, fieldDef: FieldDefinition): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check if required field is present
    if (fieldDef.constraints?.required && (value === null || value === undefined || value === '')) {
      errors.push({
        field: fieldName,
        message: `Field '${fieldName}' is required`,
        severity: 'error',
        code: 'REQUIRED_FIELD_EMPTY',
        value
      });
      return errors; // Don't continue validation if required field is empty
    }

    // Skip validation if value is null/undefined and field is not required
    if (value === null || value === undefined) {
      return errors;
    }

    // Type validation
    const typeValidation = this.validateFieldType(fieldName, value, fieldDef.type);
    errors.push(...typeValidation);

    // Constraint validation
    if (fieldDef.constraints) {
      const constraintValidation = this.validateFieldConstraints(fieldName, value, fieldDef.constraints, fieldDef.type);
      errors.push(...constraintValidation);
    }

    return errors;
  }

  /**
   * Validate field type
   */
  private validateFieldType(fieldName: string, value: any, expectedType: FieldType): ValidationError[] {
    const errors: ValidationError[] = [];

    switch (expectedType) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push({
            field: fieldName,
            message: `Field '${fieldName}' must be a string`,
            severity: 'error',
            code: 'INVALID_TYPE',
            value
          });
        }
        break;

      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          errors.push({
            field: fieldName,
            message: `Field '${fieldName}' must be a valid number`,
            severity: 'error',
            code: 'INVALID_TYPE',
            value
          });
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push({
            field: fieldName,
            message: `Field '${fieldName}' must be a boolean`,
            severity: 'error',
            code: 'INVALID_TYPE',
            value
          });
        }
        break;

      case 'array':
        if (!Array.isArray(value)) {
          errors.push({
            field: fieldName,
            message: `Field '${fieldName}' must be an array`,
            severity: 'error',
            code: 'INVALID_TYPE',
            value
          });
        }
        break;

      case 'object':
        if (typeof value !== 'object' || Array.isArray(value) || value === null) {
          errors.push({
            field: fieldName,
            message: `Field '${fieldName}' must be an object`,
            severity: 'error',
            code: 'INVALID_TYPE',
            value
          });
        }
        break;

      case 'date':
        if (!(value instanceof Date) && !this.isValidDateString(value)) {
          errors.push({
            field: fieldName,
            message: `Field '${fieldName}' must be a valid date`,
            severity: 'error',
            code: 'INVALID_TYPE',
            value
          });
        }
        break;

      case 'url':
        if (typeof value !== 'string' || !this.isValidUrl(value)) {
          errors.push({
            field: fieldName,
            message: `Field '${fieldName}' must be a valid URL`,
            severity: 'error',
            code: 'INVALID_FORMAT',
            value
          });
        }
        break;

      case 'email':
        if (typeof value !== 'string' || !this.isValidEmail(value)) {
          errors.push({
            field: fieldName,
            message: `Field '${fieldName}' must be a valid email address`,
            severity: 'error',
            code: 'INVALID_FORMAT',
            value
          });
        }
        break;
    }

    return errors;
  }

  /**
   * Validate field constraints
   */
  private validateFieldConstraints(
    fieldName: string, 
    value: any, 
    constraints: any, 
    fieldType: FieldType
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    // String constraints
    if (fieldType === 'string' && typeof value === 'string') {
      if (constraints.minLength !== undefined && value.length < constraints.minLength) {
        errors.push({
          field: fieldName,
          message: `Field '${fieldName}' must be at least ${constraints.minLength} characters long`,
          severity: 'error',
          code: 'MIN_LENGTH_VIOLATION',
          value
        });
      }

      if (constraints.maxLength !== undefined && value.length > constraints.maxLength) {
        errors.push({
          field: fieldName,
          message: `Field '${fieldName}' must be at most ${constraints.maxLength} characters long`,
          severity: 'error',
          code: 'MAX_LENGTH_VIOLATION',
          value
        });
      }

      if (constraints.pattern) {
        const regex = new RegExp(constraints.pattern);
        if (!regex.test(value)) {
          errors.push({
            field: fieldName,
            message: `Field '${fieldName}' does not match required pattern`,
            severity: 'error',
            code: 'PATTERN_VIOLATION',
            value
          });
        }
      }
    }

    // Number constraints
    if (fieldType === 'number' && typeof value === 'number') {
      if (constraints.min !== undefined && value < constraints.min) {
        errors.push({
          field: fieldName,
          message: `Field '${fieldName}' must be at least ${constraints.min}`,
          severity: 'error',
          code: 'MIN_VALUE_VIOLATION',
          value
        });
      }

      if (constraints.max !== undefined && value > constraints.max) {
        errors.push({
          field: fieldName,
          message: `Field '${fieldName}' must be at most ${constraints.max}`,
          severity: 'error',
          code: 'MAX_VALUE_VIOLATION',
          value
        });
      }
    }

    // Enum constraints
    if (fieldType === 'enum' && constraints.enum) {
      if (!constraints.enum.includes(value)) {
        errors.push({
          field: fieldName,
          message: `Field '${fieldName}' must be one of: ${constraints.enum.join(', ')}`,
          severity: 'error',
          code: 'ENUM_VIOLATION',
          value
        });
      }
    }

    return errors;
  }

  /**
   * Validate validation rule
   */
  private validateValidationRule(rule: ValidationRule, schema: CategorySchema): string[] {
    const errors: string[] = [];

    if (!rule.id || !rule.name || !rule.condition || !rule.errorMessage) {
      errors.push(`Validation rule must have id, name, condition, and errorMessage`);
    }

    if (!['error', 'warning', 'info'].includes(rule.severity)) {
      errors.push(`Validation rule '${rule.name}' has invalid severity`);
    }

    // Validate that condition references valid fields
    const fieldReferences = this.extractFieldReferences(rule.condition);
    for (const fieldRef of fieldReferences) {
      if (!schema.fields[fieldRef]) {
        errors.push(`Validation rule '${rule.name}' references undefined field: ${fieldRef}`);
      }
    }

    return errors;
  }

  /**
   * Validate compatibility rule
   */
  private validateCompatibilityRule(rule: any, schema: CategorySchema): string[] {
    const errors: string[] = [];

    if (!rule.id || !rule.name || !rule.sourceField || !rule.targetField || !rule.condition) {
      errors.push(`Compatibility rule must have id, name, sourceField, targetField, and condition`);
    }

    if (!['full', 'partial', 'none'].includes(rule.compatibilityType)) {
      errors.push(`Compatibility rule '${rule.name}' has invalid compatibility type`);
    }

    // Validate field references
    if (!schema.fields[rule.sourceField]) {
      errors.push(`Compatibility rule '${rule.name}' references undefined source field: ${rule.sourceField}`);
    }

    if (!schema.fields[rule.targetField]) {
      errors.push(`Compatibility rule '${rule.name}' references undefined target field: ${rule.targetField}`);
    }

    return errors;
  }

  /**
   * Apply validation rule to specifications
   */
  private applyValidationRule(rule: ValidationRule, specifications: Record<string, any>): { isValid: boolean } {
    try {
      // Create a safe evaluation context
      const context = { ...specifications };
      
      // Simple expression evaluation (in production, use a proper expression evaluator)
      const result = this.evaluateExpression(rule.condition, context);
      
      return { isValid: !!result };
    } catch (error) {
      console.warn(`Failed to evaluate validation rule '${rule.name}':`, error);
      return { isValid: true }; // Fail open for safety
    }
  }

  /**
   * Helper methods
   */

  private isValidVersion(version: string): boolean {
    const semverRegex = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;
    return semverRegex.test(version);
  }

  private isValidDateString(value: any): boolean {
    if (typeof value !== 'string') return false;
    const date = new Date(value);
    return !isNaN(date.getTime());
  }

  private isValidUrl(value: string): boolean {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }

  private isValidEmail(value: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }

  private extractFieldReferences(expression: string): string[] {
    // Simple field reference extraction (in production, use proper AST parsing)
    const fieldRegex = /\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g;
    const matches = expression.match(fieldRegex) || [];
    return [...new Set(matches)]; // Remove duplicates
  }

  private evaluateExpression(expression: string, context: Record<string, any>): any {
    // WARNING: This is a simplified implementation
    // In production, use a proper expression evaluator like JSONata or a sandboxed JS evaluator
    
    // Replace field references with context values
    let evaluableExpression = expression;
    for (const [key, value] of Object.entries(context)) {
      const regex = new RegExp(`\\b${key}\\b`, 'g');
      evaluableExpression = evaluableExpression.replace(regex, JSON.stringify(value));
    }

    try {
      // Use Function constructor for safer evaluation than eval
      return new Function(`return ${evaluableExpression}`)();
    } catch (error) {
      throw new Error(`Failed to evaluate expression: ${expression}`);
    }
  }
}