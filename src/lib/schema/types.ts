/**
 * Core types for the extensible device specification schema system
 */

// Base field types supported by the schema system
export type FieldType = 
  | 'string' 
  | 'number' 
  | 'boolean' 
  | 'enum' 
  | 'array' 
  | 'object' 
  | 'date' 
  | 'url' 
  | 'email';

// Field validation constraints
export interface FieldConstraints {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  enum?: string[];
  format?: string;
  unit?: string;
  precision?: number;
}

// Field metadata for enhanced functionality
export interface FieldMetadata {
  label: string;
  description?: string;
  placeholder?: string;
  helpText?: string;
  importance?: 'low' | 'medium' | 'high' | 'critical';
  weight?: number; // For compatibility scoring
  category?: string; // For grouping fields in UI
  searchable?: boolean;
  indexable?: boolean;
  deprecated?: boolean;
  deprecationMessage?: string;
  addedInVersion?: string;
}

// Core field definition
export interface FieldDefinition {
  type: FieldType;
  constraints?: FieldConstraints;
  metadata: FieldMetadata;
  defaultValue?: any;
  computed?: boolean; // If field is computed from other fields
  computeFunction?: string; // Function name for computed fields
}

// Schema definition for a device category
export interface CategorySchema {
  id: string;
  name: string;
  version: string;
  parentId?: string;
  description?: string;
  fields: Record<string, FieldDefinition>;
  inheritedFields?: string[]; // Fields inherited from parent categories
  requiredFields: string[];
  computedFields?: Record<string, string>; // Field name -> compute function
  validationRules?: ValidationRule[];
  compatibilityRules?: CompatibilityRuleDefinition[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  deprecated?: boolean;
  deprecationMessage?: string;
}

// Validation rules for complex field relationships
export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  condition: string; // JavaScript expression
  errorMessage: string;
  severity: 'error' | 'warning' | 'info';
}

// Compatibility rule definitions
export interface CompatibilityRuleDefinition {
  id: string;
  name: string;
  description: string;
  sourceField: string;
  targetField: string;
  condition: string; // JavaScript expression for compatibility check
  compatibilityType: 'full' | 'partial' | 'none';
  message: string;
  limitations?: string[];
}

// Device specification instance
export interface DeviceSpecification {
  deviceId: string;
  categoryId: string;
  schemaVersion: string;
  specifications: Record<string, any>;
  computedValues?: Record<string, any>;
  validationErrors?: ValidationError[];
  confidenceScores?: Record<string, number>; // Field -> confidence score
  sources?: Record<string, string>; // Field -> source URL/reference
  verificationStatus?: Record<string, 'pending' | 'verified' | 'rejected'>;
  createdAt: Date;
  updatedAt: Date;
}

// Validation error structure
export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  code: string;
  value?: any;
}

// Schema migration definition
export interface SchemaMigration {
  id: string;
  fromVersion: string;
  toVersion: string;
  categoryId: string;
  operations: MigrationOperation[];
  createdAt: Date;
  appliedAt?: Date;
}

// Migration operations
export type MigrationOperation = 
  | { type: 'add_field'; field: string; definition: FieldDefinition }
  | { type: 'remove_field'; field: string }
  | { type: 'modify_field'; field: string; changes: Partial<FieldDefinition> }
  | { type: 'rename_field'; oldName: string; newName: string }
  | { type: 'add_validation_rule'; rule: ValidationRule }
  | { type: 'remove_validation_rule'; ruleId: string }
  | { type: 'add_compatibility_rule'; rule: CompatibilityRuleDefinition }
  | { type: 'remove_compatibility_rule'; ruleId: string };

// Schema registry for managing all category schemas
export interface SchemaRegistry {
  schemas: Map<string, CategorySchema>;
  migrations: Map<string, SchemaMigration[]>;
  computeFunctions: Map<string, Function>;
  validationFunctions: Map<string, Function>;
}

// Template for creating new device categories
export interface CategoryTemplate {
  id: string;
  name: string;
  description: string;
  baseSchema: Partial<CategorySchema>;
  exampleDevices?: string[];
  tags?: string[];
  popularity?: number;
}

// Index configuration for dynamic field indexing
export interface IndexConfiguration {
  field: string;
  type: 'btree' | 'gin' | 'gist' | 'hash';
  unique?: boolean;
  partial?: string; // Partial index condition
  expression?: string; // For expression indexes
}

// Search configuration for dynamic search capabilities
export interface SearchConfiguration {
  field: string;
  weight: number;
  searchType: 'exact' | 'fuzzy' | 'prefix' | 'fulltext';
  analyzer?: string;
}