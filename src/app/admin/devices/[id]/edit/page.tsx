/**
 * Edit Device Page - Interface for editing existing devices
 */

import { EditDeviceForm } from '@/components/admin/EditDeviceForm';

export default function EditDevicePage({ params }: { params: { id: string } }) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Device</h1>
        <p className="text-gray-600">Update device information and specifications.</p>
      </div>
      <EditDeviceForm deviceId={params.id} />
    </div>
  );
}
