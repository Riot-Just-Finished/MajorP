"use client";

import Link from "next/link";
import { Search, Menu, Sun, Moon } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTheme } from "./ThemeProvider";

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
  const { theme, toggleTheme } = useTheme();

  return (
    <header className={`fixed top-0 w-full z-50 backdrop-blur-md border-b transition-all duration-300 ${
      theme === "dark"
        ? "bg-black/60 border-white/10"
        : "bg-white/80 border-zinc-200"
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-4">
            <button className={`p-2 md:hidden ${theme === "dark" ? "text-zinc-300 hover:text-white" : "text-zinc-600 hover:text-black"}`}>
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
                      ? theme === "dark"
                        ? "bg-white/10 text-white"
                        : "bg-zinc-200 text-black"
                      : theme === "dark"
                        ? "text-zinc-400 hover:text-white hover:bg-white/5"
                        : "text-zinc-500 hover:text-black hover:bg-zinc-100"
                  }`}
                >
                  {category.name}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full transition-colors ${
                theme === "dark"
                  ? "text-zinc-300 hover:text-yellow-400 hover:bg-white/10"
                  : "text-zinc-600 hover:text-orange-500 hover:bg-zinc-100"
              }`}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <button className={`p-2 rounded-full transition-colors ${
              theme === "dark"
                ? "text-zinc-300 hover:text-white hover:bg-white/10"
                : "text-zinc-600 hover:text-black hover:bg-zinc-100"
            }`}>
              <Search size={20} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
