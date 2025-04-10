import { Metadata } from 'next';
import { AuroraBackground } from '@/components/ui/aurora-background';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Pricing - TaskMind AI',
  description: 'Choose the perfect plan for your task management needs with TaskMind AI.',
};

const plans = [
  {
    name: 'Free',
    price: '$0',
    description: 'Perfect for getting started',
    features: [
      'Basic AI task scheduling',
      'Up to 10 tasks per month',
      'Calendar integration',
      'Email support',
    ],
  },
  {
    name: 'Pro',
    price: '$9.99',
    period: 'month',
    description: 'Best for professionals',
    features: [
      'Advanced AI scheduling',
      'Unlimited tasks',
      'Priority support',
      'Analytics dashboard',
      'Custom categories',
      'Team collaboration',
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="relative min-h-screen">
      <AuroraBackground className="fixed top-0 left-0 h-screen w-screen opacity-40">
        <div className="absolute inset-0" />
      </AuroraBackground>
      <div className="container relative mx-auto px-6 py-12">
        <h1 className="mb-8 text-center text-4xl font-bold">Simple, Transparent Pricing</h1>
        <p className="mb-12 text-center text-lg text-gray-300">
          Choose the plan that best fits your needs. All plans include a 14-day free trial.
        </p>
        <div className="grid gap-8 md:grid-cols-2 lg:max-w-4xl lg:mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className="flex flex-col rounded-lg border border-gray-700 bg-gray-800/50 p-8"
            >
              <h2 className="mb-2 text-2xl font-semibold">{plan.name}</h2>
              <div className="mb-4">
                <span className="text-4xl font-bold">{plan.price}</span>
                {plan.period && <span className="text-gray-400">/{plan.period}</span>}
              </div>
              <p className="mb-6 text-gray-300">{plan.description}</p>
              <ul className="mb-8 space-y-4 flex-grow">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button variant={plan.name === 'Pro' ? 'default' : 'outline'} size="lg">
                Get started
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 