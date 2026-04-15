"use client";

import { useEffect, useState } from "react";

interface ArticleData {
  title: string;
  content: string;
  textContent: string;
  byline: string;
}

export default function ScrapedArticle({ url, fallbackTitle, fallbackDescription }: { url: string, fallbackTitle?: string, fallbackDescription?: string }) {
  const [data, setData] = useState<ArticleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) return;

    async function fetchArticle() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/article?url=${encodeURIComponent(url)}`);
        const json = await res.json();
        
        if (!res.ok || json.error) {
          throw new Error(json.error || "Failed to fetch article content");
        }
        
        setData(json);
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    }

    fetchArticle();
  }, [url]);

  if (!url) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-6 min-h-[40vh]">
        <div className="w-12 h-12 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin"></div>
        <p className="text-zinc-400 animate-pulse text-lg">Bypassing paywalls and extracting content...</p>
      </div>
    );
  }

  if (error || (data && !data.content)) {
    return (
      <div className="max-w-3xl mx-auto w-full pt-10 px-4">
        <h1 className="text-3xl font-bold mb-4">{data?.title || fallbackTitle || "Article"}</h1>
        <div className="bg-orange-500/10 border border-orange-500/20 text-orange-200 p-6 rounded-2xl mb-8">
          <p className="font-semibold mb-2 text-lg">Notice: Article Extraction Failed</p>
          <p className="text-sm opacity-80 mb-4">
            The target platform restricted automated reading (possibly due to a strict paywall, CAPTCHA, or inaccessible layout).
          </p>
        </div>
        
        {fallbackDescription && (
          <div className="article-content mt-6">
            <h2 className="text-zinc-500 uppercase text-xs font-bold tracking-widest mb-2">Summary</h2>
            <p className="text-xl text-zinc-300 border-l-4 border-white/20 pl-4">{fallbackDescription}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <article className="max-w-3xl mx-auto w-full pt-8 pb-32 px-4 sm:px-0">
      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-6 leading-tight text-white drop-shadow-sm">
        {data?.title || fallbackTitle}
      </h1>
      
      <div className="flex items-center justify-between border-b border-white/10 pb-6 mb-8">
        <div className="text-zinc-400 font-medium">
          {data?.byline ? `By ${data.byline}` : "Unknown Author"}
        </div>
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
        className="article-content text-zinc-300"
        dangerouslySetInnerHTML={{ __html: data?.content || "" }}
      />
    </article>
  );
}
