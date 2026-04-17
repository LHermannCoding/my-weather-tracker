import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Navigation } from "@/components/Navigation";
import "./globals.css";

export const metadata: Metadata = {
  title: "Weather Dashboard",
  description: "Real-time weather monitoring for your favorite cities",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="bg-gray-950 text-gray-100 min-h-screen">
          <Navigation />
          <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}
