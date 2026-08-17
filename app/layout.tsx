import type { Metadata } from "next";
import { DM_Sans, Geist_Mono, Playfair_Display } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import Navbar from "@/components/ui/Navbar";
import Footer, { FooterFallback } from "@/components/ui/Footer";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_OG_IMAGE,
  absoluteUrl,
  getSiteUrl,
} from "@/utils/site";
import { buildOrganizationSchema, serializeJsonLd } from "@/utils/schema";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  creator: SITE_NAME,
  publisher: SITE_NAME,
  keywords: [
    "SoapyFans Hub",
    "SoapyFans",
    "Sophie Thatcher",
    "Sophie Thatcher filmography",
    "Sophie Thatcher reviews",
    "Sophie Thatcher fan site",
    "Yellowjackets",
    "Heretic",
    "Companion",
    "fan archive",
    "film reviews",
    "tv credits",
    "music releases",
  ],
  alternates: {
    languages: {
      "en": "/",
    },
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    url: siteUrl,
    locale: "en_US",
    images: [
      {
        url: absoluteUrl(SITE_OG_IMAGE),
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — ${SITE_TAGLINE}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    images: [absoluteUrl(SITE_OG_IMAGE)],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  category: "entertainment",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${dmSans.variable} ${geistMono.variable} ${playfair.variable} antialiased`}
      >
        <div className="flex min-h-screen flex-col">
          <Suspense fallback={<nav className="fixed inset-x-0 top-0 z-50 h-[73px] border-b border-[var(--border-subtle)] bg-[rgba(8,7,4,0.75)] backdrop-blur-md" />}>
            <Navbar />
          </Suspense>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: serializeJsonLd(buildOrganizationSchema()) }}
          />
          <div className="flex-1">{children}</div>
          <Suspense fallback={<FooterFallback />}>
            <Footer />
          </Suspense>
          <Analytics />
        </div>
      </body>
    </html>
  );
}
