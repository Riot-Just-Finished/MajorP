"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import ScrapedArticle from "@/components/ScrapedArticle";

function ArticlePageContent() {
  const searchParams = useSearchParams();
  const url = searchParams.get("url");

  if (!url) {
    return (
      <div className="flex h-screen items-center justify-center text-zinc-500">
        No article URL provided.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12">
      <ScrapedArticle url={url} />
    </div>
  );
}

export default function ArticlePage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin"></div>
      </div>
    }>
      <ArticlePageContent />
    </Suspense>
  );
}
