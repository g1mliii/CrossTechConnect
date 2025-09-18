/**
 * Admin Dashboard - Main overview interface with key metrics and quick actions
 */

'use client';

import { useEffect, useState } from 'react';
import { 
  Layers, 
  Database, 
  Users, 
  TrendingUp,
  Plus,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  totalCategories: number;
  totalDevices: number;
  totalUsers: number;
  pendingVerifications: number;
  recentActivity: ActivityItem[];
  systemHealth: SystemHealth;
}

interface ActivityItem {
  id: string;
  type: 'category_created' | 'schema_updated' | 'migration_applied' | 'device_added';
  description: string;
  timestamp: Date;
  user?: string;
}

interface SystemHealth {
  status: 'healthy' | 'warning' | 'error';
  issues: string[];
  lastCheck: Date;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // TODO: Replace with actual API call
      const mockStats: DashboardStats = {
        totalCategories: 12,
        totalDevices: 1247,
        totalUsers: 89,
        pendingVerifications: 23,
        recentActivity: [
          {
            id: '1',
            type: 'category_created',
            description: 'New category "Smart Watches" created',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            user: 'admin@example.com'
          },
          {
            id: '2',
            type: 'schema_updated',
            description: 'Gaming Console schema updated to v1.2',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
            user: 'admin@example.com'
          },
          {
            id: '3',
            type: 'device_added',
            description: '15 new devices added via AI extraction',
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000)
          }
        ],
        systemHealth: {
          status: 'healthy',
          issues: [],
          lastCheck: new Date()
        }
      };
      
      setStats(mockStats);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load dashboard data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Manage device categories, schemas, and system configuration</p>
        </div>
        <div className="flex space-x-3">
          <Link
            href="/admin/categories/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Category
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Categories"
          value={stats.totalCategories}
          icon={Layers}
          color="blue"
          href="/admin/categories"
        />
        <StatCard
          title="Devices"
          value={stats.totalDevices}
          icon={Database}
          color="green"
          href="/admin/devices"
        />
        <StatCard
          title="Users"
          value={stats.totalUsers}
          icon={Users}
          color="purple"
          href="/admin/users"
        />
        <StatCard
          title="Pending Verifications"
          value={stats.pendingVerifications}
          icon={Clock}
          color="orange"
          href="/admin/verifications"
        />
      </div>

      {/* System Health */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">System Health</h2>
          <div className="flex items-center space-x-2">
            {stats.systemHealth.status === 'healthy' && (
              <CheckCircle className="w-5 h-5 text-green-500" />
            )}
            {stats.systemHealth.status === 'warning' && (
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
            )}
            {stats.systemHealth.status === 'error' && (
              <AlertTriangle className="w-5 h-5 text-red-500" />
            )}
            <span className={`text-sm font-medium ${
              stats.systemHealth.status === 'healthy' ? 'text-green-700' :
              stats.systemHealth.status === 'warning' ? 'text-yellow-700' :
              'text-red-700'
            }`}>
              {stats.systemHealth.status.charAt(0).toUpperCase() + stats.systemHealth.status.slice(1)}
            </span>
          </div>
        </div>
        
        {stats.systemHealth.issues.length > 0 ? (
          <div className="space-y-2">
            {stats.systemHealth.issues.map((issue, index) => (
              <div key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                <span>{issue}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-600">All systems operational</p>
        )}
        
        <p className="text-xs text-gray-500 mt-2">
          Last checked: {stats.systemHealth.lastCheck.toLocaleTimeString()}
        </p>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {stats.recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3 py-2">
              <div className="flex-shrink-0">
                {activity.type === 'category_created' && <Layers className="w-5 h-5 text-blue-500" />}
                {activity.type === 'schema_updated' && <Database className="w-5 h-5 text-green-500" />}
                {activity.type === 'migration_applied' && <TrendingUp className="w-5 h-5 text-purple-500" />}
                {activity.type === 'device_added' && <Plus className="w-5 h-5 text-orange-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">{activity.description}</p>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <span>{activity.timestamp.toLocaleTimeString()}</span>
                  {activity.user && (
                    <>
                      <span>•</span>
                      <span>{activity.user}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'purple' | 'orange';
  href?: string;
}

function StatCard({ title, value, icon: Icon, color, href }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
  };

  const content = (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
        </div>
        <div className={`p-3 rounded-lg border ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}