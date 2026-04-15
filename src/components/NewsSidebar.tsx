import { Article } from "@/lib/api";
import NewsCard from "./NewsCard";

export default function NewsSidebar({ articles, title }: { articles: Article[], title: string }) {
  if (!articles || articles.length === 0) return null;

  return (
    <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 h-fit sticky top-24">
      <div className="flex items-center gap-2 mb-6">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <div className="h-px flex-1 bg-linear-to-r from-red-500/50 to-transparent ml-2"></div>
      </div>

      <div className="flex flex-col gap-6">
        {articles.map((article, idx) => (
          <div key={article.id || idx}>
            <NewsCard article={article} compact={true} />
            {idx < articles.length - 1 && (
              <div className="h-px w-full bg-white/5 mt-6"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
