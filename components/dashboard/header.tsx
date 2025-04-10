'use client';

import { UserButton } from "@clerk/nextjs";
import { Bell, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import { ModeToggle } from "@/components/ui/mode-toggle";

export function Header() {
  const { user } = useUser();

  return (
    <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Welcome back,{" "}
            <span className="font-medium text-gray-700 dark:text-gray-200">
              {user?.firstName || "User"}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <HelpCircle className="h-5 w-5" />
          </Button>
          <ModeToggle />
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </header>
  );
} 