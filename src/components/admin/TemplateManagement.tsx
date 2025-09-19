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
  Tag
} from 'lucide-react';

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
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors">
            <Upload className="w-4 h-4 mr-2" />
            Import Template
          </button>
          <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
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
                  onClick={() => {/* TODO: View template */}}
                  className="p-1 text-gray-400 hover:text-gray-600"
                  title="View Template"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {/* TODO: Edit template */}}
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
                  onClick={() => {/* TODO: Delete template */}}
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
    </div>
  );
}