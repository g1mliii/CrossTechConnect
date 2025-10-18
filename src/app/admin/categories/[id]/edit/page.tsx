/**
 * Edit Category Page - Interface for editing existing device categories
 */

import { CategorySchemaManagement } from '@/components/admin/CategorySchemaManagement';

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  return (
    <div className="max-w-7xl mx-auto">
      <CategorySchemaManagement categoryId={id} />
    </div>
  );
}
