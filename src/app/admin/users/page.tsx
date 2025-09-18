/**
 * Users Page - User management and verification
 */

export default function UsersPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600">Manage users, verification, and reputation system</p>
      </div>
      
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-purple-600">👥</span>
          <h3 className="text-lg font-semibold text-purple-800">Future Implementation</h3>
        </div>
        <p className="text-purple-700 mb-4">
          User management and verification system will be implemented when the crowdsourcing features are built.
        </p>
        <div className="text-sm text-purple-600">
          <p><strong>Planned for:</strong> Task 20 - Verification and Crowdsourcing System</p>
          <p><strong>Dependencies:</strong> User authentication system, verification queue</p>
          <p><strong>Features coming:</strong></p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>User account management</li>
            <li>Reputation scoring system</li>
            <li>Verification queue management</li>
            <li>User contribution tracking</li>
            <li>Moderation tools</li>
          </ul>
        </div>
      </div>
    </div>
  );
}