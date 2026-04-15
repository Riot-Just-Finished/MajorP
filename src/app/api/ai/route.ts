import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: NextRequest) {
  try {
    const { action, articleText, title } = await req.json();

    if (!articleText) {
      return NextResponse.json({ error: "No article text provided" }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Missing Gemini API Key" }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    let prompt = "";

    switch (action) {
      case "political_stance":
        prompt = `You are a highly analytical expert at analyzing journalistic writing. Categorize the following article text determining its political stance constraint strictly (e.g. Left-leaning, Right-leaning, Centrist, Hyper-polarized). 
        Format your response precisely like this: 
        1. On the first line, state only the categorization label (e.g., "Centrist / Unbiased" or "Right-leaning"). 
        2. On the next lines, provide a brief 2-3 sentence explanation describing exactly why it has this stance, referencing any specific framing or terminology used.
        
        Title: ${title}
        Article Text: ${articleText.substring(0, 8000)}`; // limit token bleed
        break;
      
      case "summarise":
        prompt = `Please provide a high-level summary of the following article. Format it entirely using 3-5 succinct bullet points. Do not include any intro or outro conversational text.
        
        Title: ${title}
        Article Text: ${articleText.substring(0, 10000)}`;
        break;

      case "change_tone":
        prompt = `You are an expert ghostwriter. Read the following article and rewrite the entire article so that its political tone is shifted to the OPPOSITE viewpoint. Maintain the core factual events, but change the framing, adjectives, inferences, and rhetoric to suit the opposite political demographic perfectly. Output only the rewritten article formatted in standard HTML paragraphs (e.g., <p>text</p>), with no markdown code blocks and no conversational intro/outro text.
        
        Title: ${title}
        Article Text: ${articleText.substring(0, 10000)}`;
        break;

      default:
        return NextResponse.json({ error: "Invalid action type" }, { status: 400 });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    return NextResponse.json({ result: response.text });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch response from Gemini API" }, { status: 500 });
  }
}
