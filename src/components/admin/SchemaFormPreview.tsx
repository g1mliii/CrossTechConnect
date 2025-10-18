/**
 * Schema Form Preview - Real-time preview of how the device form will look
 */

'use client';

import { Eye } from 'lucide-react';
import { SchemaField } from './SchemaEditor';

interface SchemaFormPreviewProps {
  fields: SchemaField[];
  categoryName?: string;
}

export function SchemaFormPreview({ fields, categoryName }: SchemaFormPreviewProps) {
  const renderField = (field: SchemaField) => {
    const baseClasses = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent";
    
    switch (field.type) {
      case 'string':
      case 'url':
      case 'email':
        return (
          <input
            type={field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : 'text'}
            placeholder={`Enter ${field.label.toLowerCase()}...`}
            className={baseClasses}
            disabled
          />
        );
      
      case 'number':
        return (
          <div className="flex items-center space-x-2">
            <input
              type="number"
              placeholder={`Enter ${field.label.toLowerCase()}...`}
              min={field.min}
              max={field.max}
              className={baseClasses}
              disabled
            />
            {field.unit && (
              <span className="text-sm text-gray-500 whitespace-nowrap">{field.unit}</span>
            )}
          </div>
        );
      
      case 'boolean':
        return (
          <label className="flex items-center space-x-2 cursor-not-allowed">
            <input
              type="checkbox"
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              disabled
            />
            <span className="text-sm text-gray-700">Enable {field.label}</span>
          </label>
        );
      
      case 'enum':
        return (
          <select className={baseClasses} disabled>
            <option value="">Select {field.label.toLowerCase()}...</option>
            {field.options?.map((option, idx) => (
              <option key={idx} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      
      case 'date':
        return (
          <input
            type="date"
            className={baseClasses}
            disabled
          />
        );
      
      case 'array':
        return (
          <div className="space-y-2">
            <input
              type="text"
              placeholder={`Add ${field.label.toLowerCase()}...`}
              className={baseClasses}
              disabled
            />
            <button
              className="text-sm text-blue-600 hover:text-blue-700"
              disabled
            >
              + Add another
            </button>
          </div>
        );
      
      case 'object':
        return (
          <textarea
            rows={3}
            placeholder={`Enter ${field.label.toLowerCase()} as JSON...`}
            className={baseClasses}
            disabled
          />
        );
      
      default:
        return (
          <input
            type="text"
            placeholder={`Enter ${field.label.toLowerCase()}...`}
            className={baseClasses}
            disabled
          />
        );
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Eye className="w-5 h-5 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900">Form Preview</h3>
        {categoryName && (
          <span className="text-sm text-gray-500">({categoryName})</span>
        )}
      </div>

      {fields.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No fields to preview</p>
          <p className="text-sm mt-1">Add fields to see how the form will look</p>
        </div>
      ) : (
        <div className="space-y-6 bg-gray-50 p-6 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600 mb-4">
            This is how the device creation/edit form will appear to users:
          </div>
          
          {fields.map((field, index) => (
            <div key={index}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              {field.description && (
                <p className="text-sm text-gray-500 mb-2">{field.description}</p>
              )}
              {renderField(field)}
              {field.min !== undefined && field.max !== undefined && (
                <p className="text-xs text-gray-500 mt-1">
                  Range: {field.min} - {field.max}
                </p>
              )}
              {field.pattern && (
                <p className="text-xs text-gray-500 mt-1">
                  Pattern: {field.pattern}
                </p>
              )}
            </div>
          ))}

          <div className="pt-4 border-t border-gray-300">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-lg opacity-50 cursor-not-allowed"
              disabled
            >
              Save Device
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
