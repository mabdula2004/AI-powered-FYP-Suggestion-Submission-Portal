import { create } from 'zustand'
import { authService } from '../services/authService'

export const useAuthStore = create((set) => ({
  user: null,
  profile: null,
  loading: true,
  error: null,

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  logout: async () => {
    await authService.signOut()
    set({ user: null, profile: null, error: null })
  },
}))

authService.onAuthChange((data) => {
  const { setUser, setProfile, setLoading } = useAuthStore.getState()
  if (data) {
    setUser(data.user)
    setProfile(data.profile)
  } else {
    setUser(null)
    setProfile(null)
  }
  setLoading(false)
})
