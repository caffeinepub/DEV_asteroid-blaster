import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";

export default function CTABanner() {
  return (
    <section id="pricing" className="py-28">
      <div className="container mx-auto px-6 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl bg-primary px-10 py-16 md:py-20 text-center"
        >
          {/* Decorative blobs */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-20 -left-20 h-64 w-64 rounded-full bg-primary-foreground/5 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-accent/20 blur-3xl"
          />

          <p className="relative text-sm font-semibold tracking-widest uppercase text-primary-foreground/60 mb-4">
            Get started today
          </p>
          <h2 className="relative font-display text-4xl md:text-5xl font-700 tracking-tight text-primary-foreground mb-5">
            Ready to ship faster?
            <br />
            <em className="font-serif not-italic opacity-80">
              Your first project is free.
            </em>
          </h2>
          <p className="relative mx-auto max-w-xl text-primary-foreground/70 text-lg mb-10">
            Join thousands of product teams who have cut their time-to-launch in
            half. No setup fees, no commitments.
          </p>
          <div className="relative flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              className="rounded-full px-8 gap-2 bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              data-ocid="cta.primary_button"
            >
              Create a free account
              <ArrowRight size={16} />
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="rounded-full px-8 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
              data-ocid="cta.secondary_button"
            >
              Talk to sales
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
