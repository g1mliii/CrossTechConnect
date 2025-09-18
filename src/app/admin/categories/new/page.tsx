/**
 * New Category Page - Interface for creating new device categories
 */

import { NewCategoryForm } from '@/components/admin/NewCategoryForm';

export default function NewCategoryPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create New Category</h1>
        <p className="text-gray-600">Define a new device category with custom specifications and validation rules.</p>
      </div>
      <NewCategoryForm />
    </div>
  );
}