/**
 * Category Management - Interface for managing device categories and schemas
 */

'use client';

import { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import { useNotifications, NotificationSystem } from './NotificationSystem';
import { LoadingState, LoadingButton } from './LoadingState';
import { ConfirmationDialog } from './ConfirmationDialog';
import { logAuditEntry } from '@/lib/audit-logger';
interface CategoryWithStats {
  id: string;
  name: string;
  description: string;
  version: string;
  deprecated: boolean;
  deviceCount: number;
  lastUsed: Date;
  status: 'active' | 'deprecated' | 'draft';
}

export function CategoryManagement() {
  const [categories, setCategories] = useState<CategoryWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'deprecated' | 'draft'>('all');
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string; deviceCount: number } | null>(null);
  const { notifications, dismissNotification, success, error, warning } = useNotifications();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories?includeDeviceCount=true');
      const data = await response.json();
      
      if (data.success) {
        const categoriesWithStats: CategoryWithStats[] = data.data.map((category: any) => ({
          id: category.id,
          name: category.name,
          description: category.attributes?.description || 'No description',
          version: '1.0', // Default version for categories
          deprecated: false, // Categories don't have deprecated field yet
          deviceCount: category.deviceCount || 0,
          lastUsed: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Mock for now
          status: 'active' as const
        }));
        
        setCategories(categoriesWithStats);
      } else {
        error('Failed to load categories', data.error);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      error('Failed to load categories', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter(category => {
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         category.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || category.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const handleExportCategory = async (categoryId: string) => {
    try {
      const response = await fetch(`/api/schemas/${categoryId}/export`);
      if (!response.ok) {
        throw new Error('Export failed');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `category-${categoryId}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      success('Category exported', 'Schema downloaded successfully');
      
      // Log audit entry
      await logAuditEntry({
        adminId: 'current-admin-id', // TODO: Get from auth context
        action: 'export_category',
        entityType: 'category',
        entityId: categoryId,
      });
    } catch (err) {
      console.error('Failed to export category:', err);
      error('Export failed', 'Could not export category schema');
    }
  };

  const handleDeleteCategory = (categoryId: string, categoryName: string, deviceCount: number) => {
    if (deviceCount > 0) {
      warning(
        'Cannot delete category',
        `Category "${categoryName}" has ${deviceCount} device(s). Please reassign or delete devices first.`
      );
      return;
    }

    setConfirmDelete({ id: categoryId, name: categoryName, deviceCount });
  };

  const confirmDeleteCategory = async () => {
    if (!confirmDelete) return;

    const { id, name } = confirmDelete;
    setDeleteLoading(id);

    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok) {
        success('Category deleted', `"${name}" has been removed successfully`);
        
        // Log audit entry
        await logAuditEntry({
          adminId: 'current-admin-id', // TODO: Get from auth context
          action: 'delete_category',
          entityType: 'category',
          entityId: id,
          changes: { name },
        });
        
        fetchCategories(); // Refresh the list
      } else {
        error('Delete failed', data.error || 'Failed to delete category');
      }
    } catch (err) {
      console.error('Failed to delete category:', err);
      error('Delete failed', 'An unexpected error occurred');
    } finally {
      setDeleteLoading(null);
      setConfirmDelete(null);
    }
  };

  if (loading) {
    return <LoadingState text="Loading categories..." />;
  }

  return (
    <>
      <NotificationSystem notifications={notifications} onDismiss={dismissNotification} />
      
      <ConfirmationDialog
        isOpen={!!confirmDelete}
        title="Delete Category"
        message={`Are you sure you want to delete "${confirmDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmDeleteCategory}
        onCancel={() => setConfirmDelete(null)}
      />
      
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Category Management</h1>
          <p className="text-gray-600">Manage device categories, schemas, and specifications</p>
        </div>
        <div className="flex space-x-3">
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </button>
          <Link
            href="/admin/categories/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Category
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="deprecated">Deprecated</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Devices
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Version
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Used
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCategories.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{category.name}</div>
                      <div className="text-sm text-gray-500">{category.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={category.status} />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {category.deviceCount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    v{category.version}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(category.lastUsed).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Link
                        href={`/admin/categories/${category.id}`}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/admin/categories/${category.id}/edit`}
                        className="p-1 text-gray-400 hover:text-blue-600"
                        title="Edit Category"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleExportCategory(category.id)}
                        className="p-1 text-gray-400 hover:text-green-600"
                        title="Export Category"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id, category.name, category.deviceCount)}
                        disabled={deleteLoading === category.id}
                        className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-50"
                        title="Delete Category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredCategories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No categories found matching your criteria</p>
          </div>
        )}
      </div>
    </div>
    </>
  );
}

interface StatusBadgeProps {
  status: 'active' | 'deprecated' | 'draft';
}

function StatusBadge({ status }: StatusBadgeProps) {
  const config = {
    active: {
      icon: CheckCircle,
      text: 'Active',
      className: 'bg-green-100 text-green-800 border-green-200'
    },
    deprecated: {
      icon: AlertTriangle,
      text: 'Deprecated',
      className: 'bg-red-100 text-red-800 border-red-200'
    },
    draft: {
      icon: Clock,
      text: 'Draft',
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    }
  };

  const { icon: Icon, text, className } = config[status];

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${className}`}>
      <Icon className="w-3 h-3 mr-1" />
      {text}
    </span>
  );
}