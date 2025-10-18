import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";
import { Header } from "@/components/layout/header";
import { validateEnv } from "@/lib/env-validation";

// Validate environment variables on server startup
validateEnv();

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Movie Release Tracker",
  description: "Never miss a movie release again. Get notified when your favorite movies are available in theaters or for streaming.",
  keywords: ["movies", "releases", "notifications", "theater", "streaming"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen bg-background">
            <Header />
            <main className="container mx-auto px-4 py-6">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
