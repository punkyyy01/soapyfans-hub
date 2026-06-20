'use server'

import { createClient } from '@/utils/supabase/server'
import { getMovieDetails } from '@/utils/tmdb'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getSiteUrl } from '@/utils/site'
import { setFlash } from '@/utils/flash'

export async function login(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })
  if (error) {
    await setFlash('Email o contraseña incorrectos.', 'error')
    redirect('/login')
  }
  redirect('/')
}

function mapRegisterError(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('already registered') || lower.includes('already exists')) {
    return 'Ya existe una cuenta con ese email.'
  }
  if (lower.includes('password')) {
    return 'La contraseña debe tener al menos 6 caracteres.'
  }
  if (lower.includes('email') && (lower.includes('invalid') || lower.includes('valid'))) {
    return 'Ingresá un email válido.'
  }
  return 'No se pudo crear la cuenta. Intentá de nuevo.'
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
  await setFlash('Revisá tu email para confirmar tu cuenta.', 'message')
  redirect('/login')
}

export async function loginWithDiscord() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'discord',
    options: { redirectTo: `${getSiteUrl()}/auth/callback` },
  })
  if (error || !data.url) {
    await setFlash('No se pudo iniciar sesión con Discord. Intentá de nuevo.', 'error')
    redirect('/login')
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

  const [{ error }, { data: profile }] = await Promise.all([
    supabase
      .from('reviews')
      .update({ rating, content, updated_at: new Date().toISOString() })
      .eq('id', reviewId)
      .eq('user_id', user.id),
    supabase.from('profiles').select('username').eq('id', user.id).single(),
  ])

  if (error) return { error: 'Something went wrong. Please try again.' }

  const slug = profile?.username
  if (!slug) redirect('/')
  redirect(`/profile/${slug}`)
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
      .select('id'),
    supabase.from('profiles').select('username').eq('id', user.id).single(),
  ])

  const profileSlug = profile?.username ?? null
  if (!profileSlug) redirect('/')

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

  revalidatePath(`/profile/${profileSlug}`)
  redirect(`/profile/${profileSlug}`)
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
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
      .update({ rating, content, updated_at: new Date().toISOString() })
      .eq('id', reviewId)
      .eq('user_id', user.id)
    if (error) redirect('/music?error=Could+not+save+your+review')
  } else {
    const { error } = await supabase
      .from('music_reviews')
      .insert({ user_id: user.id, release_id: releaseId, rating, content })
    if (error) redirect('/music?error=Could+not+save+your+review')
  }

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

  const { data: filmRow, error: filmUpsertError } = await supabase
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
      .update({ rating, content, updated_at: new Date().toISOString() })
      .eq('id', reviewId)
      .eq('user_id', user.id)

    if (error) redirect(`/films/${tmdbId}?error=Could+not+save+your+review`)
  } else {
    const { error } = await supabase
      .from('reviews')
      .insert({ user_id: user.id, film_id: filmRow.id, rating, content })

    if (error) redirect(`/films/${tmdbId}?error=Could+not+save+your+review`)
  }

  redirect(`/films/${tmdbId}`)
}
