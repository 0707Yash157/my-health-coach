// Edge function: generate personalized meal plan via Lovable AI
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // --- Auth check: require valid JWT ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const {
      age, gender, height_cm, weight_kg, activity_level, goal,
      dietary_preference, allergies, target_calories, protein_g, carbs_g, fat_g,
    } = body ?? {};

    if (!age || !gender || !target_calories) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are a certified clinical nutritionist. Design science-based, balanced, realistic single-day meal plans personalized to the user's metrics, goals, dietary preference, and allergies. Use varied whole foods. Match macros within ±8%.`;

    const userPrompt = `Create a personalized 1-day meal plan.

User profile:
- Age: ${age}, Gender: ${gender}
- Height: ${height_cm}cm, Weight: ${weight_kg}kg
- Activity: ${activity_level}
- Goal: ${goal}
- Dietary preference: ${dietary_preference || "none"}
- Allergies / dislikes: ${allergies || "none"}

Daily targets:
- Calories: ${Math.round(target_calories)} kcal
- Protein: ${Math.round(protein_g)}g
- Carbs: ${Math.round(carbs_g)}g
- Fat: ${Math.round(fat_g)}g

Return 4 meals: breakfast, lunch, dinner, snack. Each meal must include name, short description, ingredients (array of strings), calories, protein_g, carbs_g, fat_g. Also return a "tips" array with 3 short, actionable nutrition tips for this user.`;

    const tools = [{
      type: "function",
      function: {
        name: "return_meal_plan",
        description: "Return the personalized daily meal plan.",
        parameters: {
          type: "object",
          properties: {
            meals: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string", enum: ["breakfast", "lunch", "dinner", "snack"] },
                  name: { type: "string" },
                  description: { type: "string" },
                  ingredients: { type: "array", items: { type: "string" } },
                  calories: { type: "number" },
                  protein_g: { type: "number" },
                  carbs_g: { type: "number" },
                  fat_g: { type: "number" },
                },
                required: ["type", "name", "description", "ingredients", "calories", "protein_g", "carbs_g", "fat_g"],
                additionalProperties: false,
              },
            },
            tips: { type: "array", items: { type: "string" } },
          },
          required: ["meals", "tips"],
          additionalProperties: false,
        },
      },
    }];

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "return_meal_plan" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit reached. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add funds in Settings → Workspace → Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiResp.text();
      console.error("AI error", aiResp.status, t);
      return new Response(JSON.stringify({ error: "Unable to generate plan right now. Please try again." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    const args = toolCall?.function?.arguments;
    let plan;
    try {
      plan = typeof args === "string" ? JSON.parse(args) : args;
    } catch (parseErr) {
      console.error("Failed to parse AI response:", parseErr);
      return new Response(JSON.stringify({ error: "Unable to generate plan right now. Please try again." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(plan), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-meal-plan error:", e);
    return new Response(JSON.stringify({ error: "An internal error occurred. Please try again." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
