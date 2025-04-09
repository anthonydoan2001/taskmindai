import { UserButton } from "@clerk/nextjs";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <UserButton afterSignOutUrl="/" />
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Welcome to TaskMind AI!</h2>
          <p className="text-gray-600">
            You have successfully signed in. This is your protected dashboard page.
          </p>
        </div>
      </div>
    </div>
  );
} 