import { INPUT_CLS, LABEL_CLS } from '../editFormStyles'

export default function IdentitySection({
  displayName,
  setDisplayName,
  username,
  setUsername,
  pronouns,
  setPronouns,
  locationText,
  setLocation,
  bio,
  setBio,
  aboutMe,
  setAboutMe,
  websiteUrl,
  setWebsite,
}: {
  displayName: string
  setDisplayName: (v: string) => void
  username: string
  setUsername: (v: string) => void
  pronouns: string
  setPronouns: (v: string) => void
  locationText: string
  setLocation: (v: string) => void
  bio: string
  setBio: (v: string) => void
  aboutMe: string
  setAboutMe: (v: string) => void
  websiteUrl: string
  setWebsite: (v: string) => void
}) {
  return (
    <section id="identity" className="scroll-mt-28 space-y-6">
      <div className="border-b border-[var(--border-subtle)] pb-4">
        <div className="flex items-baseline justify-between">
          <p className="text-eyebrow">
            01 · Identity
          </p>
          <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">
            Public details
          </span>
        </div>
        <h2 className="mt-1 font-display text-2xl font-medium tracking-tight text-[var(--text-primary)]">
          The Curator
        </h2>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          Your name, handle, bio, about me description, and external links displayed across the archive.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className={LABEL_CLS} htmlFor="display_name">
            Display Name
          </label>
          <input
            id="display_name"
            name="display_name"
            type="text"
            maxLength={50}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g. Natalie Scatorccio"
            className={INPUT_CLS}
          />
        </div>

        <div>
          <label className={LABEL_CLS} htmlFor="username">
            Username <span className="text-[var(--accent-amber)]">*</span>
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 font-mono text-xs text-[var(--text-muted)]">
              @
            </span>
            <input
              id="username"
              name="username"
              type="text"
              maxLength={30}
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              className={`${INPUT_CLS} pl-9 font-mono`}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className={LABEL_CLS} htmlFor="pronouns">
            Pronouns
          </label>
          <input
            id="pronouns"
            name="pronouns"
            type="text"
            maxLength={30}
            value={pronouns}
            onChange={(e) => setPronouns(e.target.value)}
            placeholder="she/her, they/them, he/him"
            className={INPUT_CLS}
          />
        </div>

        <div>
          <label className={LABEL_CLS} htmlFor="location_text">
            Location
          </label>
          <input
            id="location_text"
            name="location_text"
            type="text"
            maxLength={60}
            value={locationText}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Chicago, Los Angeles, etc."
            className={INPUT_CLS}
          />
        </div>
      </div>

      {/* Short Bio */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className={LABEL_CLS} htmlFor="bio">
            Short Bio
          </label>
          <span className={`font-mono text-xs tabular-nums ${bio.length > 270 ? 'text-[var(--accent-amber)]' : 'text-[var(--text-muted)]'}`}>
            {bio.length} / 300
          </span>
        </div>
        <textarea
          id="bio"
          name="bio"
          rows={2}
          maxLength={300}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="A few words on your favorite Sophie Thatcher roles, musical releases, or reflections on the archive…"
          className={`${INPUT_CLS} resize-none leading-relaxed`}
        />
      </div>

      {/* About Me (Extended Free Text) */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className={LABEL_CLS} htmlFor="about_me">
            About Me
          </label>
          <span className={`font-mono text-xs tabular-nums ${aboutMe.length > 1900 ? 'text-[var(--accent-amber)]' : 'text-[var(--text-muted)]'}`}>
            {aboutMe.length.toLocaleString()} / 2,000
          </span>
        </div>
        <textarea
          id="about_me"
          name="about_me"
          rows={5}
          maxLength={2000}
          value={aboutMe}
          onChange={(e) => setAboutMe(e.target.value)}
          placeholder="Tell visitors a little more about you, your connection to Sophie, or what you like about the archive…"
          className={`${INPUT_CLS} resize-y leading-relaxed`}
        />
        <p className="mt-1.5 font-mono text-[0.68rem] text-[var(--text-muted)]">
          Tell visitors a little more about you, your connection to Sophie, or what you like about the archive. Line breaks and paragraphs are preserved.
        </p>
      </div>

      <div>
        <label className={LABEL_CLS} htmlFor="website_url">
          Website or Link
        </label>
        <input
          id="website_url"
          name="website_url"
          type="url"
          value={websiteUrl}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="https://instagram.com/yourhandle"
          className={INPUT_CLS}
        />
        <p className="mt-1.5 font-mono text-[0.68rem] text-[var(--text-muted)]">
          Must start with https:// (Instagram, Letterboxd, personal site, etc.)
        </p>
      </div>
    </section>
  )
}
