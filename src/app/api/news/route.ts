import { NextResponse } from 'next/server';

// ─── In-memory cache ──────────────────────────────────────
const TTL = 10 * 60 * 1000; // 10 minutes
// Keyed by category so each page has its own cache slot
const routeCache = new Map<string, { data: any[]; ts: number }>();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const force = searchParams.get('force') === 'true';
  // category param matches Next.js category slug (e.g. 'technology', 'sports')
  // defaults to 'general' for the homepage / /news feed
  const category = searchParams.get('category') || 'general';
  const cacheKey = category;

  // Return cached data if still fresh and not a forced refresh
  if (!force) {
    const entry = routeCache.get(cacheKey);
    if (entry && Date.now() - entry.ts < TTL) {
      console.log(`[cache HIT] /api/news?category=${category}`);
      return NextResponse.json(entry.data);
    }
  } else {
    console.log(`[cache BUST] /api/news?category=${category}`);
    routeCache.delete(cacheKey);
  }

  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "NEWS_API_KEY not configured" }, { status: 500 });
  }

  try {
    // politics uses /everything with keyword, all others use /top-headlines
    let url: string;
    if (category === 'politics') {
      const randomPage = Math.floor(Math.random() * 5) + 1;
      url = `https://newsapi.org/v2/everything?q=politics&language=en&pageSize=24&sortBy=publishedAt&page=${randomPage}&apiKey=${apiKey}`;
    } else if (category === 'general') {
      const randomPage = Math.floor(Math.random() * 5) + 1;
      url = `https://newsapi.org/v2/top-headlines?country=us&apiKey=${apiKey}&page=${randomPage}`;
    } else {
      const randomPage = Math.floor(Math.random() * 3) + 1;
      url = `https://newsapi.org/v2/top-headlines?category=${category}&language=en&pageSize=20&page=${randomPage}&apiKey=${apiKey}`;
    }

    const res = await fetch(url, { cache: 'no-store' });

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

    // Store in cache
    routeCache.set(cacheKey, { data: activeArticles, ts: Date.now() });
    console.log(`[cache SET] /api/news?category=${category} — ${activeArticles.length} articles`);

    return NextResponse.json(activeArticles);
  } catch (error: any) {
    console.error("API /news error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
