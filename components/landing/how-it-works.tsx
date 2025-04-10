import { Brain, Calendar, Target } from 'lucide-react';

const steps = [
  {
    title: 'Input Your Goals',
    description: 'Tell us what you want to achieve. From daily tasks to long-term objectives.',
    icon: Target,
  },
  {
    title: 'AI Planning',
    description:
      'Our AI analyzes your goals and creates an optimized schedule that fits your life.',
    icon: Brain,
  },
  {
    title: 'Smart Calendar',
    description: 'Get a personalized calendar that adapts to your progress and preferences.',
    icon: Calendar,
  },
];

export function HowItWorks() {
  return (
    <section className="bg-muted/50 py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            How TaskMind AI Works
          </h2>
          <p className="text-lg text-muted-foreground">
            Transform your goals into reality with our intelligent planning system
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.title} className="relative rounded-lg bg-background p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <step.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">
                {index + 1}. {step.title}
              </h3>
              <p className="text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
