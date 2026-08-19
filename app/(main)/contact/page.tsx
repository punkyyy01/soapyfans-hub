import type { Metadata } from "next"
import { SITE_OG_IMAGE, SITE_NAME, absoluteUrl } from "@/utils/site"
import { legalCls as cls, LegalHeader, LegalFooterNav } from "@/components/legal/legal"

export const metadata: Metadata = {
  title: "Copyright & Contact",
  description: "Copyright policy, DMCA takedown process, and general contact for SoapyFans Hub.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: `Copyright & Contact · ${SITE_NAME}`,
    description: "Copyright policy, DMCA takedown process, and general contact for SoapyFans Hub.",
    url: "/contact",
    type: "website",
    images: [
      {
        url: absoluteUrl(SITE_OG_IMAGE),
        width: 1200,
        height: 630,
        alt: `Copyright & Contact · ${SITE_NAME}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `Copyright & Contact · ${SITE_NAME}`,
    description: "Copyright policy, DMCA takedown process, and general contact for SoapyFans Hub.",
    images: [absoluteUrl(SITE_OG_IMAGE)],
  },
}

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-[700px] px-6 pt-24 pb-24 sm:pt-28">
      <LegalHeader title="Copyright & Contact" lastUpdated="May 2026" />

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

      <LegalFooterNav current="contact" />
    </main>
  )
}
