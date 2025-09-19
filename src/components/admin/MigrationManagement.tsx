/**
 * Migration Management - Interface for managing schema migrations
 */

'use client';

import { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Play, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  Database,
  RotateCcw,
  Eye,
  Trash2,
  X
} from 'lucide-react';
import { MigrationForm } from './MigrationForm';
import { ConfirmationDialog } from './ConfirmationDialog';

interface Migration {
  id: string;
  category_id: string;
  from_version: string;
  to_version: string;
  operations: any;
  created_at: string;
  applied_at: string | null;
  device_categories: {
    name: string;
  };
}

export function MigrationManagement() {
  const [migrations, setMigrations] = useState<Migration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'applied'>('all');
  const [showMigrationForm, setShowMigrationForm] = useState(false);
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [showRollbackDialog, setShowRollbackDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [selectedMigration, setSelectedMigration] = useState<Migration | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchMigrations();
  }, []);

  const fetchMigrations = async () => {
    try {
      const response = await fetch('/api/admin/migrations');
      const result = await response.json();
      
      if (result.success) {
        setMigrations(result.data);
      } else {
        console.error('Failed to fetch migrations:', result.error);
      }
    } catch (error) {
      console.error('Failed to fetch migrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewMigration = () => {
    setShowMigrationForm(true);
  };

  const handleSaveMigration = async (migrationData: any) => {
    try {
      const response = await fetch('/api/admin/migrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(migrationData)
      });

      const result = await response.json();
      if (result.success) {
        await fetchMigrations(); // Refresh the list
        setShowMigrationForm(false);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to save migration:', error);
      throw error;
    }
  };

  const handleApplyMigration = (migration: Migration) => {
    setSelectedMigration(migration);
    setShowApplyDialog(true);
  };

  const confirmApplyMigration = async () => {
    if (!selectedMigration) return;

    setActionLoading('apply');
    try {
      const response = await fetch(`/api/admin/migrations/${selectedMigration.id}/apply`, {
        method: 'POST'
      });

      const result = await response.json();
      if (result.success) {
        await fetchMigrations(); // Refresh the list
        setShowApplyDialog(false);
        setSelectedMigration(null);
      } else {
        console.error('Failed to apply migration:', result.error);
        alert('Failed to apply migration: ' + result.error);
      }
    } catch (error) {
      console.error('Failed to apply migration:', error);
      alert('Failed to apply migration');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRollbackMigration = (migration: Migration) => {
    setSelectedMigration(migration);
    setShowRollbackDialog(true);
  };

  const confirmRollbackMigration = async () => {
    if (!selectedMigration) return;

    setActionLoading('rollback');
    try {
      const response = await fetch(`/api/admin/migrations/${selectedMigration.id}/rollback`, {
        method: 'POST'
      });

      const result = await response.json();
      if (result.success) {
        await fetchMigrations(); // Refresh the list
        setShowRollbackDialog(false);
        setSelectedMigration(null);
      } else {
        console.error('Failed to rollback migration:', result.error);
        alert('Failed to rollback migration: ' + result.error);
      }
    } catch (error) {
      console.error('Failed to rollback migration:', error);
      alert('Failed to rollback migration');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteMigration = (migration: Migration) => {
    setSelectedMigration(migration);
    setShowDeleteDialog(true);
  };

  const confirmDeleteMigration = async () => {
    if (!selectedMigration) return;

    setActionLoading('delete');
    try {
      const response = await fetch(`/api/admin/migrations/${selectedMigration.id}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      if (result.success) {
        setMigrations(migrations.filter(m => m.id !== selectedMigration.id));
        setShowDeleteDialog(false);
        setSelectedMigration(null);
      } else {
        console.error('Failed to delete migration:', result.error);
        alert('Failed to delete migration: ' + result.error);
      }
    } catch (error) {
      console.error('Failed to delete migration:', error);
      alert('Failed to delete migration');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePreviewMigration = (migration: Migration) => {
    setSelectedMigration(migration);
    setShowPreviewDialog(true);
  };

  const filteredMigrations = migrations.filter(migration => {
    const matchesSearch = migration.device_categories.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         migration.from_version.includes(searchTerm) ||
                         migration.to_version.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'applied' && migration.applied_at) ||
                         (statusFilter === 'pending' && !migration.applied_at);
    
    return matchesSearch && matchesStatus;
  });

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
          <h1 className="text-2xl font-bold text-gray-900">Schema Migrations</h1>
          <p className="text-gray-600">Manage database schema changes and migrations</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={handleNewMigration}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Migration
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search migrations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="applied">Applied</option>
          </select>
        </div>
      </div>

      {/* Migrations Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Version Change
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applied
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredMigrations.map((migration) => (
                <tr key={migration.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <Database className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">
                        {migration.device_categories.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {migration.from_version} → {migration.to_version}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge applied={!!migration.applied_at} />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(migration.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {migration.applied_at 
                      ? new Date(migration.applied_at).toLocaleDateString()
                      : '-'
                    }
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handlePreviewMigration(migration)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="Preview Migration"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      {!migration.applied_at ? (
                        <>
                          <button
                            onClick={() => handleApplyMigration(migration)}
                            disabled={actionLoading === 'apply'}
                            className="p-1 text-gray-400 hover:text-green-600 disabled:opacity-50"
                            title="Apply Migration"
                          >
                            {actionLoading === 'apply' ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteMigration(migration)}
                            disabled={actionLoading === 'delete'}
                            className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-50"
                            title="Delete Migration"
                          >
                            {actionLoading === 'delete' ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleRollbackMigration(migration)}
                          disabled={actionLoading === 'rollback'}
                          className="p-1 text-gray-400 hover:text-orange-600 disabled:opacity-50"
                          title="Rollback Migration"
                        >
                          {actionLoading === 'rollback' ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
                          ) : (
                            <RotateCcw className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredMigrations.length === 0 && (
          <div className="text-center py-12">
            <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No migrations found</p>
            <p className="text-sm text-gray-400 mt-1">
              Create your first migration to get started
            </p>
          </div>
        )}
      </div>

      {/* Migration Form Modal */}
      <MigrationForm
        isOpen={showMigrationForm}
        onClose={() => setShowMigrationForm(false)}
        onSave={handleSaveMigration}
      />

      {/* Apply Migration Confirmation */}
      <ConfirmationDialog
        isOpen={showApplyDialog}
        title="Apply Migration"
        message={`Are you sure you want to apply the migration from ${selectedMigration?.from_version} to ${selectedMigration?.to_version} for ${selectedMigration?.device_categories.name}? This will modify the database schema.`}
        confirmText="Apply Migration"
        cancelText="Cancel"
        variant="warning"
        onConfirm={confirmApplyMigration}
        onCancel={() => {
          setShowApplyDialog(false);
          setSelectedMigration(null);
        }}
      />

      {/* Rollback Migration Confirmation */}
      <ConfirmationDialog
        isOpen={showRollbackDialog}
        title="Rollback Migration"
        message={`Are you sure you want to rollback the migration from ${selectedMigration?.from_version} to ${selectedMigration?.to_version} for ${selectedMigration?.device_categories.name}? This will create a reverse migration.`}
        confirmText="Rollback Migration"
        cancelText="Cancel"
        variant="warning"
        onConfirm={confirmRollbackMigration}
        onCancel={() => {
          setShowRollbackDialog(false);
          setSelectedMigration(null);
        }}
      />

      {/* Delete Migration Confirmation */}
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        title="Delete Migration"
        message={`Are you sure you want to delete this migration? This action cannot be undone. Note: Only unapplied migrations can be deleted.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmDeleteMigration}
        onCancel={() => {
          setShowDeleteDialog(false);
          setSelectedMigration(null);
        }}
      />

      {/* Migration Preview Dialog */}
      {showPreviewDialog && selectedMigration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <Database className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Migration Preview</h2>
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Category</h3>
                    <p className="text-lg font-medium text-gray-900">{selectedMigration.device_categories.name}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Version Change</h3>
                    <p className="text-lg font-medium text-gray-900">
                      {selectedMigration.from_version} → {selectedMigration.to_version}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Status</h3>
                    <StatusBadge applied={!!selectedMigration.applied_at} />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Created</h3>
                    <p className="text-lg font-medium text-gray-900">
                      {new Date(selectedMigration.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Operations</h3>
                  <div className="space-y-3">
                    {selectedMigration.operations.map((op: any, index: number) => (
                      <div key={index} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            {op.type.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className="text-sm font-medium text-gray-700">{op.field}</span>
                        </div>
                        <p className="text-sm text-gray-600">{op.description}</p>
                        {op.fieldType && (
                          <p className="text-xs text-gray-500 mt-1">Type: {op.fieldType}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface StatusBadgeProps {
  applied: boolean;
}

function StatusBadge({ applied }: StatusBadgeProps) {
  if (applied) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
        <CheckCircle className="w-3 h-3 mr-1" />
        Applied
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
      <Clock className="w-3 h-3 mr-1" />
      Pending
    </span>
  );
}