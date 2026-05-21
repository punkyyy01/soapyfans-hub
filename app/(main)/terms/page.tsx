import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The rules and terms governing use of SoapyFans Hub.",
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

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-[700px] px-6 pt-24 pb-24 sm:pt-28">
      <header className="mb-10">
        <h1 className="font-display text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">
          Terms of Service
        </h1>
        <p className="mt-3 text-sm text-[var(--text-secondary)]">
          <strong className={cls.strong}>SoapyFans Hub</strong> — soapyhub.fans
        </p>
        <p className="mt-1 text-[0.7rem] uppercase tracking-[0.2em] text-[var(--text-muted)]">
          Last updated: May 2026
        </p>
      </header>

      <section>
        <h2 className={cls.h2}>1. About This Site</h2>
        <p className={cls.p}>
          SoapyFans Hub is an unofficial, fan-made archive. It is not affiliated with, endorsed by,
          or connected to Sophie Thatcher or her representatives. By using this site, you agree to
          these terms.
        </p>
      </section>

      <section className={cls.section}>
        <h2 className={cls.h2}>2. Your Account</h2>
        <ul className={cls.ul}>
          <li className={cls.li}>You must provide accurate information when registering</li>
          <li className={cls.li}>
            You are responsible for maintaining the security of your account
          </li>
          <li className={cls.li}>You must be at least 13 years old to create an account</li>
          <li className={cls.li}>
            One account per person. Creating multiple accounts to circumvent bans is prohibited
          </li>
        </ul>
      </section>

      <section className={cls.section}>
        <h2 className={cls.h2}>3. User-Generated Content</h2>
        <p className={cls.p}>
          When you submit a review or any other content to this site, you:
        </p>
        <ul className={cls.ul}>
          <li className={cls.li}>Retain ownership of your content</li>
          <li className={cls.li}>
            Grant SoapyFans Hub a non-exclusive, royalty-free license to display that content on the
            site
          </li>
          <li className={cls.li}>
            Confirm that your content does not violate anyone else's rights
          </li>
        </ul>

        <h3 className={cls.h3}>Prohibited content</h3>
        <p className={cls.p}>
          The following is strictly prohibited and will result in content removal and/or account
          termination without warning:
        </p>
        <ul className={cls.ul}>
          <li className={cls.li}>
            <strong className={cls.strong}>Harassment or hate speech</strong> — content targeting
            any person based on race, ethnicity, gender, sexual orientation, religion, disability, or
            any other characteristic
          </li>
          <li className={cls.li}>
            <strong className={cls.strong}>Doxing</strong> — publishing private personal information
            about any individual without their consent
          </li>
          <li className={cls.li}>
            <strong className={cls.strong}>Spam</strong> — repetitive, low-quality, or automated
            content
          </li>
          <li className={cls.li}>
            <strong className={cls.strong}>Illegal content</strong> — content that violates any
            applicable law
          </li>
          <li className={cls.li}>
            <strong className={cls.strong}>Impersonation</strong> — claiming to be Sophie Thatcher,
            her representatives, or any other person
          </li>
          <li className={cls.li}>
            <strong className={cls.strong}>Advertising</strong> — unsolicited promotion of products,
            services, or other sites
          </li>
          <li className={cls.li}>
            <strong className={cls.strong}>Copyright infringement</strong> — reproducing substantial
            portions of copyrighted material
          </li>
        </ul>
      </section>

      <section className={cls.section}>
        <h2 className={cls.h2}>4. Moderation</h2>
        <p className={cls.p}>SoapyFans Hub reserves the right to:</p>
        <ul className={cls.ul}>
          <li className={cls.li}>
            Remove any content that violates these terms, at our sole discretion
          </li>
          <li className={cls.li}>
            Suspend or permanently ban any account that violates these terms
          </li>
          <li className={cls.li}>
            Preserve soft-deleted content in our database for audit purposes
          </li>
        </ul>
        <p className={`${cls.p} mt-4`}>
          We are not obligated to provide notice before removing content or terminating accounts,
          though we will make reasonable efforts to do so.
        </p>
      </section>

      <section className={cls.section}>
        <h2 className={cls.h2}>5. Intellectual Property</h2>
        <ul className={cls.ul}>
          <li className={cls.li}>
            Film data is sourced from TMDB. This product uses the TMDB API but is not endorsed or
            certified by TMDB.
          </li>
          <li className={cls.li}>
            Sophie Thatcher's name, likeness, and works belong to their respective rights holders
          </li>
          <li className={cls.li}>
            SoapyFans Hub does not claim ownership of any third-party intellectual property displayed
            on this site
          </li>
          <li className={cls.li}>
            The site's original code, design, and written content (excluding TMDB data and Sophie
            Thatcher's works) are the property of the site operator
          </li>
        </ul>
      </section>

      <section className={cls.section}>
        <h2 className={cls.h2}>6. Donations</h2>
        <p className={cls.p}>
          Donations via Ko-fi are voluntary and do not entitle donors to any goods, services,
          special access, or privileges on the site. Donations help cover operating costs (hosting,
          domain). No goods or services are exchanged for donations.
        </p>
      </section>

      <section className={cls.section}>
        <h2 className={cls.h2}>7. Disclaimers</h2>
        <ul className={cls.ul}>
          <li className={cls.li}>
            This site is provided "as is" without warranties of any kind
          </li>
          <li className={cls.li}>
            We do not guarantee the accuracy of film data sourced from TMDB
          </li>
          <li className={cls.li}>We are not responsible for content posted by users</li>
          <li className={cls.li}>
            We are not responsible for the content of external sites linked from this site
          </li>
        </ul>
      </section>

      <section className={cls.section}>
        <h2 className={cls.h2}>8. Limitation of Liability</h2>
        <p className={cls.p}>
          To the maximum extent permitted by law, SoapyFans Hub and its operator shall not be liable
          for any indirect, incidental, or consequential damages arising from your use of this site.
        </p>
      </section>

      <section className={cls.section}>
        <h2 className={cls.h2}>9. Changes to These Terms</h2>
        <p className={cls.p}>
          We may update these terms as the site evolves. The "Last updated" date reflects the most
          recent revision. Continued use of the site after changes constitutes acceptance.
        </p>
      </section>

      <section className={cls.section}>
        <h2 className={cls.h2}>10. Contact</h2>
        <p className={cls.p}>
          For questions about these terms:{" "}
          <a href="mailto:contacto.frambuesa.proyecto@gmail.com" className={cls.a}>
            contacto.frambuesa.proyecto@gmail.com
          </a>
        </p>
      </section>

      <div className="mt-12 border-t border-[var(--border-subtle)] pt-6 flex gap-6 text-[0.7rem] uppercase tracking-[0.2em] text-[var(--text-muted)]">
        <Link href="/privacy" className="hover:text-[var(--accent-gold)] transition-colors">
          Privacy Policy
        </Link>
        <Link href="/contact" className="hover:text-[var(--accent-gold)] transition-colors">
          Copyright &amp; Contact
        </Link>
      </div>
    </main>
  )
}
