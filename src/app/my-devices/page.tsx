/**
 * User device library page
 */

'use client';

import { UserDeviceLibrary } from '@/components/UserDeviceLibrary';
import { useRouter } from 'next/navigation';

export default function MyDevicesPage() {
  const router = useRouter();

  // In a real app, get this from auth context
  const mockUserId = 'user-id-123';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <UserDeviceLibrary
          userId={mockUserId}
          onAddDevice={() => {
            // Navigate to device search/add page
            router.push('/search');
          }}
          onEditDevice={(userDevice) => {
            console.log('Edit device:', userDevice);
            // Could open a modal or navigate to edit page
          }}
          onRemoveDevice={(userDeviceId) => {
            console.log('Device removed:', userDeviceId);
          }}
        />
      </div>
    </div>
  );
}
