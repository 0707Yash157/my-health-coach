// Health metric calculators
export type Gender = "male" | "female";
export type Activity = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type Goal = "lose" | "maintain" | "gain";

export const ACTIVITY_FACTOR: Record<Activity, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const GOAL_DELTA: Record<Goal, number> = {
  lose: -0.2,    // 20% deficit
  maintain: 0,
  gain: 0.15,    // 15% surplus
};

export function calcBMI(weightKg: number, heightCm: number) {
  const m = heightCm / 100;
  return +(weightKg / (m * m)).toFixed(1);
}

export function bmiCategory(bmi: number) {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Healthy";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

// Mifflin–St Jeor BMR
export function calcBMR(weightKg: number, heightCm: number, age: number, gender: Gender) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(gender === "male" ? base + 5 : base - 161);
}

export function calcTDEE(bmr: number, activity: Activity) {
  return Math.round(bmr * ACTIVITY_FACTOR[activity]);
}

export function targetCalories(tdee: number, goal: Goal) {
  return Math.round(tdee * (1 + GOAL_DELTA[goal]));
}

// Macros: protein 1.8g/kg, fat 25% kcal, rest carbs
export function calcMacros(weightKg: number, calories: number, goal: Goal) {
  const proteinPerKg = goal === "gain" ? 2.0 : goal === "lose" ? 2.2 : 1.8;
  const protein_g = Math.round(weightKg * proteinPerKg);
  const fat_g = Math.round((calories * 0.27) / 9);
  const remainingKcal = calories - protein_g * 4 - fat_g * 9;
  const carbs_g = Math.max(0, Math.round(remainingKcal / 4));
  return { protein_g, carbs_g, fat_g };
}
