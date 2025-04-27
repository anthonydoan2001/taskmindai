import { Metadata } from 'next';
import { AuroraBackground } from '@/components/ui/aurora-background';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Features - TaskMind AI',
  description: 'Explore the powerful features of TaskMind AI that help you manage your tasks and time more effectively.',
};

export default function FeaturesPage() {
  return (
    <div className="relative min-h-screen">
      <AuroraBackground className="fixed top-0 left-0 h-screen w-screen opacity-40">
        <div className="absolute inset-0" />
      </AuroraBackground>
      <div className="container relative mx-auto px-6 py-12">
        <h1 className="mb-8 text-4xl font-bold">Features</h1>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* AI Scheduling */}
          <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-6">
            <Image
              src="/images/calendar-feature.png"
              alt="AI Scheduling"
              width={400}
              height={300}
              className="mb-4 rounded-lg"
            />
            <h2 className="mb-2 text-xl font-semibold">AI-Powered Scheduling</h2>
            <p className="text-gray-300">
              Convert natural language goals into optimized calendar plans using advanced AI algorithms.
            </p>
          </div>

          {/* Analytics */}
          <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-6">
            <Image
              src="/images/analytics-feature.png"
              alt="Analytics"
              width={400}
              height={300}
              className="mb-4 rounded-lg"
            />
            <h2 className="mb-2 text-xl font-semibold">Comprehensive Analytics</h2>
            <p className="text-gray-300">
              Track your productivity and task completion with detailed analytics and insights.
            </p>
          </div>

          {/* Calendar Integration */}
          <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-6">
            <Image
              src="/images/reschedule-feature.png"
              alt="Calendar Integration"
              width={400}
              height={300}
              className="mb-4 rounded-lg"
            />
            <h2 className="mb-2 text-xl font-semibold">Smart Calendar Integration</h2>
            <p className="text-gray-300">
              Seamlessly sync with your existing calendar and automatically adjust schedules.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 