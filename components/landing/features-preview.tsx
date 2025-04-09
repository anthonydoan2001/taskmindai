import { BarChart3, Calendar, RefreshCw } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const features = [
  {
    title: "AI-Generated Calendar",
    description: "Smart scheduling that adapts to your work style and energy levels",
    icon: Calendar,
    preview: "/images/calendar-feature.png",
  },
  {
    title: "Task Analytics",
    description: "Visualize your productivity patterns and optimize your schedule",
    icon: BarChart3,
    preview: "/images/analytics-feature.png",
  },
  {
    title: "Smart Rescheduling",
    description: "Automatically adjust your schedule when plans change",
    icon: RefreshCw,
    preview: "/images/reschedule-feature.png",
  },
]

export function FeaturesPreview() {
  return (
    <section className="py-20 bg-background">
      <div className="container px-4 mx-auto">
        <div className="max-w-2xl mx-auto mb-16 text-center">
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
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center justify-center w-10 h-10 text-primary bg-primary/10 rounded-lg">
                    <feature.icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                </div>
                <p className="mb-6 text-muted-foreground">
                  {feature.description}
                </p>
              </div>
              <CardContent className="p-0">
                <div className="relative aspect-video bg-muted">
                  {/* Placeholder for feature preview image */}
                  <img
                    src={feature.preview}
                    alt={feature.title}
                    className="object-cover w-full h-full"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
} 