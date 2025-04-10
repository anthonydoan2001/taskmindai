'use client';

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  CalendarDays, 
  BarChart3, 
  Settings, 
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  Brain
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/mode-toggle";

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Task Input",
    href: "/dashboard/task",
    icon: PlusCircle,
  },
  {
    title: "Calendar",
    href: "/dashboard/calendar",
    icon: CalendarDays,
  },
  {
    title: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className={cn(
        "relative h-screen border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 transition-all duration-300",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-4 top-6 z-20 rounded-full border bg-white dark:bg-gray-900"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </Button>

      <nav className="flex flex-col h-full py-6 px-4">
        <Link href="/dashboard" className={cn(
          "flex items-center gap-3 px-2 mb-6 text-xl font-bold logo-text",
          isCollapsed ? "justify-center px-0" : ""
        )}>
          <Brain className="h-6 w-6 text-primary shrink-0" />
          {!isCollapsed && <span className="truncate">TaskMindAI</span>}
        </Link>

        <div className="space-y-1.5 flex-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                pathname === item.href ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50" : "",
                isCollapsed ? "justify-center px-2" : ""
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span className="truncate">{item.title}</span>}
            </Link>
          ))}
        </div>
        <div className={cn(
          "mt-auto pt-4 border-t border-gray-200 dark:border-gray-800",
          isCollapsed ? "flex justify-center" : ""
        )}>
          <ModeToggle />
        </div>
      </nav>
    </div>
  );
} 