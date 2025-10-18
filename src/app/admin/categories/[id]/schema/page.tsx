/**
 * Category Schema Management Page
 */

import { CategorySchemaManagement } from '@/components/admin/CategorySchemaManagement';

export default async function CategorySchemaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  return (
    <div className="max-w-7xl mx-auto">
      <CategorySchemaManagement categoryId={id} />
    </div>
  );
}
