/**
 * Verification Interface - Category-specific verification checklists
 */

'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Clock, User, Calendar } from 'lucide-react';

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
  category: {
    id: string;
    name: string;
  };
}

interface VerificationItem {
  id: string;
  deviceId: string;
  fieldName: string;
  currentValue: any;
  proposedValue: any;
  sourceType: 'ai_extraction' | 'user_submission';
  confidenceScore: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  device: {
    id: string;
    name: string;
    brand: string;
    category: {
      id: string;
      name: string;
    };
  };
  votes?: VerificationVote[];
}

interface VerificationVote {
  id: string;
  userId: string;
  vote: 'approve' | 'reject' | 'modify';
  suggestedValue?: any;
  comment?: string;
  createdAt: string;
  user: {
    displayName: string;
    reputationScore: number;
  };
}

interface VerificationInterfaceProps {
  categoryId?: string;
  deviceId?: string;
  userId: string;
  userReputationScore: number;
}

export function VerificationInterface({
  categoryId,
  deviceId,
  userId,
  userReputationScore
}: VerificationInterfaceProps) {
  const [verificationItems, setVerificationItems] = useState<VerificationItem[]>([]);
  const [categorySchema, setCategorySchema] = useState<CategorySchema | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'high_confidence' | 'low_confidence'>('pending');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'confidence' | 'priority'>('newest');

  useEffect(() => {
    fetchVerificationItems();
  }, [categoryId, deviceId, filter, sortBy]);

  useEffect(() => {
    if (categoryId) {
      fetchCategorySchema();
    }
  }, [categoryId]);

  const fetchVerificationItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryId) params.append('categoryId', categoryId);
      if (deviceId) params.append('deviceId', deviceId);
      params.append('filter', filter);
      params.append('sortBy', sortBy);

      const response = await fetch(`/api/verification/items?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setVerificationItems(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch verification items:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategorySchema = async () => {
    if (!categoryId) return;
    
    try {
      const response = await fetch(`/api/categories/${categoryId}/schema`);
      const data = await response.json();
      
      if (data.success) {
        setCategorySchema(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch category schema:', error);
    }
  };

  const submitVote = async (itemId: string, vote: 'approve' | 'reject' | 'modify', suggestedValue?: any, comment?: string) => {
    try {
      const response = await fetch(`/api/verification/items/${itemId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vote,
          suggestedValue,
          comment
        })
      });

      if (response.ok) {
        // Refresh the verification items
        fetchVerificationItems();
      }
    } catch (error) {
      console.error('Failed to submit vote:', error);
    }
  };

  const getFieldDefinition = (fieldName: string): FieldDefinition | null => {
    if (!categorySchema) return null;
    return categorySchema.fields[fieldName] || null;
  };

  const formatValue = (value: any, fieldDef: FieldDefinition | null): string => {
    if (value === null || value === undefined) return 'N/A';
    
    if (fieldDef?.type === 'number' && fieldDef.unit) {
      return `${value} ${fieldDef.unit}`;
    }
    
    if (fieldDef?.type === 'array' && Array.isArray(value)) {
      return value.join(', ');
    }
    
    if (fieldDef?.type === 'object' && typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    
    return String(value);
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-50';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const calculateVoteWeight = (reputationScore: number): number => {
    return Math.min(reputationScore / 100, 5.0);
  };

  const getVoteSummary = (item: VerificationItem) => {
    if (!item.votes || item.votes.length === 0) {
      return { approveWeight: 0, rejectWeight: 0, modifyWeight: 0, totalVotes: 0 };
    }

    const summary = item.votes.reduce((acc, vote) => {
      const weight = calculateVoteWeight(vote.user.reputationScore);
      acc[`${vote.vote}Weight`] += weight;
      acc.totalVotes += 1;
      return acc;
    }, { approveWeight: 0, rejectWeight: 0, modifyWeight: 0, totalVotes: 0 });

    return summary;
  };

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Verification Queue</h2>
          <p className="text-sm text-gray-600 mt-1">
            Review and verify device specifications
            {categorySchema && ` for ${categorySchema.category.name}`}
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Items</option>
            <option value="pending">Pending Only</option>
            <option value="high_confidence">High Confidence (≥80%)</option>
            <option value="low_confidence">Low Confidence (&lt;60%)</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="confidence">By Confidence</option>
            <option value="priority">By Priority</option>
          </select>
        </div>
      </div>

      {/* User Reputation Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <User className="w-5 h-5 text-blue-500" />
          <span className="text-sm text-blue-800">
            Your reputation score: <strong>{userReputationScore}</strong> 
            (Vote weight: {calculateVoteWeight(userReputationScore).toFixed(1)}x)
          </span>
        </div>
      </div>

      {/* Verification Items */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading verification items...</span>
        </div>
      ) : verificationItems.length === 0 ? (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No verification items found</h3>
          <p className="text-gray-600">
            {filter === 'pending' 
              ? 'All items have been verified!' 
              : 'Try adjusting your filters to see more items.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {verificationItems.map((item) => {
            const fieldDef = getFieldDefinition(item.fieldName);
            const voteSummary = getVoteSummary(item);
            const hasUserVoted = item.votes?.some(vote => vote.userId === userId);
            
            return (
              <div key={item.id} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {getStatusIcon(item.status)}
                      <h3 className="text-lg font-medium text-gray-900">
                        {item.device.brand} {item.device.name}
                      </h3>
                      <span className="text-sm text-gray-500">
                        {item.device.category.name}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(item.confidenceScore)}`}>
                        {Math.round(item.confidenceScore * 100)}% confidence
                      </span>
                      <span className="capitalize">{item.sourceType.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>

                {/* Field Information */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-gray-900 mb-3">
                    Field: {fieldDef?.label || item.fieldName}
                    {fieldDef?.unit && <span className="text-gray-500 ml-1">({fieldDef.unit})</span>}
                  </h4>
                  
                  {fieldDef?.description && (
                    <p className="text-sm text-gray-600 mb-3">{fieldDef.description}</p>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Current Value
                      </label>
                      <div className="p-3 bg-white border border-gray-200 rounded-lg">
                        <code className="text-sm">
                          {formatValue(item.currentValue, fieldDef)}
                        </code>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Proposed Value
                      </label>
                      <div className="p-3 bg-white border border-gray-200 rounded-lg">
                        <code className="text-sm">
                          {formatValue(item.proposedValue, fieldDef)}
                        </code>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vote Summary */}
                {voteSummary.totalVotes > 0 && (
                  <div className="bg-blue-50 rounded-lg p-4 mb-4">
                    <h5 className="font-medium text-gray-900 mb-2">Vote Summary</h5>
                    <div className="flex items-center space-x-6 text-sm">
                      <span className="text-green-600">
                        Approve: {voteSummary.approveWeight.toFixed(1)} weight
                      </span>
                      <span className="text-red-600">
                        Reject: {voteSummary.rejectWeight.toFixed(1)} weight
                      </span>
                      <span className="text-yellow-600">
                        Modify: {voteSummary.modifyWeight.toFixed(1)} weight
                      </span>
                      <span className="text-gray-600">
                        Total votes: {voteSummary.totalVotes}
                      </span>
                    </div>
                  </div>
                )}

                {/* Voting Actions */}
                {item.status === 'pending' && !hasUserVoted && (
                  <div className="flex items-center justify-end space-x-3">
                    <button
                      onClick={() => submitVote(item.id, 'reject')}
                      className="inline-flex items-center px-4 py-2 border border-red-300 text-red-700 bg-white rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </button>
                    
                    <button
                      onClick={() => {
                        const comment = prompt('Optional comment:');
                        submitVote(item.id, 'modify', null, comment || undefined);
                      }}
                      className="inline-flex items-center px-4 py-2 border border-yellow-300 text-yellow-700 bg-white rounded-lg hover:bg-yellow-50 transition-colors"
                    >
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Needs Modification
                    </button>
                    
                    <button
                      onClick={() => submitVote(item.id, 'approve')}
                      className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </button>
                  </div>
                )}

                {hasUserVoted && (
                  <div className="text-center py-2">
                    <span className="text-sm text-gray-600">You have already voted on this item</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}