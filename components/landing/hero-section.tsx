import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

export function HeroSection() {
  return (
    <section className="relative py-20 overflow-hidden bg-background">
      <div className="container px-4 mx-auto">
        <div className="flex flex-wrap items-center -mx-4">
          <div className="w-full px-4 mb-16 md:w-1/2 md:mb-0">
            <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-foreground md:text-5xl lg:text-6xl">
              Turn your goals into{" "}
              <span className="text-primary">smart calendar plans.</span>
            </h1>
            <p className="mb-8 text-lg text-muted-foreground md:text-xl">
              Let AI transform your goals into actionable calendar schedules. 
              Stay organized, focused, and achieve more with intelligent time management.
            </p>
            <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
              <Link href="/sign-up">
                <Button size="lg" className="gap-2">
                  Get Started <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button size="lg" variant="outline">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
          <div className="w-full px-4 md:w-1/2">
            <div className="relative mx-auto md:mr-0 max-w-max">
              <div className="relative z-10">
                {/* Placeholder for hero image - replace src with actual image */}
                <img
                  className="relative rounded-lg shadow-xl"
                  src="/images/calendar-preview.png"
                  alt="AI Calendar Preview"
                  width={580}
                  height={420}
                />
              </div>
              <div className="absolute -left-6 -top-6 w-full h-full bg-primary/10 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 