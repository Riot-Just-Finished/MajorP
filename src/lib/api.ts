export interface Source {
  id?: string;
  name: string;
  url: string;
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

export interface GNewsResponse {
  totalArticles: number;
  articles: Article[];
}

const API_KEY = "735a5e2d04a659898129b6cb3daaa6ef";
const BASE_URL = "https://gnews.io/api/v4";

// Dummy data for fallback
const dummyArticles: Article[] = [
  {
    title: "Global Tech Summit Unveils Next-Gen Artificial Intelligence",
    description: "Industry leaders gather to showcase breakthrough AI models promising to reshape the future of computing and everyday problem solving.",
    content: "Industry leaders gather to showcase breakthrough AI models promising to reshape the future of computing and everyday problem solving. The event saw participation from massive corporations...",
    url: "#",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80",
    publishedAt: new Date().toISOString(),
    source: { name: "Tech Daily", url: "#" }
  },
  {
    title: "Market Rally: Tech Stocks Surge Amid Positive Earnings",
    description: "Major tech companies beat Q3 earnings expectations, sending global markets on a rapid upwards trajectory.",
    content: "Major tech companies beat Q3 earnings expectations, sending global markets on a rapid upwards trajectory...",
    url: "#",
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80",
    publishedAt: new Date(Date.now() - 3600000).toISOString(),
    source: { name: "Financial Post", url: "#" }
  },
  {
    title: "Sustainable Architecture: The Rise of Green Skyscrapers",
    description: "Architects are increasingly turning to sustainable materials and vertical gardens to combat urban pollution.",
    content: "Architects are increasingly turning to sustainable materials and vertical gardens to combat urban pollution...",
    url: "#",
    image: "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&q=80",
    publishedAt: new Date(Date.now() - 7200000).toISOString(),
    source: { name: "Design World", url: "#" }
  },
  {
    title: "New Battery Technology Could Double EV Range",
    description: "Researchers developed a solid-state battery that promises to double the range of current electric vehicles.",
    content: "Researchers developed a solid-state battery that promises to double the range of current electric vehicles...",
    url: "#",
    image: "https://images.unsplash.com/photo-1593941707882-a5bba14938cb?auto=format&fit=crop&q=80",
    publishedAt: new Date(Date.now() - 10800000).toISOString(),
    source: { name: "Auto Future", url: "#" }
  },
  {
    title: "Exploring the Deep Ocean: New Species Discovered",
    description: "A recent expedition to the Mariana Trench has uncovered several previously unknown species of marine life.",
    content: "A recent expedition to the Mariana Trench has uncovered several previously unknown species of marine life...",
    url: "#",
    image: "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?auto=format&fit=crop&q=80",
    publishedAt: new Date(Date.now() - 14400000).toISOString(),
    source: { name: "Science Now", url: "#" }
  },
  {
    title: "Global Coffee Shortage Driven By Extreme Climate",
    description: "Coffee farmers report massive yield reductions as unpredictable weather patterns negatively impact growth.",
    content: "Coffee farmers report massive yield reductions as unpredictable weather patterns negatively impact growth...",
    url: "#",
    image: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80",
    publishedAt: new Date(Date.now() - 18000000).toISOString(),
    source: { name: "Global News", url: "#" }
  }
];

export async function fetchTopHeadlines(category: string = 'general', max: number = 6): Promise<Article[]> {
  try {
    const res = await fetch(`${BASE_URL}/top-headlines?category=${category}&lang=en&max=${max}&apikey=${API_KEY}`, {
      next: { revalidate: 3600 } // Revalidate every hour
    });
    
    if (!res.ok) {
      console.warn("API limit probably reached or error occurred. Returning dummy data.");
      return dummyArticles.slice(0, max);
    }
    
    const data: GNewsResponse = await res.json();
    return data.articles.length > 0 ? data.articles : dummyArticles.slice(0, max);
  } catch (error) {
    console.error("Error fetching news:", error);
    return dummyArticles.slice(0, max);
  }
}

export async function searchNews(query: string, max: number = 6): Promise<Article[]> {
  try {
    const res = await fetch(`${BASE_URL}/search?q=${encodeURIComponent(query)}&lang=en&max=${max}&apikey=${API_KEY}`, {
      next: { revalidate: 3600 }
    });
    
    if (!res.ok) {
      console.warn("API limit probably reached or error occurred. Returning dummy data.");
      return dummyArticles.slice(0, max);
    }
    
    const data: GNewsResponse = await res.json();
    return data.articles.length > 0 ? data.articles : dummyArticles.slice(0, max);
  } catch (error) {
    console.error("Error fetching news:", error);
    return dummyArticles.slice(0, max);
  }
}
