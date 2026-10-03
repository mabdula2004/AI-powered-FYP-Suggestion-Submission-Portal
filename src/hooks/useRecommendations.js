import { useState, useEffect, useCallback } from 'react'
import { aiService } from '../services/aiService'

export default function useRecommendations(studentProfile) {
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isUsingFallback, setIsUsingFallback] = useState(false)

  const fetchRecommendations = useCallback(async () => {
    if (!studentProfile) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    setIsUsingFallback(false)

    try {
      const results = await aiService.getRecommendations(studentProfile)
      setRecommendations(results)
    } catch (err) {
      console.warn('Gemini failed, using local fallback:', err)
      try {
        const fallback = await aiService.getLocalRecommendations(studentProfile)
        setRecommendations(fallback)
        setIsUsingFallback(true)
      } catch (fallbackErr) {
        setError(fallbackErr.message)
      }
    } finally {
      setLoading(false)
    }
  }, [studentProfile])

  useEffect(() => {
    fetchRecommendations()
  }, [fetchRecommendations])

  const refresh = useCallback(() => {
    fetchRecommendations()
  }, [fetchRecommendations])

  return { recommendations, loading, error, isUsingFallback, refresh }
}
