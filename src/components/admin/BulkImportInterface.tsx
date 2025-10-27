/**
 * Bulk Import Interface - Category-aware CSV/JSON import with field mapping
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { Upload, Download, FileText, AlertCircle, CheckCircle, Trash2, Settings } from 'lucide-react';

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
  requiredFields: string[];
  category: {
    id: string;
    name: string;
  };
}

interface ImportMapping {
  sourceColumn: string;
  targetField: string;
  transformation?: 'none' | 'lowercase' | 'uppercase' | 'trim' | 'number' | 'boolean' | 'array' | 'json';
  defaultValue?: any;
}

interface ImportPreview {
  headers: string[];
  rows: any[][];
  totalRows: number;
  errors: ImportError[];
}

interface ImportError {
  row: number;
  column: string;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

interface BulkImportInterfaceProps {
  categoryId?: string;
  onImportComplete?: (results: ImportResult) => void;
}

interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: ImportError[];
}

export function BulkImportInterface({ categoryId, onImportComplete }: BulkImportInterfaceProps) {
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(categoryId || '');
  const [categorySchema, setCategorySchema] = useState<CategorySchema | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'csv' | 'json' | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [mappings, setMappings] = useState<ImportMapping[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'import'>('upload');
  const [importResults, setImportResults] = useState<ImportResult | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategoryId) {
      fetchCategorySchema();
    }
  }, [selectedCategoryId]);

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

  const fetchCategorySchema = async () => {
    if (!selectedCategoryId) return;
    
    try {
      const response = await fetch(`/api/categories/${selectedCategoryId}/schema`);
      const data = await response.json();
      
      if (data.success) {
        setCategorySchema(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch category schema:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    const extension = selectedFile.name.split('.').pop()?.toLowerCase();
    if (!extension || !['csv', 'json'].includes(extension)) {
      alert('Please select a CSV or JSON file');
      return;
    }

    setFile(selectedFile);
    setFileType(extension as 'csv' | 'json');
    parseFile(selectedFile, extension as 'csv' | 'json');
  };

  const parseFile = async (file: File, type: 'csv' | 'json') => {
    setLoading(true);
    
    try {
      const text = await file.text();
      
      if (type === 'csv') {
        parseCSV(text);
      } else {
        parseJSON(text);
      }
      
      setStep('mapping');
    } catch (error) {
      console.error('Failed to parse file:', error);
      alert('Failed to parse file. Please check the format.');
    } finally {
      setLoading(false);
    }
  };

  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) return;

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows = lines.slice(1).map(line => 
      line.split(',').map(cell => cell.trim().replace(/"/g, ''))
    );

    setPreview({
      headers,
      rows: rows.slice(0, 10), // Show first 10 rows for preview
      totalRows: rows.length,
      errors: []
    });

    // Initialize mappings
    initializeMappings(headers);
  };

  const parseJSON = (text: string) => {
    try {
      const data = JSON.parse(text);
      
      if (!Array.isArray(data)) {
        throw new Error('JSON must be an array of objects');
      }

      if (data.length === 0) {
        throw new Error('JSON array is empty');
      }

      const headers = Object.keys(data[0]);
      const rows = data.slice(0, 10).map(obj => headers.map(h => obj[h]));

      setPreview({
        headers,
        rows,
        totalRows: data.length,
        errors: []
      });

      // Initialize mappings
      initializeMappings(headers);
    } catch (error) {
      throw new Error(`Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const initializeMappings = (headers: string[]) => {
    const newMappings: ImportMapping[] = headers.map(header => {
      // Try to auto-match headers to schema fields or basic device fields
      const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      let matchedField = '';
      
      // First try to match with schema fields if available
      if (categorySchema && categorySchema.fields) {
        matchedField = Object.keys(categorySchema.fields).find(fieldName => {
          const normalizedField = fieldName.toLowerCase().replace(/[^a-z0-9]/g, '');
          return normalizedField === normalizedHeader || 
                 normalizedField.includes(normalizedHeader) ||
                 normalizedHeader.includes(normalizedField);
        }) || '';
      }
      
      // If no schema match, try basic device fields
      if (!matchedField) {
        const basicFields = ['name', 'brand', 'model', 'category_id', 'width_cm', 'height_cm', 
                            'depth_cm', 'weight_kg', 'power_watts', 'power_type', 'description', 'manual_url'];
        matchedField = basicFields.find(field => {
          const normalizedField = field.toLowerCase().replace(/[^a-z0-9]/g, '');
          return normalizedField === normalizedHeader;
        }) || '';
      }

      return {
        sourceColumn: header,
        targetField: matchedField,
        transformation: 'none'
      };
    });

    setMappings(newMappings);
  };

  const updateMapping = (index: number, field: keyof ImportMapping, value: any) => {
    setMappings(prev => prev.map((mapping, i) => 
      i === index ? { ...mapping, [field]: value } : mapping
    ));
  };

  const addMapping = () => {
    if (!preview) return;
    
    setMappings(prev => [...prev, {
      sourceColumn: preview.headers[0] || '',
      targetField: '',
      transformation: 'none'
    }]);
  };

  const removeMapping = (index: number) => {
    setMappings(prev => prev.filter((_, i) => i !== index));
  };

  const validateMappings = (): ImportError[] => {
    const errors: ImportError[] = [];
    
    // Check basic required fields are mapped
    const basicRequiredFields = ['name', 'brand'];
    basicRequiredFields.forEach(requiredField => {
      const isMapped = mappings.some(mapping => mapping.targetField === requiredField);
      if (!isMapped) {
        errors.push({
          row: -1,
          column: '',
          field: requiredField,
          message: `Required field '${requiredField}' is not mapped`,
          severity: 'error'
        });
      }
    });

    // Check schema required fields if schema exists
    if (categorySchema && categorySchema.requiredFields) {
      categorySchema.requiredFields.forEach(requiredField => {
        const isMapped = mappings.some(mapping => mapping.targetField === requiredField);
        if (!isMapped) {
          errors.push({
            row: -1,
            column: '',
            field: requiredField,
            message: `Required field '${requiredField}' is not mapped`,
            severity: 'warning'
          });
        }
      });
    }

    // Check for duplicate mappings
    const targetFields = mappings.map(m => m.targetField).filter(f => f);
    const duplicates = targetFields.filter((field, index) => targetFields.indexOf(field) !== index);
    duplicates.forEach(field => {
      errors.push({
        row: -1,
        column: '',
        field,
        message: `Field '${field}' is mapped multiple times`,
        severity: 'error'
      });
    });

    return errors;
  };

  const generatePreview = () => {
    if (!preview) return;

    const validationErrors = validateMappings();
    
    setPreview(prev => prev ? {
      ...prev,
      errors: validationErrors
    } : null);

    if (validationErrors.filter(e => e.severity === 'error').length === 0) {
      setStep('preview');
    }
  };

  const performImport = async () => {
    if (!file || !selectedCategoryId) return;

    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('categoryId', selectedCategoryId);
      formData.append('mappings', JSON.stringify(mappings));
      formData.append('fileType', fileType || '');

      const response = await fetch('/api/devices/bulk-import', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (result.success) {
        setImportResults(result.data);
        setStep('import');
        onImportComplete?.(result.data);
      } else {
        alert(`Import failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Import failed:', error);
      alert('Import failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    // Basic device fields
    const basicHeaders = ['name', 'brand', 'model', 'category_id', 'width_cm', 'height_cm', 
                         'depth_cm', 'weight_kg', 'power_watts', 'power_type', 'description', 'manual_url'];
    
    // Add category-specific fields if schema exists
    const schemaHeaders = categorySchema && categorySchema.fields ? Object.keys(categorySchema.fields) : [];
    const headers = [...basicHeaders, ...schemaHeaders];
    
    const csvContent = headers.join(',') + '\n';
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // Use category name if available, otherwise generic name
    const categoryName = categorySchema?.category?.name || 'devices';
    a.download = `${categoryName.toLowerCase().replace(/\s+/g, '_')}_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetImport = () => {
    setFile(null);
    setFileType(null);
    setPreview(null);
    setMappings([]);
    setImportResults(null);
    setStep('upload');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Bulk Import Devices</h2>
          <p className="text-sm text-gray-600 mt-1">
            Import multiple devices from CSV or JSON files with automatic field mapping
          </p>
        </div>
        
        {categorySchema && (
          <button
            onClick={downloadTemplate}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Template
          </button>
        )}
      </div>

      {/* Progress Steps */}
      <div className="flex items-center space-x-4">
        {['upload', 'mapping', 'preview', 'import'].map((stepName, index) => (
          <div key={stepName} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === stepName ? 'bg-blue-600 text-white' :
              ['upload', 'mapping', 'preview', 'import'].indexOf(step) > index ? 'bg-green-600 text-white' :
              'bg-gray-200 text-gray-600'
            }`}>
              {index + 1}
            </div>
            <span className={`ml-2 text-sm font-medium capitalize ${
              step === stepName ? 'text-blue-600' : 'text-gray-600'
            }`}>
              {stepName}
            </span>
            {index < 3 && <div className="w-8 h-px bg-gray-300 ml-4" />}
          </div>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <div className="space-y-6">
          {/* Category Selection */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Select Category</h3>
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* File Upload */}
          {selectedCategoryId && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Upload File</h3>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  Drop your file here or click to browse
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  Supports CSV and JSON files up to 10MB
                </p>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.json"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Choose File
                </button>
              </div>
              
              {file && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-blue-500" />
                    <span className="text-sm font-medium text-blue-900">{file.name}</span>
                    <span className="text-sm text-blue-700">
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Field Mapping */}
      {step === 'mapping' && preview && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Field Mapping</h3>
              <button
                onClick={addMapping}
                className="inline-flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Settings className="w-4 h-4 mr-2" />
                Add Mapping
              </button>
            </div>
            
            <div className="space-y-4">
              {mappings.map((mapping, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-gray-200 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Source Column
                    </label>
                    <select
                      value={mapping.sourceColumn}
                      onChange={(e) => updateMapping(index, 'sourceColumn', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {preview.headers.map(header => (
                        <option key={header} value={header}>{header}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Target Field
                    </label>
                    <select
                      value={mapping.targetField}
                      onChange={(e) => updateMapping(index, 'targetField', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select field</option>
                      <optgroup label="Basic Fields">
                        <option value="name">Device Name</option>
                        <option value="brand">Brand</option>
                        <option value="model">Model</option>
                        <option value="category_id">Category ID</option>
                        <option value="width_cm">Width (cm)</option>
                        <option value="height_cm">Height (cm)</option>
                        <option value="depth_cm">Depth (cm)</option>
                        <option value="weight_kg">Weight (kg)</option>
                        <option value="power_watts">Power (watts)</option>
                        <option value="power_type">Power Type</option>
                        <option value="description">Description</option>
                        <option value="manual_url">Manual URL</option>
                      </optgroup>
                      {categorySchema && categorySchema.fields && Object.keys(categorySchema.fields).length > 0 && (
                        <optgroup label="Category-Specific Fields">
                          {Object.entries(categorySchema.fields).map(([fieldName, fieldDef]) => (
                            <option key={fieldName} value={fieldName}>
                              {fieldDef.label} ({fieldDef.type})
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Transformation
                    </label>
                    <select
                      value={mapping.transformation}
                      onChange={(e) => updateMapping(index, 'transformation', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="none">None</option>
                      <option value="trim">Trim Whitespace</option>
                      <option value="lowercase">Lowercase</option>
                      <option value="uppercase">Uppercase</option>
                      <option value="number">Convert to Number</option>
                      <option value="boolean">Convert to Boolean</option>
                      <option value="array">Split to Array</option>
                      <option value="json">Parse JSON</option>
                    </select>
                  </div>
                  
                  <div className="flex items-end">
                    <button
                      onClick={() => removeMapping(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {preview.errors.length > 0 && (
              <div className="mt-4 space-y-2">
                {preview.errors.map((error, index) => (
                  <div key={index} className={`flex items-center space-x-2 p-3 rounded-lg ${
                    error.severity === 'error' ? 'bg-red-50 text-red-800' : 'bg-yellow-50 text-yellow-800'
                  }`}>
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{error.message}</span>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setStep('upload')}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={generatePreview}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Generate Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Preview */}
      {step === 'preview' && preview && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Import Preview</h3>
            
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                Ready to import <strong>{preview.totalRows}</strong> devices into <strong>{categorySchema?.category.name}</strong>
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {mappings.filter(m => m.targetField).map(mapping => (
                      <th key={mapping.targetField} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {categorySchema?.fields[mapping.targetField]?.label || mapping.targetField}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {preview.rows.slice(0, 5).map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {mappings.filter(m => m.targetField).map(mapping => {
                        const columnIndex = preview.headers.indexOf(mapping.sourceColumn);
                        const value = columnIndex >= 0 ? row[columnIndex] : '';
                        return (
                          <td key={mapping.targetField} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {value || '-'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {preview.totalRows > 5 && (
              <p className="mt-4 text-sm text-gray-600 text-center">
                Showing first 5 rows of {preview.totalRows} total rows
              </p>
            )}
            
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setStep('mapping')}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Back to Mapping
              </button>
              <button
                onClick={performImport}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                Start Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Import Results */}
      {step === 'import' && importResults && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div>
                <h3 className="text-lg font-medium text-gray-900">Import Complete</h3>
                <p className="text-sm text-gray-600">Your devices have been imported successfully</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{importResults.imported}</div>
                <div className="text-sm text-green-800">Successfully Imported</div>
              </div>
              
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{importResults.failed}</div>
                <div className="text-sm text-red-800">Failed</div>
              </div>
              
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{importResults.imported + importResults.failed}</div>
                <div className="text-sm text-blue-800">Total Processed</div>
              </div>
            </div>
            
            {importResults.errors.length > 0 && (
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Import Errors</h4>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {importResults.errors.map((error, index) => (
                    <div key={index} className="flex items-start space-x-2 p-3 bg-red-50 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
                      <div className="text-sm">
                        <span className="font-medium">Row {error.row}:</span> {error.message}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={resetImport}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Import Another File
              </button>
              <button
                onClick={() => window.location.href = '/admin/devices'}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Devices
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}