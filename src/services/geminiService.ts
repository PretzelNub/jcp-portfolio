import { GoogleGenAI, Type } from "@google/genai";

import { supabase, isSupabaseConfigured } from "./supabaseClient";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function chatWithAI(message: string, history: { role: "user" | "model", parts: { text: string }[] }[], context?: any) {
  // Try to call Supabase Edge Function first if configured
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.functions.invoke('chat', {
        body: { message, history, context },
      });

      if (!error && data?.text) {
        return data.text;
      }
      if (error) console.warn('Supabase Edge Function error (falling back):', error);
    } catch (error) {
      console.warn('Failed to reach Supabase Edge Function (falling back):', error);
    }
  }

  // Fallback to local Gemini call
  const model = "gemini-3-flash-preview";
  
  const profile = context?.profile || {};
  const experiences = context?.experiences || [];
  const skills = context?.skills || [];
  const gaps = context?.gaps || [];
  const values = context?.values || {};
  const faqs = context?.faqs || [];
  const aiInstructions = context?.aiInstructions || [];

  const systemInstruction = `You are the AI assistant for ${profile.name || 'Joe Peterlin'}'s portfolio. 
Your goal is to answer questions about the candidate's experience, skills, and personality.
Be professional, direct, and honest. If you don't know something, say so.

Candidate Profile:
- Name: ${profile.name || 'Joe Peterlin'}
- Title: ${profile.title || 'Senior Engineer'}
- Pitch: ${profile.elevator_pitch || ''}
- Career Narrative: ${profile.career_narrative || ''}
- Looking for: ${profile.looking_for || ''}
- Location: ${profile.location || ''}

Experience:
${experiences.map((e: any) => `- ${e.company_name} (${e.title}): ${e.bullet_points?.join(', ')}`).join('\n')}

Skills:
${skills.map((s: any) => `- ${s.skill_name} (${s.category}, rating: ${s.self_rating}/5)`).join('\n')}

Gaps/Weaknesses:
${gaps.map((g: any) => `- ${g.gap_type}: ${g.description}`).join('\n')}

Values & Culture:
- Must haves: ${values.must_haves?.join(', ') || ''}
- Dealbreakers: ${values.dealbreakers?.join(', ') || ''}
- Management Style: ${values.management_style_preferences || ''}

Common Questions & Answers:
${faqs.map((f: any) => `Q: ${f.question}\nA: ${f.answer}`).join('\n')}

AI Instructions (How you should behave):
${aiInstrDataToString(aiInstructions)}

Always speak in the first person as the candidate's representative. Be helpful and provide evidence from the context above.`;

  const chat = ai.chats.create({
    model,
    config: {
      systemInstruction,
    },
  });

  const response = await chat.sendMessage({ message });
  return response.text;
}

function aiInstrDataToString(instructions: any[]) {
  if (!instructions || instructions.length === 0) return "Be professional and honest.";
  return instructions.map(i => `- ${i.instruction_type}: ${i.instruction}`).join('\n');
}

export async function analyzeJD(jd: string, context?: any) {
  // Try to call Supabase Edge Function first if configured
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.functions.invoke('analyze-jd', {
        body: { jd, context },
      });

      if (!error && data) {
        return data;
      }
      if (error) console.warn('Supabase Edge Function error for JD analysis (falling back):', error);
    } catch (error) {
      console.warn('Failed to reach Supabase Edge Function for JD analysis (falling back):', error);
    }
  }

  // Fallback to local Gemini call
  const model = "gemini-3.1-pro-preview";
  
  const profile = context?.profile || {};
  const experiences = context?.experiences || [];
  const skills = context?.skills || [];
  const gaps = context?.gaps || [];
  const values = context?.values || {};

  const candidateContext = `
Candidate: ${profile.name || 'Joe Peterlin'}
Title: ${profile.title || ''}
Pitch: ${profile.elevator_pitch || ''}

Experience:
${experiences.map((e: any) => `- ${e.company_name} (${e.title}): ${e.bullet_points?.join(', ')}`).join('\n')}

Skills:
${skills.map((s: any) => `- ${s.skill_name} (${s.category}, rating: ${s.self_rating}/5)`).join('\n')}

Gaps/Weaknesses:
${gaps.map((g: any) => `- ${g.gap_type}: ${g.description}`).join('\n')}

Values & Culture:
- Must haves: ${values.must_haves?.join(', ') || ''}
- Dealbreakers: ${values.dealbreakers?.join(', ') || ''}
`;

  const systemInstruction = `You are an expert technical recruiter and career coach. 
Your task is to provide a brutally honest, high-signal assessment of how well a candidate fits a specific job description.
Do NOT just repeat the job description. Analyze the gaps, the transferable skills, and provide a clear verdict.
Be direct, professional, and insightful. If the candidate is a poor fit, say so clearly and explain why.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: `Analyze this Job Description and provide an honest assessment of fit for the candidate.
      
      Candidate Context:
      ${candidateContext}
      
      Job Description:
      ${jd}
      
      Return the response in JSON format with the following structure:
      {
        "verdict": "probably_not" | "strong_fit" | "worth_conversation",
        "headline": "A punchy, high-level summary of the fit",
        "opening": "A 2-3 sentence direct assessment of the match.",
        "gaps": [{"requirement": "Specific requirement from JD", "gap_title": "Short title for the gap", "explanation": "Why the candidate doesn't meet this or how they fall short"}],
        "transfers": "A paragraph explaining which of the candidate's existing skills are most relevant and how they transfer to this specific role.",
        "recommendation": "A final recommendation on whether the candidate should apply and what their strategy should be."
      }`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            verdict: { type: Type.STRING },
            headline: { type: Type.STRING },
            opening: { type: Type.STRING },
            gaps: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT,
                properties: {
                  requirement: { type: Type.STRING },
                  gap_title: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                },
                required: ["requirement", "gap_title", "explanation"]
              } 
            },
            transfers: { type: Type.STRING },
            recommendation: { type: Type.STRING }
          },
          required: ["verdict", "headline", "opening", "gaps", "transfers", "recommendation"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    return JSON.parse(text);
  } catch (error) {
    console.error("Error in analyzeJD fallback:", error);
    return {
      verdict: "worth_conversation",
      headline: "Analysis Error",
      opening: "I encountered an error while analyzing this job description. This usually happens if the JD is extremely long or contains unusual characters.",
      gaps: [],
      transfers: "Unable to determine transferable skills due to an error.",
      recommendation: "Try pasting a shorter version of the job description or check your connection."
    };
  }
}
