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
const RSS_FEEDS: Record<string, string[]> = {
  politics: [
    "https://feeds.bbci.co.uk/news/politics/rss.xml",
    "https://www.theguardian.com/politics/rss",
    "https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml",
  ],
  technology: [
    "https://feeds.bbci.co.uk/news/technology/rss.xml",
    "https://www.theguardian.com/technology/rss",
    "https://techcrunch.com/feed/",
  ],
  business: [
    "https://feeds.bbci.co.uk/news/business/rss.xml",
    "https://www.theguardian.com/business/rss",
    "https://rss.nytimes.com/services/xml/rss/nyt/Business.xml",
  ],
  sports: [
    "https://feeds.bbci.co.uk/sport/rss.xml",
    "https://www.theguardian.com/sport/rss",
  ],
  science: [
    "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml",
    "https://www.theguardian.com/science/rss",
    "https://rss.nytimes.com/services/xml/rss/nyt/Science.xml",
  ],
  health: [
    "https://feeds.bbci.co.uk/news/health/rss.xml",
    "https://www.theguardian.com/society/health/rss",
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

const DEFAULT_FEEDS = RSS_FEEDS.general;

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1504711434969-e33886168d6c?auto=format&fit=crop&q=80&w=800";

// ─── In-memory cache ──────────────────────────────────────────────────────────
const TTL = 10 * 60 * 1000; // 10 minutes
const newsCache = new Map<string, { data: Article[]; ts: number }>();

// ─── Seen-articles tracker (rotation system) ──────────────────────────────────
// Tracks which article URLs have already been shown per category so each
// refresh serves a different batch from the full RSS pool.
const seenUrls = new Map<string, Set<string>>();
// Full pool cache — stores ALL items fetched from RSS so we can rotate through
const poolCache = new Map<string, { articles: Article[]; ts: number }>();
const POOL_TTL = 15 * 60 * 1000; // 15 min — pools live a bit longer than display cache

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

export function bustCache(keyPrefix?: string): void {
  if (keyPrefix) {
    // Clear display cache entries matching the prefix
    for (const k of newsCache.keys()) {
      if (k.includes(keyPrefix)) newsCache.delete(k);
    }
    // Also clear ALL display cache entries (since page SSR uses different keys)
    // e.g. /api/news busts "politics" but page.tsx caches as "search:politics:14"
    newsCache.clear();
    console.log(`[bustCache] Cleared all display cache (triggered by "${keyPrefix}")`);
  } else {
    newsCache.clear();
    seenUrls.clear();
    poolCache.clear();
    console.log(`[bustCache] Cleared ALL caches`);
  }
}

/** Pick `max` unseen articles from the pool, rotating automatically. */
function pickUnseen(poolKey: string, pool: Article[], max: number): Article[] {
  let seen = seenUrls.get(poolKey);
  if (!seen) {
    seen = new Set();
    seenUrls.set(poolKey, seen);
  }

  // Separate unseen from seen
  const unseen = pool.filter((a) => !seen!.has(a.url));

  // If fewer unseen than needed, reset rotation
  if (unseen.length < max) {
    console.log(`[rotate] Resetting seen list for "${poolKey}" (${seen.size} seen, ${unseen.length} unseen, need ${max})`);
    seen.clear();
    // After reset, all are "unseen"
    const batch = pool.slice(0, max);
    batch.forEach((a) => seen!.add(a.url));
    return batch;
  }

  // Take the first `max` unseen articles
  const batch = unseen.slice(0, max);
  batch.forEach((a) => seen!.add(a.url));
  console.log(`[rotate] Serving ${batch.length} fresh articles for "${poolKey}" (${seen.size} total seen)`);
  return batch;
}

// ─── XML helpers (regex-based, zero deps) ─────────────────────────────────────

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .trim();
}

function stripHtml(s: string): string {
  return decodeEntities(s.replace(/<[^>]+>/g, ""));
}

function extractTag(xml: string, tag: string): string {
  // CDATA: <tag><![CDATA[content]]></tag>
  const cdataRe = new RegExp(
    `<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`,
    "i"
  );
  const cdataM = cdataRe.exec(xml);
  if (cdataM) return cdataM[1].trim();

  // Plain: <tag>content</tag>
  const plainRe = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const plainM = plainRe.exec(xml);
  if (plainM) return decodeEntities(plainM[1].trim());

  return "";
}

function extractAttr(xml: string, tag: string, attr: string): string {
  // Handles self-closing and open tags
  const re = new RegExp(`<${tag}[^>]*?\\s${attr}\\s*=\\s*["']([^"']+)["']`, "i");
  const m = re.exec(xml);
  return m ? decodeEntities(m[1]) : "";
}

function extractImage(itemXml: string): string {
  // 1. <media:thumbnail url="..." />  (BBC uses this)
  const thumb = extractAttr(itemXml, "media:thumbnail", "url");
  if (thumb) return thumb;

  // 2. <media:content url="..." />
  const media = extractAttr(itemXml, "media:content", "url");
  if (media) return media;

  // 3. <enclosure url="..." type="image/..." />
  const encRe =
    /<enclosure[^>]*url=["']([^"']+)["'][^>]*type=["']image[^"']*["'][^>]*\/?>/i;
  const encAlt =
    /<enclosure[^>]*type=["']image[^"']*["'][^>]*url=["']([^"']+)["'][^>]*\/?>/i;
  const encM = encRe.exec(itemXml) || encAlt.exec(itemXml);
  if (encM) return decodeEntities(encM[1]);

  // 4. <img src="..." /> inside raw XML / description CDATA
  const imgRe = /<img[^>]+src=["']([^"']+)["']/i;
  const imgM = imgRe.exec(itemXml);
  if (imgM) return decodeEntities(imgM[1]);

  return "";
}

// ─── Source name prettifier ───────────────────────────────────────────────────
const SOURCE_MAP: Record<string, string> = {
  "bbci.co.uk": "BBC News",
  "bbc.com": "BBC News",
  "theguardian.com": "The Guardian",
  "techcrunch.com": "TechCrunch",
  "politico.com": "Politico",
  "reuters.com": "Reuters",
  "nasa.gov": "NASA",
  "nytimes.com": "New York Times",
  "aljazeera.com": "Al Jazeera",
  "cnn.com": "CNN",
};

function extractSourceName(feedUrl: string): string {
  try {
    const host = new URL(feedUrl).hostname.replace(/^(www|feeds|rss)\./, "");
    for (const [key, name] of Object.entries(SOURCE_MAP)) {
      if (host.includes(key)) return name;
    }
    // Capitalize first part: "example.com" → "Example"
    const parts = host.split(".");
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  } catch {
    return "News";
  }
}

// ─── Parse RSS feed XML → Article[] ───────────────────────────────────────────
function parseRss(xml: string, sourceName: string): Article[] {
  const items: Article[] = [];
  const itemRe = /<item[\s>]([\s\S]*?)<\/item>/gi;
  let m: RegExpExecArray | null;

  while ((m = itemRe.exec(xml)) !== null) {
    const block = m[1];

    const title = stripHtml(extractTag(block, "title"));
    if (!title) continue;

    // <link> sometimes has tracking params; decode entities
    let url = extractTag(block, "link");
    if (!url) url = extractAttr(block, "link", "href");
    if (!url) continue;

    const rawDesc =
      extractTag(block, "description") || extractTag(block, "summary") || "";
    const description = stripHtml(rawDesc);

    const rawContent = extractTag(block, "content:encoded") || rawDesc;
    const content = stripHtml(rawContent) || description;

    const pubDate =
      extractTag(block, "pubDate") ||
      extractTag(block, "dc:date") ||
      extractTag(block, "published") ||
      extractTag(block, "updated") ||
      "";

    let publishedAt: string;
    try {
      publishedAt = pubDate ? new Date(pubDate).toISOString() : new Date().toISOString();
    } catch {
      publishedAt = new Date().toISOString();
    }

    const image = extractImage(block) || PLACEHOLDER_IMAGE;

    items.push({
      title,
      description: description || title,
      content: content || description || title,
      url,
      image,
      publishedAt,
      source: { name: sourceName },
    });
  }

  return items;
}

// ─── Fetch a single RSS feed ──────────────────────────────────────────────────
async function fetchOneFeed(feedUrl: string): Promise<Article[]> {
  const source = extractSourceName(feedUrl);
  try {
    const res = await fetch(feedUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      console.warn(`[RSS] ${feedUrl} → HTTP ${res.status}`);
      return [];
    }

    const xml = await res.text();
    const articles = parseRss(xml, source);
    console.log(`[RSS] ✓ ${source} → ${articles.length} articles`);
    return articles;
  } catch (err) {
    console.warn(`[RSS] ✗ ${source}:`, (err as Error).message);
    return [];
  }
}

// ─── Aggregate multiple RSS feeds ─────────────────────────────────────────────
async function fetchFromRss(feeds: string[], max: number): Promise<Article[]> {
  const results = await Promise.allSettled(feeds.map(fetchOneFeed));
  const seen = new Set<string>();
  const merged: Article[] = [];

  for (const r of results) {
    if (r.status !== "fulfilled") continue;
    for (const article of r.value) {
      // Deduplicate by URL
      const key = article.url.replace(/[?#].*$/, ""); // ignore query params
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(article);
      }
    }
  }

  // Sort newest first
  merged.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  return merged.slice(0, max);
}

// ─── NewsAPI fallback ─────────────────────────────────────────────────────────
const NEWSAPI_BASE = "https://newsapi.org/v2";

interface NewsApiArticle {
  source: { id?: string; name: string };
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string | null;
}

async function fetchFromNewsApi(
  category: string,
  max: number
): Promise<Article[]> {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    console.warn("[NewsAPI] No API key configured");
    return [];
  }

  try {
    let url: string;
    if (category === "politics" || category === "global politics") {
      url = `${NEWSAPI_BASE}/everything?q=politics&language=en&pageSize=${max + 5}&sortBy=publishedAt`;
    } else {
      url = `${NEWSAPI_BASE}/top-headlines?category=${category}&language=en&pageSize=${max + 5}`;
    }

    console.log(`[NewsAPI] Falling back for "${category}"...`);
    const res = await fetch(url, {
      headers: { "X-Api-Key": apiKey },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      console.warn(`[NewsAPI] HTTP ${res.status}`);
      return [];
    }

    const data = await res.json();
    const articles: Article[] = (data.articles || [])
      .filter((a: NewsApiArticle) => {
        if (!a || !a.title || !a.url) return false;
        const u = a.url.toLowerCase();
        if (u.includes("alltoc.com")) return false;
        if (a.source?.name?.toLowerCase().includes("political wire"))
          return false;
        return true;
      })
      .slice(0, max)
      .map((a: NewsApiArticle) => ({
        title: a.title || "No Title",
        description: a.description || "",
        content: a.content || a.description || "",
        url: a.url,
        image: a.urlToImage || PLACEHOLDER_IMAGE,
        publishedAt: a.publishedAt,
        source: { id: a.source?.id, name: a.source?.name || "Unknown" },
      }));

    console.log(`[NewsAPI] ✓ ${articles.length} articles for "${category}"`);
    return articles;
  } catch (err) {
    console.warn("[NewsAPI] ✗", (err as Error).message);
    return [];
  }
}

// ─── Fallback dummy data ──────────────────────────────────────────────────────
const dummyArticles: Article[] = [
  {
    title: "Global Tech Summit Unveils Next-Gen Artificial Intelligence",
    description:
      "Industry leaders gather to showcase breakthrough AI models promising to reshape the future of computing.",
    content:
      "Industry leaders gather to showcase breakthrough AI models promising to reshape the future of computing and everyday problem solving...",
    url: "#",
    image:
      "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80",
    publishedAt: new Date().toISOString(),
    source: { name: "Tech Daily" },
  },
  {
    title: "Market Rally: Tech Stocks Surge Amid Positive Earnings",
    description:
      "Major tech companies beat Q3 earnings expectations, propelling global markets higher.",
    content:
      "Major tech companies beat Q3 earnings expectations, sending global markets on a rapid upward trajectory...",
    url: "#",
    image:
      "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80",
    publishedAt: new Date(Date.now() - 3600000).toISOString(),
    source: { name: "Financial Post" },
  },
  {
    title: "Sustainable Architecture: The Rise of Green Skyscrapers",
    description:
      "Architects turn to sustainable materials and vertical gardens to combat urban pollution.",
    content:
      "Architects are increasingly turning to sustainable materials and vertical gardens to combat urban pollution...",
    url: "#",
    image:
      "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&q=80",
    publishedAt: new Date(Date.now() - 7200000).toISOString(),
    source: { name: "Design World" },
  },
  {
    title: "New Battery Technology Could Double EV Range",
    description:
      "Researchers develop a solid-state battery promising to double the range of current EVs.",
    content:
      "Researchers developed a solid-state battery that promises to double the range of current electric vehicles...",
    url: "#",
    image:
      "https://images.unsplash.com/photo-1593941707882-a5bba14938cb?auto=format&fit=crop&q=80",
    publishedAt: new Date(Date.now() - 10800000).toISOString(),
    source: { name: "Auto Future" },
  },
  {
    title: "Exploring the Deep Ocean: New Species Discovered",
    description:
      "A Mariana Trench expedition uncovers several previously unknown marine species.",
    content:
      "A recent expedition to the Mariana Trench has uncovered several previously unknown species of marine life...",
    url: "#",
    image:
      "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?auto=format&fit=crop&q=80",
    publishedAt: new Date(Date.now() - 14400000).toISOString(),
    source: { name: "Science Now" },
  },
  {
    title: "Global Coffee Shortage Driven By Extreme Climate",
    description:
      "Coffee farmers report massive yield reductions from unpredictable weather patterns.",
    content:
      "Coffee farmers report massive yield reductions as unpredictable weather patterns negatively impact growth...",
    url: "#",
    image:
      "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80",
    publishedAt: new Date(Date.now() - 18000000).toISOString(),
    source: { name: "Global News" },
  },
];

// ─── Public API ───────────────────────────────────────────────────────────────
// Tier 1: RSS feeds (with rotation) → Tier 2: NewsAPI → Tier 3: dummy data

/**
 * Grabs the full article pool for a category (cached for POOL_TTL),
 * then rotates through unseen articles on each call.
 */
async function getPool(category: string): Promise<Article[]> {
  const poolKey = `pool:${category}`;
  const cached = poolCache.get(poolKey);
  if (cached && Date.now() - cached.ts < POOL_TTL) {
    return cached.articles;
  }

  // Fetch ALL articles from every feed for this category
  const feeds = RSS_FEEDS[category] ?? DEFAULT_FEEDS;
  const articles = await fetchFromRss(feeds, 200); // grab everything

  if (articles.length > 0) {
    poolCache.set(poolKey, { articles, ts: Date.now() });
    console.log(`[pool] Cached ${articles.length} articles for "${category}"`);
  }

  return articles;
}

export async function fetchTopHeadlines(
  category: string = "general",
  max: number = 6
): Promise<Article[]> {
  if (category === "politics") return searchNews("politics", max);

  const cacheKey = `headlines:${category}:${max}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  // Tier 1: RSS with rotation
  const pool = await getPool(category);
  let articles: Article[] = [];

  if (pool.length > 0) {
    articles = pickUnseen(`headlines:${category}`, pool, max);
  }

  // Tier 2: NewsAPI fallback
  if (articles.length < 2) {
    console.warn(`[Tier 2] RSS pool too small (${articles.length}), trying NewsAPI for "${category}"...`);
    const apiArticles = await fetchFromNewsApi(category, max);
    if (apiArticles.length > articles.length) articles = apiArticles;
  }

  // Tier 3: Dummy data
  if (articles.length === 0) {
    console.warn(`[Tier 3] All sources failed for "${category}", using dummy data`);
    return dummyArticles.slice(0, max);
  }

  setCache(cacheKey, articles);
  return articles;
}

export async function searchNews(
  query: string,
  max: number = 6
): Promise<Article[]> {
  const cacheKey = `search:${query}:${max}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  // Figure out which RSS category best matches the query
  const q = query.toLowerCase();
  let category = "general";
  for (const cat of Object.keys(RSS_FEEDS)) {
    if (q.includes(cat)) {
      category = cat;
      break;
    }
  }

  // Tier 1: RSS pool with keyword filtering + rotation
  const pool = await getPool(category);

  // Filter by query keywords
  const keywords = q.split(/\s+/).filter((w) => w.length > 2);
  const relevant = pool.filter((a) => {
    const haystack = (a.title + " " + a.description).toLowerCase();
    return keywords.some((kw) => haystack.includes(kw));
  });

  // Use keyword-filtered pool if enough results, otherwise full pool
  const sourcePool = relevant.length >= max ? relevant : pool;
  let articles: Article[] = [];

  if (sourcePool.length > 0) {
    articles = pickUnseen(`search:${query}`, sourcePool, max);
  }

  // Tier 2: NewsAPI fallback
  if (articles.length < 2) {
    console.warn(`[Tier 2] RSS search for "${query}" got ${articles.length}, trying NewsAPI...`);
    const apiArticles = await fetchFromNewsApi(
      category === "general" ? query : category,
      max
    );
    if (apiArticles.length > articles.length) articles = apiArticles;
  }

  // Tier 3: Dummy
  if (articles.length === 0) {
    console.warn(`[Tier 3] All search sources failed for "${query}", using dummy data`);
    return dummyArticles.slice(0, max);
  }

  setCache(cacheKey, articles);
  return articles;
}

