import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "motion/react";

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16"
    >
      {/* Subtle gradient orbs */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-32 h-[600px] w-[600px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-[500px] w-[500px] rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="container mx-auto px-6 max-w-5xl text-center relative">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-1.5 text-xs font-medium text-muted-foreground mb-8"
        >
          <Sparkles size={12} className="text-accent" />
          Now in public beta — join 10,000+ teams
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-display text-5xl md:text-7xl font-800 leading-[1.05] tracking-tight text-foreground mb-6"
        >
          Build something{" "}
          <em className="font-serif not-italic text-primary">beautiful</em>
          <br />
          without the friction.
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto max-w-2xl text-lg md:text-xl text-muted-foreground leading-relaxed mb-10"
        >
          Luminary gives your team a single platform to design, ship, and
          iterate on products — faster than ever, with less overhead.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Button
            size="lg"
            className="gap-2 rounded-full px-8"
            data-ocid="hero.primary_button"
          >
            Start for free
            <ArrowRight size={16} />
          </Button>
          <Button
            size="lg"
            variant="ghost"
            className="rounded-full px-8 text-muted-foreground"
            data-ocid="hero.secondary_button"
          >
            See how it works
          </Button>
        </motion.div>

        {/* Social proof */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-8 text-xs text-muted-foreground"
        >
          No credit card required &nbsp;·&nbsp; Free plan available
          &nbsp;·&nbsp; Cancel anytime
        </motion.p>
      </div>
    </section>
  );
}
