import { create } from 'zustand'
import { onSnapshot, doc } from 'firebase/firestore'
import { db } from '../lib/firebase'

export const useGroupStore = create((set) => ({
  group: null,
  loading: false,
  error: null,

  setGroup: (group) => set({ group }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  fetchGroup: (groupId) => {
    set({ loading: true, error: null })
    const unsubscribe = onSnapshot(
      doc(db, 'groups', groupId),
      (docSnap) => {
        if (docSnap.exists()) {
          set({ group: { id: docSnap.id, ...docSnap.data() }, loading: false })
        } else {
          set({ group: null, loading: false })
        }
      },
      (err) => {
        set({ error: err.message, loading: false })
      }
    )
    return unsubscribe
  },

  clearGroup: () => set({ group: null, error: null }),
}))
