export interface PublicUser {
  id: string
  displayName: string
  isRegistered: boolean
  email: string | null
}

export function useAuth() {
  const user = useState<PublicUser | null>('auth-user', () => null)
  const loaded = useState('auth-loaded', () => false)

  async function refresh() {
    const res = await $fetch<{ user: PublicUser | null }>('/api/auth/me')
    user.value = res.user
    loaded.value = true
    return res.user
  }

  async function submit(path: 'login' | 'register', body: Record<string, unknown>) {
    const fingerprint = await computeFingerprint()
    const res = await $fetch<{ user: PublicUser }>(`/api/auth/${path}`, { method: 'POST', body: { ...body, fingerprint } })
    user.value = res.user
    return res.user
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    user.value = null
  }

  return { user, loaded, refresh, submit, logout }
}
