import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { questionText, questionType, idealAnswer, userAnswer, marks, options } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a strict but fair CBSE Board Examiner. Your job is to evaluate a student's answer against the ideal/model answer.

Grading rules:
- Be precise and fair in scoring
- For MCQs: it's either correct or incorrect
- For numerical: check each step. Award partial marks for correct intermediate steps even if final answer is wrong. Identify exactly which step went wrong.
- For theoretical: check for key points, completeness, accuracy, and clarity. Award partial marks for partially correct answers.
- Maximum marks for this question: ${marks}

You must return a JSON object with:
{
  "score": number (out of ${marks}),
  "max_score": ${marks},
  "is_correct": boolean,
  "feedback": "Overall assessment in 1-2 sentences",
  "improvements": [
    "Specific thing to improve #1",
    "Specific thing to improve #2"
  ],
  "correct_answer": "The model/ideal answer if student is wrong",
  "step_analysis": "For numerical: step-by-step comparison showing where the student went wrong. For theoretical: which key points were missed."
}

Return ONLY the JSON object, no other text.`;

    const userMessage = `Question (${questionType}, ${marks} marks): ${questionText}
${options ? `Options: ${JSON.stringify(options)}` : ""}

Ideal/Model Answer: ${idealAnswer}

Student's Answer: ${userAnswer}

Evaluate the student's answer.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || "{}";

    let evaluation;
    try {
      const cleaned = rawContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      evaluation = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", rawContent);
      evaluation = {
        score: 0,
        max_score: marks,
        is_correct: false,
        feedback: "Could not evaluate the answer. Please try again.",
        improvements: [],
      };
    }

    return new Response(JSON.stringify(evaluation), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("grade-answer error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
