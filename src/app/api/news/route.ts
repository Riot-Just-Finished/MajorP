import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "NEWS_API_KEY not configured" }, { status: 500 });
  }

  try {
    const res = await fetch(`https://newsapi.org/v2/top-headlines?country=us&apiKey=${apiKey}`, {
      next: { revalidate: 3600 }
    });

    if (!res.ok) {
      const errorData = await res.json();
      return NextResponse.json({ error: "NewsAPI fetch failed", details: errorData }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data.articles);
  } catch (error: any) {
    console.error("API /news error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
