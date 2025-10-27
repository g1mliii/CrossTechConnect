// Admin Content Moderation Queue Page
'use client';

import { useState } from 'react';
import useSWR from 'swr';

interface ModerationItem {
  id: string;
  contentType: string;
  contentId: string;
  reason: string;
  status: string;
  reportedById?: string;
  moderatorNotes?: string;
  createdAt: string;
  moderatedAt?: string;
}

const ITEMS_PER_PAGE = 50;

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data;
};

export default function AdminModerationPage() {
  const [statusFilter, setStatusFilter] = useState('pending');
  const [currentPage, setCurrentPage] = useState(1);

  const params = new URLSearchParams({
    status: statusFilter,
    limit: ITEMS_PER_PAGE.toString(),
    offset: ((currentPage - 1) * ITEMS_PER_PAGE).toString()
  });

  // Use SWR for client-side caching
  const { data: queueData, error: queueError, isLoading: queueLoading, mutate } = useSWR(
    `/api/admin/moderation?${params.toString()}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000, // 10 seconds deduplication
      keepPreviousData: true
    }
  );

  const { data: statsData } = useSWR(
    '/api/admin/moderation/stats',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000 // 30 seconds for stats
    }
  );

  const queue = queueData?.data || [];
  const totalCount = queueData?.total || 0;
  const stats = statsData?.data || {
    pending: 0,
    approved: 0,
    rejected: 0,
    removed: 0,
    total: 0
  };

  const moderateContent = async (
    id: string,
    status: 'approved' | 'rejected' | 'removed',
    notes?: string
  ) => {
    try {
      const response = await fetch(`/api/admin/moderation/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes })
      });
      
      if (response.ok) {
        mutate(); // Revalidate the cache
      }
    } catch (error) {
      console.error('Error moderating content:', error);
    }
  };

  const handleModerate = (item: ModerationItem, status: 'approved' | 'rejected' | 'removed') => {
    const notes = prompt(`Enter moderation notes (optional):`);
    moderateContent(item.id, status, notes || undefined);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Content Moderation Queue</h1>
        <p className="text-gray-600">Review and moderate reported content</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Total Reports</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Pending</div>
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Approved</div>
          <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Rejected</div>
          <div className="text-2xl font-bold text-blue-600">{stats.rejected}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Removed</div>
          <div className="text-2xl font-bold text-red-600">{stats.removed}</div>
        </div>
      </div>

      {/* Status Filter */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-2">
          {['pending', 'approved', 'rejected', 'removed'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded ${
                statusFilter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Moderation Queue */}
      <div className="bg-white rounded-lg shadow">
        {queueLoading ? (
          <div className="p-8 text-center">Loading...</div>
        ) : queueError ? (
          <div className="p-8 text-center text-red-500">
            Error loading moderation queue: {queueError.message}
          </div>
        ) : queue.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No items in {statusFilter} queue
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Content</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Reason</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Reported</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Notes</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {queue.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium">{item.contentType}</div>
                      <div className="text-xs text-gray-500">{item.contentId}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded ${
                        item.reason === 'spam' ? 'bg-red-100 text-red-800' :
                        item.reason === 'inappropriate' ? 'bg-orange-100 text-orange-800' :
                        item.reason === 'copyright' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {item.reason}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded ${
                        item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        item.status === 'approved' ? 'bg-green-100 text-green-800' :
                        item.status === 'rejected' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm max-w-xs truncate">
                      {item.moderatorNotes || '-'}
                    </td>
                    <td className="px-4 py-3">
                      {item.status === 'pending' ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleModerate(item, 'approved')}
                            className="text-green-600 hover:text-green-800 text-sm"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleModerate(item, 'rejected')}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleModerate(item, 'removed')}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">
                          {item.moderatedAt ? new Date(item.moderatedAt).toLocaleDateString() : '-'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalCount > ITEMS_PER_PAGE && (
        <div className="mt-6 flex justify-between items-center bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">
            Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount} items
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <div className="flex items-center px-4">
              Page {currentPage} of {Math.ceil(totalCount / ITEMS_PER_PAGE)}
            </div>
            <button
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={currentPage >= Math.ceil(totalCount / ITEMS_PER_PAGE)}
              className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
