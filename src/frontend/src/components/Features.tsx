import { Layers, ShieldCheck, Zap } from "lucide-react";
import { motion } from "motion/react";

const features = [
  {
    icon: Layers,
    title: "Unified workspace",
    description:
      "Bring design, code, and feedback together in one place. No more context switching between tools or losing decisions in Slack threads.",
    accent: "bg-primary/10 text-primary",
  },
  {
    icon: Zap,
    title: "Ship in hours, not weeks",
    description:
      "Automated workflows, one-click deploys, and intelligent suggestions mean your team spends time building — not configuring.",
    accent: "bg-accent/20 text-accent-foreground",
  },
  {
    icon: ShieldCheck,
    title: "Built for scale",
    description:
      "Enterprise-grade security, granular permissions, and audit logs keep your work protected as your team grows from 5 to 5,000.",
    accent: "bg-primary/10 text-primary",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-28 bg-muted/40">
      <div className="container mx-auto px-6 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-sm font-semibold tracking-widest uppercase text-primary mb-3">
            Why Luminary
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-700 tracking-tight text-foreground">
            Everything your team needs.
            <br />
            <em className="font-serif not-italic text-muted-foreground">
              Nothing it doesn't.
            </em>
          </h2>
        </motion.div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6" id="about">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group bg-card rounded-2xl p-8 shadow-card hover:shadow-card-hover transition-shadow duration-300 border border-border/60"
              data-ocid={`features.item.${i + 1}`}
            >
              <div
                className={`inline-flex h-12 w-12 items-center justify-center rounded-xl mb-5 ${f.accent}`}
              >
                <f.icon size={22} strokeWidth={1.8} />
              </div>
              <h3 className="font-display text-xl font-700 tracking-tight text-foreground mb-3">
                {f.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                {f.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
