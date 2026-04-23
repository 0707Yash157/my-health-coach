import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { calcBMI, calcBMR, calcTDEE, targetCalories, calcMacros, type Activity, type Gender, type Goal } from "@/lib/health";
import { z } from "zod";

const schema = z.object({
  age: z.number().int().min(13).max(100),
  gender: z.enum(["male", "female"]),
  height_cm: z.number().min(120).max(230),
  weight_kg: z.number().min(35).max(250),
  activity_level: z.enum(["sedentary", "light", "moderate", "active", "very_active"]),
  goal: z.enum(["lose", "maintain", "gain"]),
  dietary_preference: z.string().max(60).optional(),
  allergies: z.string().max(300).optional(),
});

const STEPS = ["You", "Body", "Lifestyle", "Goal"];

export default function Onboarding() {
  const { user, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [age, setAge] = useState("28");
  const [gender, setGender] = useState<Gender>("female");
  const [height, setHeight] = useState("168");
  const [weight, setWeight] = useState("65");
  const [activity, setActivity] = useState<Activity>("moderate");
  const [goal, setGoal] = useState<Goal>("maintain");
  const [diet, setDiet] = useState("balanced");
  const [allergies, setAllergies] = useState("");

  useEffect(() => {
    if (!authLoading && !user) nav("/auth");
  }, [user, authLoading, nav]);

  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  const submit = async () => {
    if (!user) return;
    const parsed = schema.safeParse({
      age: Number(age),
      gender,
      height_cm: Number(height),
      weight_kg: Number(weight),
      activity_level: activity,
      goal,
      dietary_preference: diet,
      allergies,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    const v = parsed.data;
    const bmi = calcBMI(v.weight_kg, v.height_cm);
    const bmr = calcBMR(v.weight_kg, v.height_cm, v.age, v.gender);
    const tdee = calcTDEE(bmr, v.activity_level);
    const cals = targetCalories(tdee, v.goal);
    const macros = calcMacros(v.weight_kg, cals, v.goal);

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("health_profiles")
        .upsert(
          {
            user_id: user.id,
            ...v,
            bmi, bmr, tdee,
            target_calories: cals,
            ...macros,
          },
          { onConflict: "user_id" }
        );
      if (error) throw error;
      toast.success("Profile saved. Generating your plan…");
      nav("/dashboard?generate=1");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save profile");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <header className="container py-6 flex items-center justify-between">
        <Logo />
        <span className="text-sm text-muted-foreground">Step {step + 1} of {STEPS.length}</span>
      </header>
      <div className="container max-w-2xl pb-16">
        <Progress value={((step + 1) / STEPS.length) * 100} className="h-1 mb-8" />
        <Card className="p-8 sm:p-10 bg-gradient-card shadow-elegant border-border/50">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.35 }}
            >
              {step === 0 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-display text-3xl mb-2">A little about you</h2>
                    <p className="text-muted-foreground">We'll tailor every recommendation to your body and goals.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Age</Label>
                      <Input type="number" min={13} max={100} value={age} onChange={(e) => setAge(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Gender (biological)</Label>
                      <Select value={gender} onValueChange={(v) => setGender(v as Gender)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="male">Male</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-display text-3xl mb-2">Your body metrics</h2>
                    <p className="text-muted-foreground">Used to calculate BMI, BMR, and daily calorie needs.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Height (cm)</Label>
                      <Input type="number" value={height} onChange={(e) => setHeight(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Weight (kg)</Label>
                      <Input type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} />
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-display text-3xl mb-2">Activity level</h2>
                    <p className="text-muted-foreground">Be honest — accuracy matters more than ambition.</p>
                  </div>
                  <RadioGroup value={activity} onValueChange={(v) => setActivity(v as Activity)} className="grid gap-3">
                    {[
                      { v: "sedentary", t: "Sedentary", d: "Little to no exercise, desk job" },
                      { v: "light", t: "Lightly active", d: "Light exercise 1–3 days/week" },
                      { v: "moderate", t: "Moderately active", d: "Exercise 3–5 days/week" },
                      { v: "active", t: "Very active", d: "Hard exercise 6–7 days/week" },
                      { v: "very_active", t: "Athlete", d: "Twice-daily training or physical job" },
                    ].map((o) => (
                      <Label
                        key={o.v}
                        htmlFor={o.v}
                        className="flex items-start gap-3 rounded-xl border border-border p-4 cursor-pointer transition-smooth hover:bg-secondary/60 has-[:checked]:border-primary has-[:checked]:bg-secondary/80"
                      >
                        <RadioGroupItem value={o.v} id={o.v} className="mt-1" />
                        <div>
                          <div className="font-medium">{o.t}</div>
                          <div className="text-sm text-muted-foreground">{o.d}</div>
                        </div>
                      </Label>
                    ))}
                  </RadioGroup>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-display text-3xl mb-2">Your goal</h2>
                    <p className="text-muted-foreground">We'll adjust calories and macros accordingly.</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { v: "lose", t: "Lose fat" },
                      { v: "maintain", t: "Maintain" },
                      { v: "gain", t: "Build muscle" },
                    ].map((o) => (
                      <button
                        key={o.v}
                        type="button"
                        onClick={() => setGoal(o.v as Goal)}
                        className={`rounded-xl border p-4 text-sm font-medium transition-smooth ${
                          goal === o.v ? "border-primary bg-secondary shadow-soft" : "border-border hover:bg-secondary/60"
                        }`}
                      >
                        {o.t}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Dietary preference</Label>
                    <Select value={diet} onValueChange={setDiet}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="balanced">Balanced (no restrictions)</SelectItem>
                        <SelectItem value="vegetarian">Vegetarian</SelectItem>
                        <SelectItem value="vegan">Vegan</SelectItem>
                        <SelectItem value="pescatarian">Pescatarian</SelectItem>
                        <SelectItem value="mediterranean">Mediterranean</SelectItem>
                        <SelectItem value="keto">Low-carb / Keto</SelectItem>
                        <SelectItem value="high_protein">High protein</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Allergies or foods to avoid (optional)</Label>
                    <Textarea
                      placeholder="e.g. peanuts, shellfish, mushrooms"
                      value={allergies}
                      onChange={(e) => setAllergies(e.target.value)}
                      maxLength={300}
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-10 flex items-center justify-between">
            <Button variant="ghost" onClick={back} disabled={step === 0}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button variant="hero" onClick={next}>
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button variant="hero" onClick={submit} disabled={submitting}>
                {submitting ? "Saving…" : <>Generate my plan <Sparkles className="h-4 w-4" /></>}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
