import { NextResponse } from 'next/server';
import { fetchTopHeadlines, bustCache } from '@/lib/api';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const force = searchParams.get('force') === 'true';
  const category = searchParams.get('category') || 'general';

  if (force) {
    console.log(`[BUST] /api/news?category=${category}`);
    bustCache(category);
  }

  try {
    const articles = await fetchTopHeadlines(category, 24);
    console.log(`[/api/news] ${category} → ${articles.length} articles`);
    return NextResponse.json(articles);
  } catch (error: any) {
    console.error('[/api/news] error:', error);
    return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 });
  }
}
