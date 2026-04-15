import { fetchTopHeadlines } from "@/lib/api";
import NewsGrid from "@/components/NewsGrid";
import HeroSection from "@/components/HeroSection";

export const revalidate = 60;

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  
  const articles = await fetchTopHeadlines(slug, 12);
  const title = slug.charAt(0).toUpperCase() + slug.slice(1) + " News";

  if (!articles || articles.length === 0) {
    return (
      <div className="flex flex-col h-[60vh] items-center justify-center space-y-4">
        <h1 className="text-3xl font-bold text-white">{title}</h1>
        <p className="text-zinc-400">No articles available for this category right now.</p>
      </div>
    );
  }

  const heroArticle = articles[0];
  const gridArticles = articles.slice(1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 lg:mt-10 space-y-12">
      <div>
        <h1 className="text-4xl lg:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 mb-8 inline-block drop-shadow-md">
          {title}
        </h1>
        <HeroSection article={heroArticle} />
      </div>

      <div className="mt-12">
        <NewsGrid articles={gridArticles} title={`More in ${title}`} />
      </div>
    </div>
  );
}
