import type { Metadata } from "next";
import { DM_Sans, Geist_Mono, Playfair_Display } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";
import { headers } from "next/headers";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import Navbar from "./components/Navbar";
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
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const nonce = (await headers()).get('x-nonce') ?? undefined
  const year = new Date().getFullYear();

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
            nonce={nonce}
            dangerouslySetInnerHTML={{ __html: serializeJsonLd(buildOrganizationSchema()) }}
          />
          <div className="flex-1">{children}</div>
          <footer className="relative border-t border-[var(--border-subtle)] bg-[var(--bg-base)]">
            <div className="mx-auto max-w-7xl px-6 py-10 sm:px-10 sm:py-12">
              <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
                <div className="max-w-xl">
                  <p className="font-display text-lg font-semibold tracking-tight text-[var(--text-primary)]">
                    SoapyFans <span className="italic text-[var(--accent-amber)]">Hub</span>
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)] text-pretty">
                    A fan-made home base for filmography, reviews, and the little details we keep coming back to.
                  </p>
                  <p className="mt-4 text-[0.7rem] uppercase tracking-[0.32em] text-[var(--text-muted)]">
                    Built by fans · Not official · {year}
                  </p>
                </div>

                <nav className="flex flex-wrap items-center gap-x-7 gap-y-3 text-[0.72rem] uppercase tracking-[0.28em] text-[var(--text-secondary)]">
                  <Link href="/" className="transition-colors hover:text-[var(--accent-gold)]">
                    Home
                  </Link>
                  <Link href="/films" className="transition-colors hover:text-[var(--accent-gold)]">
                    Filmography
                  </Link>
                  <Link href="/music" className="transition-colors hover:text-[var(--accent-gold)]">
                    Music
                  </Link>
                  <Link href="/login" className="transition-colors hover:text-[var(--accent-gold)]">
                    Sign in
                  </Link>
                </nav>
              </div>

              <div className="mt-8 h-px w-full bg-gradient-to-r from-transparent via-[var(--border-strong)] to-transparent" />

              <div className="mt-6 flex flex-col gap-3 text-xs leading-relaxed text-[var(--text-muted)] sm:flex-row sm:items-center sm:justify-between">
                <p>
                  Uses the TMDB API, but is not endorsed or certified by TMDB.
                </p>
                <a
                  href="https://ko-fi.com/punkyyyy"
                  target="_blank"
                  rel="noreferrer noopener sponsored"
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] px-4 py-2 text-[0.68rem] uppercase tracking-[0.32em] text-[var(--text-secondary)] transition-colors hover:border-[var(--accent-gold)] hover:text-[var(--accent-gold)]"
                  aria-label="Support this archive on Ko-fi"
                >
                  Support this archive · Ko-fi
                </a>
                <p className="text-[0.7rem] uppercase tracking-[0.28em]">
                  © {year} SoapyFans Hub
                </p>
              </div>

              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[0.68rem] text-[var(--text-muted)]">
                <Link href="/privacy" className="transition-colors hover:text-[var(--accent-gold)]">
                  Privacy Policy
                </Link>
                <span aria-hidden>·</span>
                <Link href="/terms" className="transition-colors hover:text-[var(--accent-gold)]">
                  Terms of Service
                </Link>
                <span aria-hidden>·</span>
                <Link href="/contact" className="transition-colors hover:text-[var(--accent-gold)]">
                  Copyright &amp; Contact
                </Link>
              </div>
            </div>
          </footer>
          <Analytics />
        </div>
      </body>
    </html>
  );
}
