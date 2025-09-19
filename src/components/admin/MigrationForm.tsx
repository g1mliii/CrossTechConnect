/**
 * Migration Form - Create new migration with operation builder
 */

'use client';

import { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Save,
  Database,
  AlertCircle,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface MigrationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (migration: any) => Promise<void>;
}

interface MigrationOperation {
  type: 'add_field' | 'remove_field' | 'modify_field' | 'add_validation' | 'remove_validation';
  field: string;
  fieldType?: string;
  required?: boolean;
  description: string;
  validation?: any;
  originalType?: string;
  originalRequired?: boolean;
  originalValidation?: any;
}

interface DeviceCategory {
  id: string;
  name: string;
}

export function MigrationForm({ isOpen, onClose, onSave }: MigrationFormProps) {
  const [formData, setFormData] = useState({
    categoryId: '',
    fromVersion: '',
    toVersion: '',
    autoApply: false
  });
  
  const [operations, setOperations] = useState<MigrationOperation[]>([]);
  const [categories, setCategories] = useState<DeviceCategory[]>([]);
  const [loading, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [expandedOperations, setExpandedOperations] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      // Reset form
      setFormData({
        categoryId: '',
        fromVersion: '',
        toVersion: '',
        autoApply: false
      });
      setOperations([]);
      setErrors({});
      setExpandedOperations(new Set());
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const result = await response.json();
      if (result.success) {
        setCategories(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const addOperation = () => {
    setOperations([...operations, {
      type: 'add_field',
      field: '',
      fieldType: 'string',
      required: false,
      description: ''
    }]);
    // Expand the new operation
    setExpandedOperations(new Set([...expandedOperations, operations.length]));
  };

  const updateOperation = (index: number, updates: Partial<MigrationOperation>) => {
    const updated = [...operations];
    updated[index] = { ...updated[index], ...updates };
    setOperations(updated);
  };

  const removeOperation = (index: number) => {
    setOperations(operations.filter((_, i) => i !== index));
    const newExpanded = new Set(expandedOperations);
    newExpanded.delete(index);
    // Adjust indices for remaining operations
    const adjustedExpanded = new Set<number>();
    newExpanded.forEach(i => {
      if (i < index) {
        adjustedExpanded.add(i);
      } else if (i > index) {
        adjustedExpanded.add(i - 1);
      }
    });
    setExpandedOperations(adjustedExpanded);
  };

  const toggleOperationExpanded = (index: number) => {
    const newExpanded = new Set(expandedOperations);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedOperations(newExpanded);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.categoryId) {
      newErrors.categoryId = 'Category is required';
    }

    if (!formData.fromVersion.trim()) {
      newErrors.fromVersion = 'From version is required';
    }

    if (!formData.toVersion.trim()) {
      newErrors.toVersion = 'To version is required';
    }

    if (formData.fromVersion === formData.toVersion) {
      newErrors.toVersion = 'To version must be different from from version';
    }

    if (operations.length === 0) {
      newErrors.operations = 'At least one operation is required';
    }

    // Validate operations
    operations.forEach((op, index) => {
      if (!op.field.trim()) {
        newErrors[`op_${index}_field`] = 'Field name is required';
      }
      if (!op.description.trim()) {
        newErrors[`op_${index}_description`] = 'Description is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const migrationData = {
        categoryId: formData.categoryId,
        fromVersion: formData.fromVersion,
        toVersion: formData.toVersion,
        operations,
        autoApply: formData.autoApply
      };

      await onSave(migrationData);
      onClose();
    } catch (error) {
      console.error('Error saving migration:', error);
      setErrors({ submit: 'Failed to save migration' });
    } finally {
      setSaving(false);
    }
  };

  const getOperationTypeLabel = (type: string) => {
    switch (type) {
      case 'add_field': return 'Add Field';
      case 'remove_field': return 'Remove Field';
      case 'modify_field': return 'Modify Field';
      case 'add_validation': return 'Add Validation';
      case 'remove_validation': return 'Remove Validation';
      default: return type;
    }
  };

  const getOperationColor = (type: string) => {
    switch (type) {
      case 'add_field': return 'bg-green-100 text-green-800 border-green-200';
      case 'remove_field': return 'bg-red-100 text-red-800 border-red-200';
      case 'modify_field': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'add_validation': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'remove_validation': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">New Migration</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 180px)' }}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Migration Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {errors.categoryId && (
                    <p className="text-red-600 text-sm mt-1 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.categoryId}
                    </p>
                  )}
                </div>

                <div>
                  <label className="flex items-center mt-6">
                    <input
                      type="checkbox"
                      checked={formData.autoApply}
                      onChange={(e) => setFormData({ ...formData, autoApply: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">Auto-apply migration</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    From Version *
                  </label>
                  <input
                    type="text"
                    value={formData.fromVersion}
                    onChange={(e) => setFormData({ ...formData, fromVersion: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 1.0.0"
                  />
                  {errors.fromVersion && (
                    <p className="text-red-600 text-sm mt-1 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.fromVersion}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    To Version *
                  </label>
                  <input
                    type="text"
                    value={formData.toVersion}
                    onChange={(e) => setFormData({ ...formData, toVersion: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 1.1.0"
                  />
                  {errors.toVersion && (
                    <p className="text-red-600 text-sm mt-1 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.toVersion}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Operations */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Migration Operations</h3>
                <button
                  type="button"
                  onClick={addOperation}
                  className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Operation
                </button>
              </div>

              {errors.operations && (
                <p className="text-red-600 text-sm flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.operations}
                </p>
              )}

              <div className="space-y-3">
                {operations.map((operation, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg">
                    {/* Operation Header */}
                    <div 
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => toggleOperationExpanded(index)}
                    >
                      <div className="flex items-center space-x-3">
                        {expandedOperations.has(index) ? (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        )}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getOperationColor(operation.type)}`}>
                          {getOperationTypeLabel(operation.type)}
                        </span>
                        <span className="text-sm font-medium text-gray-700">
                          {operation.field || 'Unnamed field'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeOperation(index);
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Operation Details */}
                    {expandedOperations.has(index) && (
                      <div className="p-4 border-t border-gray-200 bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Operation Type
                            </label>
                            <select
                              value={operation.type}
                              onChange={(e) => updateOperation(index, { type: e.target.value as any })}
                              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="add_field">Add Field</option>
                              <option value="remove_field">Remove Field</option>
                              <option value="modify_field">Modify Field</option>
                              <option value="add_validation">Add Validation</option>
                              <option value="remove_validation">Remove Validation</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Field Name *
                            </label>
                            <input
                              type="text"
                              value={operation.field}
                              onChange={(e) => updateOperation(index, { field: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="e.g., resolution"
                            />
                            {errors[`op_${index}_field`] && (
                              <p className="text-red-600 text-xs mt-1">{errors[`op_${index}_field`]}</p>
                            )}
                          </div>

                          {(operation.type === 'add_field' || operation.type === 'modify_field') && (
                            <>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Field Type
                                </label>
                                <select
                                  value={operation.fieldType || 'string'}
                                  onChange={(e) => updateOperation(index, { fieldType: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                  <option value="string">String</option>
                                  <option value="number">Number</option>
                                  <option value="boolean">Boolean</option>
                                  <option value="array">Array</option>
                                  <option value="object">Object</option>
                                </select>
                              </div>

                              <div>
                                <label className="flex items-center mt-6">
                                  <input
                                    type="checkbox"
                                    checked={operation.required || false}
                                    onChange={(e) => updateOperation(index, { required: e.target.checked })}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="ml-2 text-xs font-medium text-gray-600">Required field</span>
                                </label>
                              </div>
                            </>
                          )}

                          <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Description *
                            </label>
                            <textarea
                              value={operation.description}
                              onChange={(e) => updateOperation(index, { description: e.target.value })}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Describe what this operation does..."
                            />
                            {errors[`op_${index}_description`] && (
                              <p className="text-red-600 text-xs mt-1">{errors[`op_${index}_description`]}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
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
            Create Migration
          </button>
        </div>
      </div>
    </div>
  );
}