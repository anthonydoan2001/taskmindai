import { Brain, Calendar, Target } from "lucide-react"

const steps = [
  {
    title: "Input Your Goals",
    description: "Tell us what you want to achieve. From daily tasks to long-term objectives.",
    icon: Target,
  },
  {
    title: "AI Planning",
    description: "Our AI analyzes your goals and creates an optimized schedule that fits your life.",
    icon: Brain,
  },
  {
    title: "Smart Calendar",
    description: "Get a personalized calendar that adapts to your progress and preferences.",
    icon: Calendar,
  },
]

export function HowItWorks() {
  return (
    <section className="py-20 bg-muted/50">
      <div className="container px-4 mx-auto">
        <div className="max-w-2xl mx-auto mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            How TaskMind AI Works
          </h2>
          <p className="text-lg text-muted-foreground">
            Transform your goals into reality with our intelligent planning system
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="relative p-6 bg-background rounded-lg shadow-sm"
            >
              <div className="flex items-center justify-center w-12 h-12 mb-4 text-primary bg-primary/10 rounded-full">
                <step.icon className="w-6 h-6" />
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
  )
} 