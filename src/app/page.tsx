import { searchNews } from "@/lib/api";
import HeroSection from "@/components/HeroSection";
import NewsGrid from "@/components/NewsGrid";
import NewsSidebar from "@/components/NewsSidebar";

// Force Next.js to revalidate this page frequently (e.g., every 60 seconds)
export const revalidate = 60;

export default async function Home() {
  const articles = await searchNews('politics', 10);
  const trendingArticles = await searchNews('global politics', 4);

  if (!articles || articles.length === 0) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-zinc-400">
        No articles available at the moment.
      </div>
    );
  }

  const heroArticle = articles[0];
  const gridArticles = articles.slice(1, 7);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 lg:mt-10 space-y-12">
      {/* Hero Section */}
      <HeroSection article={heroArticle} />

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          <NewsGrid articles={gridArticles} title="Top Political Stories" />
        </div>
        
        <div className="lg:col-span-1">
          <NewsSidebar articles={trendingArticles} title="Trending Globally" />
        </div>
      </div>
    </div>
  );
}
