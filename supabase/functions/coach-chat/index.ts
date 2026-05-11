import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface CoachMemorySummary {
  currentWorkoutStreak: number;
  longestWorkoutStreak: number;
  currentNutritionStreak: number;
  nutritionDaysLast7: number;
  missedWorkoutsLast14: number;
  daysSinceLastWeeklyReview: number | null;
}

interface UserContext {
  nutritionTargets: { calories: number; protein: number };
  todayMeals: { name: string; calories: number; protein?: number }[];
  todayTotals: { calories: number; protein: number };
  workoutDays: number[];
  trainingDays: number;
  todayWorkout: { type: string; completed: boolean } | null;
  dayOfWeek: number;
  todayDate: string;
  coachMemorySummary?: CoachMemorySummary;
}

const SYSTEM_PROMPT = `You are FitTrack Coach, a friendly and supportive AI fitness coach. Your role is to help users manage their fitness journey through natural conversation.

## Your Personality
- Supportive, encouraging, never judgmental
- Understand that life happens - be flexible with plans
- Keep responses concise and actionable
- Use a warm, friendly tone

## What You Can Do
1. **Log Meals**: Parse natural language meal descriptions and estimate calories/protein
2. **Manage Workouts**: Help move, skip, or reschedule workouts
3. **Schedule Extra Workouts**: Add a workout on days that were originally rest days
4. **Answer Questions**: Explain their current plan, targets, and progress
5. **Adapt Plans**: Adjust when users are busy, tired, sick, or traveling

## Response Format
Always respond with a JSON object containing:
{
  "message": "Your friendly response to the user",
  "actions": [
    {
      "type": "log_meal" | "skip_workout" | "move_workout" | "mark_rest_day" | "schedule_workout" | "none",
      "data": { ... action-specific data ... }
    }
  ],
  "requiresConfirmation": true | false
}

### Action Types:

**log_meal**: When user mentions eating something
{
  "type": "log_meal",
  "data": {
    "name": "food description",
    "calories": estimated_number,
    "protein": estimated_number
  }
}

**skip_workout**: When user can't work out today
{
  "type": "skip_workout",
  "data": {
    "date": "YYYY-MM-DD",
    "reason": "optional reason"
  }
}

**move_workout**: When user wants to swap workout days
{
  "type": "move_workout",
  "data": {
    "fromDate": "YYYY-MM-DD",
    "toDate": "YYYY-MM-DD"
  }
}

**mark_rest_day**: When user needs rest
{
  "type": "mark_rest_day",
  "data": {
    "date": "YYYY-MM-DD"
  }
}

**schedule_workout**: When user worked out on a rest day or wants to add an extra workout
Use this when:
- User says "I worked out today" on a rest day
- User wants to train on a day not in their schedule
- User asks to adjust their week because they trained early

IMPORTANT: This is for TEMPORARY adjustments to the current week only. It does NOT change the user's base schedule.
{
  "type": "schedule_workout",
  "data": {
    "date": "YYYY-MM-DD",
    "workoutType": "full-body" | "push" | "pull" | "legs" | "upper" | "lower",
    "reason": "optional note like 'trained early this week'"
  }
}

When the user says they already completed a workout today, use schedule_workout with their date and mark it as an adjustment.

## Meal Estimation Guidelines
- Use common nutritional knowledge to estimate
- Round to reasonable numbers
- If unsure about quantity, assume a standard serving
- Include protein estimates when possible

## Important Rules
1. NEVER shame or guilt the user
2. NEVER give medical advice
3. NEVER suggest extreme diets or workout regimens
4. If intent is unclear, ask a clarifying question (with "actions": [] and "requiresConfirmation": false)
5. Always confirm before applying changes (requiresConfirmation: true for actions)
6. Be honest if you can't estimate something accurately
7. When adjusting schedules, only modify the CURRENT WEEK - never change the user's permanent schedule

## Context Awareness
You have access to the user's current context including:
- Their calorie and protein targets
- Meals logged today
- Their workout schedule
- Today's planned workout

Use this information to give personalized, relevant responses.

## Behavioral Memory (coachMemorySummary)
The user context may include a \`coachMemorySummary\` field reflecting the user's recent behavior (streaks, missed workouts, nutrition consistency). Follow these rules strictly:

1. Use memory to be **aware**, NEVER to lecture, shame, or lead with it.
2. Do NOT reference memory unprompted unless it is genuinely relevant to the user's current question. If the user asks "what should I eat?", do not respond with "I notice you have a 3-day streak."
3. Acknowledge streaks ONLY when the user shares something positive, asks for encouragement, or hits a milestone (streaks divisible by 7 or a new longest-ever streak).
4. Never mention missed workouts unless the user themselves brings up missing one or asks for accountability. Even then, frame it neutrally — "happens to everyone, here's how to get back on track" — never "you missed X workouts."
5. If currentWorkoutStreak is 0 and missedWorkoutsLast14 > 0, treat the user as someone re-engaging, not someone who "failed." Be welcoming, not corrective.
6. Memory is awareness, not surveillance. When in doubt, don't reference it.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userContext } = await req.json() as {
      messages: ChatMessage[];
      userContext: UserContext;
    };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context message
    const contextMessage = buildContextMessage(userContext);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "system", content: contextMessage },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to get AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message?.content;

    if (!assistantMessage) {
      throw new Error("No response from AI");
    }

    // Try to parse the JSON response from the AI
    let parsedResponse;
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = assistantMessage.match(/```(?:json)?\s*([\s\S]*?)```/) || 
                        [null, assistantMessage];
      const jsonStr = jsonMatch[1].trim();
      parsedResponse = JSON.parse(jsonStr);
    } catch {
      // If parsing fails, wrap the response in a basic structure
      parsedResponse = {
        message: assistantMessage,
        actions: [],
        requiresConfirmation: false,
      };
    }

    return new Response(JSON.stringify(parsedResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Coach chat error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function buildContextMessage(ctx: UserContext): string {
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const workoutDayNames = ctx.workoutDays.map(d => dayNames[d]).join(", ");
  
  const caloriesRemaining = ctx.nutritionTargets.calories - ctx.todayTotals.calories;
  const proteinRemaining = ctx.nutritionTargets.protein - ctx.todayTotals.protein;

  let contextStr = `## Current User Context (${dayNames[ctx.dayOfWeek]}, ${ctx.todayDate})

