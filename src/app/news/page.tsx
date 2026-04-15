"use client";

import { useEffect, useState } from "react";

interface Headline {
  title: string;
  url: string;
  source?: { name: string };
  description?: string;
  publishedAt?: string;
}

interface ArticleData {
  title: string;
  content: string;
  textContent: string;
  byline: string;
}

export default function NewsReaderPage() {
  const [headlines, setHeadlines] = useState<Headline[]>([]);
  const [loadingHeadlines, setLoadingHeadlines] = useState(true);
  const [headlinesError, setHeadlinesError] = useState("");

  const [activeArticleData, setActiveArticleData] = useState<ArticleData | null>(null);
  const [activeHeadline, setActiveHeadline] = useState<Headline | null>(null);
  const [loadingArticle, setLoadingArticle] = useState(false);
  const [articleError, setArticleError] = useState("");

  useEffect(() => {
    async function fetchHeadlines() {
      try {
        const res = await fetch("/api/news");
        if (!res.ok) throw new Error("Failed to load headlines.");
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setHeadlines(data);
      } catch (err: any) {
        setHeadlinesError(err.message || "An error occurred");
      } finally {
        setLoadingHeadlines(false);
      }
    }
    fetchHeadlines();
  }, []);

  async function handleArticleClick(headline: Headline) {
    if (!headline.url) return;
    setActiveHeadline(headline);
    setLoadingArticle(true);
    setArticleError("");
    setActiveArticleData(null);

    try {
      const res = await fetch(`/api/article?url=${encodeURIComponent(headline.url)}`);
      if (!res.ok) {
        throw new Error("Unable to fetch article content.");
      }
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setActiveArticleData(data);
    } catch (err: any) {
      setArticleError(err.message || "Failed to load article");
    } finally {
      setLoadingArticle(false);
    }
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-black text-white pt-24 px-4 sm:px-6 lg:px-8 gap-6 max-w-screen-2xl mx-auto">
      {/* Sidebar: Headlines */}
      <aside className="w-full md:w-1/3 lg:w-1/4 flex flex-col border-r border-white/10 pr-4 overflow-y-auto max-h-[calc(100vh-100px)] custom-scrollbar">
        <h2 className="text-2xl font-bold mb-6 text-red-500">Latest Headlines</h2>

        {loadingHeadlines && <div className="animate-pulse flex flex-col gap-4">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 bg-white/5 rounded-xl"></div>)}
        </div>}

        {headlinesError && <div className="text-red-400 text-sm bg-red-400/10 p-4 rounded-lg">{headlinesError}</div>}

        {!loadingHeadlines && !headlinesError && headlines.length === 0 && (
          <div className="text-zinc-500">No headlines available.</div>
        )}

        <div className="flex flex-col gap-4">
          {headlines.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleArticleClick(item)}
              className={`text-left p-4 rounded-xl transition-all duration-200 border ${activeHeadline?.url === item.url
                  ? "bg-white/10 border-red-500/50"
                  : "bg-transparent border-transparent hover:bg-white/5"
                }`}
            >
              <div className="text-xs text-red-400 font-semibold mb-1 uppercase tracking-wider">
                {item.source?.name || "News"}
              </div>
              <h3 className="text-sm font-medium line-clamp-3 text-zinc-200">{item.title}</h3>
            </button>
          ))}
        </div>
      </aside>

      {/* Main Panel: Reading Area */}
      <main className="w-full md:w-2/3 lg:w-3/4 flex flex-col pl-2 md:pl-4 overflow-y-auto max-h-[calc(100vh-100px)]">
        {!loadingArticle && !activeHeadline && !activeArticleData && (
          <div className="flex-1 flex items-center justify-center text-zinc-500">
            Select an article from the sidebar to start reading.
          </div>
        )}

        {loadingArticle && (
          <div className="flex flex-col items-center justify-center flex-1 space-y-6">
            <div className="w-10 h-10 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin"></div>
            <p className="text-zinc-400 animate-pulse">Bypassing paywalls and extracting content...</p>
          </div>
        )}

        {!loadingArticle && (articleError || (activeArticleData && !activeArticleData.content)) && activeHeadline && (
          <div className="max-w-3xl mx-auto w-full pt-10">
            <h1 className="text-3xl font-bold mb-4">{activeHeadline.title}</h1>
            <div className="bg-orange-500/10 border border-orange-500/20 text-orange-200 p-6 rounded-2xl mb-8">
              <p className="font-semibold mb-2">Notice: Article Extraction Failed</p>
              <p className="text-sm opacity-80 mb-4">
                The targeted publishing platform restricted automated reading (likely due to a strict paywall, CAPTCHA, or incompatible script-driven layout).
              </p>
            </div>
            {/* Fallback to description from the headlines feed */}
            {activeHeadline.description && (
              <div className="article-content">
                <p className="text-xl text-zinc-300 border-l-4 border-white/20 pl-4">{activeHeadline.description}</p>
              </div>
            )}
          </div>
        )}

        {!loadingArticle && activeArticleData && activeArticleData.content && (
          <article className="max-w-3xl mx-auto w-full pt-8 pb-32">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-6 leading-tight">
              {activeArticleData.title || activeHeadline?.title}
            </h1>

            <div className="flex items-center justify-between border-b border-white/10 pb-6 mb-8">
              {activeArticleData.byline && (
                <div className="text-zinc-400 font-medium">By {activeArticleData.byline}</div>
              )}
            </div>

            {/* AI Action Buttons */}
            <div className="flex flex-wrap gap-3 mb-10">
              <button className="flex-1 sm:flex-none px-6 py-2.5 bg-gradient-to-r from-blue-600/20 to-blue-500/10 hover:from-blue-600/40 hover:to-blue-500/20 border border-blue-500/30 rounded-xl text-blue-200 text-sm font-semibold tracking-wide transition-all duration-300 shadow-[0_0_15px_rgba(59,130,246,0.1)] hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] hover:-translate-y-0.5">
                Political Side
              </button>
              <button className="flex-1 sm:flex-none px-6 py-2.5 bg-gradient-to-r from-emerald-600/20 to-emerald-500/10 hover:from-emerald-600/40 hover:to-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-200 text-sm font-semibold tracking-wide transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:-translate-y-0.5">
                Summarise
              </button>
              <button className="flex-1 sm:flex-none px-6 py-2.5 bg-gradient-to-r from-purple-600/20 to-purple-500/10 hover:from-purple-600/40 hover:to-purple-500/20 border border-purple-500/30 rounded-xl text-purple-200 text-sm font-semibold tracking-wide transition-all duration-300 shadow-[0_0_15px_rgba(168,85,247,0.1)] hover:shadow-[0_0_20px_rgba(168,85,247,0.2)] hover:-translate-y-0.5">
                Change Tone
              </button>
            </div>

            <div
              className="article-content"
              dangerouslySetInnerHTML={{ __html: activeArticleData.content }}
            />
          </article>
        )}
      </main>
    </div>
  );
}
