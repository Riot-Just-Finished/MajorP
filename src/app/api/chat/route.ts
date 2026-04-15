import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

interface Message {
  role: 'user' | 'model';
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const { messages, articleText, articleTitle } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages array' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Missing Gemini API Key' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Build the full conversation history for Gemini
    // We inject the article as a system-level context in the first user turn
    const systemContext = articleText
      ? `You are an expert news analyst and helpful assistant. The user is reading the following news article and wants to discuss it with you. Answer questions thoughtfully and accurately based on the article content. You may also draw on your general knowledge to provide additional context, but always prioritise the article's content.

ARTICLE TITLE: ${articleTitle || 'News Article'}

ARTICLE CONTENT:
${articleText.substring(0, 12000)}

---
Now answer the user's questions about this article.`
      : `You are a helpful news analyst assistant. Answer questions about current events and news thoughtfully.`;

    // Convert message history to Gemini format
    const contents = messages.map((msg: Message) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // Prepend the system context as the first exchange if article exists
    const finalContents = articleText
      ? [
          { role: 'user', parts: [{ text: systemContext }] },
          { role: 'model', parts: [{ text: `Got it! I've read "${articleTitle || 'the article'}" and I'm ready to discuss it. What would you like to know?` }] },
          ...contents
        ]
      : contents;

    let responseText = '';

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: finalContents
      });
      responseText = response.text || '';
    } catch (googleError: any) {
      console.warn('Google API failed, trying OpenRouter...', googleError?.status);
      const openRouterKey = process.env.OPENROUTER_API_KEY;
      if (!openRouterKey) throw googleError;

      const orMessages = [
        { role: 'system', content: systemContext },
        ...messages.map((m: Message) => ({ role: m.role === 'model' ? 'assistant' : 'user', content: m.content }))
      ];

      const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openRouterKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: orMessages,
          max_tokens: 2000
        })
      });

      if (!orRes.ok) throw new Error(`OpenRouter failed: ${orRes.status}`);
      const orData = await orRes.json();
      responseText = orData.choices[0].message.content;
    }

    return NextResponse.json({ reply: responseText });
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: error.message || 'Chat failed' }, { status: 500 });
  }
}
