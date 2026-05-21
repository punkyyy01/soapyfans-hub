import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Copyright & Contact",
  description: "Copyright policy, DMCA takedown process, and general contact for SoapyFans Hub.",
}

const cls = {
  h2: "font-display text-xl font-semibold text-[var(--text-primary)] mb-4",
  h3: "mt-6 mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]",
  p: "text-sm text-[var(--text-secondary)] leading-relaxed",
  ul: "mt-3 list-disc pl-5 space-y-1.5",
  li: "text-sm text-[var(--text-secondary)] leading-relaxed",
  a: "text-[var(--accent-gold)] underline-offset-2 hover:underline",
  strong: "font-semibold text-[var(--text-primary)]",
  section: "border-t border-[var(--border-subtle)] pt-8 mt-8",
}

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-[700px] px-6 pt-24 pb-24 sm:pt-28">
      <header className="mb-10">
        <h1 className="font-display text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">
          Copyright &amp; Contact
        </h1>
        <p className="mt-3 text-sm text-[var(--text-secondary)]">
          <strong className={cls.strong}>SoapyFans Hub</strong> — soapyhub.fans
        </p>
      </header>

      <section>
        <h2 className={cls.h2}>Copyright Policy</h2>
        <p className={cls.p}>
          SoapyFans Hub is an unofficial fan archive. We respect intellectual property rights and
          take copyright concerns seriously.
        </p>

        <h3 className={cls.h3}>Film and TV data</h3>
        <p className={cls.p}>
          All film and television data is sourced from The Movie Database (TMDB) API. This product
          uses the TMDB API but is not endorsed or certified by TMDB. Images are served directly
          from TMDB's CDN under their terms of use.
        </p>

        <h3 className={cls.h3}>User-generated content</h3>
        <p className={cls.p}>
          Reviews and other content submitted by users are the responsibility of those users. If you
          believe a user has posted content that infringes your copyright, please contact us using
          the information below.
        </p>

        <h3 className={cls.h3}>DMCA Takedown Requests</h3>
        <p className={cls.p}>
          If you are a rights holder and believe content on this site infringes your copyright,
          please send a notice to:
        </p>
        <p className="mt-3 text-sm">
          <a href="mailto:contacto.frambuesa.proyecto@gmail.com" className={cls.a}>
            <strong className={cls.strong}>contacto.frambuesa.proyecto@gmail.com</strong>
          </a>
        </p>
        <p className={`${cls.p} mt-4`}>Your notice should include:</p>
        <ul className={cls.ul}>
          <li className={cls.li}>
            Identification of the copyrighted work you believe has been infringed
          </li>
          <li className={cls.li}>
            Identification of the specific content on our site that you believe infringes your
            copyright, with enough detail for us to locate it
          </li>
          <li className={cls.li}>
            Your contact information (name, address, email, phone)
          </li>
          <li className={cls.li}>
            A statement that you have a good faith belief that the use is not authorized by the
            copyright owner, its agent, or the law
          </li>
          <li className={cls.li}>
            A statement that the information in your notice is accurate
          </li>
          <li className={cls.li}>Your physical or electronic signature</li>
        </ul>
        <p className={`${cls.p} mt-4`}>
          We will respond to valid DMCA notices within 14 days.
        </p>
      </section>

      <section className={cls.section}>
        <h2 className={cls.h2}>General Contact</h2>
        <p className={cls.p}>
          For privacy requests, account deletions, content reports, or general questions:
        </p>
        <p className="mt-3 text-sm">
          <a href="mailto:contacto.frambuesa.proyecto@gmail.com" className={cls.a}>
            <strong className={cls.strong}>contacto.frambuesa.proyecto@gmail.com</strong>
          </a>
        </p>
        <p className={`${cls.p} mt-4`}>
          We are a small fan-operated site. We read every message and will respond as quickly as
          possible, typically within a few days.
        </p>
      </section>

      <section className={cls.section}>
        <h2 className={cls.h2}>Fan Site Disclaimer</h2>
        <p className={cls.p}>
          SoapyFans Hub is an unofficial fan project. It is not affiliated with, endorsed by,
          sponsored by, or connected to Sophie Thatcher or her management, representation, or any
          associated entities. All trademarks and copyrights belong to their respective owners.
        </p>
      </section>

      <div className="mt-12 border-t border-[var(--border-subtle)] pt-6 flex gap-6 text-[0.7rem] uppercase tracking-[0.2em] text-[var(--text-muted)]">
        <Link href="/privacy" className="hover:text-[var(--accent-gold)] transition-colors">
          Privacy Policy
        </Link>
        <Link href="/terms" className="hover:text-[var(--accent-gold)] transition-colors">
          Terms of Service
        </Link>
      </div>
    </main>
  )
}
