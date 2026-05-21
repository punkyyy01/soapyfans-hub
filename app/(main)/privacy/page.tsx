import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How SoapyFans Hub collects, uses, and protects your data.",
}

const cls = {
  h2: "font-display text-xl font-semibold text-[var(--text-primary)] mb-4",
  h3: "mt-6 mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]",
  p: "text-sm text-[var(--text-secondary)] leading-relaxed",
  ul: "mt-3 list-disc pl-5 space-y-1.5",
  li: "text-sm text-[var(--text-secondary)] leading-relaxed",
  a: "text-[var(--accent-gold)] underline-offset-2 hover:underline",
  strong: "font-semibold text-[var(--text-primary)]",
  code: "font-mono text-xs bg-[var(--bg-elevated)] border border-[var(--border-subtle)] px-1.5 py-0.5 rounded",
  section: "border-t border-[var(--border-subtle)] pt-8 mt-8",
}

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-[700px] px-6 pt-24 pb-24 sm:pt-28">
      <header className="mb-10">
        <h1 className="font-display text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-3 text-sm text-[var(--text-secondary)]">
          <strong className={cls.strong}>SoapyFans Hub</strong> — soapyhub.fans
        </p>
        <p className="mt-1 text-[0.7rem] uppercase tracking-[0.2em] text-[var(--text-muted)]">
          Last updated: May 2026
        </p>
      </header>

      <section>
        <h2 className={cls.h2}>Who We Are</h2>
        <p className={cls.p}>
          SoapyFans Hub is an unofficial, fan-made archive dedicated to the filmography, music, and
          work of actress Sophie Thatcher. This site is not affiliated with, endorsed by, or
          connected to Sophie Thatcher or her representatives in any way.
        </p>
        <p className={`${cls.p} mt-3`}>
          This site is operated by an individual fan. Contact:{" "}
          <a href="mailto:contacto.frambuesa.proyecto@gmail.com" className={cls.a}>
            contacto.frambuesa.proyecto@gmail.com
          </a>
        </p>
      </section>

      <section className={cls.section}>
        <h2 className={cls.h2}>What Data We Collect</h2>

        <h3 className={cls.h3}>Data you provide directly</h3>
        <ul className={cls.ul}>
          <li className={cls.li}>
            <strong className={cls.strong}>Email address</strong> — if you register with email and
            password
          </li>
          <li className={cls.li}>
            <strong className={cls.strong}>Display name, username, and bio</strong> — set by you in
            your profile
          </li>
          <li className={cls.li}>
            <strong className={cls.strong}>Avatar image</strong> — uploaded by you (optional)
          </li>
          <li className={cls.li}>
            <strong className={cls.strong}>Review content</strong> — text and star ratings you
            submit for films and music releases
          </li>
        </ul>

        <h3 className={cls.h3}>Data collected automatically via third-party services</h3>

        <div className="mt-4 space-y-4">
          <p className={cls.p}>
            <strong className={cls.strong}>Supabase (database and authentication)</strong>
            {" "}Your email address, hashed password (never stored in plain text), and session tokens
            are managed by Supabase. When you sign in with Discord, Supabase receives your Discord
            username, avatar URL, and email from Discord's OAuth flow. Supabase is
            GDPR-compliant.{" "}
            <a
              href="https://supabase.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className={cls.a}
            >
              Supabase Privacy Policy
            </a>
          </p>
          <p className={cls.p}>
            <strong className={cls.strong}>Discord OAuth</strong>
            {" "}If you choose "Continue with Discord," Discord shares your username, avatar, and
            email with us. We only use this to create your account. We do not access your Discord
            messages, servers, or any other Discord data.{" "}
            <a
              href="https://discord.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className={cls.a}
            >
              Discord Privacy Policy
            </a>
          </p>
          <p className={cls.p}>
            <strong className={cls.strong}>Vercel Analytics</strong>
            {" "}This site uses Vercel Analytics to understand general traffic patterns (page views,
            referrers, geographic region). Vercel Analytics is privacy-focused and does not use
            cookies or store personal identifiers. It collects anonymized data including approximate
            location derived from IP address. IP addresses are not stored.{" "}
            <a
              href="https://vercel.com/legal/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className={cls.a}
            >
              Vercel Privacy Policy
            </a>
          </p>
          <p className={cls.p}>
            <strong className={cls.strong}>YouTube (embedded videos)</strong>
            {" "}Some music pages embed YouTube videos using{" "}
            <code className={cls.code}>youtube-nocookie.com</code>. This domain does not set
            tracking cookies unless you interact with the video. If you play a video, YouTube's own
            privacy policy applies.{" "}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className={cls.a}
            >
              YouTube Privacy Policy
            </a>
          </p>
          <p className={cls.p}>
            <strong className={cls.strong}>TMDB API</strong>
            {" "}Film and TV data is sourced from The Movie Database (TMDB) API. We do not share any
            user data with TMDB. This product uses the TMDB API but is not endorsed or certified by
            TMDB.
          </p>
        </div>
      </section>

      <section className={cls.section}>
        <h2 className={cls.h2}>How We Use Your Data</h2>
        <ul className={cls.ul}>
          <li className={cls.li}>To create and manage your account</li>
          <li className={cls.li}>
            To display your username and reviews publicly on the site
          </li>
          <li className={cls.li}>To allow you to edit or delete your own content</li>
          <li className={cls.li}>
            To understand how the site is used (via Vercel Analytics)
          </li>
        </ul>
        <p className={`${cls.p} mt-4`}>
          We do not sell your data. We do not use your data for advertising. We do not share your
          data with third parties except as described above (Supabase, Discord, Vercel — all
          necessary to operate the site).
        </p>
      </section>

      <section className={cls.section}>
        <h2 className={cls.h2}>Data Retention</h2>
        <ul className={cls.ul}>
          <li className={cls.li}>
            Your account data is retained as long as your account exists
          </li>
          <li className={cls.li}>
            Deleted reviews are soft-deleted (marked as deleted but not immediately removed from our
            database) to preserve data integrity
          </li>
          <li className={cls.li}>
            You may request full deletion of your account and associated data at any time by emailing{" "}
            <a href="mailto:contacto.frambuesa.proyecto@gmail.com" className={cls.a}>
              contacto.frambuesa.proyecto@gmail.com
            </a>
          </li>
        </ul>
      </section>

      <section className={cls.section}>
        <h2 className={cls.h2}>Your Rights</h2>
        <p className={cls.p}>
          Depending on your location, you may have the right to:
        </p>
        <ul className={cls.ul}>
          <li className={cls.li}>Access the personal data we hold about you</li>
          <li className={cls.li}>Request correction of inaccurate data</li>
          <li className={cls.li}>Request deletion of your data</li>
          <li className={cls.li}>Object to processing of your data</li>
        </ul>
        <p className={`${cls.p} mt-4`}>
          To exercise any of these rights, contact us at{" "}
          <a href="mailto:contacto.frambuesa.proyecto@gmail.com" className={cls.a}>
            contacto.frambuesa.proyecto@gmail.com
          </a>
          . We will respond within 30 days.
        </p>
      </section>

      <section className={cls.section}>
        <h2 className={cls.h2}>Cookies</h2>
        <p className={cls.p}>
          This site does not use tracking cookies. Supabase sets a session cookie to keep you logged
          in. This cookie is strictly necessary for the site to function and does not track you
          across other websites.
        </p>
      </section>

      <section className={cls.section}>
        <h2 className={cls.h2}>Changes to This Policy</h2>
        <p className={cls.p}>
          We may update this policy as the site evolves. The "Last updated" date at the top reflects
          the most recent revision. Continued use of the site after changes constitutes acceptance of
          the updated policy.
        </p>
      </section>

      <section className={cls.section}>
        <h2 className={cls.h2}>Contact</h2>
        <p className={cls.p}>
          For privacy-related requests:{" "}
          <a href="mailto:contacto.frambuesa.proyecto@gmail.com" className={cls.a}>
            contacto.frambuesa.proyecto@gmail.com
          </a>
        </p>
      </section>

      <div className="mt-12 border-t border-[var(--border-subtle)] pt-6 flex gap-6 text-[0.7rem] uppercase tracking-[0.2em] text-[var(--text-muted)]">
        <Link href="/terms" className="hover:text-[var(--accent-gold)] transition-colors">
          Terms of Service
        </Link>
        <Link href="/contact" className="hover:text-[var(--accent-gold)] transition-colors">
          Copyright &amp; Contact
        </Link>
      </div>
    </main>
  )
}
