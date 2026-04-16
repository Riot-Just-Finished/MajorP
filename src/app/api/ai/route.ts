import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// ─── OpenRouter helper ────────────────────────────────────────────────────────
async function callOpenRouter(prompt: string, model: string): Promise<string> {
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (!openRouterKey || openRouterKey === 'your_openrouter_key_here') {
    throw new Error('OPENROUTER_API_KEY not configured in .env');
  }

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openRouterKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'NewsArt AI',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 6000,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`OpenRouter [${model}] failed (${res.status}): ${JSON.stringify(err)}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

// ─── Route handler ────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { action, articleText, title } = await req.json();

    if (!articleText) {
      return NextResponse.json({ error: 'No article text provided' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Missing Gemini API Key' }, { status: 500 });
    }

    // ─── Build prompt ─────────────────────────────────────────────────────────
    const MAX_INPUT = 10000;
    const truncatedText = articleText.substring(0, MAX_INPUT);

    let prompt = '';
    switch (action) {
      case 'political_stance':
        prompt = `You are a highly analytical expert at analyzing journalistic writing. Categorize the following article text determining its political stance constraint strictly (e.g. Left-leaning, Right-leaning, Centrist, Hyper-polarized). 
        Format your response precisely like this: 
        1. On the first line, state only the categorization label (e.g., "Centrist / Unbiased" or "Right-leaning"). 
        2. On the next lines, provide a brief 2-3 sentence explanation describing exactly why it has this stance, referencing any specific framing or terminology used.
        
        Title: ${title}
        Article Text: ${truncatedText}`;
        break;

      case 'summarise':
        prompt = `Please provide a high-level summary of the following article. Format it entirely using 3-5 succinct bullet points. Do not include any intro or outro conversational text.
        
        Title: ${title}
        Article Text: ${truncatedText}`;
        break;

      case 'change_tone':
        prompt = `You are an expert ghostwriter. Read the following article and rewrite the entire article so that its political tone is shifted to the OPPOSITE viewpoint. Maintain the core factual events, but change the framing, adjectives, inferences, and rhetoric to suit the opposite political demographic perfectly. Output only the rewritten article formatted in standard HTML paragraphs (e.g., <p>text</p>), with no markdown code blocks and no conversational intro/outro text.
        
        Title: ${title}
        Article Text: ${truncatedText}`;
        break;

      default:
        return NextResponse.json({ error: 'Invalid action type' }, { status: 400 });
    }

    // ─── Tier 1: Native Google Gemini ─────────────────────────────────────────
    let responseText = '';
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      responseText = response.text ?? '';
      console.log('[AI] Served via native Google Gemini');
    } catch (googleError: any) {
      console.warn('[AI] Native Gemini failed:', googleError?.status ?? googleError?.message);

      // ─── Tier 2: OpenRouter → gemini-2.5-flash ──────────────────────────────
      try {
        responseText = await callOpenRouter(prompt, 'google/gemini-2.5-flash');
        console.log('[AI] Served via OpenRouter (gemini-2.5-flash)');
      } catch (orError1: any) {
        console.warn('[AI] OpenRouter gemini-2.5-flash failed:', orError1.message);

        // ─── Tier 3: OpenRouter → free fallback model ────────────────────────
        try {
          responseText = await callOpenRouter(prompt, 'mistralai/mistral-7b-instruct:free');
          console.log('[AI] Served via OpenRouter (mistral-7b free fallback)');
        } catch (orError2: any) {
          console.error('[AI] All tiers exhausted:', orError2.message);
          throw new Error(
            'All AI providers are currently unavailable. Please try again in a moment.'
          );
        }
      }
    }

    return NextResponse.json({ result: responseText });
  } catch (error: any) {
    console.error('[AI] Route error:', error);
    return NextResponse.json(
      { error: error.message ?? 'Failed to fetch AI response' },
      { status: 500 }
    );
  }
}
