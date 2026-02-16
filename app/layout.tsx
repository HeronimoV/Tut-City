import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "Tut City 🏙️📐 — Your Geometry BFF",
  description: "Upload a photo of any geometry problem and get step-by-step solutions with explanations. Made for students, by students.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 antialiased">
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
