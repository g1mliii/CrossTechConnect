/**
 * Category Specific Fields - Renders dynamic fields based on category schema
 */

'use client';

import { useState, useEffect } from 'react';
import { DynamicFormField } from './DynamicFormField';
import { AlertCircle, Loader2 } from 'lucide-react';

interface CategorySpecificFieldsProps {
  categoryId: string;
  specifications: Record<string, unknown>;
  onChange: (specifications: Record<string, unknown>) => void;
  errors?: Record<string, string>;
}

interface FieldDefinition {
  type: 'string' | 'number' | 'boolean' | 'enum' | 'array' | 'object' | 'date' | 'url' | 'email';
  label: string;
  description?: string;
  unit?: string;
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: string;
  options?: string[];
  placeholder?: string;
  default?: any;
}

interface CategorySchema {
  id: string;
  version: string;
  name: string;
  description?: string;
  fields: Record<string, FieldDefinition>;
  requiredFields: string[];
  category: {
    id: string;
    name: string;
  };
}

export function CategorySpecificFields({
  categoryId,
  specifications,
  onChange,
  errors = {}
}: CategorySpecificFieldsProps) {
  const [schema, setSchema] = useState<CategorySchema | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (categoryId) {
      fetchCategorySchema();
    } else {
      setSchema(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  const fetchCategorySchema = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/categories/${categoryId}/schema`);
      const data = await response.json();

      if (data.success) {
        setSchema(data.data);
        
        // Initialize specifications with default values if not already set
        if (data.data.fields && Object.keys(specifications).length === 0) {
          const defaults: Record<string, unknown> = {};
          Object.entries(data.data.fields as Record<string, FieldDefinition>).forEach(([fieldName, fieldDef]) => {
            if (fieldDef.default !== undefined) {
              defaults[fieldName] = fieldDef.default;
            }
          });
          if (Object.keys(defaults).length > 0) {
            onChange(defaults);
          }
        }
      } else {
        // No schema found - this is okay, just means no category-specific fields
        setSchema(null);
        setError(null);
      }
    } catch (err) {
      console.error('Failed to fetch category schema:', err);
      setError('Failed to load category-specific fields');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (fieldName: string, value: unknown) => {
    onChange({
      ...specifications,
      [fieldName]: value
    });
  };

  // Don't show anything if no category is selected
  if (!categoryId) {
    return null;
  }

  // Show loading state
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center space-x-2 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading category-specific fields...</span>
        </div>
      </div>
    );
  }

  // Show error if fetch failed
  if (error) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-yellow-500" />
          <p className="text-sm text-yellow-800">{error}</p>
        </div>
      </div>
    );
  }

  // No schema found - this is okay
  if (!schema || !schema.fields || Object.keys(schema.fields).length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-blue-500" />
          <p className="text-sm text-blue-800">
            No category-specific fields defined for this category yet.
          </p>
        </div>
      </div>
    );
  }

  // Render dynamic fields
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {schema.category.name} Specifications
        </h2>
        {schema.description && (
          <p className="text-sm text-gray-600 mt-1">{schema.description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(schema.fields).map(([fieldName, fieldDef]) => (
          <div key={fieldName} className={fieldDef.type === 'object' ? 'md:col-span-2' : ''}>
            <DynamicFormField
              fieldName={fieldName}
              fieldDef={fieldDef as FieldDefinition}
              value={specifications[fieldName]}
              onChange={handleFieldChange}
              error={errors[fieldName]}
            />
          </div>
        ))}
      </div>

      <div className="mt-4 text-xs text-gray-500">
        Schema version: {schema.version}
      </div>
    </div>
  );
}
