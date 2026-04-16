"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface ArticleData {
  title: string;
  content: string;
  textContent: string;
  byline: string;
}

export default function ScrapedArticle({ url, fallbackTitle, fallbackDescription }: { url: string, fallbackTitle?: string, fallbackDescription?: string }) {
  const router = useRouter();
  const [data, setData] = useState<ArticleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // AI States
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [aiFeedback, setAiFeedback] = useState<{ type: string, content: string } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) return;

    async function fetchArticle() {
      setLoading(true);
      setError(null);
      setAiFeedback(null);
      setAiError(null);
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

  async function handleAIAction(action: "political_stance" | "summarise" | "change_tone") {
    if (!data?.textContent) return;

    setAiLoading(action);
    setAiError(null);

    // If change_tone, clear existing feedback panel since we inject directly into body
    if (action === "change_tone") {
      setAiFeedback(null);
    }

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          articleText: data.textContent,
          title: data.title || fallbackTitle
        })
      });

      const responseData = await res.json();

      if (!res.ok || responseData.error) {
        throw new Error(responseData.error || "AI processing failed");
      }

      if (action === "change_tone") {
        // Replace the main HTML content
        setData(prev => prev ? { ...prev, content: responseData.result } : prev);
      } else {
        // Show inside floating insight box
        setAiFeedback({ type: action, content: responseData.result });
      }

    } catch (err: any) {
      console.error(err);
      setAiError(err.message || "Failed to connect to AI engine.");
    } finally {
      setAiLoading(null);
    }
  }

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
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => handleAIAction("political_stance")}
          disabled={aiLoading !== null}
          className="flex-1 sm:flex-none px-6 py-2.5 bg-gradient-to-r from-blue-600/20 to-blue-500/10 hover:from-blue-600/40 hover:to-blue-500/20 border border-blue-500/30 rounded-xl text-blue-200 text-sm font-semibold tracking-wide transition-all duration-300 shadow-[0_0_15px_rgba(59,130,246,0.1)] hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2">
          {aiLoading === "political_stance" && <div className="w-4 h-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />}
          Political Side
        </button>
        <button
          onClick={() => handleAIAction("summarise")}
          disabled={aiLoading !== null}
          className="flex-1 sm:flex-none px-6 py-2.5 bg-gradient-to-r from-emerald-600/20 to-emerald-500/10 hover:from-emerald-600/40 hover:to-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-200 text-sm font-semibold tracking-wide transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2">
          {aiLoading === "summarise" && <div className="w-4 h-4 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />}
          Summarise
        </button>
        <button
          onClick={() => handleAIAction("change_tone")}
          disabled={aiLoading !== null}
          className="flex-1 sm:flex-none px-6 py-2.5 bg-gradient-to-r from-purple-600/20 to-purple-500/10 hover:from-purple-600/40 hover:to-purple-500/20 border border-purple-500/30 rounded-xl text-purple-200 text-sm font-semibold tracking-wide transition-all duration-300 shadow-[0_0_15px_rgba(168,85,247,0.1)] hover:shadow-[0_0_20px_rgba(168,85,247,0.2)] hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2">
          {aiLoading === "change_tone" && <div className="w-4 h-4 rounded-full border-2 border-purple-400 border-t-transparent animate-spin" />}
          Change Tone
        </button>
        <button
          onClick={() => {
            sessionStorage.setItem("chatbot_article_title", data?.title || fallbackTitle || "");
            sessionStorage.setItem("chatbot_article_text", data?.textContent || fallbackDescription || "");
            router.push("/chatbot");
          }}
          disabled={aiLoading !== null}
          className="flex-1 sm:flex-none px-6 py-2.5 bg-gradient-to-r from-violet-600/20 to-indigo-500/10 hover:from-violet-600/40 hover:to-indigo-500/20 border border-violet-500/30 rounded-xl text-violet-200 text-sm font-semibold tracking-wide transition-all duration-300 shadow-[0_0_15px_rgba(139,92,246,0.1)] hover:shadow-[0_0_20px_rgba(139,92,246,0.2)] hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
          Talk to Chatbot
        </button>
      </div>

      {aiError && (
        <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          {aiError}
        </div>
      )}

      {aiFeedback && (
        <div className={`mb-10 p-6 rounded-2xl border backdrop-blur-sm ${aiFeedback.type === 'political_stance'
            ? 'bg-blue-500/5 border-blue-500/20'
            : 'bg-emerald-500/5 border-emerald-500/20'
          }`}>
          <h3 className={`text-xs uppercase tracking-widest font-bold mb-4 ${aiFeedback.type === 'political_stance' ? 'text-blue-400' : 'text-emerald-400'
            }`}>
            AI {aiFeedback.type === 'political_stance' ? 'Political Analysis' : 'Generated Summary'}
          </h3>
          <div className="text-zinc-200 leading-relaxed whitespace-pre-wrap">
            {aiFeedback.content}
          </div>
        </div>
      )}

      <div
        className="article-content text-zinc-300"
        dangerouslySetInnerHTML={{ __html: data?.content || "" }}
      />
    </article>
  );
}
