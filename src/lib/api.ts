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

interface NewsApiArticle {
  source: Source;
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string | null;
}

export interface NewsApiResponse {
  status: string;
  totalResults: number;
  articles: NewsApiArticle[];
}

const BASE_URL = "https://newsapi.org/v2";

// Dummy data for fallback
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

function mapNewsApiToArticle(newsApiArticle: NewsApiArticle): Article {
  return {
    title: newsApiArticle.title || "No Title",
    description: newsApiArticle.description || "",
    content: newsApiArticle.content || "",
    url: newsApiArticle.url,
    image: newsApiArticle.urlToImage || "https://images.unsplash.com/photo-1508921340878-ba53e1f016ec?auto=format&fit=crop&q=80",
    publishedAt: newsApiArticle.publishedAt,
    source: {
      id: newsApiArticle.source?.id,
      name: newsApiArticle.source?.name || "Unknown Source",
    }
  };
}

export async function fetchTopHeadlines(category: string = 'general', max: number = 6): Promise<Article[]> {
  // If "politics" is passed historically, just redirect to searchNews since top-headlines
  // doesn't support 'politics' as an official category.
  if (category === 'politics') {
    return searchNews(category, max);
  }

  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    console.warn("No NEWS_API_KEY found, using dummy data.");
    return dummyArticles.slice(0, max);
  }

  try {
    const randomPage = Math.floor(Math.random() * 3) + 1;
    const res = await fetch(`${BASE_URL}/top-headlines?category=${category}&language=en&pageSize=${max}&page=${randomPage}`, {
      headers: {
        'X-Api-Key': apiKey,
      },
      cache: 'no-store'
    });
    
    if (!res.ok) {
      console.warn(`API limit probably reached or error occurred (${res.status}). Returning dummy data.`);
      return dummyArticles.slice(0, max);
    }
    
    const data: NewsApiResponse = await res.json();
    return data.articles && data.articles.length > 0 
      ? data.articles.map(mapNewsApiToArticle) 
      : dummyArticles.slice(0, max);
  } catch (error) {
    console.error("Error fetching news:", error);
    return dummyArticles.slice(0, max);
  }
}

export async function searchNews(query: string, max: number = 6): Promise<Article[]> {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    console.warn("No NEWS_API_KEY found, using dummy data.");
    return dummyArticles.slice(0, max);
  }

  try {
    const randomPage = Math.floor(Math.random() * 5) + 1;
    const res = await fetch(`${BASE_URL}/everything?q=${encodeURIComponent(query)}&language=en&pageSize=${max}&sortBy=publishedAt&page=${randomPage}`, {
      headers: {
        'X-Api-Key': apiKey,
      },
      cache: 'no-store'
    });
    
    if (!res.ok) {
      console.warn(`API limit probably reached or error occurred (${res.status}). Returning dummy data.`);
      return dummyArticles.slice(0, max);
    }
    
    const data: NewsApiResponse = await res.json();
    return data.articles && data.articles.length > 0 
      ? data.articles.map(mapNewsApiToArticle) 
      : dummyArticles.slice(0, max);
  } catch (error) {
    console.error("Error fetching news:", error);
    return dummyArticles.slice(0, max);
  }
}
