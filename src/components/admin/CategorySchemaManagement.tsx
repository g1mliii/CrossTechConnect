/**
 * Category Schema Management - Complete interface for managing category schemas
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Save, 
  Download, 
  Upload, 
  AlertCircle, 
  CheckCircle,
  History,
  FileJson,
  Layers,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { SchemaEditor, SchemaField } from './SchemaEditor';
import { SchemaFormPreview } from './SchemaFormPreview';

interface CategorySchemaManagementProps {
  categoryId: string;
}

interface Category {
  id: string;
  name: string;
  parent_id: string | null;
}

interface Schema {
  id: string;
  category_id: string;
  version: string;
  name: string;
  description: string | null;
  fields: Record<string, SchemaField>;
  required_fields: string[];
  created_at: string;
  deprecated: boolean;
}

interface Template {
  id: string;
  name: string;
  description: string;
  baseSchema: {
    fields: Record<string, SchemaField>;
    requiredFields: string[];
  };
}

interface ImpactData {
  affectedDevices: number;
  affectedSpecifications: number;
  severity: 'low' | 'medium' | 'high';
  breakingChanges: string[];
  warnings: string[];
  info: string[];
  requiresMigration: boolean;
  canAutoMigrate: boolean;
}

export function CategorySchemaManagement({ categoryId }: CategorySchemaManagementProps) {
  const router = useRouter();
  
  // State
  const [category, setCategory] = useState<Category | null>(null);
  const [currentSchema, setCurrentSchema] = useState<Schema | null>(null);
  const [schemaHistory, setSchemaHistory] = useState<Schema[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  
  // Form state
  const [schemaName, setSchemaName] = useState('');
  const [schemaDescription, setSchemaDescription] = useState('');
  const [schemaVersion, setSchemaVersion] = useState('1.0');
  const [fields, setFields] = useState<SchemaField[]>([]);
  const [requiredFields, setRequiredFields] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showImpactAnalysis, setShowImpactAnalysis] = useState(false);
  const [impactData, setImpactData] = useState<ImpactData | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  const fetchData = async () => {
    try {
      // Fetch category
      const categoryRes = await fetch(`/api/categories/${categoryId}`);
      const categoryData = await categoryRes.json();
      if (categoryData.success) {
        setCategory(categoryData.data);
      }

      // Fetch current schema
      const schemaRes = await fetch(`/api/categories/${categoryId}/schema`);
      const schemaData = await schemaRes.json();
      console.log('Schema response:', schemaData);
      
      if (schemaData.success && schemaData.data) {
        const schema = schemaData.data;
        console.log('Schema data:', schema);
        console.log('Schema fields:', schema.fields);
        
        setCurrentSchema(schema);
        setSchemaName(schema.name);
        setSchemaDescription(schema.description || '');
        setSchemaVersion(schema.version);
        
        // Convert fields object to array
        const fieldsArray = Object.entries(schema.fields || {}).map(([name, field]) => ({
          ...(field as SchemaField),
          name
        }));
        console.log('Converted fields array:', fieldsArray);
        setFields(fieldsArray);
        setRequiredFields(schema.required_fields || []);
      } else {
        console.log('No schema found or error:', schemaData);
      }

      // Fetch schema history
      const historyRes = await fetch(`/api/categories/${categoryId}/schema?includeHistory=true`);
      const historyData = await historyRes.json();
      if (historyData.success) {
        setSchemaHistory(historyData.data);
      }

      // Fetch templates
      try {
        const templatesRes = await fetch('/api/admin/templates');
        const templatesData = await templatesRes.json();
        console.log('Templates response:', templatesData);
        if (templatesData.success) {
          setTemplates(templatesData.data);
          console.log('Templates loaded:', templatesData.data.length);
        }
      } catch (templatesError) {
        console.error('Failed to fetch templates:', templatesError);
        // Continue without templates
      }

    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Show template selector by default when no schema exists
  useEffect(() => {
    if (!loading && !currentSchema && initialLoad) {
      setShowTemplateSelector(true);
      setInitialLoad(false);
    }
  }, [loading, currentSchema, initialLoad]);

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    // Convert template fields to array
    const templateFields = Object.entries(template.baseSchema.fields || {}).map(([name, field]) => ({
      ...(field as SchemaField),
      name
    }));

    setFields(templateFields);
    setRequiredFields(template.baseSchema.requiredFields || []);
    setSchemaName(template.name);
    setSchemaDescription(template.description);
    setSelectedTemplate(templateId);
    setShowTemplateSelector(false);
    setSuccessMessage(`Template "${template.name}" loaded successfully`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const validateSchema = (): boolean => {
    const errors: string[] = [];

    if (!schemaName.trim()) {
      errors.push('Schema name is required');
    }

    if (!schemaVersion.trim()) {
      errors.push('Schema version is required');
    }

    if (fields.length === 0) {
      errors.push('At least one field is required');
    }

    // Validate field names are unique
    const fieldNames = fields.map(f => f.name);
    const duplicates = fieldNames.filter((name, index) => fieldNames.indexOf(name) !== index);
    if (duplicates.length > 0) {
      errors.push(`Duplicate field names: ${duplicates.join(', ')}`);
    }

    // Validate required fields exist
    const invalidRequired = requiredFields.filter(rf => !fieldNames.includes(rf));
    if (invalidRequired.length > 0) {
      errors.push(`Required fields not found: ${invalidRequired.join(', ')}`);
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const analyzeImpact = async () => {
    if (!currentSchema) return;

    try {
      const currentFieldNames = Object.keys(currentSchema.fields || {});
      const newFieldNames = fields.map(f => f.name);
      
      const removedFields = currentFieldNames.filter(f => !newFieldNames.includes(f));
      const addedFields = fields.filter(f => !currentFieldNames.includes(f.name));
      const modifiedFields = fields.filter(f => {
        const oldField = currentSchema.fields[f.name];
        return oldField && JSON.stringify(oldField) !== JSON.stringify(f);
      }).map(f => f.name);

      const response = await fetch(`/api/categories/${categoryId}/schema/impact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentVersion: currentSchema.version,
          newFields: addedFields,
          removedFields,
          modifiedFields
        })
      });

      const data = await response.json();
      if (data.success) {
        setImpactData(data.data);
        setShowImpactAnalysis(true);
      }
    } catch (error) {
      console.error('Failed to analyze impact:', error);
    }
  };

  const handleSave = async () => {
    if (!validateSchema()) {
      return;
    }

    // Show impact analysis if schema exists
    if (currentSchema && !showImpactAnalysis) {
      await analyzeImpact();
      return;
    }

    setSaving(true);
    setValidationErrors([]);

    try {
      // Convert fields array to object
      const fieldsObject = fields.reduce((acc, field) => {
        const { name, ...fieldData } = field;
        acc[name] = fieldData;
        return acc;
      }, {} as Record<string, Omit<SchemaField, 'name'>>);

      const payload = {
        name: schemaName,
        description: schemaDescription,
        version: schemaVersion,
        fields: fieldsObject,
        requiredFields,
        createdBy: 'admin-user', // TODO: Get from auth context
        templateId: selectedTemplate || undefined
      };

      let response;
      if (currentSchema) {
        // Update existing schema
        response = await fetch(`/api/categories/${categoryId}/schema`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            schemaId: currentSchema.id,
            ...payload
          })
        });
      } else {
        // Create new schema
        response = await fetch(`/api/categories/${categoryId}/schema`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(currentSchema ? 'Schema updated successfully' : 'Schema created successfully');
        setShowImpactAnalysis(false);
        setTimeout(() => {
          router.push(`/admin/categories/${categoryId}`);
        }, 1500);
      } else {
        setValidationErrors([data.error || 'Failed to save schema']);
      }
    } catch (error) {
      console.error('Failed to save schema:', error);
      setValidationErrors(['Failed to save schema']);
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/categories/${categoryId}/schema/export`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `schema-${category?.name || categoryId}-v${schemaVersion}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export schema:', error);
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        
        if (imported.fields) {
          const fieldsArray = Object.entries(imported.fields).map(([name, field]: [string, any]) => ({
            name,
            ...field
          }));
          setFields(fieldsArray);
        }
        
        if (imported.requiredFields) {
          setRequiredFields(imported.requiredFields);
        }
        
        if (imported.name) setSchemaName(imported.name);
        if (imported.description) setSchemaDescription(imported.description);
        if (imported.version) setSchemaVersion(imported.version);
        
        setSuccessMessage('Schema imported successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        setValidationErrors(['Invalid schema file format']);
      }
    };
    reader.readAsText(file);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href={`/admin/categories/${categoryId}`}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Schema Editor: {category?.name}
            </h1>
            <p className="text-gray-600">
              {currentSchema ? `Editing v${currentSchema.version}` : 'Create new schema'}
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <History className="w-4 h-4 mr-2" />
            History
          </button>
          <button
            onClick={handleExport}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            disabled={fields.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
          <label className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors cursor-pointer">
            <Upload className="w-4 h-4 mr-2" />
            Import
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
          <button
            onClick={handleSave}
            disabled={saving || !schemaName.trim() || !schemaVersion.trim()}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {currentSchema ? 'Update' : 'Create'}
          </button>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-green-800">{successMessage}</span>
        </div>
      )}

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

      {/* Template Selector */}
      {showTemplateSelector && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Template</h2>
          
          {templates.length === 0 ? (
            <div className="text-center py-8">
              <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">No templates available yet</p>
              <button
                onClick={() => setShowTemplateSelector(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Start from Scratch
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template.id)}
                  className="text-left p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-start space-x-3">
                    <Layers className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-gray-900">{template.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {Object.keys(template.baseSchema.fields || {}).length} fields
                      </p>
                    </div>
                  </div>
                </button>
              ))}
              <button
                onClick={() => setShowTemplateSelector(false)}
                className="text-left p-4 border border-gray-200 rounded-lg hover:border-gray-400 transition-colors"
              >
                <div className="flex items-start space-x-3">
                  <FileJson className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-gray-900">Start from Scratch</h3>
                    <p className="text-sm text-gray-600 mt-1">Create a custom schema without a template</p>
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Schema History */}
      {showHistory && schemaHistory.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Schema Version History</h2>
          <div className="space-y-2">
            {schemaHistory.map((schema) => (
              <div
                key={schema.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">v{schema.version}</span>
                    {schema.deprecated && (
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">
                        Deprecated
                      </span>
                    )}
                    {schema.id === currentSchema?.id && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{schema.name}</p>
                  <p className="text-xs text-gray-500">
                    Created {new Date(schema.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  {Object.keys(schema.fields || {}).length} fields
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Impact Analysis */}
      {showImpactAnalysis && impactData && (
        <div className={`rounded-lg border p-6 ${
          impactData.severity === 'high' ? 'bg-red-50 border-red-200' :
          impactData.severity === 'medium' ? 'bg-yellow-50 border-yellow-200' :
          'bg-blue-50 border-blue-200'
        }`}>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Impact Analysis</h2>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Affected Devices</p>
              <p className="text-2xl font-bold text-gray-900">{impactData.affectedDevices}</p>
            </div>

            {impactData.breakingChanges.length > 0 && (
              <div>
                <p className="text-sm font-medium text-red-700 mb-2">Breaking Changes:</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-red-600">
                  {impactData.breakingChanges.map((change: string, idx: number) => (
                    <li key={idx}>{change}</li>
                  ))}
                </ul>
              </div>
            )}

            {impactData.warnings.length > 0 && (
              <div>
                <p className="text-sm font-medium text-yellow-700 mb-2">Warnings:</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-yellow-600">
                  {impactData.warnings.map((warning: string, idx: number) => (
                    <li key={idx}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {impactData.info.length > 0 && (
              <div>
                <p className="text-sm font-medium text-blue-700 mb-2">Information:</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-blue-600">
                  {impactData.info.map((info: string, idx: number) => (
                    <li key={idx}>{info}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-4 border-t">
              <button
                onClick={() => setShowImpactAnalysis(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Proceed with Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category & Schema Information */}
      {!showTemplateSelector && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Category & Schema Information</h2>
            {!currentSchema && (
              <button
                onClick={() => setShowTemplateSelector(true)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Use Template
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 pb-6 border-b border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category Name
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700">
                {category?.name || 'Loading...'}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parent Category
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700">
                {category?.parent_id || 'None (Top Level)'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Schema Name *
              </label>
              <input
                type="text"
                value={schemaName}
                onChange={(e) => setSchemaName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Gaming Console Schema"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Version *
              </label>
              <input
                type="text"
                value={schemaVersion}
                onChange={(e) => setSchemaVersion(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 1.0, 2.0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fields Count
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700">
                {fields.length} field(s)
              </div>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Schema Description
            </label>
            <textarea
              value={schemaDescription}
              onChange={(e) => setSchemaDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe this schema..."
            />
          </div>
        </div>
      )}

      {/* Schema Editor and Preview */}
      {!showTemplateSelector && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Editor */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Schema Fields</h2>
            <SchemaEditor
              fields={fields}
              onChange={setFields}
              requiredFields={requiredFields}
              onRequiredFieldsChange={setRequiredFields}
            />
          </div>

          {/* Preview */}
          <div className="lg:sticky lg:top-6 h-fit">
            <SchemaFormPreview
              fields={fields}
              categoryName={category?.name}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      {!showTemplateSelector && (
        <div className="flex items-center justify-end space-x-3 bg-white rounded-lg border border-gray-200 p-6">
          <Link
            href={`/admin/categories/${categoryId}`}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            onClick={handleSave}
            disabled={saving || !schemaName.trim() || !schemaVersion.trim()}
            className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {currentSchema ? 'Update Schema' : 'Create Schema'}
          </button>
        </div>
      )}
    </div>
  );
}
