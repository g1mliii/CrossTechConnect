/**
 * Category Detail Page - View category details
 */

import { CategoryDetail } from '../../../../components/admin/CategoryDetail';

export default async function CategoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="max-w-4xl mx-auto">
      <CategoryDetail categoryId={id} />
    </div>
  );
}
