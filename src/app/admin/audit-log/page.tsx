/**
 * Audit Log Page - View admin action history
 */

import { AuditLogViewer } from '@/components/admin/AuditLogViewer';

export default function AuditLogPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
        <p className="text-gray-600">Track all administrative actions and changes</p>
      </div>
      <AuditLogViewer />
    </div>
  );
}
