import { NextRequest, NextResponse } from 'next/server';

// ─── Ollama local helper ──────────────────────────────────────────────────────
async function callOllama(prompt: string): Promise<string> {
  const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

  const res = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gemma3:1b',
      prompt,
      stream: false,
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`Ollama request failed (${res.status}): ${err}`);
  }

  const data = await res.json();
  return data.response ?? '';
}

// ─── Route handler ────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { action, articleText, title } = await req.json();

    if (!articleText) {
      return NextResponse.json({ error: 'No article text provided' }, { status: 400 });
    }

    // ─── Build prompt (same prompts as Gemini route) ──────────────────────────
    const MAX_INPUT = 4000; // smaller limit for local model
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
        prompt = `Only rewrite, do not use first person text. You are an expert ghostwriter. Read the following article and rewrite the entire article so that its political tone is shifted to the OPPOSITE viewpoint. Maintain the core factual events, but change the framing, adjectives, inferences, and rhetoric to suit the opposite political demographic perfectly. Output only the rewritten article formatted in standard HTML paragraphs (e.g., <p>text</p>), with no markdown code blocks and no conversational intro/outro text.
        
        Title: ${title}
        Article Text: ${truncatedText}`;
        break;

      default:
        return NextResponse.json({ error: 'Invalid action type' }, { status: 400 });
    }

    // ─── Call local Ollama ────────────────────────────────────────────────────
    let responseText = '';
    try {
      responseText = await callOllama(prompt);
      console.log('[AI-Local] Served via Ollama (gemma3:1b)');
    } catch (ollamaError: any) {
      console.error('[AI-Local] Ollama failed:', ollamaError.message);
      throw new Error(
        'Local model (Ollama) is not reachable. Make sure Ollama is running with gemma3:1b loaded.'
      );
    }

    return NextResponse.json({ result: responseText });
  } catch (error: any) {
    console.error('[AI-Local] Route error:', error);
    return NextResponse.json(
      { error: error.message ?? 'Failed to fetch local AI response' },
      { status: 500 }
    );
  }
}
