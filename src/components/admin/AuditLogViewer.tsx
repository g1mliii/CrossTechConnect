/**
 * Audit Log Viewer - Display admin action history
 */

'use client';

import { useEffect, useState } from 'react';
import { Clock, User, FileText, CheckCircle, XCircle, Filter } from 'lucide-react';
import { LoadingState } from './LoadingState';

interface AuditLog {
  id: string;
  admin_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  changes: any;
  ip_address: string;
  success: boolean;
  error_message?: string;
  created_at: string;
  admin?: {
    email: string;
    display_name?: string;
  };
}

export function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: '',
    entityType: '',
    adminId: '',
  });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const limit = 50;

  useEffect(() => {
    fetchLogs();
  }, [filters, page]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: (page * limit).toString(),
      });

      if (filters.action) params.append('action', filters.action);
      if (filters.entityType) params.append('entityType', filters.entityType);
      if (filters.adminId) params.append('adminId', filters.adminId);

      const response = await fetch(`/api/admin/audit-log?${params}`);
      const result = await response.json();

      if (result.success) {
        setLogs(result.data.logs);
        setTotal(result.data.total);
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getActionColor = (action: string) => {
    if (action.includes('create')) return 'text-green-600 bg-green-50';
    if (action.includes('update')) return 'text-blue-600 bg-blue-50';
    if (action.includes('delete')) return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  if (loading && logs.length === 0) {
    return <LoadingState text="Loading audit logs..." />;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Filter className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-medium text-gray-700">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Filter by action..."
            value={filters.action}
            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Filter by entity type..."
            value={filters.entityType}
            onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Filter by admin ID..."
            value={filters.adminId}
            onChange={(e) => setFilters({ ...filters, adminId: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Admin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Entity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  IP Address
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>{formatDate(log.created_at)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span>{log.admin?.display_name || log.admin?.email || log.admin_id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span>{log.entity_type}</span>
                      <span className="text-gray-400">#{log.entity_id.substring(0, 8)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {log.success ? (
                      <div className="flex items-center space-x-1 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm">Success</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1 text-red-600">
                        <XCircle className="w-4 h-4" />
                        <span className="text-sm">Failed</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {log.ip_address}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {page * limit + 1} to {Math.min((page + 1) * limit, total)} of {total} logs
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={(page + 1) * limit >= total}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
