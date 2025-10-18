/**
 * Admin Layout - Protected layout for admin interfaces
 */

'use client';

import { ReactNode } from 'react';
import { SWRConfig } from 'swr';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  // TODO: Add authentication check for admin role
  // const user = await getCurrentUser();
  // if (!user || user.role !== 'admin') {
  //   redirect('/login');
  // }

  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        dedupingInterval: 60000, // 60 seconds
        focusThrottleInterval: 60000,
        provider: () => new Map(), // Use Map for better performance
      }}
    >
      <div className="admin-panel min-h-screen bg-gray-50 text-gray-900" style={{ colorScheme: 'light' }}>
        <AdminHeader />
        <div className="flex min-h-screen">
          <AdminSidebar />
          <main className="flex-1 p-6 bg-gray-50 text-gray-900">
            {children}
          </main>
        </div>
      </div>
    </SWRConfig>
  );
}