/**
 * New Device Page - Interface for creating new devices
 */

import { NewDeviceForm } from '@/components/admin/NewDeviceForm';

export default function NewDevicePage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create New Device</h1>
        <p className="text-gray-600">Add a new device to the catalog with specifications.</p>
      </div>
      <NewDeviceForm />
    </div>
  );
}
