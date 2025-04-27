'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarDays,
  BarChart3,
  Settings,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  Brain,
  Repeat,
  Target,
  FileText,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/ui/mode-toggle';

const navItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Task Input',
    href: '/task',
    icon: PlusCircle,
  },
  {
    title: 'Calendar',
    href: '/calendar',
    icon: CalendarDays,
  },
  {
    title: 'Habits',
    href: '/habits',
    icon: Repeat,
  },
  {
    title: 'Priorities',
    href: '/priorities',
    icon: Target,
  },
  {
    title: 'Task Templates',
    href: '/templates',
    icon: FileText,
  },
  {
    title: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className={cn(
        'relative h-screen border-r border-gray-200 bg-white transition-all duration-300 dark:border-gray-800 dark:bg-gray-900',
        isCollapsed ? 'w-14' : 'w-48',
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-4 z-20 h-6 w-6 rounded-full border bg-white dark:bg-gray-900"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </Button>

      <nav className="flex h-full flex-col px-2 py-4">
        <Link
          href="/dashboard"
          className={cn(
            'logo-text mb-4 flex items-center gap-2 px-2 text-sm font-semibold',
            isCollapsed ? 'justify-center px-0' : '',
          )}
        >
          <Brain className="h-4 w-4 shrink-0 text-primary" />
          {!isCollapsed && <span className="truncate">TaskMindAI</span>}
        </Link>

        <div className="flex-1 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50',
                pathname === item.href
                  ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50'
                  : '',
                isCollapsed ? 'justify-center' : '',
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span className="truncate">{item.title}</span>}
            </Link>
          ))}
        </div>
        <div
          className={cn(
            'mt-auto border-t border-gray-200 pt-3 dark:border-gray-800',
            isCollapsed ? 'flex justify-center' : '',
          )}
        >
          <ModeToggle />
        </div>
      </nav>
    </div>
  );
}
