// ─── Types ────────────────────────────────────────────────────────────────────

export interface Source {
  id?: string | null;
  name: string;
}

export interface Article {
  id?: string;
  title: string;
  description: string;
  content: string;
  url: string;
  image: string;
  publishedAt: string;
  source: Source;
}

// ─── RSS feed map ─────────────────────────────────────────────────────────────
// Each category maps to one or more public RSS feeds (tried in order).
const RSS_FEEDS: Record<string, string[]> = {
  politics: [
    "https://feeds.bbci.co.uk/news/politics/rss.xml",
    "https://rss.politico.com/politics-news.xml",
    "https://www.theguardian.com/politics/rss",
  ],
  technology: [
    "https://feeds.bbci.co.uk/news/technology/rss.xml",
    "https://www.theguardian.com/technology/rss",
    "https://techcrunch.com/feed/",
  ],
  business: [
    "https://feeds.bbci.co.uk/news/business/rss.xml",
    "https://www.theguardian.com/business/rss",
    "https://feeds.reuters.com/reuters/businessNews",
  ],
  sports: [
    "https://feeds.bbci.co.uk/sport/rss.xml",
    "https://www.theguardian.com/sport/rss",
  ],
  science: [
    "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml",
    "https://www.theguardian.com/science/rss",
    "https://www.nasa.gov/rss/dyn/breaking_news.rss",
  ],
  health: [
    "https://feeds.bbci.co.uk/news/health/rss.xml",
    "https://www.theguardian.com/society/rss",
  ],
  entertainment: [
    "https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml",
    "https://www.theguardian.com/culture/rss",
  ],
  general: [
    "https://feeds.bbci.co.uk/news/world/rss.xml",
    "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",
    "https://www.theguardian.com/world/rss",
  ],
};

// Default fallback feeds for unknown categories
const DEFAULT_FEEDS = RSS_FEEDS.general;

// ─── In-memory cache ──────────────────────────────────────────────────────────
const TTL = 10 * 60 * 1000; // 10 minutes
const newsCache = new Map<string, { data: Article[]; ts: number }>();

function getCached(key: string): Article[] | null {
  const entry = newsCache.get(key);
  if (entry && Date.now() - entry.ts < TTL) {
    console.log(`[cache HIT] ${key}`);
    return entry.data;
  }
  return null;
}

function setCache(key: string, data: Article[]): void {
  newsCache.set(key, { data, ts: Date.now() });
  console.log(`[cache SET] ${key} — ${data.length} articles`);
}

// ─── Fallback dummy data ──────────────────────────────────────────────────────
const dummyArticles: Article[] = [
  {
    title: "Global Tech Summit Unveils Next-Gen Artificial Intelligence",
    description: "Industry leaders gather to showcase breakthrough AI models promising to reshape the future of computing and everyday problem solving.",
    content: "Industry leaders gather to showcase breakthrough AI models promising to reshape the future of computing and everyday problem solving. The event saw participation from massive corporations...",
    url: "#",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80",
    publishedAt: new Date().toISOString(),
    source: { name: "Tech Daily" }
  },
  {
    title: "Market Rally: Tech Stocks Surge Amid Positive Earnings",
    description: "Major tech companies beat Q3 earnings expectations, sending global markets on a rapid upwards trajectory.",
    content: "Major tech companies beat Q3 earnings expectations, sending global markets on a rapid upwards trajectory...",
    url: "#",
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80",
    publishedAt: new Date(Date.now() - 3600000).toISOString(),
    source: { name: "Financial Post" }
  },
  {
    title: "Sustainable Architecture: The Rise of Green Skyscrapers",
    description: "Architects are increasingly turning to sustainable materials and vertical gardens to combat urban pollution.",
    content: "Architects are increasingly turning to sustainable materials and vertical gardens to combat urban pollution...",
    url: "#",
    image: "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&q=80",
    publishedAt: new Date(Date.now() - 7200000).toISOString(),
    source: { name: "Design World" }
  },
  {
    title: "New Battery Technology Could Double EV Range",
    description: "Researchers developed a solid-state battery that promises to double the range of current electric vehicles.",
    content: "Researchers developed a solid-state battery that promises to double the range of current electric vehicles...",
    url: "#",
    image: "https://images.unsplash.com/photo-1593941707882-a5bba14938cb?auto=format&fit=crop&q=80",
    publishedAt: new Date(Date.now() - 10800000).toISOString(),
    source: { name: "Auto Future" }
  },
  {
    title: "Exploring the Deep Ocean: New Species Discovered",
    description: "A recent expedition to the Mariana Trench has uncovered several previously unknown species of marine life.",
    content: "A recent expedition to the Mariana Trench has uncovered several previously unknown species of marine life...",
    url: "#",
    image: "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?auto=format&fit=crop&q=80",
    publishedAt: new Date(Date.now() - 14400000).toISOString(),
    source: { name: "Science Now" }
  },
  {
    title: "Global Coffee Shortage Driven By Extreme Climate",
    description: "Coffee farmers report massive yield reductions as unpredictable weather patterns negatively impact growth.",
    content: "Coffee farmers report massive yield reductions as unpredictable weather patterns negatively impact growth...",
    url: "#",
    image: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80",
    publishedAt: new Date(Date.now() - 18000000).toISOString(),
    source: { name: "Global News" }
  }
];