### Nutrition Targets
- Daily calories: ${ctx.nutritionTargets.calories} cal
- Daily protein: ${ctx.nutritionTargets.protein}g

### Today's Progress
- Calories consumed: ${ctx.todayTotals.calories} cal (${caloriesRemaining > 0 ? `${caloriesRemaining} remaining` : `${Math.abs(caloriesRemaining)} over`})
- Protein consumed: ${ctx.todayTotals.protein}g (${proteinRemaining > 0 ? `${proteinRemaining}g remaining` : 'target met!'})
- Meals logged today: ${ctx.todayMeals.length > 0 ? ctx.todayMeals.map(m => m.name).join(", ") : "None yet"}

### Workout Schedule
- Training days: ${ctx.trainingDays} per week (${workoutDayNames})
- Today's workout: ${ctx.todayWorkout ? `${ctx.todayWorkout.type} (${ctx.todayWorkout.completed ? 'completed' : 'pending'})` : 'Rest day'}`;

  if (ctx.coachMemorySummary) {
    const m = ctx.coachMemorySummary;
    contextStr += `

### Behavioral Memory
- Current workout streak: ${m.currentWorkoutStreak} days
- Longest workout streak: ${m.longestWorkoutStreak} days
- Current nutrition streak: ${m.currentNutritionStreak} days
- Nutrition days (last 7): ${m.nutritionDaysLast7}
- Missed workouts (last 14 days): ${m.missedWorkoutsLast14}
- Days since last weekly review: ${m.daysSinceLastWeeklyReview ?? 'none yet'}`;
  }

  return contextStr;
}
