import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Tut City 🏙️📐 — Your Math BFF",
  description: "Upload a photo of any math problem and get step-by-step solutions with explanations. Grades 1-12. All subjects. One app.",
  openGraph: {
    title: "Tut City — Your Math BFF 🏙️📐",
    description: "Snap a photo of any math problem. Get step-by-step help that actually makes sense. Grades 1-12.",
    type: "website",
    url: "https://tutcity.com",
    siteName: "Tut City",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tut City — Your Math BFF 🏙️📐",
    description: "Snap a photo of any math problem. Get step-by-step help that actually makes sense.",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-17958412853"
          strategy="afterInteractive"
        />
        <Script id="google-ads" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-17958412853');
          `}
        </Script>
      </head>
      <body className="min-h-screen bg-gray-50 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
