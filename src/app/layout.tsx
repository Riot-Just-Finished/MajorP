import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import ThemeProvider from "@/components/ThemeProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NewsSummarisation AI",
  description: "Dynamic news app fetching real-time headlines with an immersive UI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} min-h-screen bg-black text-zinc-100 font-sans antialiased overflow-x-hidden selection:bg-red-500/30 selection:text-red-200`}>
        <ThemeProvider>
          {/* Background ambient effect */}
          <div className="fixed inset-0 z-[-1] bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-zinc-900 via-black to-black dark-bg" />
          <Header />
          <main className="pt-20 pb-16">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}

