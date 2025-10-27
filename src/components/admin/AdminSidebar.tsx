/**
 * Admin Sidebar - Navigation menu for admin interface
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Layers, 
  BarChart3, 
  Settings, 
  Database,
  FileText,
  Zap,
  Users,
  Smartphone,
  Shield,
  BookOpen,
  Sparkles,
  Flag
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigationSections = [
  {
    title: 'Overview',
    items: [
      { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
      { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    ]
  },
  {
    title: 'Device Management',
    items: [
      { name: 'Categories', href: '/admin/categories', icon: Layers },
      { name: 'Devices', href: '/admin/devices', icon: Smartphone },
      { name: 'Templates', href: '/admin/templates', icon: FileText },
    ]
  },
  {
    title: 'Content & AI',
    items: [
      { name: 'Documentation', href: '/admin/documentation', icon: BookOpen },
      { name: 'AI Extractions', href: '/admin/extractions', icon: Sparkles },
      { name: 'Moderation Queue', href: '/admin/moderation', icon: Flag },
    ]
  },
  {
    title: 'System',
    items: [
      { name: 'Users', href: '/admin/users', icon: Users },
      { name: 'Audit Log', href: '/admin/audit-log', icon: Shield },
      { name: 'Migrations', href: '/admin/migrations', icon: Database },
      { name: 'Plugins', href: '/admin/plugins', icon: Zap },
      { name: 'Settings', href: '/admin/settings', icon: Settings },
    ]
  }
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <nav className="p-4 space-y-6">
        {navigationSections.map((section) => (
          <div key={section.title}>
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              {section.title}
            </h3>
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}