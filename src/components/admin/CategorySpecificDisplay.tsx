/**
 * Category Specific Display - Shows category-specific specifications in read-only format
 */

'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';

interface CategorySpecificDisplayProps {
  deviceId: string;
  categoryId: string;
}

interface FieldDefinition {
  type: 'string' | 'number' | 'boolean' | 'enum' | 'array' | 'object' | 'date' | 'url' | 'email';
  label: string;
  description?: string;
  unit?: string;
}

interface DeviceSpecification {
  specifications: Record<string, unknown>;
  schema: {
    fields: Record<string, FieldDefinition>;
    version: string;
  };
  category: {
    name: string;
  };
}

export function CategorySpecificDisplay({ deviceId, categoryId }: CategorySpecificDisplayProps) {
  const [specification, setSpecification] = useState<DeviceSpecification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (deviceId && categoryId) {
      fetchSpecifications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId, categoryId]);

  const fetchSpecifications = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/devices/${deviceId}/specifications`);
      const data = await response.json();

      if (data.success) {
        setSpecification(data.data);
      } else {
        // No specifications found - this is okay
        setSpecification(null);
      }
    } catch (err) {
      console.error('Failed to fetch specifications:', err);
      setError('Failed to load category-specific specifications');
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (value: unknown, fieldDef: FieldDefinition): string => {
    if (value === null || value === undefined) {
      return 'N/A';
    }

    switch (fieldDef.type) {
      case 'boolean':
        return value ? 'Yes' : 'No';
      
      case 'array':
        return Array.isArray(value) ? value.join(', ') : String(value);
      
      case 'object':
        return typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
      
      case 'date':
        try {
          return new Date(String(value)).toLocaleDateString();
        } catch {
          return String(value);
        }
      
      case 'url':
      case 'email':
        return String(value);
      
      case 'number':
        return fieldDef.unit ? `${value} ${fieldDef.unit}` : String(value);
      
      default:
        return String(value);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center space-x-2 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading specifications...</span>
        </div>
      </div>
    );
  }

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

  if (!specification || !specification.specifications || Object.keys(specification.specifications).length === 0) {
    return null; // Don't show anything if no specifications exist
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {specification.category.name} Specifications
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Schema version: {specification.schema.version}
        </p>
      </div>

      <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(specification.specifications).map(([fieldName, value]) => {
          const fieldDef = specification.schema.fields[fieldName];
          
          if (!fieldDef) {
            return null; // Skip fields not in schema
          }

          const isUrl = fieldDef.type === 'url';
          const isEmail = fieldDef.type === 'email';
          const isObject = fieldDef.type === 'object';
          const formattedValue = formatValue(value, fieldDef);

          return (
            <div key={fieldName} className={isObject ? 'md:col-span-2' : ''}>
              <dt className="text-sm font-medium text-gray-500">
                {fieldDef.label}
                {fieldDef.description && (
                  <span className="block text-xs font-normal text-gray-400 mt-0.5">
                    {fieldDef.description}
                  </span>
                )}
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {isUrl ? (
                  <a
                    href={formattedValue}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {formattedValue}
                  </a>
                ) : isEmail ? (
                  <a href={`mailto:${formattedValue}`} className="text-blue-600 hover:underline">
                    {formattedValue}
                  </a>
                ) : isObject ? (
                  <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                    {formattedValue}
                  </pre>
                ) : (
                  formattedValue
                )}
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
