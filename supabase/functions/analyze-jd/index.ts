import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { GoogleGenAI, Type } from "https://esm.sh/@google/genai@1.29.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { jd } = await req.json()

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const [
      { data: profile },
      { data: experiences },
      { data: skills },
      { data: gaps },
      { data: values },
      { data: faqs },
      { data: instructions }
    ] = await Promise.all([
      supabase.from('candidate_profile').select('*').single(),
      supabase.from('experiences').select('*').order('display_order', { ascending: true }),
      supabase.from('skills').select('*'),
      supabase.from('gaps_weaknesses').select('*'),
      supabase.from('values_culture').select('*').single(),
      supabase.from('faq_responses').select('*'),
      supabase.from('ai_instructions').select('*').order('priority', { descending: true })
    ])

    const name = profile?.name || 'Joe Peterlin'

    const systemPrompt = `You are analyzing a job description to assess fit for ${name}.
Give a BRUTALLY HONEST assessment of whether ${name} is a good fit.

Your assessment MUST:
1. Identify specific requirements from the JD that ${name} DOES NOT meet
2. Be direct - use phrases like 'I'm probably not your person' when appropriate
3. Explain what DOES transfer even if it's not a perfect fit
4. Give a clear recommendation

## CANDIDATE CONTEXT:
${JSON.stringify({ profile, experiences, skills, gaps, values, instructions })}

Respond with JSON:
{
  "verdict": "strong_fit" | "worth_conversation" | "probably_not",
  "headline": "Brief headline for the assessment",
  "opening": "1-2 sentence direct assessment in first person",
  "gaps": [
    {
      "requirement": "What the JD asks for",
      "gap_title": "Short title",
      "explanation": "Why this is a gap for me"
    }
  ],
  "transfers": "What skills/experience DO transfer",
  "recommendation": "Direct advice - can be 'don't hire me for this'"
}`;

    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) throw new Error('GEMINI_API_KEY not found in secrets')

    const genAI = new GoogleGenAI({ apiKey })

    const result = await genAI.models.generateContent({
      model: "gemini-1.5-flash",
      contents: `Analyze this JD: ${jd}\n\nSystem Instruction: ${systemPrompt}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            verdict: { type: Type.STRING, enum: ["strong_fit", "worth_conversation", "probably_not"] },
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
    })

    const responseText = result.text

    return new Response(responseText, {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
