/**
 * New Category Form - Interface for creating new device categories
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Trash2, 
  Save, 
  Eye,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';
import { CategoryTemplate, CategorySchema, FieldDefinition, FieldType } from '@/lib/schema/types';

interface FormField {
  id: string;
  name: string;
  type: FieldType;
  required: boolean;
  label: string;
  description: string;
  constraints: any;
  metadata: any;
}

export function NewCategoryForm() {
  const router = useRouter();
  const [templates, setTemplates] = useState<CategoryTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [parentCategory, setParentCategory] = useState('');
  const [fields, setFields] = useState<FormField[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/schemas?template=true');
      const data = await response.json();
      if (data.success) {
        setTemplates(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id === templateId);
    
    if (template) {
      setCategoryName(template.name);
      setCategoryDescription(template.description);
      
      // Convert template fields to form fields
      const templateFields = Object.entries(template.baseSchema.fields || {}).map(([name, field]) => ({
        id: Math.random().toString(36).substring(7),
        name,
        type: field.type,
        required: field.constraints?.required || false,
        label: field.metadata.label,
        description: field.metadata.description || '',
        constraints: field.constraints || {},
        metadata: field.metadata
      }));
      
      setFields(templateFields);
    }
  };

  const addField = () => {
    const newField: FormField = {
      id: Math.random().toString(36).substring(7),
      name: '',
      type: 'string',
      required: false,
      label: '',
      description: '',
      constraints: {},
      metadata: {
        label: '',
        importance: 'medium',
        weight: 0.5,
        searchable: false,
        indexable: false
      }
    };
    setFields([...fields, newField]);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map(field => 
      field.id === id ? { ...field, ...updates } : field
    ));
  };

  const removeField = (id: string) => {
    setFields(fields.filter(field => field.id !== id));
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!categoryName.trim()) {
      errors.push('Category name is required');
    }

    if (!categoryDescription.trim()) {
      errors.push('Category description is required');
    }

    if (fields.length === 0) {
      errors.push('At least one field is required');
    }

    // Validate field names are unique and not empty
    const fieldNames = fields.map(f => f.name.trim()).filter(Boolean);
    const uniqueNames = new Set(fieldNames);
    
    if (fieldNames.length !== uniqueNames.size) {
      errors.push('Field names must be unique');
    }

    fields.forEach((field, index) => {
      if (!field.name.trim()) {
        errors.push(`Field ${index + 1}: Name is required`);
      }
      if (!field.label.trim()) {
        errors.push(`Field ${index + 1}: Label is required`);
      }
    });

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Convert form fields to schema format
      const schemaFields: Record<string, FieldDefinition> = {};
      fields.forEach(field => {
        schemaFields[field.name] = {
          type: field.type,
          constraints: {
            ...field.constraints,
            required: field.required
          },
          metadata: {
            ...field.metadata,
            label: field.label,
            description: field.description
          }
        };
      });

      const schema: Partial<CategorySchema> = {
        id: categoryName.toLowerCase().replace(/\s+/g, '-'),
        name: categoryName,
        description: categoryDescription,
        parentId: parentCategory || undefined,
        fields: schemaFields,
        requiredFields: fields.filter(f => f.required).map(f => f.name),
        version: '1.0.0',
        createdBy: 'admin' // TODO: Get from auth context
      };

      const response = await fetch('/api/schemas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schema })
      });

      if (response.ok) {
        router.push('/admin/categories');
      } else {
        const error = await response.json();
        setValidationErrors([error.error || 'Failed to create category']);
      }
    } catch (error) {
      console.error('Failed to create category:', error);
      setValidationErrors(['Failed to create category']);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <h3 className="text-sm font-medium text-red-800">Please fix the following errors:</h3>
          </div>
          <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Template Selection */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Start from Template (Optional)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => handleTemplateSelect(template.id)}
              className={`p-4 border rounded-lg text-left transition-colors ${
                selectedTemplate === template.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <h3 className="font-medium text-gray-900">{template.name}</h3>
              <p className="text-sm text-gray-600 mt-1">{template.description}</p>
              <div className="flex items-center space-x-2 mt-2">
                {template.tags?.map((tag) => (
                  <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                    {tag}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Basic Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category Name *
            </label>
            <input
              type="text"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Gaming Consoles"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Parent Category
            </label>
            <select
              value={parentCategory}
              onChange={(e) => setParentCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">None (Top Level)</option>
              {/* TODO: Load existing categories */}
              <option value="electronics">Electronics</option>
              <option value="gaming">Gaming</option>
              <option value="audio">Audio</option>
            </select>
          </div>
        </div>
        
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            value={categoryDescription}
            onChange={(e) => setCategoryDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Describe what types of devices belong to this category..."
          />
        </div>
      </div>

      {/* Field Definitions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Field Definitions</h2>
          <button
            onClick={addField}
            className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Field
          </button>
        </div>

        <div className="space-y-4">
          {fields.map((field, index) => (
            <FieldEditor
              key={field.id}
              field={field}
              index={index}
              onUpdate={(updates) => updateField(field.id, updates)}
              onRemove={() => removeField(field.id)}
            />
          ))}
          
          {fields.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Info className="w-8 h-8 mx-auto mb-2" />
              <p>No fields defined yet. Add fields to specify what information devices in this category should have.</p>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsPreviewMode(!isPreviewMode)}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
        >
          <Eye className="w-4 h-4 mr-2" />
          {isPreviewMode ? 'Edit' : 'Preview'}
        </button>
        
        <div className="flex space-x-3">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Create Category
          </button>
        </div>
      </div>
    </div>
  );
}

interface FieldEditorProps {
  field: FormField;
  index: number;
  onUpdate: (updates: Partial<FormField>) => void;
  onRemove: () => void;
}

function FieldEditor({ field, index, onUpdate, onRemove }: FieldEditorProps) {
  const fieldTypes: FieldType[] = ['string', 'number', 'boolean', 'enum', 'array', 'object', 'date', 'url', 'email'];

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-900">Field {index + 1}</h3>
        <button
          onClick={onRemove}
          className="p-1 text-gray-400 hover:text-red-600"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Field Name *
          </label>
          <input
            type="text"
            value={field.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            placeholder="e.g., screenSize"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type *
          </label>
          <select
            value={field.type}
            onChange={(e) => onUpdate({ type: e.target.value as FieldType })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            {fieldTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Label *
          </label>
          <input
            type="text"
            value={field.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            placeholder="e.g., Screen Size"
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <input
          type="text"
          value={field.description}
          onChange={(e) => onUpdate({ description: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          placeholder="Describe what this field represents..."
        />
      </div>

      <div className="mt-4 flex items-center space-x-6">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={field.required}
            onChange={(e) => onUpdate({ required: e.target.checked })}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700">Required</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={field.metadata.searchable}
            onChange={(e) => onUpdate({ 
              metadata: { ...field.metadata, searchable: e.target.checked }
            })}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700">Searchable</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={field.metadata.indexable}
            onChange={(e) => onUpdate({ 
              metadata: { ...field.metadata, indexable: e.target.checked }
            })}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700">Indexable</span>
        </label>
      </div>
    </div>
  );
}