import { useState, useEffect } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../lib/firebase'

export default function useFeatureFlag() {
  const [flags, setFlags] = useState({
    chatbotEnabled: true,
    ideaGeneratorEnabled: true,
    roadmapEnabled: true,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadFlags = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'systemConfig'))
        const config = {}
        snapshot.docs.forEach((d) => {
          const data = d.data()
          config[d.id] = data.value?.toString().toLowerCase() === 'true'
        })
        setFlags({
          chatbotEnabled: config.chatbotEnabled !== false,
          ideaGeneratorEnabled: config.ideaGeneratorEnabled !== false,
          roadmapEnabled: config.roadmapEnabled !== false,
        })
      } catch {
        // Keep defaults on error
      } finally {
        setLoading(false)
      }
    }
    loadFlags()
  }, [])

  return { ...flags, loading }
}