// ─── RSS XML parser ───────────────────────────────────────────────────────────
// Pure regex/string based — works in any Node.js/Edge runtime, no extra deps.

function extractText(xml: string, tag: string): string {
  // Try CDATA first, then plain content
  const cdataRe = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, "i");
  const plainRe = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const cdataMatch = cdataRe.exec(xml);
  if (cdataMatch) return cdataMatch[1].trim();
  const plainMatch = plainRe.exec(xml);
  return plainMatch ? stripHtml(plainMatch[1].trim()) : "";
}

function extractAttr(xml: string, tag: string, attr: string): string {
  const re = new RegExp(`<${tag}[^>]*\\s${attr}=["']([^"']+)["'][^>]*>`, "i");
  const m = re.exec(xml);
  return m ? m[1] : "";
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ").trim();
}

function extractImageFromItem(itemXml: string): string {
  // 1. <media:content url="..." />
  const mediaUrl = extractAttr(itemXml, "media:content", "url");
  if (mediaUrl) return mediaUrl;

  // 2. <media:thumbnail url="..." />
  const thumbUrl = extractAttr(itemXml, "media:thumbnail", "url");
  if (thumbUrl) return thumbUrl;

  // 3. <enclosure url="..." type="image/..." />
  const encRe = /<enclosure[^>]*url=["']([^"']+)["'][^>]*type=["']image[^"']*["'][^>]*\/?>/i;
  const encMatch = encRe.exec(itemXml);
  if (encMatch) return encMatch[1];

  // 4. First <img src="..." /> inside description/content CDATA
  const imgRe = /<img[^>]+src=["']([^"']+)["']/i;
  const descText = extractText(itemXml, "description") || extractText(itemXml, "content:encoded");
  const imgMatch = imgRe.exec(descText + itemXml);
  if (imgMatch) return imgMatch[1];

  return "";
}

function parseRssItems(xml: string, sourceName: string): Article[] {
  // Split into <item> blocks
  const itemRe = /<item[\s>]([\s\S]*?)<\/item>/gi;
  const articles: Article[] = [];
  let match: RegExpExecArray | null;

  while ((match = itemRe.exec(xml)) !== null) {
    const itemXml = match[1];

    const title = stripHtml(extractText(itemXml, "title"));
    const url = extractText(itemXml, "link") || extractAttr(itemXml, "link", "href");
    const description = stripHtml(extractText(itemXml, "description"));
    const content = extractText(itemXml, "content:encoded") || description;
    const pubDate = extractText(itemXml, "pubDate") || extractText(itemXml, "dc:date") || extractText(itemXml, "published");
    const image = extractImageFromItem(itemXml);

    if (!title || !url) continue;

    let publishedAt: string;
    try {
      publishedAt = pubDate ? new Date(pubDate).toISOString() : new Date().toISOString();
    } catch {
      publishedAt = new Date().toISOString();
    }

    articles.push({
      title,
      description,
      content: content || description,
      url,
      image: image || "https://images.unsplash.com/photo-1508921340878-ba53e1f016ec?auto=format&fit=crop&q=80",
      publishedAt,
      source: { name: sourceName },
    });
  }

  return articles;
}

