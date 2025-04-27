import { Metadata } from 'next';
import { AuroraBackground } from '@/components/ui/aurora-background';

export const metadata: Metadata = {
  title: 'About TaskMind AI',
  description: 'Learn more about TaskMind AI and our mission to revolutionize task management through AI.',
};

export default function AboutPage() {
  return (
    <div className="relative min-h-screen">
      <AuroraBackground className="fixed top-0 left-0 h-screen w-screen opacity-40">
        <div className="absolute inset-0" />
      </AuroraBackground>
      <div className="container relative mx-auto px-6 py-12">
        <h1 className="mb-8 text-4xl font-bold">About TaskMind AI</h1>
        <div className="prose prose-invert max-w-none">
          <p className="text-lg">
            TaskMind AI is a cutting-edge platform that converts natural language goals into personalized calendar plans,
            helping you manage your time more effectively through AI-powered scheduling.
          </p>
          {/* Add more content sections here */}
        </div>
      </div>
    </div>
  );
} 