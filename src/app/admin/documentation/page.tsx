// Admin Documentation Management Page
'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';

interface Documentation {
  id: string;
  deviceId: string;
  title: string;
  contentType: string;
  sourceType: string;
  verified: boolean;
  confidenceScore?: number;
  helpfulVotes: number;
  notHelpfulVotes: number;
  viewCount: number;
  cacheStatus: string;
  createdAt: string;
  device?: {
    id: string;
    name: string;
    brand: string;
  };
}

const ITEMS_PER_PAGE = 50;

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data;
};

export default function AdminDocumentationPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    contentType: '',
    sourceType: '',
    verified: '',
    minConfidence: ''
  });

  const params = new URLSearchParams();
  if (filters.contentType) params.append('contentType', filters.contentType);
  if (filters.sourceType) params.append('sourceType', filters.sourceType);
  if (filters.verified) params.append('verified', filters.verified);
  if (filters.minConfidence) params.append('minConfidence', filters.minConfidence);
  params.append('limit', ITEMS_PER_PAGE.toString());
  params.append('offset', ((currentPage - 1) * ITEMS_PER_PAGE).toString());

  // Use SWR for client-side caching
  const { data, error, isLoading, mutate } = useSWR(
    `/api/documentation?${params.toString()}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // 30 seconds deduplication
      keepPreviousData: true
    }
  );

  const documentation: Documentation[] = data?.data || [];
  const totalCount = data?.total || 0;

  const verifyDocumentation = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/documentation/${id}/verify`, {
        method: 'POST'
      });
      
      if (response.ok) {
        mutate(); // Revalidate the cache
      }
    } catch (error) {
      console.error('Error verifying documentation:', error);
    }
  };

  const deleteDocumentation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this documentation?')) return;

    try {
      const response = await fetch(`/api/admin/documentation/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        mutate(); // Revalidate the cache
      }
    } catch (error) {
      console.error('Error deleting documentation:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Documentation Management</h1>
        <p className="text-gray-600">Manage device documentation, manuals, and guides</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Content Type</label>
            <select
              value={filters.contentType}
              onChange={(e) => setFilters({ ...filters, contentType: e.target.value })}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">All Types</option>
              <option value="manual">Manual</option>
              <option value="guide">Guide</option>
              <option value="review">Review</option>
              <option value="tip">Tip</option>
              <option value="troubleshooting">Troubleshooting</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Source Type</label>
            <select
              value={filters.sourceType}
              onChange={(e) => setFilters({ ...filters, sourceType: e.target.value })}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">All Sources</option>
              <option value="ai_extracted">AI Extracted</option>
              <option value="user_contributed">User Contributed</option>
              <option value="official">Official</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Verified</label>
            <select
              value={filters.verified}
              onChange={(e) => setFilters({ ...filters, verified: e.target.value })}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">All</option>
              <option value="true">Verified</option>
              <option value="false">Unverified</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Min Confidence</label>
            <input
              type="number"
              min="0"
              max="1"
              step="0.1"
              value={filters.minConfidence}
              onChange={(e) => setFilters({ ...filters, minConfidence: e.target.value })}
              className="w-full border rounded px-3 py-2"
              placeholder="0.0 - 1.0"
            />
          </div>
        </div>
      </div>

      {/* Documentation List */}
      <div className="bg-white rounded-lg shadow">
        {isLoading ? (
          <div className="p-8 text-center">Loading...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">
            Error loading documentation: {error.message}
          </div>
        ) : documentation.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No documentation found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Title</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Device</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Source</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Confidence</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Votes</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Views</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {documentation.map((doc: Documentation) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium">{doc.title}</div>
                      <div className="text-xs text-gray-500">{doc.id}</div>
                    </td>
                    <td className="px-4 py-3">
                      {doc.device ? (
                        <div>
                          <div className="font-medium">{doc.device.name}</div>
                          <div className="text-xs text-gray-500">{doc.device.brand}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                        {doc.contentType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded ${
                        doc.sourceType === 'ai_extracted' ? 'bg-purple-100 text-purple-800' :
                        doc.sourceType === 'official' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {doc.sourceType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {doc.confidenceScore !== undefined ? (
                        <span className={`font-medium ${
                          doc.confidenceScore >= 0.8 ? 'text-green-600' :
                          doc.confidenceScore >= 0.6 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {(doc.confidenceScore * 100).toFixed(0)}%
                        </span>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <span className="text-green-600">↑{doc.helpfulVotes}</span>
                        {' / '}
                        <span className="text-red-600">↓{doc.notHelpfulVotes}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{doc.viewCount}</td>
                    <td className="px-4 py-3">
                      {doc.verified ? (
                        <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">
                          Verified
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800">
                          Unverified
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/documentation/${doc.id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          View
                        </Link>
                        {!doc.verified && (
                          <button
                            onClick={() => verifyDocumentation(doc.id)}
                            className="text-green-600 hover:text-green-800 text-sm"
                          >
                            Verify
                          </button>
                        )}
                        <button
                          onClick={() => deleteDocumentation(doc.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      </div>
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
            Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount} documents
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

      {/* Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Total Documents</div>
          <div className="text-2xl font-bold">{totalCount}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Current Page</div>
          <div className="text-2xl font-bold text-blue-600">
            {documentation.length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Verified (Page)</div>
          <div className="text-2xl font-bold text-green-600">
            {documentation.filter(d => d.verified).length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">AI Extracted (Page)</div>
          <div className="text-2xl font-bold text-purple-600">
            {documentation.filter(d => d.sourceType === 'ai_extracted').length}
          </div>
        </div>
      </div>
    </div>
  );
}
