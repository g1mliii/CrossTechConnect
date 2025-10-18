/**
 * Category Detail - View category details
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface CategoryDetailProps {
  categoryId: string;
}

interface Category {
  id: string;
  name: string;
  parent_id: string | null;
  attributes: Record<string, unknown> | null;
  deviceCount: number;
}

export function CategoryDetail({ categoryId }: CategoryDetailProps) {
  const router = useRouter();
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  const fetchCategory = async () => {
    try {
      const response = await fetch(`/api/categories/${categoryId}`);
      const data = await response.json();
      
      if (data.success) {
        setCategory(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch category:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!category) return;

    if (category.deviceCount > 0) {
      alert(`Cannot delete category "${category.name}" because it has ${category.deviceCount} device(s). Please reassign or delete devices first.`);
      return;
    }

    if (!confirm(`Are you sure you want to delete the category "${category.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok) {
        router.push('/admin/categories');
      } else {
        alert(data.error || 'Failed to delete category');
      }
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert('Failed to delete category');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Category not found</p>
        <Link href="/admin/categories" className="text-blue-600 hover:underline mt-4 inline-block">
          Back to Categories
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/categories"
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{category.name}</h1>
            <p className="text-gray-600">{category.deviceCount} device(s)</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Link
            href={`/admin/categories/${categoryId}/schema`}
            className="inline-flex items-center px-4 py-2 border border-blue-300 rounded-lg text-blue-700 bg-white hover:bg-blue-50 transition-colors"
          >
            <Edit className="w-4 h-4 mr-2" />
            Manage Schema
          </Link>
          <Link
            href={`/admin/categories/${categoryId}/edit`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Link>
          <button
            onClick={handleDelete}
            className="inline-flex items-center px-4 py-2 border border-red-300 rounded-lg text-red-700 bg-white hover:bg-red-50 transition-colors"
            disabled={category.deviceCount > 0}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </button>
        </div>
      </div>

      {/* Basic Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Category Information</h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Category Name</dt>
            <dd className="mt-1 text-sm text-gray-900">{category.name}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Device Count</dt>
            <dd className="mt-1 text-sm text-gray-900">{category.deviceCount}</dd>
          </div>
          {category.parent_id && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Parent Category</dt>
              <dd className="mt-1 text-sm text-gray-900">{category.parent_id}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Attributes */}
      {category.attributes && Object.keys(category.attributes).length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Attributes</h2>
          <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm">
            {JSON.stringify(category.attributes, null, 2)}
          </pre>
        </div>
      )}

      {/* Devices in Category */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Devices in this Category</h2>
        <Link
          href={`/admin/devices?category=${categoryId}`}
          className="text-blue-600 hover:underline"
        >
          View all {category.deviceCount} device(s) →
        </Link>
      </div>
    </div>
  );
}
