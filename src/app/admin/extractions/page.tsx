// Admin AI Extraction Review Queue Page
'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';

interface Extraction {
  id: string;
  documentationId: string;
  deviceId: string;
  categoryId: string;
  schemaVersion: string;
  extractedFields: Record<string, any>;
  fieldConfidence: Record<string, number>;
  missingFields: string[];
  validationErrors?: Record<string, string>;
  aiModel: string;
  processingTime: number;
  reviewStatus: string;
  createdAt: string;
}

const ITEMS_PER_PAGE = 20;

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data;
};

export default function AdminExtractionsPage() {
  const [statusFilter, setStatusFilter] = useState('pending');
  const [currentPage, setCurrentPage] = useState(1);

  const params = new URLSearchParams({
    status: statusFilter,
    limit: ITEMS_PER_PAGE.toString(),
    offset: ((currentPage - 1) * ITEMS_PER_PAGE).toString()
  });

  // Use SWR for client-side caching
  const { data, error, isLoading, mutate } = useSWR(
    `/api/admin/extractions?${params.toString()}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 15000, // 15 seconds deduplication
      keepPreviousData: true // Keep previous data while loading new data
    }
  );

  const extractions: Extraction[] = data?.data || [];
  const totalCount = data?.total || 0;

  const reviewExtraction = async (id: string, status: 'approved' | 'rejected' | 'needs_review') => {
    try {
      const response = await fetch(`/api/admin/extractions/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      
      if (response.ok) {
        mutate(); // Revalidate the cache
      }
    } catch (error) {
      console.error('Error reviewing extraction:', error);
    }
  };

  const calculateOverallConfidence = (fieldConfidence: Record<string, number>) => {
    const values = Object.values(fieldConfidence);
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">AI Extraction Review Queue</h1>
        <p className="text-gray-600">Review and approve AI-extracted device specifications</p>
      </div>

      {/* Status Filter */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-2">
          {['pending', 'needs_review', 'approved', 'rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded ${
                statusFilter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Extractions List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">Loading...</div>
        ) : error ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-red-500">
            Error loading extractions: {error.message}
          </div>
        ) : extractions.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No extractions found with status: {statusFilter}
          </div>
        ) : (
          extractions.map((extraction: Extraction) => {
            const overallConfidence = calculateOverallConfidence(extraction.fieldConfidence);
            const hasErrors = extraction.validationErrors && Object.keys(extraction.validationErrors).length > 0;

            return (
              <div key={extraction.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Extraction {extraction.id}</h3>
                    <div className="text-sm text-gray-600">
                      Device: {extraction.deviceId} | Category: {extraction.categoryId}
                    </div>
                    <div className="text-sm text-gray-600">
                      Schema Version: {extraction.schemaVersion} | Model: {extraction.aiModel}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${
                      overallConfidence >= 0.8 ? 'text-green-600' :
                      overallConfidence >= 0.6 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {(overallConfidence * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-gray-500">Overall Confidence</div>
                  </div>
                </div>

                {/* Extracted Fields */}
                <div className="mb-4">
                  <h4 className="font-semibold mb-2">Extracted Fields ({Object.keys(extraction.extractedFields).length})</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {Object.entries(extraction.extractedFields).map(([field, value]) => {
                      const confidence = extraction.fieldConfidence[field] || 0;
                      return (
                        <div key={field} className="border rounded p-2">
                          <div className="flex justify-between items-start">
                            <div className="font-medium text-sm">{field}</div>
                            <div className={`text-xs font-semibold ${
                              confidence >= 0.8 ? 'text-green-600' :
                              confidence >= 0.6 ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {(confidence * 100).toFixed(0)}%
                            </div>
                          </div>
                          <div className="text-sm text-gray-700 mt-1">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Missing Fields */}
                {extraction.missingFields.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2 text-yellow-600">
                      Missing Fields ({extraction.missingFields.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {extraction.missingFields.map((field) => (
                        <span key={field} className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800">
                          {field}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Validation Errors */}
                {hasErrors && (
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2 text-red-600">
                      Validation Errors ({Object.keys(extraction.validationErrors!).length})
                    </h4>
                    <div className="space-y-1">
                      {Object.entries(extraction.validationErrors!).map(([field, error]) => (
                        <div key={field} className="text-sm">
                          <span className="font-medium">{field}:</span>{' '}
                          <span className="text-red-600">{error}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div className="flex justify-between items-center text-sm text-gray-600 mb-4">
                  <div>Processing Time: {extraction.processingTime}ms</div>
                  <div>Created: {new Date(extraction.createdAt).toLocaleString()}</div>
                </div>

                {/* Actions */}
                {extraction.reviewStatus === 'pending' || extraction.reviewStatus === 'needs_review' ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => reviewExtraction(extraction.id, 'approved')}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => reviewExtraction(extraction.id, 'needs_review')}
                      className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                    >
                      Needs Review
                    </button>
                    <button
                      onClick={() => reviewExtraction(extraction.id, 'rejected')}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Reject
                    </button>
                    <Link
                      href={`/admin/extractions/${extraction.id}/edit`}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Edit Fields
                    </Link>
                  </div>
                ) : (
                  <div className={`px-4 py-2 rounded text-center ${
                    extraction.reviewStatus === 'approved' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    Status: {extraction.reviewStatus.toUpperCase()}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalCount > ITEMS_PER_PAGE && (
        <div className="mt-6 flex justify-between items-center bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">
            Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount} extractions
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
          <div className="text-sm text-gray-600">Total ({statusFilter})</div>
          <div className="text-2xl font-bold">{totalCount}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Avg Confidence (Page)</div>
          <div className="text-2xl font-bold text-blue-600">
            {extractions.length > 0
              ? (extractions.reduce((sum, e) => sum + calculateOverallConfidence(e.fieldConfidence), 0) / extractions.length * 100).toFixed(0)
              : 0}%
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">With Errors (Page)</div>
          <div className="text-2xl font-bold text-red-600">
            {extractions.filter(e => e.validationErrors && Object.keys(e.validationErrors).length > 0).length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Avg Processing Time</div>
          <div className="text-2xl font-bold">
            {extractions.length > 0
              ? (extractions.reduce((sum, e) => sum + e.processingTime, 0) / extractions.length).toFixed(0)
              : 0}ms
          </div>
        </div>
      </div>
    </div>
  );
}
