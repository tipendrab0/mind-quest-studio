import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { content, difficulty, questionType, numQuestions, chapterName } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const difficultyMap: Record<string, string> = {
      easy: "basic recall, simple application. Suitable for beginners.",
      medium: "moderate complexity, requires understanding of concepts and some application.",
      hard: "advanced level, requires deep understanding, multi-step reasoning, and application. CBSE board exam level.",
      olympiad: "competition level, requires creative problem solving, advanced concepts, and rigorous mathematical reasoning."
    };

    const typeInstructions: Record<string, string> = {
      mcq: "Generate Multiple Choice Questions (MCQs) with exactly 4 options labeled A, B, C, D. Specify the correct option.",
      numerical: "Generate numerical/calculation-based problems that require step-by-step mathematical working. Include the detailed solution with all steps.",
      theoretical: "Generate descriptive/theoretical questions that require written explanations, definitions, derivations, or essay-type answers.",
      mixed: "Generate a mix of MCQs, numerical problems, and theoretical questions.",
    };

    const systemPrompt = `You are an expert CBSE Board Paper Setter and examiner. You create high-quality exam questions based on provided study material.

Rules:
- Questions must be strictly based on the provided content
- Each question should have clear marking scheme (marks allocated)
- For MCQs: provide 4 options and the correct answer
- For numerical: provide step-by-step ideal solution
- For theoretical: provide model answer with key points
- Difficulty: ${difficultyMap[difficulty] || difficultyMap.medium}
- Question type: ${typeInstructions[questionType] || typeInstructions.mixed}
- Chapter: ${chapterName || "General"}

Return a JSON array of questions. Each question object should have:
{
  "question_text": "the question",
  "question_type": "mcq" | "numerical" | "theoretical",
  "options": ["A) ...", "B) ...", "C) ...", "D) ..."] | null,
  "marks": number,
  "ideal_answer": "detailed model answer with steps"
}

Generate exactly ${numQuestions || 5} questions. Return ONLY the JSON array, no other text.`;

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
          { role: "user", content: `Based on the following study material, generate ${numQuestions || 5} questions:\n\n${content}` },
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
    const rawContent = data.choices?.[0]?.message?.content || "[]";
    
    // Parse JSON from response, handling markdown code blocks
    let questions;
    try {
      const cleaned = rawContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      questions = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", rawContent);
      questions = [];
    }

    return new Response(JSON.stringify({ questions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-questions error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
