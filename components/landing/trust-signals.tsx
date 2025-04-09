import { Star } from "lucide-react"
import Image from "next/image"

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Product Manager",
    content: "TaskMind AI has transformed how I manage my time. The AI suggestions are surprisingly accurate!",
    avatar: "/images/avatars/avatar-1.png",
  },
  {
    name: "Michael Chen",
    role: "Entrepreneur",
    content: "Finally, a calendar that understands my workflow. The smart rescheduling feature is a game-changer.",
    avatar: "/images/avatars/avatar-2.png",
  },
]

export function TrustSignals() {
  return (
    <section className="py-20 bg-muted/50">
      <div className="container px-4 mx-auto">
        <div className="max-w-2xl mx-auto mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Trusted by Professionals
          </h2>
          <p className="text-lg text-muted-foreground">
            Join thousands of users who trust TaskMind AI for their scheduling needs
          </p>
        </div>

        {/* Testimonials */}
        <div className="grid gap-8 mb-16 md:grid-cols-2">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.name}
              className="p-6 bg-background rounded-lg shadow-sm"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 text-yellow-400 fill-yellow-400"
                  />
                ))}
              </div>
              <p className="mb-4 text-foreground">{testimonial.content}</p>
              <div className="flex items-center gap-4">
                <div className="relative w-12 h-12 overflow-hidden rounded-full">
                  <Image
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-semibold">{testimonial.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-8 py-8">
          <div className="flex items-center gap-2">
            <Image
              src="/images/google-calendar.svg"
              alt="Google Calendar"
              width={32}
              height={32}
            />
            <span className="text-sm font-medium">
              Works with Google Calendar
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Image
              src="/images/security-badge.svg"
              alt="256-bit encryption"
              width={32}
              height={32}
            />
            <span className="text-sm font-medium">
              256-bit SSL encryption
            </span>
          </div>
        </div>
      </div>
    </section>
  )
} 