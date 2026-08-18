'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getMovieDetails } from '@/utils/tmdb'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getSiteUrl } from '@/utils/site'
import { setFlash } from '@/utils/flash'

export async function login(formData: FormData) {
  const nextRaw = formData.get('next') as string | null
  const next =
    nextRaw && nextRaw.startsWith('/') && !nextRaw.startsWith('//') && !nextRaw.includes('\\')
      ? nextRaw
      : '/'

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })
  if (error) {
    await setFlash('Incorrect email or password.', 'error')
    redirect(next !== '/' ? `/login?next=${encodeURIComponent(next)}` : '/login')
  }
  revalidatePath('/', 'layout')
  redirect(next)
}

function mapRegisterError(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('already registered') || lower.includes('already exists')) {
    return 'An account with this email already exists.'
  }
  if (lower.includes('password')) {
    return 'Password must be at least 6 characters.'
  }
  if (lower.includes('email') && (lower.includes('invalid') || lower.includes('valid'))) {
    return 'Please enter a valid email address.'
  }
  return 'Could not create account. Please try again.'
}

export async function register(formData: FormData) {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })
  if (error) {
    await setFlash(mapRegisterError(error.message), 'error')
    redirect('/register')
  }
  if (data.session) redirect('/')
  await setFlash('Check your email to confirm your account.', 'message')
  redirect('/login')
}

export async function loginWithDiscord(formData?: FormData) {
  const nextRaw = (formData?.get?.('next') as string | null) ?? null
  const next =
    nextRaw && nextRaw.startsWith('/') && !nextRaw.startsWith('//') && !nextRaw.includes('\\')
      ? nextRaw
      : '/'

  const supabase = await createClient()
  const callbackUrl = new URL('/auth/callback', getSiteUrl())
  if (next !== '/') {
    callbackUrl.searchParams.set('next', next)
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'discord',
    options: {
      redirectTo: callbackUrl.toString(),
      scopes: 'identify email',
    },
  })
  if (error || !data.url) {
    console.error('[loginWithDiscord] Error initiating Discord OAuth:', error)
    await setFlash('Could not sign in with Discord. Please try again.', 'error')
    redirect(next !== '/' ? `/login?next=${encodeURIComponent(next)}` : '/login')
  }
  redirect(data.url)
}

export async function loginWithGoogle(formData?: FormData) {
  const nextRaw = (formData?.get?.('next') as string | null) ?? null
  const next =
    nextRaw && nextRaw.startsWith('/') && !nextRaw.startsWith('//') && !nextRaw.includes('\\')
      ? nextRaw
      : '/'

  const supabase = await createClient()
  const callbackUrl = new URL('/auth/callback', getSiteUrl())
  if (next !== '/') {
    callbackUrl.searchParams.set('next', next)
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: callbackUrl.toString(),
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })
  if (error || !data.url) {
    console.error('[loginWithGoogle] Error initiating Google OAuth:', error)
    await setFlash('Could not sign in with Google. Please try again.', 'error')
    redirect(next !== '/' ? `/login?next=${encodeURIComponent(next)}` : '/login')
  }
  redirect(data.url)
}

export type ReviewUpdateState = { error: string | null }

export async function updateReview(
  _prevState: ReviewUpdateState,
  formData: FormData,
): Promise<ReviewUpdateState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const reviewId = formData.get('review_id') as string
  const rating = Number(formData.get('rating'))
  const content = ((formData.get('content') as string) ?? '').trim().slice(0, 5000) || null

  if (!rating || rating < 1 || rating > 5) return { error: 'Please select a rating.' }

  const [{ data: updatedReview, error }, { data: profile }] = await Promise.all([
    supabase
      .from('reviews')
      .update({ rating, content, updated_at: new Date().toISOString() })
      .eq('id', reviewId)
      .eq('user_id', user.id)
      .select('film_id')
      .maybeSingle(),
    supabase.from('profiles').select('username').eq('id', user.id).maybeSingle(),
  ])

  if (error) return { error: 'Something went wrong. Please try again.' }

  const profileSlug = profile?.username ?? user.id

  if (updatedReview?.film_id) {
    const { data: film } = await supabase
      .from('films')
      .select('tmdb_id')
      .eq('id', updatedReview.film_id)
      .maybeSingle()
    if (film?.tmdb_id) {
      revalidatePath(`/films/${film.tmdb_id}`)
    }
  }

  revalidatePath(`/profile/${profileSlug}`)
  revalidatePath(`/profile/${user.id}`)
  revalidatePath('/dashboard-s9k2mx')
  redirect(`/profile/${profileSlug}`)
}

export async function deleteReview(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const reviewId = formData.get('review_id') as string

  if (!reviewId) {
    redirect(`/profile/${user.id}?error=${encodeURIComponent('Missing review id.')}`)
  }

  const [{ error: deleteError, data: deletedRows }, { data: profile }] = await Promise.all([
    supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId)
      .eq('user_id', user.id)
      .select('id, film_id'),
    supabase.from('profiles').select('username').eq('id', user.id).maybeSingle(),
  ])

  const profileSlug = profile?.username ?? user.id

  if (deleteError) {
    redirect(
      `/profile/${profileSlug}?error=${encodeURIComponent(
        'Could not delete the review. Please try again.',
      )}`,
    )
  }

  if (!deletedRows || deletedRows.length === 0) {
    redirect(
      `/profile/${profileSlug}?error=${encodeURIComponent(
        'Review not found, or you do not have permission to delete it.',
      )}`,
    )
  }

  const filmId = deletedRows[0]?.film_id
  if (filmId) {
    const { data: film } = await supabase
      .from('films')
      .select('tmdb_id')
      .eq('id', filmId)
      .maybeSingle()
    if (film?.tmdb_id) {
      revalidatePath(`/films/${film.tmdb_id}`)
    }
  }

  revalidatePath(`/profile/${profileSlug}`)
  revalidatePath(`/profile/${user.id}`)
  revalidatePath('/dashboard-s9k2mx')
  redirect(`/profile/${profileSlug}`)
}

