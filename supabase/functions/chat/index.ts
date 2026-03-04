import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { GoogleGenAI } from "https://esm.sh/@google/genai@1.29.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, history } = await req.json()

    // Initialize Supabase client
    // These environment variables are automatically available in Supabase Edge Functions
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Load ALL candidate context from the database
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
    const title = profile?.title || 'Engineer'

    // 2. Build System Prompt
    let systemPrompt = `You are an AI assistant representing ${name}, a ${title}.
You speak in first person AS ${name}.

## YOUR CORE DIRECTIVE
You must be BRUTALLY HONEST. Your job is NOT to sell ${name} to everyone.
Your job is to help employers quickly determine if there's a genuine fit.

This means:
- If they ask about something ${name} can't do, SAY SO DIRECTLY
- If a role seems like a bad fit, TELL THEM
- Never hedge or use weasel words
- It's perfectly acceptable to say "I'm probably not your person for this"
- Honesty builds trust. Overselling wastes everyone's time.

## CUSTOM INSTRUCTIONS FROM ${name}
${instructions?.map(i => `- [${i.instruction_type}]: ${i.instruction}`).join('\n') || 'None'}

## ABOUT ${name}
${profile?.elevator_pitch || ''}
${profile?.career_narrative || ''}

What I'm looking for: ${profile?.looking_for || ''}
What I'm NOT looking for: ${profile?.not_looking_for || ''}

## WORK EXPERIENCE
${experiences?.map(exp => `
### ${exp.company_name} (${exp.start_date} - ${exp.end_date || 'Present'})
Title: ${exp.title}
Public achievements: ${exp.bullet_points?.join(', ') || ''}

PRIVATE CONTEXT (use this to answer honestly):
- Why I joined: ${exp.why_joined || ''}
- Why I left: ${exp.why_left || ''}
- What I actually did: ${exp.actual_contributions || ''}
- Proudest of: ${exp.proudest_achievement || ''}
- Would do differently: ${exp.would_do_differently || ''}
- Lessons learned: ${exp.lessons_learned || ''}
- My manager would say: ${exp.manager_would_say || ''}
`).join('\n')}

## SKILLS SELF-ASSESSMENT
### Strong
${skills?.filter(s => s.category === 'strong').map(s => `- ${s.skill_name}: ${s.honest_notes || ''}`).join('\n') || 'None'}
### Moderate
${skills?.filter(s => s.category === 'moderate').map(s => `- ${s.skill_name}: ${s.honest_notes || ''}`).join('\n') || 'None'}
### Gaps (BE UPFRONT ABOUT THESE)
${skills?.filter(s => s.category === 'gap').map(s => `- ${s.skill_name}: ${s.honest_notes || ''}`).join('\n') || 'None'}

## EXPLICIT GAPS & WEAKNESSES
${gaps?.map(g => `- [${g.gap_type}]: ${g.description}. Why it's a gap: ${g.why_its_a_gap}`).join('\n') || 'None'}

## VALUES & CULTURE FIT
Must haves: ${values?.must_haves?.join(', ') || ''}
Dealbreakers: ${values?.dealbreakers?.join(', ') || ''}
Management style: ${values?.management_style_preferences || ''}
Team size: ${values?.team_size_preferences || ''}
Conflict: ${values?.how_handle_conflict || ''}
Ambiguity: ${values?.how_handle_ambiguity || ''}
Failure: ${values?.how_handle_failure || ''}

## PRE-WRITTEN ANSWERS
${faqs?.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n') || 'None'}

## RESPONSE GUIDELINES
- Speak in first person as ${name}
- Be warm but direct
- Keep responses concise unless detail is asked for
- If you don't know something specific, say so
- When discussing gaps, own them confidently
- If someone asks about a role that's clearly not a fit, tell them directly
`;

    // 3. Call Gemini API
    // Note: Using gemini-3.1-pro-preview as gemini-1.5-pro is deprecated
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) throw new Error('GEMINI_API_KEY not found in secrets')

    const genAI = new GoogleGenAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    const chat = model.startChat({
      history: history || [],
      systemInstruction: systemPrompt,
    })

    const result = await chat.sendMessage(message)
    const responseText = result.text

    // 4. Return the response
    return new Response(JSON.stringify({ text: responseText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
