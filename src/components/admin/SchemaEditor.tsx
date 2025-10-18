/**
 * Schema Editor - Visual editor for category schemas with field management
 */

'use client';

import { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  ChevronDown, 
  ChevronUp,
  Info
} from 'lucide-react';

export interface SchemaField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'enum' | 'array' | 'object' | 'date' | 'url' | 'email';
  label: string;
  description?: string;
  required: boolean;
  unit?: string;
  min?: number;
  max?: number;
  pattern?: string;
  options?: string[];
  defaultValue?: string | number | boolean | null;
}

interface SchemaEditorProps {
  fields: SchemaField[];
  onChange: (fields: SchemaField[]) => void;
  requiredFields: string[];
  onRequiredFieldsChange: (fields: string[]) => void;
}

export function SchemaEditor({ 
  fields, 
  onChange, 
  requiredFields, 
  onRequiredFieldsChange 
}: SchemaEditorProps) {
  const [expandedFields, setExpandedFields] = useState<Set<number>>(new Set([0]));
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const addField = () => {
    const newField: SchemaField = {
      name: `field_${fields.length + 1}`,
      type: 'string',
      label: `Field ${fields.length + 1}`,
      required: false
    };
    onChange([...fields, newField]);
    setExpandedFields(new Set([...expandedFields, fields.length]));
  };

  const removeField = (index: number) => {
    const field = fields[index];
    const newFields = fields.filter((_, i) => i !== index);
    onChange(newFields);
    
    // Remove from required fields if present
    if (requiredFields.includes(field.name)) {
      onRequiredFieldsChange(requiredFields.filter(f => f !== field.name));
    }
  };

  const updateField = (index: number, updates: Partial<SchemaField>) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates };
    
    // Update required fields if name changed
    if (updates.name && fields[index].name !== updates.name) {
      const oldName = fields[index].name;
      if (requiredFields.includes(oldName)) {
        onRequiredFieldsChange(
          requiredFields.map(f => f === oldName ? updates.name! : f)
        );
      }
    }
    
    // Update required fields if required flag changed
    if (updates.required !== undefined) {
      if (updates.required && !requiredFields.includes(newFields[index].name)) {
        onRequiredFieldsChange([...requiredFields, newFields[index].name]);
      } else if (!updates.required && requiredFields.includes(newFields[index].name)) {
        onRequiredFieldsChange(requiredFields.filter(f => f !== newFields[index].name));
      }
    }
    
    onChange(newFields);
  };

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedFields);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedFields(newExpanded);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newFields = [...fields];
    const draggedField = newFields[draggedIndex];
    newFields.splice(draggedIndex, 1);
    newFields.splice(index, 0, draggedField);
    
    setDraggedIndex(index);
    onChange(newFields);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-4">
      {/* Field List */}
      <div className="space-y-2">
        {fields.map((field, index) => (
          <div
            key={index}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`bg-white border rounded-lg ${
              draggedIndex === index ? 'opacity-50' : ''
            }`}
          >
            {/* Field Header */}
            <div className="flex items-center p-4 cursor-move hover:bg-gray-50">
              <GripVertical className="w-5 h-5 text-gray-400 mr-3" />
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">{field.label}</span>
                  <span className="text-sm text-gray-500">({field.type})</span>
                  {field.required && (
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">
                      Required
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500">{field.name}</div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => toggleExpanded(index)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  {expandedFields.has(index) ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>
                <button
                  onClick={() => removeField(index)}
                  className="p-1 text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Field Configuration */}
            {expandedFields.has(index) && (
              <div className="border-t p-4 space-y-4 bg-gray-50">
                <div className="grid grid-cols-2 gap-4">
                  {/* Field Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Field Name *
                    </label>
                    <input
                      type="text"
                      value={field.name}
                      onChange={(e) => updateField(index, { name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="field_name"
                    />
                  </div>

                  {/* Field Label */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Label *
                    </label>
                    <input
                      type="text"
                      value={field.label}
                      onChange={(e) => updateField(index, { label: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Field Label"
                    />
                  </div>

                  {/* Field Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type *
                    </label>
                    <select
                      value={field.type}
                      onChange={(e) => updateField(index, { type: e.target.value as SchemaField['type'] })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="string">String</option>
                      <option value="number">Number</option>
                      <option value="boolean">Boolean</option>
                      <option value="enum">Enum (Select)</option>
                      <option value="array">Array</option>
                      <option value="object">Object</option>
                      <option value="date">Date</option>
                      <option value="url">URL</option>
                      <option value="email">Email</option>
                    </select>
                  </div>

                  {/* Required */}
                  <div className="flex items-center">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => updateField(index, { required: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Required Field</span>
                    </label>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={field.description || ''}
                    onChange={(e) => updateField(index, { description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Field description..."
                  />
                </div>

                {/* Type-specific fields */}
                {field.type === 'number' && (
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit
                      </label>
                      <input
                        type="text"
                        value={field.unit || ''}
                        onChange={(e) => updateField(index, { unit: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., cm, kg, watts"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Min Value
                      </label>
                      <input
                        type="number"
                        value={field.min || ''}
                        onChange={(e) => updateField(index, { min: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Value
                      </label>
                      <input
                        type="number"
                        value={field.max || ''}
                        onChange={(e) => updateField(index, { max: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}

                {field.type === 'string' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pattern (Regex)
                    </label>
                    <input
                      type="text"
                      value={field.pattern || ''}
                      onChange={(e) => updateField(index, { pattern: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., ^[A-Z]{2}[0-9]{4}$"
                    />
                  </div>
                )}

                {field.type === 'enum' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Options (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={field.options?.join(', ') || ''}
                      onChange={(e) => updateField(index, { 
                        options: e.target.value.split(',').map(o => o.trim()).filter(Boolean)
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Option 1, Option 2, Option 3"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Field Button */}
      <button
        onClick={addField}
        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center space-x-2"
      >
        <Plus className="w-5 h-5" />
        <span>Add Field</span>
      </button>

      {/* Info */}
      {fields.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">No fields defined yet</p>
            <p>Click &quot;Add Field&quot; to start building your schema. You can drag and drop fields to reorder them.</p>
          </div>
        </div>
      )}
    </div>
  );
}
