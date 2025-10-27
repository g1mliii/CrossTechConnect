/**
 * Compatibility Rule Builder - Dynamic rule builder based on device category standards
 */

'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, AlertCircle, Settings } from 'lucide-react';
import { DynamicFormField } from './DynamicFormField';

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

interface CategorySchema {
  id: string;
  version: string;
  name: string;
  fields: Record<string, FieldDefinition>;
  category: {
    id: string;
    name: string;
  };
}

interface CompatibilityRule {
  id?: string;
  name: string;
  description: string;
  sourceCategoryId: string;
  targetCategoryId: string;
  sourceField: string;
  targetField: string;
  condition: string;
  compatibilityType: 'full' | 'partial' | 'none';
  message: string;
  limitations: string[];
  recommendations: string[];
}

interface CompatibilityRuleBuilderProps {
  categoryId?: string;
  onSave?: (rule: CompatibilityRule) => void;
  onCancel?: () => void;
  existingRule?: CompatibilityRule;
}

export function CompatibilityRuleBuilder({
  categoryId,
  onSave,
  onCancel,
  existingRule
}: CompatibilityRuleBuilderProps) {
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [sourceSchema, setSourceSchema] = useState<CategorySchema | null>(null);
  const [targetSchema, setTargetSchema] = useState<CategorySchema | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [rule, setRule] = useState<CompatibilityRule>({
    name: '',
    description: '',
    sourceCategoryId: categoryId || '',
    targetCategoryId: '',
    sourceField: '',
    targetField: '',
    condition: '',
    compatibilityType: 'full',
    message: '',
    limitations: [],
    recommendations: [],
    ...existingRule
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (rule.sourceCategoryId) {
      fetchCategorySchema(rule.sourceCategoryId, 'source');
    }
  }, [rule.sourceCategoryId]);

  useEffect(() => {
    if (rule.targetCategoryId) {
      fetchCategorySchema(rule.targetCategoryId, 'target');
    }
  }, [rule.targetCategoryId]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchCategorySchema = async (categoryId: string, type: 'source' | 'target') => {
    try {
      const response = await fetch(`/api/categories/${categoryId}/schema`);
      const data = await response.json();
      
      if (data.success) {
        if (type === 'source') {
          setSourceSchema(data.data);
        } else {
          setTargetSchema(data.data);
        }
      }
    } catch (error) {
      console.error(`Failed to fetch ${type} schema:`, error);
    }
  };

  const updateRule = (field: keyof CompatibilityRule, value: any) => {
    setRule(prev => ({ ...prev, [field]: value }));
    
    // Clear field selections when category changes
    if (field === 'sourceCategoryId') {
      setRule(prev => ({ ...prev, sourceField: '' }));
    }
    if (field === 'targetCategoryId') {
      setRule(prev => ({ ...prev, targetField: '' }));
    }
  };

  const addLimitation = () => {
    setRule(prev => ({
      ...prev,
      limitations: [...prev.limitations, '']
    }));
  };

  const updateLimitation = (index: number, value: string) => {
    setRule(prev => ({
      ...prev,
      limitations: prev.limitations.map((item, i) => i === index ? value : item)
    }));
  };

  const removeLimitation = (index: number) => {
    setRule(prev => ({
      ...prev,
      limitations: prev.limitations.filter((_, i) => i !== index)
    }));
  };

  const addRecommendation = () => {
    setRule(prev => ({
      ...prev,
      recommendations: [...prev.recommendations, '']
    }));
  };

  const updateRecommendation = (index: number, value: string) => {
    setRule(prev => ({
      ...prev,
      recommendations: prev.recommendations.map((item, i) => i === index ? value : item)
    }));
  };

  const removeRecommendation = (index: number) => {
    setRule(prev => ({
      ...prev,
      recommendations: prev.recommendations.filter((_, i) => i !== index)
    }));
  };

  const generateConditionTemplate = () => {
    if (!rule.sourceField || !rule.targetField) {
      return;
    }

    // Try to get field definitions from schemas if available
    const sourceFieldDef = sourceSchema?.fields?.[rule.sourceField];
    const targetFieldDef = targetSchema?.fields?.[rule.targetField];

    let template = '';
    
    // If we have schema field definitions, use them
    if (sourceFieldDef && targetFieldDef) {
      if (sourceFieldDef.type === 'number' && targetFieldDef.type === 'number') {
        template = `source >= target * 0.8`; // 80% compatibility threshold
      } else if (sourceFieldDef.type === 'string' && targetFieldDef.type === 'string') {
        template = `source.toLowerCase() === target.toLowerCase()`;
      } else if (sourceFieldDef.type === 'enum' && targetFieldDef.type === 'enum') {
        template = `source === target`;
      } else if (sourceFieldDef.type === 'array' && targetFieldDef.type === 'array') {
        template = `source.some(item => target.includes(item))`;
      } else {
        template = `source === target`;
      }
    } else {
      // Fallback: infer type from field name for basic device fields
      const numberFields = ['width_cm', 'height_cm', 'depth_cm', 'weight_kg', 'power_watts'];
      const stringFields = ['name', 'brand', 'model', 'description', 'power_type'];
      
      if (numberFields.includes(rule.sourceField) && numberFields.includes(rule.targetField)) {
        template = `source >= target * 0.8`;
      } else if (stringFields.includes(rule.sourceField) && stringFields.includes(rule.targetField)) {
        template = `source.toLowerCase() === target.toLowerCase()`;
      } else {
        template = `source === target`;
      }
    }

    setRule(prev => ({ ...prev, condition: template }));
  };

  const validateRule = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!rule.name.trim()) {
      newErrors.name = 'Rule name is required';
    }

    if (!rule.sourceCategoryId) {
      newErrors.sourceCategoryId = 'Source category is required';
    }

    if (!rule.targetCategoryId) {
      newErrors.targetCategoryId = 'Target category is required';
    }

    if (!rule.sourceField) {
      newErrors.sourceField = 'Source field is required';
    }

    if (!rule.targetField) {
      newErrors.targetField = 'Target field is required';
    }

    if (!rule.condition.trim()) {
      newErrors.condition = 'Condition is required';
    }

    if (!rule.message.trim()) {
      newErrors.message = 'Message is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateRule()) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/compatibility/rules', {
        method: existingRule ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rule)
      });

      if (response.ok) {
        const data = await response.json();
        onSave?.(data.data);
      } else {
        const error = await response.json();
        setErrors({ general: error.error || 'Failed to save rule' });
      }
    } catch (error) {
      console.error('Failed to save rule:', error);
      setErrors({ general: 'Failed to save rule' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          {existingRule ? 'Edit' : 'Create'} Compatibility Rule
        </h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={generateConditionTemplate}
            disabled={!rule.sourceField || !rule.targetField}
            className="inline-flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            title="Auto-generate condition based on field types"
          >
            <Settings className="w-4 h-4 mr-2" />
            Generate Template
          </button>
        </div>
      </div>

      {/* General Errors */}
      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-sm text-red-800">{errors.general}</p>
          </div>
        </div>
      )}

      {/* Basic Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rule Name *
            </label>
            <input
              type="text"
              value={rule.name}
              onChange={(e) => updateRule('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="e.g., Power Supply Compatibility"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Compatibility Type
            </label>
            <select
              value={rule.compatibilityType}
              onChange={(e) => updateRule('compatibilityType', e.target.value as 'full' | 'partial' | 'none')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="full">Full Compatibility</option>
              <option value="partial">Partial Compatibility</option>
              <option value="none">No Compatibility</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={rule.description}
              onChange={(e) => updateRule('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe what this rule checks for..."
            />
          </div>
        </div>
      </div>

      {/* Category and Field Selection */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Field Mapping</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Source Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Source Category *
            </label>
            <select
              value={rule.sourceCategoryId}
              onChange={(e) => updateRule('sourceCategoryId', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.sourceCategoryId ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Select source category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            {errors.sourceCategoryId && <p className="mt-1 text-sm text-red-600">{errors.sourceCategoryId}</p>}
          </div>

          {/* Target Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Category *
            </label>
            <select
              value={rule.targetCategoryId}
              onChange={(e) => updateRule('targetCategoryId', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.targetCategoryId ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Select target category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            {errors.targetCategoryId && <p className="mt-1 text-sm text-red-600">{errors.targetCategoryId}</p>}
          </div>

          {/* Source Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Source Field *
            </label>
            <select
              value={rule.sourceField}
              onChange={(e) => updateRule('sourceField', e.target.value)}
              disabled={!rule.sourceCategoryId}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.sourceField ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Select source field</option>
              <optgroup label="Basic Device Fields">
                <option value="name">Device Name</option>
                <option value="brand">Brand</option>
                <option value="model">Model</option>
                <option value="width_cm">Width (cm)</option>
                <option value="height_cm">Height (cm)</option>
                <option value="depth_cm">Depth (cm)</option>
                <option value="weight_kg">Weight (kg)</option>
                <option value="power_watts">Power (watts)</option>
                <option value="power_type">Power Type</option>
              </optgroup>
              {sourceSchema && sourceSchema.fields && Object.keys(sourceSchema.fields).length > 0 && (
                <optgroup label="Category-Specific Fields">
                  {Object.entries(sourceSchema.fields).map(([fieldName, fieldDef]) => (
                    <option key={fieldName} value={fieldName}>
                      {fieldDef.label} ({fieldDef.type})
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            {errors.sourceField && <p className="mt-1 text-sm text-red-600">{errors.sourceField}</p>}
          </div>

          {/* Target Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Field *
            </label>
            <select
              value={rule.targetField}
              onChange={(e) => updateRule('targetField', e.target.value)}
              disabled={!rule.targetCategoryId}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.targetField ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Select target field</option>
              <optgroup label="Basic Device Fields">
                <option value="name">Device Name</option>
                <option value="brand">Brand</option>
                <option value="model">Model</option>
                <option value="width_cm">Width (cm)</option>
                <option value="height_cm">Height (cm)</option>
                <option value="depth_cm">Depth (cm)</option>
                <option value="weight_kg">Weight (kg)</option>
                <option value="power_watts">Power (watts)</option>
                <option value="power_type">Power Type</option>
              </optgroup>
              {targetSchema && targetSchema.fields && Object.keys(targetSchema.fields).length > 0 && (
                <optgroup label="Category-Specific Fields">
                  {Object.entries(targetSchema.fields).map(([fieldName, fieldDef]) => (
                    <option key={fieldName} value={fieldName}>
                      {fieldDef.label} ({fieldDef.type})
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            {errors.targetField && <p className="mt-1 text-sm text-red-600">{errors.targetField}</p>}
          </div>
        </div>
      </div>

      {/* Condition */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Compatibility Condition</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            JavaScript Condition *
          </label>
          <textarea
            value={rule.condition}
            onChange={(e) => updateRule('condition', e.target.value)}
            rows={4}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm ${
              errors.condition ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="e.g., source >= target * 0.8"
          />
          {errors.condition && <p className="mt-1 text-sm text-red-600">{errors.condition}</p>}
          <p className="mt-2 text-xs text-gray-500">
            Use &apos;source&apos; and &apos;target&apos; to reference field values. Example: source &gt;= target * 0.8
          </p>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Result Message *
          </label>
          <input
            type="text"
            value={rule.message}
            onChange={(e) => updateRule('message', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.message ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="e.g., Power supply provides sufficient wattage"
          />
          {errors.message && <p className="mt-1 text-sm text-red-600">{errors.message}</p>}
        </div>
      </div>

      {/* Limitations */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Limitations</h3>
          <button
            onClick={addLimitation}
            className="inline-flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Limitation
          </button>
        </div>
        
        <div className="space-y-3">
          {rule.limitations.map((limitation, index) => (
            <div key={index} className="flex items-center space-x-3">
              <input
                type="text"
                value={limitation}
                onChange={(e) => updateLimitation(index, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe a limitation..."
              />
              <button
                onClick={() => removeLimitation(index)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          
          {rule.limitations.length === 0 && (
            <p className="text-sm text-gray-500 italic">No limitations defined</p>
          )}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Recommendations</h3>
          <button
            onClick={addRecommendation}
            className="inline-flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Recommendation
          </button>
        </div>
        
        <div className="space-y-3">
          {rule.recommendations.map((recommendation, index) => (
            <div key={index} className="flex items-center space-x-3">
              <input
                type="text"
                value={recommendation}
                onChange={(e) => updateRecommendation(index, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Provide a recommendation..."
              />
              <button
                onClick={() => removeRecommendation(index)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          
          {rule.recommendations.length === 0 && (
            <p className="text-sm text-gray-500 italic">No recommendations defined</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end space-x-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {existingRule ? 'Update' : 'Create'} Rule
        </button>
      </div>
    </div>
  );
}