// Schema-Aware AI Extraction Service
// This service extracts device specifications from PDFs/manuals based on category schemas

import { createClient } from '@supabase/supabase-js';
import type { 
  ExtractionRequest, 
  ExtractionResponse, 
  FieldExtractionResult 
} from '@/types/documentation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface SchemaField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'enum' | 'array' | 'object' | 'date' | 'url' | 'email';
  label: string;
  description?: string;
  unit?: string;
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: string;
  options?: string[];
}

interface CategorySchema {
  id: string;
  categoryId: string;
  version: string;
  name: string;
  fields: Record<string, SchemaField>;
  requiredFields: string[];
}

/**
 * Fetch category schema to use as extraction template
 */
export async function fetchCategorySchema(
  categoryId: string,
  version?: string
): Promise<CategorySchema | null> {
  try {
    let query = supabase
      .from('device_category_schemas')
      .select('*')
      .eq('category_id', categoryId);

    if (version) {
      query = query.eq('version', version);
    } else {
      // Get latest version
      query = query.order('created_at', { ascending: false }).limit(1);
    }

    const { data, error } = await query.single();

    if (error) {
      console.error('Error fetching category schema:', error);
      return null;
    }

    return data as CategorySchema;
  } catch (error) {
    console.error('Error in fetchCategorySchema:', error);
    return null;
  }
}

/**
 * Build extraction prompt based on schema fields
 */
export function buildExtractionPrompt(
  schema: CategorySchema,
  documentContent: string
): string {
  const fieldDescriptions = Object.entries(schema.fields)
    .map(([fieldName, field]) => {
      let desc = `- ${field.label} (${fieldName}): ${field.type}`;
      if (field.description) desc += ` - ${field.description}`;
      if (field.unit) desc += ` [Unit: ${field.unit}]`;
      if (field.required) desc += ` [REQUIRED]`;
      if (field.options) desc += ` [Options: ${field.options.join(', ')}]`;
      if (field.min !== undefined || field.max !== undefined) {
        desc += ` [Range: ${field.min ?? '∞'} to ${field.max ?? '∞'}]`;
      }
      return desc;
    })
    .join('\n');

  return `You are a technical specification extraction AI. Extract device specifications from the following document based on the provided schema.

CATEGORY: ${schema.name}
SCHEMA VERSION: ${schema.version}

FIELDS TO EXTRACT:
${fieldDescriptions}

EXTRACTION RULES:
1. Extract ONLY the fields defined in the schema above
2. Return values in the exact type specified (string, number, boolean, etc.)
3. For enum fields, use only the provided options
4. For number fields, respect min/max constraints
5. If a field is not found in the document, mark it as missing
6. Provide a confidence score (0.0-1.0) for each extracted field
7. Include source context (the text snippet where you found the value)

DOCUMENT CONTENT:
${documentContent}

Return a JSON object with this structure:
{
  "extractedFields": {
    "fieldName": "value",
    ...
  },
  "fieldConfidence": {
    "fieldName": 0.95,
    ...
  },
  "missingFields": ["fieldName1", "fieldName2"],
  "sourceContext": {
    "fieldName": "text snippet from document",
    ...
  }
}`;
}

/**
 * Validate extracted value against schema constraints
 */
export function validateFieldValue(
  fieldName: string,
  value: any,
  field: SchemaField
): string | null {
  // Type validation
  if (field.type === 'number' && typeof value !== 'number') {
    return `Expected number, got ${typeof value}`;
  }
  if (field.type === 'boolean' && typeof value !== 'boolean') {
    return `Expected boolean, got ${typeof value}`;
  }
  if (field.type === 'string' && typeof value !== 'string') {
    return `Expected string, got ${typeof value}`;
  }
  if (field.type === 'array' && !Array.isArray(value)) {
    return `Expected array, got ${typeof value}`;
  }

  // Range validation for numbers
  if (field.type === 'number') {
    if (field.min !== undefined && value < field.min) {
      return `Value ${value} is below minimum ${field.min}`;
    }
    if (field.max !== undefined && value > field.max) {
      return `Value ${value} is above maximum ${field.max}`;
    }
  }

  // Enum validation
  if (field.type === 'enum' && field.options) {
    if (!field.options.includes(value)) {
      return `Value "${value}" is not in allowed options: ${field.options.join(', ')}`;
    }
  }

  // Pattern validation for strings
  if (field.type === 'string' && field.pattern) {
    const regex = new RegExp(field.pattern);
    if (!regex.test(value)) {
      return `Value does not match required pattern: ${field.pattern}`;
    }
  }

  // URL validation
  if (field.type === 'url') {
    try {
      new URL(value);
    } catch {
      return `Invalid URL format`;
    }
  }

  // Email validation
  if (field.type === 'email') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return `Invalid email format`;
    }
  }

  return null;
}

/**
 * Process AI extraction response and validate against schema
 */