function extractSourceName(feedUrl: string): string {
  try {
    const host = new URL(feedUrl).hostname.replace(/^www\.|^feeds\./, "");
    // prettify known hostnames
    const map: Record<string, string> = {
      "bbci.co.uk": "BBC News",
      "theguardian.com": "The Guardian",
      "techcrunch.com": "TechCrunch",
      "politico.com": "Politico",
      "reuters.com": "Reuters",
      "nasa.gov": "NASA",
      "nytimes.com": "New York Times",
    };
    for (const [key, name] of Object.entries(map)) {
      if (host.includes(key)) return name;
    }
    return host.split(".")[0].charAt(0).toUpperCase() + host.split(".")[0].slice(1);
  } catch {
    return "News";
  }
}

// ─── Fetch & parse one RSS feed ───────────────────────────────────────────────
async function fetchRssFeed(feedUrl: string): Promise<Article[]> {
  const sourceName = extractSourceName(feedUrl);
  try {
    const res = await fetch(feedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; NewsBot/1.0)",
        "Accept": "application/rss+xml, application/xml, text/xml, */*",
      },
      cache: "no-store",
      // 8-second timeout (AbortSignal.timeout requires Node 17.5+)
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      console.warn(`[RSS] ${feedUrl} returned ${res.status}`);
      return [];
    }

    const xml = await res.text();
    const items = parseRssItems(xml, sourceName);
    console.log(`[RSS] ${feedUrl} → ${items.length} items`);
    return items;
  } catch (err) {
    console.warn(`[RSS] Failed to fetch ${feedUrl}:`, (err as Error).message);
    return [];
  }
}

// ─── Multi-feed aggregator ────────────────────────────────────────────────────
async function fetchFromFeeds(feeds: string[], max: number): Promise<Article[]> {
  // Try feeds concurrently; merge & deduplicate by URL
  const results = await Promise.all(feeds.map(fetchRssFeed));
  const seen = new Set<string>();
  const merged: Article[] = [];

  for (const items of results) {
    for (const item of items) {
      if (!seen.has(item.url)) {
        seen.add(item.url);
        merged.push(item);
      }
    }
  }

  // Sort newest first
  merged.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  return merged.slice(0, max);
}

// ─── Public API (same signatures as before) ───────────────────────────────────

export async function fetchTopHeadlines(category: string = "general", max: number = 6): Promise<Article[]> {
  const cacheKey = `rss:headlines:${category}:${max}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const feeds = RSS_FEEDS[category] ?? DEFAULT_FEEDS;
  const articles = await fetchFromFeeds(feeds, max);

  if (articles.length > 0) {
    setCache(cacheKey, articles);
    return articles;
  }

  console.warn(`[RSS] No articles for category "${category}", using dummy data.`);
  return dummyArticles.slice(0, max);
}

export async function searchNews(query: string, max: number = 6): Promise<Article[]> {
  // Map common query keywords to category feeds
  const queryLower = query.toLowerCase();
  let category = "general";
  for (const cat of Object.keys(RSS_FEEDS)) {
    if (queryLower.includes(cat)) {
      category = cat;
      break;
    }
  }

  const cacheKey = `rss:search:${query}:${max}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const feeds = RSS_FEEDS[category] ?? DEFAULT_FEEDS;
  const articles = await fetchFromFeeds(feeds, max * 3); // fetch more so we can filter

  // Filter by query keyword (loose match on title/description)
  const keywords = query.toLowerCase().split(/\s+/);
  const filtered = articles.filter(a => {
    const text = (a.title + " " + a.description).toLowerCase();
    return keywords.some(kw => text.includes(kw));
  });

  const result = (filtered.length >= 3 ? filtered : articles).slice(0, max);

  if (result.length > 0) {
    setCache(cacheKey, result);
    return result;
  }

  return dummyArticles.slice(0, max);
}
