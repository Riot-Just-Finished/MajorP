import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json({ error: "Missing 'url' parameter" }, { status: 400 });
  }

  try {
    const response = await axios.get(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
      },
      timeout: 8000
    });

    const doc = new JSDOM(response.data, { url: targetUrl });
    const reader = new Readability(doc.window.document);
    const article = reader.parse();

    if (!article) {
      return NextResponse.json({ error: "Could not parse article from the provided URL" }, { status: 500 });
    }

    return NextResponse.json({
      title: article.title,
      content: article.content, // HTML string
      textContent: article.textContent,
      byline: article.byline,
    });
  } catch (error: any) {
    console.error(`Error scraping URL ${targetUrl}:`, error.message);
    return NextResponse.json(
      { error: "Failed to fetch or parse article.", details: error.message },
      { status: 500 }
    );
  }
}
