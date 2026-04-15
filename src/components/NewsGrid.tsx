import { Article } from "@/lib/api";
import NewsCard from "./NewsCard";

export default function NewsGrid({ articles, title }: { articles: Article[], title: string }) {
  if (!articles || articles.length === 0) return null;

  return (
    <section>
      <div className="flex items-center gap-2 mb-6">
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        <div className="h-px flex-1 bg-white/10 ml-4"></div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-10">
        {articles.map((article, idx) => (
          <NewsCard key={article.id || idx} article={article} />
        ))}
      </div>
    </section>
  );
}
