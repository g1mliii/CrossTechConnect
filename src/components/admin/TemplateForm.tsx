/**
 * Template Form - Create/Edit template with schema builder
 */

'use client';

import { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Save,
  Eye,
  EyeOff,
  AlertCircle,
  Tag,
  FileText
} from 'lucide-react';

interface TemplateFormProps {
  template?: {
    id: string;
    name: string;
    description: string;
    baseSchema: any;
    exampleDevices: string[];
    tags: string[];
  };
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: any) => Promise<void>;
}

interface SchemaField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  description: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    enum?: string[];
  };
}

export function TemplateForm({ template, isOpen, onClose, onSave }: TemplateFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tags: [] as string[],
    exampleDevices: [] as string[]
  });
  
  const [schemaFields, setSchemaFields] = useState<SchemaField[]>([]);
  const [newTag, setNewTag] = useState('');
  const [newDevice, setNewDevice] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        description: template.description,
        tags: template.tags,
        exampleDevices: template.exampleDevices
      });
      
      // Convert baseSchema to SchemaField array
      const fields = Object.entries(template.baseSchema.properties || {}).map(([name, field]: [string, any]) => ({
        name,
        type: field.type,
        required: template.baseSchema.required?.includes(name) || false,
        description: field.description || '',
        validation: {
          min: field.minimum,
          max: field.maximum,
          pattern: field.pattern,
          enum: field.enum
        }
      }));
      setSchemaFields(fields);
    } else {
      // Reset form for new template
      setFormData({
        name: '',
        description: '',
        tags: [],
        exampleDevices: []
      });
      setSchemaFields([]);
    }
    setErrors({});
  }, [template, isOpen]);

  const addSchemaField = () => {
    setSchemaFields([...schemaFields, {
      name: '',
      type: 'string',
      required: false,
      description: ''
    }]);
  };

  const updateSchemaField = (index: number, updates: Partial<SchemaField>) => {
    const updated = [...schemaFields];
    updated[index] = { ...updated[index], ...updates };
    setSchemaFields(updated);
  };

  const removeSchemaField = (index: number) => {
    setSchemaFields(schemaFields.filter((_, i) => i !== index));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()]
      });
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag)
    });
  };

  const addExampleDevice = () => {
    if (newDevice.trim() && !formData.exampleDevices.includes(newDevice.trim())) {
      setFormData({
        ...formData,
        exampleDevices: [...formData.exampleDevices, newDevice.trim()]
      });
      setNewDevice('');
    }
  };

  const removeExampleDevice = (device: string) => {
    setFormData({
      ...formData,
      exampleDevices: formData.exampleDevices.filter(d => d !== device)
    });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Template name is required';
    }

    if (schemaFields.length === 0) {
      newErrors.schema = 'At least one schema field is required';
    }

    // Validate schema fields
    schemaFields.forEach((field, index) => {
      if (!field.name.trim()) {
        newErrors[`field_${index}_name`] = 'Field name is required';
      }
      if (schemaFields.filter(f => f.name === field.name).length > 1) {
        newErrors[`field_${index}_name`] = 'Field name must be unique';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateBaseSchema = () => {
    const properties: Record<string, any> = {};
    const required: string[] = [];

    schemaFields.forEach(field => {
      properties[field.name] = {
        type: field.type,
        description: field.description
      };

      if (field.validation) {
        if (field.validation.min !== undefined) properties[field.name].minimum = field.validation.min;
        if (field.validation.max !== undefined) properties[field.name].maximum = field.validation.max;
        if (field.validation.pattern) properties[field.name].pattern = field.validation.pattern;
        if (field.validation.enum) properties[field.name].enum = field.validation.enum;
      }

      if (field.required) {
        required.push(field.name);
      }
    });

    return {
      type: 'object',
      properties,
      required
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const templateData = {
        ...formData,
        baseSchema: generateBaseSchema()
      };

      await onSave(templateData);
      onClose();
    } catch (error) {
      console.error('Error saving template:', error);
      setErrors({ submit: 'Failed to save template' });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              {template ? 'Edit Template' : 'New Template'}
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="p-2 text-gray-400 hover:text-gray-600"
              title={showPreview ? 'Hide Preview' : 'Show Preview'}
            >
              {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Form */}
          <div className={`${showPreview ? 'w-1/2' : 'w-full'} overflow-y-auto p-6`}>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Gaming Console Template"
                  />
                  {errors.name && (
                    <p className="text-red-600 text-sm mt-1 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe what this template is for..."
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Add tag..."
                    />
                    <button
                      type="button"
                      onClick={addTag}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Example Devices */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Example Devices
                  </label>
                  <div className="space-y-2 mb-2">
                    {formData.exampleDevices.map(device => (
                      <div key={device} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-700">{device}</span>
                        <button
                          type="button"
                          onClick={() => removeExampleDevice(device)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newDevice}
                      onChange={(e) => setNewDevice(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addExampleDevice())}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Add example device..."
                    />
                    <button
                      type="button"
                      onClick={addExampleDevice}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Schema Builder */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Schema Fields</h3>
                  <button
                    type="button"
                    onClick={addSchemaField}
                    className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Field
                  </button>
                </div>

                {errors.schema && (
                  <p className="text-red-600 text-sm flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.schema}
                  </p>
                )}

                <div className="space-y-4">
                  {schemaFields.map((field, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-700">Field {index + 1}</h4>
                        <button
                          type="button"
                          onClick={() => removeSchemaField(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Field Name *
                          </label>
                          <input
                            type="text"
                            value={field.name}
                            onChange={(e) => updateSchemaField(index, { name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="e.g., resolution"
                          />
                          {errors[`field_${index}_name`] && (
                            <p className="text-red-600 text-xs mt-1">{errors[`field_${index}_name`]}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Type
                          </label>
                          <select
                            value={field.type}
                            onChange={(e) => updateSchemaField(index, { type: e.target.value as any })}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="string">String</option>
                            <option value="number">Number</option>
                            <option value="boolean">Boolean</option>
                            <option value="array">Array</option>
                            <option value="object">Object</option>
                          </select>
                        </div>

                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Description
                          </label>
                          <input
                            type="text"
                            value={field.description}
                            onChange={(e) => updateSchemaField(index, { description: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Describe this field..."
                          />
                        </div>

                        <div className="col-span-2">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={(e) => updateSchemaField(index, { required: e.target.checked })}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-xs font-medium text-gray-600">Required field</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {errors.submit && (
                <p className="text-red-600 text-sm flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.submit}
                </p>
              )}
            </form>
          </div>

          {/* Preview */}
          {showPreview && (
            <div className="w-1/2 border-l border-gray-200 overflow-y-auto p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Preview</h3>
              <pre className="text-xs bg-gray-50 p-4 rounded-lg overflow-auto">
                {JSON.stringify(generateBaseSchema(), null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {template ? 'Update Template' : 'Create Template'}
          </button>
        </div>
      </div>
    </div>
  );
}