import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Sparkles, Sun, UtensilsCrossed, Moon, Cookie, RefreshCw, Pencil, Flame, Activity, Target, Scale } from "lucide-react";
import { bmiCategory } from "@/lib/health";

type Meal = {
  type: "breakfast" | "lunch" | "dinner" | "snack";
  name: string;
  description: string;
  ingredients: string[];
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
};

type Plan = { meals: Meal[]; tips: string[] };

const MEAL_META: Record<Meal["type"], { label: string; icon: any }> = {
  breakfast: { label: "Breakfast", icon: Sun },
  lunch: { label: "Lunch", icon: UtensilsCrossed },
  dinner: { label: "Dinner", icon: Moon },
  snack: { label: "Snack", icon: Cookie },
};

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const [profile, setProfile] = useState<any | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) nav("/auth");
  }, [user, authLoading, nav]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data: hp } = await supabase
        .from("health_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!hp) {
        nav("/onboarding");
        return;
      }
      setProfile(hp);

      const { data: mp } = await supabase
        .from("meal_plans")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (mp?.plan_data) setPlan(mp.plan_data as unknown as Plan);
      setLoading(false);

      if (params.get("generate") === "1") {
        params.delete("generate");
        setParams(params, { replace: true });
        generate(hp);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const generate = async (hp = profile) => {
    if (!hp || !user) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-meal-plan", { body: hp });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const newPlan = data as Plan;
      setPlan(newPlan);
      await supabase.from("meal_plans").insert({
        user_id: user.id,
        plan_data: newPlan as any,
        total_calories: newPlan.meals.reduce((s, m) => s + (m.calories || 0), 0),
      } as any);
      toast.success("Your fresh plan is ready!");
    } catch (e: any) {
      toast.error(e?.message ?? "Couldn't generate plan");
    } finally {
      setGenerating(false);
    }
  };

  const macroData = useMemo(() => {
    if (!profile) return [];
    return [
      { name: "Protein", value: Number(profile.protein_g) * 4, color: "hsl(var(--primary))" },
      { name: "Carbs", value: Number(profile.carbs_g) * 4, color: "hsl(var(--accent))" },
      { name: "Fat", value: Number(profile.fat_g) * 9, color: "hsl(var(--sage))" },
    ];
  }, [profile]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="container py-10 space-y-6">
          <Skeleton className="h-12 w-72" />
          <div className="grid md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container py-10 space-y-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-wrap justify-between items-end gap-4"
        >
          <div>
            <div className="text-sm text-muted-foreground mb-1">Your dashboard</div>
            <h1 className="font-display text-4xl md:text-5xl">
              Hello — let's eat <span className="italic text-primary">well</span> today.
            </h1>
          </div>
          <Button variant="outline" asChild>
            <Link to="/onboarding"><Pencil className="h-4 w-4" /> Edit profile</Link>
          </Button>
        </motion.div>

        {/* Metric cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard icon={Scale} label="BMI" value={Number(profile.bmi).toFixed(1)} sub={bmiCategory(Number(profile.bmi))} />
          <MetricCard icon={Flame} label="BMR" value={Math.round(Number(profile.bmr)).toString()} sub="kcal at rest" />
          <MetricCard icon={Activity} label="TDEE" value={Math.round(Number(profile.tdee)).toString()} sub="kcal burned/day" />
          <MetricCard
            icon={Target}
            label="Daily target"
            value={Math.round(Number(profile.target_calories)).toString()}
            sub={profile.goal === "lose" ? "deficit" : profile.goal === "gain" ? "surplus" : "maintain"}
            highlight
          />
        </div>

        {/* Macros + plan */}
        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="p-6 bg-gradient-card border-border/60 shadow-soft lg:col-span-1">
            <h3 className="font-display text-xl mb-4">Daily macros</h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={macroData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2} stroke="none">
                    {macroData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }}
                    formatter={(v: number, n) => [`${Math.round(v)} kcal`, n]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-2">
              <MacroRow color="hsl(var(--primary))" label="Protein" grams={profile.protein_g} />
              <MacroRow color="hsl(var(--accent))" label="Carbs" grams={profile.carbs_g} />
              <MacroRow color="hsl(var(--sage))" label="Fat" grams={profile.fat_g} />
            </div>
          </Card>

          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 md:p-8 bg-gradient-primary text-primary-foreground border-none shadow-elegant relative overflow-hidden">
              <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary-glow/40 blur-3xl" />
              <div className="relative flex flex-wrap justify-between items-center gap-4">
                <div>
                  <div className="text-primary-foreground/70 text-sm uppercase tracking-wider mb-2">Today's meal plan</div>
                  <h2 className="font-display text-3xl md:text-4xl">
                    {plan ? "Curated for your goals" : "Generate your first plan"}
                  </h2>
                </div>
                <Button variant="accent" size="lg" onClick={() => generate()} disabled={generating}>
                  {generating ? (
                    <><RefreshCw className="h-4 w-4 animate-spin" /> Generating…</>
                  ) : plan ? (
                    <><RefreshCw className="h-4 w-4" /> New plan</>
                  ) : (
                    <><Sparkles className="h-4 w-4" /> Generate plan</>
                  )}
                </Button>
              </div>
            </Card>

            {plan ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {plan.meals.map((m, i) => {
                  const Meta = MEAL_META[m.type];
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: i * 0.08 }}
                    >
                      <Card className="p-5 h-full bg-card border-border/60 shadow-soft hover:shadow-elegant transition-smooth">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="grid place-items-center h-8 w-8 rounded-lg bg-secondary text-primary">
                            <Meta.icon className="h-4 w-4" />
                          </span>
                          <Badge variant="secondary" className="text-xs">{Meta.label}</Badge>
                          <span className="ml-auto text-sm font-semibold">{Math.round(m.calories)} kcal</span>
                        </div>
                        <h4 className="font-display text-xl mb-1.5">{m.name}</h4>
                        <p className="text-sm text-muted-foreground mb-3">{m.description}</p>
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {m.ingredients.slice(0, 6).map((ing, j) => (
                            <span key={j} className="text-xs bg-secondary/70 rounded-full px-2.5 py-1">{ing}</span>
                          ))}
                        </div>
                        <div className="flex gap-3 text-xs pt-3 border-t border-border">
                          <span><span className="text-primary font-semibold">P</span> {Math.round(m.protein_g)}g</span>
                          <span><span className="text-accent font-semibold">C</span> {Math.round(m.carbs_g)}g</span>
                          <span><span className="text-sage-foreground font-semibold">F</span> {Math.round(m.fat_g)}g</span>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <Card className="p-10 text-center bg-gradient-card border-dashed border-2 border-border">
                <Sparkles className="h-10 w-10 mx-auto mb-3 text-primary/60" />
                <h3 className="font-display text-2xl mb-1">No plan yet</h3>
                <p className="text-muted-foreground">Click "Generate plan" above to receive your personalized meals.</p>
              </Card>
            )}

            {plan?.tips?.length ? (
              <Card className="p-6 bg-gradient-card border-border/60 shadow-soft">
                <h3 className="font-display text-xl mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-accent" /> Personal tips
                </h3>
                <ul className="space-y-2.5">
                  {plan.tips.map((t, i) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <span className="text-primary font-semibold">{i + 1}.</span>
                      <span className="text-foreground/85">{t}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, sub, highlight }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className={`p-5 h-full border-border/60 shadow-soft ${highlight ? "bg-gradient-sage" : "bg-gradient-card"}`}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="font-display text-3xl">{value}</div>
        <div className="text-sm text-muted-foreground mt-1">{sub}</div>
      </Card>
    </motion.div>
  );
}

function MacroRow({ color, label, grams }: { color: string; label: string; grams: number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
        <span>{label}</span>
      </div>
      <span className="font-semibold">{Math.round(Number(grams))}g</span>
    </div>
  );
}
