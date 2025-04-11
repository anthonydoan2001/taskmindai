import { BarChart3, Calendar, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';

const features = [
  {
    title: 'AI-Generated Calendar',
    description: 'Smart scheduling that adapts to your work style and energy levels',
    icon: Calendar,
    preview: 'https://placehold.co/600x400/png?text=Calendar+Feature',
  },
  {
    title: 'Task Analytics',
    description: 'Visualize your productivity patterns and optimize your schedule',
    icon: BarChart3,
    preview: 'https://placehold.co/600x400/png?text=Analytics+Feature',
  },
  {
    title: 'Smart Rescheduling',
    description: 'Automatically adjust your schedule when plans change',
    icon: RefreshCw,
    preview: 'https://placehold.co/600x400/png?text=Reschedule+Feature',
  },
];

export function FeaturesPreview() {
  return (
    <section className="bg-background py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Powerful Features for Better Planning
          </h2>
          <p className="text-lg text-muted-foreground">
            Experience the future of intelligent time management
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="overflow-hidden">
              <div className="p-6">
                <div className="mb-4 flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                </div>
                <p className="mb-6 text-muted-foreground">{feature.description}</p>
              </div>
              <CardContent className="p-0">
                <div className="relative aspect-video bg-muted">
                  {/* Placeholder for feature preview image */}
                  <Image
                    src={feature.preview}
                    alt={feature.title}
                    className="h-full w-full object-cover"
                    width={300}
                    height={200}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
          <div className="mt-16 flow-root sm:mt-24">
            <div className="-m-2 rounded-xl bg-gray-900/5 p-2 ring-1 ring-inset ring-gray-900/10 lg:-m-4 lg:rounded-2xl lg:p-4">
              <Image
                src="https://placehold.co/2432x1442/png?text=Dashboard+Preview"
                alt="App screenshot"
                width={2432}
                height={1442}
                className="rounded-md shadow-2xl ring-1 ring-gray-900/10"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
