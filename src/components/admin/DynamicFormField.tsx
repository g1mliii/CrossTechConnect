/**
 * Dynamic Form Field - Renders form fields based on schema definition
 */

'use client';

import { AlertCircle } from 'lucide-react';

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
  default?: unknown;
}

interface DynamicFormFieldProps {
  fieldName: string;
  fieldDef: FieldDefinition;
  value: unknown;
  onChange: (fieldName: string, value: unknown) => void;
  error?: string;
}

export function DynamicFormField({ 
  fieldName, 
  fieldDef, 
  value, 
  onChange,
  error 
}: DynamicFormFieldProps) {
  
  const renderField = () => {
    const baseClasses = `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
      error ? 'border-red-300' : 'border-gray-300'
    }`;

    switch (fieldDef.type) {
      case 'string':
      case 'url':
      case 'email':
        return (
          <input
            type={fieldDef.type === 'url' ? 'url' : fieldDef.type === 'email' ? 'email' : 'text'}
            value={String(value || '')}
            onChange={(e) => onChange(fieldName, e.target.value)}
            className={baseClasses}
            placeholder={fieldDef.placeholder || fieldDef.label}
            pattern={fieldDef.pattern}
            required={fieldDef.required}
          />
        );

      case 'number':
        return (
          <div className="relative">
            <input
              type="number"
              value={typeof value === 'number' ? value : ''}
              onChange={(e) => onChange(fieldName, e.target.value ? parseFloat(e.target.value) : null)}
              className={baseClasses}
              placeholder={fieldDef.placeholder || '0'}
              min={fieldDef.min}
              max={fieldDef.max}
              step="any"
              required={fieldDef.required}
            />
            {fieldDef.unit && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                {fieldDef.unit}
              </span>
            )}
          </div>
        );

      case 'boolean':
        return (
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={typeof value === 'boolean' ? value : false}
              onChange={(e) => onChange(fieldName, e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              {fieldDef.description || 'Enable this option'}
            </span>
          </label>
        );

      case 'enum':
        return (
          <select
            value={String(value || '')}
            onChange={(e) => onChange(fieldName, e.target.value)}
            className={baseClasses}
            required={fieldDef.required}
          >
            <option value="">Select {fieldDef.label}</option>
            {fieldDef.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'date':
        return (
          <input
            type="date"
            value={String(value || '')}
            onChange={(e) => onChange(fieldName, e.target.value)}
            className={baseClasses}
            required={fieldDef.required}
          />
        );

      case 'array':
        // Simple array input - comma-separated values
        return (
          <div>
            <input
              type="text"
              value={Array.isArray(value) ? value.join(', ') : ''}
              onChange={(e) => {
                const arrayValue = e.target.value
                  .split(',')
                  .map(v => v.trim())
                  .filter(v => v.length > 0);
                onChange(fieldName, arrayValue);
              }}
              className={baseClasses}
              placeholder="Enter values separated by commas"
              required={fieldDef.required}
            />
            <p className="mt-1 text-xs text-gray-500">
              Enter multiple values separated by commas
            </p>
          </div>
        );

      case 'object':
        // Simple JSON object input
        return (
          <div>
            <textarea
              value={typeof value === 'object' ? JSON.stringify(value, null, 2) : ''}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  onChange(fieldName, parsed);
                } catch {
                  // Invalid JSON, keep as string for now
                  onChange(fieldName, e.target.value);
                }
              }}
              className={baseClasses}
              rows={4}
              placeholder='{"key": "value"}'
              required={fieldDef.required}
            />
            <p className="mt-1 text-xs text-gray-500">
              Enter valid JSON object
            </p>
          </div>
        );

      default:
        return (
          <input
            type="text"
            value={String(value || '')}
            onChange={(e) => onChange(fieldName, e.target.value)}
            className={baseClasses}
            placeholder={fieldDef.placeholder || fieldDef.label}
          />
        );
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {fieldDef.label}
        {fieldDef.required && <span className="text-red-500 ml-1">*</span>}
        {fieldDef.unit && <span className="text-gray-500 ml-1">({fieldDef.unit})</span>}
      </label>
      
      {fieldDef.description && fieldDef.type !== 'boolean' && (
        <p className="text-xs text-gray-500 mb-2">{fieldDef.description}</p>
      )}
      
      {renderField()}
      
      {error && (
        <div className="flex items-center space-x-1 mt-1 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
      
      {fieldDef.min !== undefined && fieldDef.max !== undefined && fieldDef.type === 'number' && (
        <p className="mt-1 text-xs text-gray-500">
          Range: {fieldDef.min} - {fieldDef.max}
        </p>
      )}
    </div>
  );
}