export async function logout() {
  const supabase = await createClient()
  try {
    await supabase.auth.signOut({ scope: 'local' })
  } catch (err) {
    console.warn('[logout] Non-fatal signOut warning:', err)
  }
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function submitMusicReview(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const releaseId = formData.get('release_id') as string
  const rating = Number(formData.get('rating'))

  if (!rating || rating < 1 || rating > 5) {
    redirect('/music?error=Please+select+a+rating')
  }

  const content = ((formData.get('content') as string) ?? '').trim().slice(0, 5000) || null
  const reviewId = (formData.get('review_id') as string) || null

  if (reviewId) {
    const { error } = await supabase
      .from('music_reviews')
      .update({ rating, content, deleted_at: null, updated_at: new Date().toISOString() })
      .eq('id', reviewId)
      .eq('user_id', user.id)
    if (error) redirect('/music?error=Could+not+save+your+review')
  } else {
    // Check if review already exists for this user and release
    const { data: existing } = await supabase
      .from('music_reviews')
      .select('id')
      .eq('user_id', user.id)
      .eq('release_id', releaseId)
      .maybeSingle()

    if (existing) {
      const { error } = await supabase
        .from('music_reviews')
        .update({ rating, content, deleted_at: null, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .eq('user_id', user.id)
      if (error) redirect('/music?error=Could+not+save+your+review')
    } else {
      const { error } = await supabase
        .from('music_reviews')
        .insert({ user_id: user.id, release_id: releaseId, rating, content })
      if (error) redirect('/music?error=Could+not+save+your+review')
    }
  }

  const { data: userProfile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .maybeSingle()
  const profileSlug = userProfile?.username ?? user.id

  revalidatePath('/music')
  revalidatePath(`/profile/${profileSlug}`)
  revalidatePath(`/profile/${user.id}`)
  revalidatePath('/dashboard-s9k2mx')
  redirect('/music')
}

export async function submitReview(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const tmdbId = Number(formData.get('tmdb_id'))
  const rating = Number(formData.get('rating'))

  if (!Number.isFinite(tmdbId) || tmdbId <= 0) {
    redirect(`/films/${encodeURIComponent(String(formData.get('tmdb_id') ?? ''))}?error=Invalid+film`)
  }

  if (!rating || rating < 1 || rating > 5) {
    redirect(`/films/${tmdbId}?error=Please+select+a+rating`)
  }

  const content = ((formData.get('content') as string) ?? '').trim().slice(0, 5000) || null
  const reviewId = (formData.get('review_id') as string) || null

  const details = await getMovieDetails(tmdbId).catch(() => null)
  if (!details) redirect(`/films/${tmdbId}?error=Could+not+load+film+details`)

  const releaseYear = details.release_date ? Number(details.release_date.slice(0, 4)) : null

  // Written via the service-role client, not the caller-scoped one: this is
  // the only legitimate writer of `films`, and every field here comes from
  // a real, server-side getMovieDetails() response above -- never from
  // client input. Keeping films.INSERT/UPDATE closed to anon/authenticated
  // (see 20260818XXXXXX_restrict_films_writes_to_service_role.sql) means a
  // direct PostgREST request can no longer overwrite a cached film's
  // title/poster/overview, which was otherwise visible on any user's public
  // profile activity feed and in the admin dashboard.
  const { data: filmRow, error: filmUpsertError } = await createAdminClient()
    .from('films')
    .upsert(
      {
        tmdb_id: tmdbId,
        title: details.title,
        release_year: Number.isFinite(releaseYear) ? releaseYear : null,
        poster_path: details.poster_path || null,
        overview: details.overview || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'tmdb_id' }
    )
    .select('id')
    .single()

  if (filmUpsertError || !filmRow) {
    redirect(`/films/${tmdbId}?error=Failed+to+save+film`)
  }

  if (reviewId) {
    const { error } = await supabase
      .from('reviews')
      .update({ rating, content, deleted_at: null, updated_at: new Date().toISOString() })
      .eq('id', reviewId)
      .eq('user_id', user.id)

    if (error) redirect(`/films/${tmdbId}?error=Could+not+save+your+review`)
  } else {
    // Check if review already exists for this user and film
    const { data: existing } = await supabase
      .from('reviews')
      .select('id')
      .eq('user_id', user.id)
      .eq('film_id', filmRow.id)
      .maybeSingle()

    if (existing) {
      const { error } = await supabase
        .from('reviews')
        .update({ rating, content, deleted_at: null, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .eq('user_id', user.id)

      if (error) redirect(`/films/${tmdbId}?error=Could+not+save+your+review`)
    } else {
      const { error } = await supabase
        .from('reviews')
        .insert({ user_id: user.id, film_id: filmRow.id, rating, content })

      if (error) redirect(`/films/${tmdbId}?error=Could+not+save+your+review`)
    }
  }

  const { data: userProfile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .maybeSingle()
  const profileSlug = userProfile?.username ?? user.id

  revalidatePath(`/films/${tmdbId}`)
  revalidatePath(`/profile/${profileSlug}`)
  revalidatePath(`/profile/${user.id}`)
  revalidatePath('/dashboard-s9k2mx')
  redirect(`/films/${tmdbId}`)
}
