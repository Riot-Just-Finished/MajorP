import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "NEWS_API_KEY not configured" }, { status: 500 });
  }

  try {
    const randomPage = Math.floor(Math.random() * 5) + 1;
    const res = await fetch(`https://newsapi.org/v2/top-headlines?country=us&apiKey=${apiKey}&page=${randomPage}`, {
      cache: 'no-store'
    });

    if (!res.ok) {
      const errorData = await res.json();
      return NextResponse.json({ error: "NewsAPI fetch failed", details: errorData }, { status: res.status });
    }

    const data = await res.json();
    const activeArticles = (data.articles || []).filter((article: any) => {
      if (!article) return false;
      const url = article.url?.toLowerCase() || "";
      const sourceName = article.source?.name?.toLowerCase() || "";
      if (url.includes("alltoc.com")) return false;
      if (sourceName.includes("political wire")) return false;
      return true;
    });

    return NextResponse.json(activeArticles);
  } catch (error: any) {
    console.error("API /news error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