export async function processExtractionResponse(
  aiResponse: any,
  schema: CategorySchema
): Promise<{
  extractedFields: Record<string, any>;
  fieldConfidence: Record<string, number>;
  missingFields: string[];
  validationErrors: Record<string, string>;
}> {
  const extractedFields: Record<string, any> = {};
  const fieldConfidence: Record<string, number> = {};
  const missingFields: string[] = [];
  const validationErrors: Record<string, string> = {};

  // Process each field in the schema
  for (const [fieldName, field] of Object.entries(schema.fields)) {
    const value = aiResponse.extractedFields?.[fieldName];
    const confidence = aiResponse.fieldConfidence?.[fieldName] ?? 0;

    if (value === undefined || value === null) {
      missingFields.push(fieldName);
      continue;
    }

    // Validate the extracted value
    const validationError = validateFieldValue(fieldName, value, field);
    if (validationError) {
      validationErrors[fieldName] = validationError;
      continue;
    }

    extractedFields[fieldName] = value;
    fieldConfidence[fieldName] = confidence;
  }

  // Check for required fields
  for (const requiredField of schema.requiredFields) {
    if (!extractedFields[requiredField] && !missingFields.includes(requiredField)) {
      missingFields.push(requiredField);
    }
  }

  return {
    extractedFields,
    fieldConfidence,
    missingFields,
    validationErrors
  };
}

/**
 * Calculate overall confidence score
 */
export function calculateOverallConfidence(
  fieldConfidence: Record<string, number>,
  missingFields: string[],
  totalFields: number
): number {
  if (totalFields === 0) return 0;

  const foundFields = Object.keys(fieldConfidence).length;
  const avgConfidence = foundFields > 0
    ? Object.values(fieldConfidence).reduce((sum, conf) => sum + conf, 0) / foundFields
    : 0;

  const completeness = foundFields / totalFields;

  // Weighted average: 70% confidence, 30% completeness
  return avgConfidence * 0.7 + completeness * 0.3;
}

/**
 * Main schema-aware extraction function
 * This would integrate with your AI service (OpenAI, local LLM, etc.)
 */
export async function extractSpecificationsFromDocument(
  request: ExtractionRequest
): Promise<ExtractionResponse> {
  const startTime = Date.now();

  // 1. Fetch category schema
  const schema = await fetchCategorySchema(request.categoryId, request.schemaVersion);
  if (!schema) {
    throw new Error(`Schema not found for category ${request.categoryId}`);
  }

  // 2. Fetch document content (this would be implemented based on your storage)
  // For now, this is a placeholder
  const documentContent = await fetchDocumentContent(request.documentUrl);

  // 3. Build extraction prompt
  const prompt = buildExtractionPrompt(schema, documentContent);

  // 4. Call AI service (placeholder - integrate with your AI service)
  const aiResponse = await callAIService(prompt, request.aiModel);

  // 5. Process and validate response
  const {
    extractedFields,
    fieldConfidence,
    missingFields,
    validationErrors
  } = await processExtractionResponse(aiResponse, schema);

  // 6. Calculate overall confidence
  const overallConfidence = calculateOverallConfidence(
    fieldConfidence,
    missingFields,
    Object.keys(schema.fields).length
  );

  const processingTime = Date.now() - startTime;

  // 7. Store extraction result
  const extractionId = await storeExtractionResult({
    deviceId: request.deviceId,
    categoryId: request.categoryId,
    schemaVersion: request.schemaVersion,
    extractedFields,
    fieldConfidence,
    missingFields,
    validationErrors,
    aiModel: request.aiModel ?? 'default',
    processingTime
  });

  return {
    extractionId,
    extractedFields,
    fieldConfidence,
    missingFields,
    validationErrors: Object.keys(validationErrors).length > 0 ? validationErrors : undefined,
    processingTime,
    overallConfidence
  };
}

/**
 * Fetch document content from storage
 * Placeholder - implement based on your storage solution
 */
async function fetchDocumentContent(documentUrl: string): Promise<string> {
  // TODO: Implement document fetching from Supabase storage or external URL
  // This would handle PDF parsing, web scraping, etc.
  return 'Document content placeholder';
}

/**
 * Call AI service for extraction
 * Placeholder - integrate with OpenAI, local LLM, etc.
 */
async function callAIService(prompt: string, model?: string): Promise<any> {
  // TODO: Implement AI service integration
  // This would call OpenAI API, local Ollama instance, etc.
  return {
    extractedFields: {},
    fieldConfidence: {},
    missingFields: [],
    sourceContext: {}
  };
}

/**
 * Store extraction result in database
 */
async function storeExtractionResult(data: {
  deviceId: string;
  categoryId: string;
  schemaVersion: string;
  extractedFields: Record<string, any>;
  fieldConfidence: Record<string, number>;
  missingFields: string[];
  validationErrors: Record<string, string>;
  aiModel: string;
  processingTime: number;
}): Promise<string> {
  // Generate ID
  const extractionId = `ext_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // This would be stored when documentation is created
  // For now, return the generated ID
  return extractionId;
}
