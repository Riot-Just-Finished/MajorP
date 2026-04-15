import { Article } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";

export default function HeroSection({ article }: { article: Article }) {
  if (!article) return null;

  const imageUrl = article.image || "https://images.unsplash.com/photo-1508921340878-ba53e1f016ec?auto=format&fit=crop&q=80";
  let timeAgo = "recently";
  try {
    timeAgo = formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true });
  } catch (e) { }

  return (
    <a href={article.url} target="_blank" rel="noopener noreferrer" className="relative block group rounded-3xl overflow-hidden aspect-[16/9] sm:aspect-[21/9]">
      <div className="absolute inset-0 bg-zinc-900">
        <img
          src={imageUrl}
          alt={article.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </div>

      {/* Gradient overlay to make text readable */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-12">
        <div className="max-w-3xl transform transition-transform duration-500 translate-y-4 group-hover:translate-y-0">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-red-600 text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-lg shadow-red-500/30">
              Top Headline
            </span>
            <span className="text-zinc-300 text-sm font-medium">
              {timeAgo} • {article.source.name}
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-4 drop-shadow-lg">
            {article.title}
          </h1>

          <p className="text-zinc-300 text-base sm:text-lg max-w-2xl line-clamp-2 md:line-clamp-3 mb-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
            {article.description}
          </p>
        </div>
      </div>
    </a>
  );
}
