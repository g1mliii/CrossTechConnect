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
  Database
} from 'lucide-react';

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
          <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
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
                      {!migration.applied_at && (
                        <button
                          className="p-1 text-gray-400 hover:text-green-600"
                          title="Apply Migration"
                        >
                          <Play className="w-4 h-4" />
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