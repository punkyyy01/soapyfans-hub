import { cookies } from 'next/headers'

const FLASH_KEY = 'auth_flash'

export async function setFlash(
  message: string,
  type: 'error' | 'message' = 'error',
) {
  const cookieStore = await cookies()
  cookieStore.set(FLASH_KEY, JSON.stringify({ message, type }), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 30, // one-shot: expires in 30 seconds
  })
}

export async function getFlash(): Promise<{
  message: string
  type: string
} | null> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(FLASH_KEY)?.value
  if (!raw) return null
  cookieStore.delete(FLASH_KEY)
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}
