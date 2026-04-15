"use client";

import Link from "next/link";
import { Search, Menu } from "lucide-react";
import { usePathname } from "next/navigation";

const categories = [
  { name: "Home", path: "/" },
  { name: "Politics", path: "/category/politics" },
  { name: "World", path: "/category/world" },
  { name: "Tech", path: "/category/technology" },
  { name: "Business", path: "/category/business" },
  { name: "Entertainment", path: "/category/entertainment" },
  { name: "Sports", path: "/category/sports" },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 w-full z-50 bg-black/60 backdrop-blur-md border-b border-white/10 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-4">
            <button className="p-2 text-zinc-300 hover:text-white md:hidden">
              <Menu size={24} />
            </button>
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                NewsSummarisation AI
              </span>
            </Link>
          </div>

          <nav className="hidden md:flex space-x-1">
            {categories.map((category) => {
              const isActive = pathname === category.path;
              return (
                <Link
                  key={category.name}
                  href={category.path}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {category.name}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center">
            <button className="p-2 text-zinc-300 hover:text-white transition-colors rounded-full hover:bg-white/10">
              <Search size={20} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
