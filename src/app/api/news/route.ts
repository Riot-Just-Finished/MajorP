import { NextResponse } from 'next/server';
import { fetchTopHeadlines } from '@/lib/api';

// ─── In-memory route-level cache (mirrors lib/api's cache for forced busts) ──
const TTL = 10 * 60 * 1000; // 10 minutes
const routeCache = new Map<string, { ts: number }>();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const force = searchParams.get('force') === 'true';
  const category = searchParams.get('category') || 'general';
  const cacheKey = category;

  if (force) {
    console.log(`[cache BUST] /api/news?category=${category}`);
    routeCache.delete(cacheKey);
  } else {
    const entry = routeCache.get(cacheKey);
    if (entry && Date.now() - entry.ts < TTL) {
      console.log(`[cache HIT] /api/news?category=${category}`);
      // Re-use the lib cache — just signal the client to reload
      const articles = await fetchTopHeadlines(category, 24);
      return NextResponse.json(articles);
    }
  }

  try {
    const articles = await fetchTopHeadlines(category, 24);
    routeCache.set(cacheKey, { ts: Date.now() });
    console.log(`[RSS] /api/news?category=${category} — ${articles.length} articles`);
    return NextResponse.json(articles);
  } catch (error: any) {
    console.error('[RSS] /api/news error:', error);
    return NextResponse.json({ error: 'Failed to fetch RSS feeds' }, { status: 500 });
  }
}
