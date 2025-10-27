/**
 * Admin page for verification queue
 */

'use client';

import { VerificationInterface } from '@/components/admin/VerificationInterface';

export default function VerificationsPage() {
  // In a real app, get this from auth context
  const mockUserId = 'admin-user-id';
  const mockUserReputation = 100;

  return (
    <div className="space-y-6">
      <VerificationInterface
        userId={mockUserId}
        userReputationScore={mockUserReputation}
      />
    </div>
  );
}
