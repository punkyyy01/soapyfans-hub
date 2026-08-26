'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  isListMediaType,
  validateListName,
  validateListDescription,
  type ListMediaType,
} from '@/utils/lists'

// Same idiom as app/(main)/profile/edit/actions.ts's addFavorite/
// removeFavorite/reorderFavorites: plain exported 'use server' functions
// called directly from client code (not <form action>), because list
// management needs local client state (drag reorder, a search modal,
// optimistic add/remove) beyond a single toggle.

type MediaType = ListMediaType

async function revalidateListPages(
  supabase: Awaited<ReturnType<typeof createClient>>,
  listId: string,
  userId: string,
) {
  const { data } = await supabase.from('profiles').select('username').eq('id', userId).maybeSingle()
  const slug = data?.username ?? userId
  revalidatePath(`/lists/${listId}`)
  revalidatePath('/lists')
  revalidatePath(`/profile/${slug}`)
  revalidatePath(`/profile/${userId}`)
}

// ── Lists ────────────────────────────────────────────────────────────────

export async function createList(
  name: string,
  description: string,
  isPublic: boolean,
): Promise<{ error: string | null; id: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.', id: null }

  const nameError = validateListName(name)
  if (nameError) return { error: nameError, id: null }
  const descriptionError = validateListDescription(description)
  if (descriptionError) return { error: descriptionError, id: null }

  const trimmedName = name.trim()
  const trimmedDescription = description.trim()

  const { data, error } = await supabase
    .from('lists')
    .insert({
      user_id: user.id,
      name: trimmedName,
      description: trimmedDescription || null,
      is_public: isPublic,
    })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') return { error: 'You already have a list with that name.', id: null }
    return { error: 'Failed to create list.', id: null }
  }

  await revalidateListPages(supabase, data.id, user.id)
  return { error: null, id: data.id }
}

export async function updateListMeta(
  listId: string,
  updates: { name?: string; description?: string; isPublic?: boolean },
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const patch: { name?: string; description?: string | null; is_public?: boolean } = {}

  if (updates.name !== undefined) {
    const nameError = validateListName(updates.name)
    if (nameError) return { error: nameError }
    patch.name = updates.name.trim()
  }
  if (updates.description !== undefined) {
    const descriptionError = validateListDescription(updates.description)
    if (descriptionError) return { error: descriptionError }
    patch.description = updates.description.trim() || null
  }
  if (updates.isPublic !== undefined) {
    patch.is_public = updates.isPublic
  }

  const { error } = await supabase
    .from('lists')
    .update(patch)
    .eq('id', listId)
    .eq('user_id', user.id)

  if (error) {
    if (error.code === '23505') return { error: 'You already have a list with that name.' }
    return { error: 'Failed to update list.' }
  }

  await revalidateListPages(supabase, listId, user.id)
  return { error: null }
}

export async function deleteList(listId: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { error } = await supabase
    .from('lists')
    .delete()
    .eq('id', listId)
    .eq('user_id', user.id)

  if (error) return { error: 'Failed to delete list.' }

  await revalidateListPages(supabase, listId, user.id)
  return { error: null }
}

// ── List items ───────────────────────────────────────────────────────────

export async function addListItem(
  listId: string,
  tmdbId: number,
  mediaType: MediaType,
): Promise<{ error: string | null; id: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.', id: null }
  if (!isListMediaType(mediaType)) return { error: 'Invalid media type.', id: null }

  // No hard cap/slot invariant to protect here (unlike profile_favorites),
  // so a plain read-then-insert is fine -- a rare concurrent double-add
  // just means two items briefly share a position, which is cosmetic only
  // (position has no UNIQUE constraint on list_items).
  const { data: last } = await supabase
    .from('list_items')
    .select('position')
    .eq('list_id', listId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data, error } = await supabase
    .from('list_items')
    .insert({
      list_id: listId,
      tmdb_id: tmdbId,
      media_type: mediaType,
      position: (last?.position ?? -1) + 1,
    })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') return { error: 'Already in this list.', id: null }
    return { error: 'Failed to add item to list.', id: null }
  }

  await revalidateListPages(supabase, listId, user.id)
  return { error: null, id: data.id }
}

export async function removeListItem(listId: string, itemId: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { error } = await supabase
    .from('list_items')
    .delete()
    .eq('id', itemId)
    .eq('list_id', listId)

  if (error) return { error: 'Failed to remove item from list.' }

  await revalidateListPages(supabase, listId, user.id)
  return { error: null }
}

export async function reorderListItems(listId: string, orderedIds: string[]): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { error } = await supabase.rpc('reorder_list_items', { p_list_id: listId, p_ids: orderedIds })
  if (error) return { error: 'Failed to reorder items.' }

  await revalidateListPages(supabase, listId, user.id)
  return { error: null }
}
