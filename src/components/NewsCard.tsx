import Link from "next/link";
import Image from "next/image";
import { Article } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";

export default function NewsCard({ article, compact = false }: { article: Article, compact?: boolean }) {
  // Use a default image if article.image is missing, or not a string. Some APIs return null.
  const imageUrl = article.image || "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=60";

  let timeAgo = "recently";
  try {
    timeAgo = formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true });
  } catch (e) {
    // ignore invalid dates
  }

  return (
    <a href={article.url} target="_blank" rel="noopener noreferrer" className="block group">
      <div className="flex flex-col gap-3">
        <div className={`overflow-hidden rounded-xl relative ${compact ? 'aspect-[4/3]' : 'aspect-video'}`}>
          <img
            src={imageUrl}
            alt={article.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs font-semibold text-red-500 uppercase tracking-wider">
            <span>{article.source.name}</span>
            <span className="text-zinc-500 normal-case">{timeAgo}</span>
          </div>
          <h3 className={`font-bold text-zinc-100 group-hover:text-white transition-colors line-clamp-2 ${compact ? 'text-sm' : 'text-lg'}`}>
            {article.title}
          </h3>
          {!compact && (
            <p className="text-sm text-zinc-400 line-clamp-3 mt-1">
              {article.description}
            </p>
          )}
        </div>
      </div>
    </a>
  );
}
