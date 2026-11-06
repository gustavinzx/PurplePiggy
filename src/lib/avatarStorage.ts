import { supabase } from './supabase'

interface CacheEntry {
  url: string
  expiresAt: number
}

const memoryCache = new Map<string, CacheEntry>()
const CACHE_KEY_PREFIX = 'pp_avatar_signed_'

/**
 * Extrai o caminho do arquivo no bucket 'avatars' a partir de um path relativo ou URL completa do Supabase.
 */
export function extractAvatarStoragePath(avatarUrlOrPath?: string | null): string | null {
  if (!avatarUrlOrPath) return null
  if (avatarUrlOrPath.startsWith('preset:') || avatarUrlOrPath.startsWith('data:')) return null

  // Se já for um caminho relativo limpo (ex: "<uid>/avatar-123.jpg")
  if (!avatarUrlOrPath.startsWith('http://') && !avatarUrlOrPath.startsWith('https://')) {
    return avatarUrlOrPath.replace(/^\/+/, '')
  }

  // Se for uma URL do Supabase Storage apontando para o bucket avatars (/object/public/avatars/ ou /object/sign/avatars/)
  const match = avatarUrlOrPath.match(/\/storage\/v1\/object\/(?:public|sign)\/avatars\/([^?#]+)/)
  if (match && match[1]) {
    return decodeURIComponent(match[1])
  }

  return null
}

/**
 * Obtém uma Signed URL com validade curta (1 hora) e cache local para o avatar privado.
 */
export async function getAvatarSignedUrl(avatarUrlOrPath?: string | null): Promise<string | null> {
  if (!avatarUrlOrPath) return null

  // Presets do mascote e data URLs locais são retornados diretamente
  if (avatarUrlOrPath.startsWith('preset:') || avatarUrlOrPath.startsWith('data:')) {
    return avatarUrlOrPath
  }

  const storagePath = extractAvatarStoragePath(avatarUrlOrPath)
  if (!storagePath) {
    // Imagem externa genérica (ex: avatar do Google ou placeholder)
    return avatarUrlOrPath
  }

  const now = Date.now()
  const cacheKey = CACHE_KEY_PREFIX + storagePath

  // 1. Verificar cache em memória
  const inMemory = memoryCache.get(cacheKey)
  if (inMemory && inMemory.expiresAt > now + 300_000) {
    return inMemory.url
  }

  // 2. Verificar cache no localStorage
  try {
    const rawLocal = localStorage.getItem(cacheKey)
    if (rawLocal) {
      const parsed: CacheEntry = JSON.parse(rawLocal)
      if (parsed.expiresAt > now + 300_000) {
        memoryCache.set(cacheKey, parsed)
        return parsed.url
      }
    }
  } catch {
    // Silently continue to fresh signed URL
  }

  // 3. Gerar Signed URL com 1 hora de validade (3600 segundos)
  try {
    const { data, error } = await supabase.storage
      .from('avatars')
      .createSignedUrl(storagePath, 3600)

    if (error || !data?.signedUrl) {
      console.warn('[avatarStorage] Falha ao gerar signed URL:', error?.message)
      return avatarUrlOrPath
    }

    const entry: CacheEntry = {
      url: data.signedUrl,
      expiresAt: now + 3500_000, // ~58 minutos de validade no cache
    }

    memoryCache.set(cacheKey, entry)
    try {
      localStorage.setItem(cacheKey, JSON.stringify(entry))
    } catch {
      // ignore
    }

    return entry.url
  } catch (err) {
    console.error('[avatarStorage] Erro inesperado ao gerar signed URL:', err)
    return avatarUrlOrPath
  }
}
