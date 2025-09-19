/**
 * Template Management - Interface for managing category templates
 */

'use client';

import { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload,
  Eye,
  Edit,
  Trash2,
  FileText,
  Tag,
  X
} from 'lucide-react';
import { TemplateForm } from './TemplateForm';
import { ConfirmationDialog } from './ConfirmationDialog';

interface Template {
  id: string;
  name: string;
  description: string;
  baseSchema: any;
  exampleDevices: string[];
  tags: string[];
  popularity: number;
}

export function TemplateManagement() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tagFilter, setTagFilter] = useState<string>('');
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | undefined>();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/admin/templates');
      const result = await response.json();
      
      if (result.success) {
        setTemplates(result.data);
      } else {
        console.error('Failed to fetch templates:', result.error);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTag = !tagFilter || template.tags.includes(tagFilter);
    
    return matchesSearch && matchesTag;
  });

  // Get all unique tags
  const allTags = Array.from(new Set(templates.flatMap(t => t.tags)));

  const handleNewTemplate = () => {
    setEditingTemplate(undefined);
    setShowTemplateForm(true);
  };

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template);
    setShowTemplateForm(true);
  };

  const handleViewTemplate = (template: Template) => {
    setPreviewTemplate(template);
    setShowPreviewDialog(true);
  };

  const handleDeleteTemplate = (template: Template) => {
    setTemplateToDelete(template);
    setShowDeleteDialog(true);
  };

  const confirmDeleteTemplate = async () => {
    if (!templateToDelete) return;

    try {
      const response = await fetch(`/api/admin/templates/${templateToDelete.id}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      if (result.success) {
        setTemplates(templates.filter(t => t.id !== templateToDelete.id));
        setShowDeleteDialog(false);
        setTemplateToDelete(null);
      } else {
        console.error('Failed to delete template:', result.error);
      }
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  };

  const handleSaveTemplate = async (templateData: any) => {
    try {
      const url = editingTemplate 
        ? `/api/admin/templates/${editingTemplate.id}`
        : '/api/admin/templates';
      
      const method = editingTemplate ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(templateData)
      });

      const result = await response.json();
      if (result.success) {
        await fetchTemplates(); // Refresh the list
        setShowTemplateForm(false);
        setEditingTemplate(undefined);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to save template:', error);
      throw error;
    }
  };

  const handleExportTemplate = async (templateId: string) => {
    try {
      const response = await fetch(`/api/admin/templates/${templateId}/export`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `template-${templateId}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export template:', error);
    }
  };

  const handleImportTemplate = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const templateData = JSON.parse(text);

        const response = await fetch('/api/admin/templates', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            template: templateData,
            import: true
          })
        });

        const result = await response.json();
        if (result.success) {
          await fetchTemplates(); // Refresh the list
        } else {
          console.error('Failed to import template:', result.error);
          alert('Failed to import template: ' + result.error);
        }
      } catch (error) {
        console.error('Failed to import template:', error);
        alert('Failed to import template. Please check the file format.');
      }
    };
    input.click();
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Category Templates</h1>
          <p className="text-gray-600">Manage device category templates and import/export functionality</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={handleImportTemplate}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import Template
          </button>
          <button 
            onClick={handleNewTemplate}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Template
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Tags</option>
            {allTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <div key={template.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => handleViewTemplate(template)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                  title="View Template"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleEditTemplate(template)}
                  className="p-1 text-gray-400 hover:text-blue-600"
                  title="Edit Template"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleExportTemplate(template.id)}
                  className="p-1 text-gray-400 hover:text-green-600"
                  title="Export Template"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteTemplate(template)}
                  className="p-1 text-gray-400 hover:text-red-600"
                  title="Delete Template"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
              {template.description}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-1 mb-4">
              {template.tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </span>
              ))}
            </div>

            {/* Example Devices */}
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-500 mb-2">Example Devices:</p>
              <div className="text-xs text-gray-600">
                {template.exampleDevices.length > 0 
                  ? template.exampleDevices.slice(0, 2).join(', ') + 
                    (template.exampleDevices.length > 2 ? ` +${template.exampleDevices.length - 2} more` : '')
                  : 'No examples'
                }
              </div>
            </div>

            {/* Popularity */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Popularity: {template.popularity}</span>
              <span>{Object.keys(template.baseSchema || {}).length} fields</span>
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No templates found</p>
          <p className="text-sm text-gray-400 mt-1">
            {searchTerm || tagFilter 
              ? 'Try adjusting your search or filter criteria'
              : 'Create your first template to get started'
            }
          </p>
        </div>
      )}

      {/* Template Form Modal */}
      <TemplateForm
        template={editingTemplate}
        isOpen={showTemplateForm}
        onClose={() => {
          setShowTemplateForm(false);
          setEditingTemplate(undefined);
        }}
        onSave={handleSaveTemplate}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        title="Delete Template"
        message={`Are you sure you want to delete the template "${templateToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmDeleteTemplate}
        onCancel={() => {
          setShowDeleteDialog(false);
          setTemplateToDelete(null);
        }}
      />

      {/* Template Preview Dialog */}
      {showPreviewDialog && previewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Template Preview</h2>
              </div>
              <button
                onClick={() => setShowPreviewDialog(false)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{previewTemplate.name}</h3>
                  <p className="text-gray-600">{previewTemplate.description}</p>
                </div>
                
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {previewTemplate.tags.map(tag => (
                      <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-2">Example Devices</h4>
                  <ul className="list-disc list-inside text-gray-600">
                    {previewTemplate.exampleDevices.map(device => (
                      <li key={device}>{device}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-2">Schema</h4>
                  <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm">
                    {JSON.stringify(previewTemplate.baseSchema, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}