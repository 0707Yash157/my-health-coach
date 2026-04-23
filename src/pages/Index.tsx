import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import { Activity, Brain, LineChart, Sparkles, ArrowRight, Leaf } from "lucide-react";
import heroImg from "@/assets/hero-meal.jpg";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user } = useAuth();
  const ctaHref = user ? "/dashboard" : "/auth?mode=signup";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero -z-10" />
        <div className="container grid lg:grid-cols-2 gap-12 lg:gap-16 items-center py-16 md:py-24 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 backdrop-blur px-4 py-1.5 text-sm text-muted-foreground mb-6">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              AI-powered nutrition, personalized to you
            </div>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl leading-[1.02] text-balance mb-6">
              Eat for the body
              <br />
              <span className="italic text-primary">you're building.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mb-8 text-balance">
              Verdure calculates your BMI, BMR, and daily calorie needs, then crafts a meal plan tuned to your goals — backed by clinical nutrition science.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button variant="hero" size="xl" asChild>
                <Link to={ctaHref}>
                  Get my free plan <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="xl" asChild>
                <a href="#how">How it works</a>
              </Button>
            </div>
            <div className="flex items-center gap-6 mt-10 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><Leaf className="h-4 w-4 text-primary" /> No credit card</div>
              <div className="flex items-center gap-2"><Leaf className="h-4 w-4 text-primary" /> Built on real science</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="relative"
          >
            <div className="absolute -inset-8 bg-gradient-sage rounded-[3rem] blur-3xl opacity-40 -z-10" />
            <div className="relative aspect-square rounded-[2.5rem] overflow-hidden shadow-elegant animate-float">
              <img
                src={heroImg}
                alt="Beautifully arranged personalized healthy meal with salmon, quinoa, avocado and fresh greens"
                width={1280}
                height={1280}
                className="w-full h-full object-cover"
              />
            </div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="absolute -bottom-6 -left-4 sm:-left-10 bg-card rounded-2xl shadow-elegant p-4 border border-border/60 max-w-[220px]"
            >
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Today's target</div>
              <div className="font-display text-3xl">2,140<span className="text-base text-muted-foreground"> kcal</span></div>
              <div className="flex gap-3 mt-2 text-xs">
                <span><span className="font-semibold text-primary">P</span> 165g</span>
                <span><span className="font-semibold text-accent">C</span> 220g</span>
                <span><span className="font-semibold text-sage-foreground">F</span> 64g</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="container py-20 md:py-28">
        <div className="max-w-2xl mb-16">
          <div className="text-sm font-medium text-primary uppercase tracking-wider mb-3">How it works</div>
          <h2 className="font-display text-4xl md:text-5xl text-balance">
            Three simple steps to a plan that actually fits.
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Activity, title: "Share your metrics", text: "A 60-second intake: age, body, activity level, goal, and food preferences.", n: "01" },
            { icon: Brain, title: "AI builds your plan", text: "We compute BMI, BMR, TDEE, then design a balanced day of meals matched to your macros.", n: "02" },
            { icon: LineChart, title: "Track and improve", text: "Log weight, monitor trends, and regenerate your plan as your goals evolve.", n: "03" },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="group relative bg-gradient-card rounded-2xl p-8 border border-border/60 shadow-soft hover:shadow-elegant transition-smooth"
            >
              <div className="absolute top-6 right-6 font-display text-5xl text-primary/10">{f.n}</div>
              <div className="h-12 w-12 rounded-xl bg-gradient-primary text-primary-foreground grid place-items-center mb-5 shadow-soft">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-2xl mb-2">{f.title}</h3>
              <p className="text-muted-foreground">{f.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container pb-24">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-primary text-primary-foreground p-10 md:p-16 shadow-elegant">
          <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-primary-glow/40 blur-3xl" />
          <div className="relative max-w-2xl">
            <h2 className="font-display text-4xl md:text-5xl mb-4 text-balance">
              Your healthiest year starts with one good meal.
            </h2>
            <p className="text-primary-foreground/80 text-lg mb-8 max-w-lg">
              Join Verdure and get a free personalized meal plan in under two minutes.
            </p>
            <Button variant="accent" size="xl" asChild>
              <Link to={ctaHref}>Start free <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 py-8">
        <div className="container flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2"><Leaf className="h-4 w-4 text-primary" /> Verdure © {new Date().getFullYear()}</div>
          <div>Crafted with care. Not medical advice.</div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
