/**
 * Device Detail Page - View device details
 */

import { DeviceDetail } from '@/components/admin/DeviceDetail';

export default function DeviceDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="max-w-4xl mx-auto">
      <DeviceDetail deviceId={params.id} />
    </div>
  );
}
