import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Sparkles,
  RefreshCw,
  Wrench,
  TrendingUp,
  ArrowRight,
  Target,
  NotebookPen
} from 'lucide-react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuthStore } from '../../stores/authStore'
import useRecommendations from '../../hooks/useRecommendations'
import Button from '../../components/ui/Button'
import IdeaGeneratorTab from './IdeaGeneratorTab'
import ChatbotTab from './ChatbotTab'
import NotepadTab from './NotepadTab'
import ThreeDEffectWrapper from '../../components/ui/3DEffectWrapper'

const TABS = [
  { key: 'suggestions', label: 'AI Suggestions', icon: Sparkles },
  { key: 'generate', label: 'Generate Idea', icon: TrendingUp },
  { key: 'chatbot', label: 'Chatbot', icon: Wrench },
  { key: 'notepads', label: 'My Notepads', icon: NotebookPen },
]


function CircularProgress({ percentage }) {
  const radius = 38
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="relative w-[88px] h-[88px] flex flex-col items-center justify-center flex-shrink-0">
      <svg className="absolute inset-0 w-[88px] h-[88px] -rotate-90">
        <circle
          cx="44"
          cy="44"
          r={radius}
          fill="none"
          stroke="var(--bg-tertiary)"
          strokeWidth="8"
        />
        <motion.circle
          cx="44"
          cy="44"
          r={radius}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
        />
      </svg>
      <div className="flex flex-col items-center justify-center relative z-10 mt-1">
        <span className="text-[24px] font-bold text-navy leading-none">{percentage}</span>
        <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Match</span>
      </div>
    </div>
  )
}

export default function RecommendationsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'suggestions'
  const { user } = useAuthStore()
  const [studentProfile, setStudentProfile] = useState(null)

  useEffect(() => {
    if (!user?.uid) return
    const unsub = onSnapshot(doc(db, 'studentProfiles', user.uid), (snap) => {
      if (snap.exists()) setStudentProfile(snap.data())
    })
    return unsub
  }, [user?.uid])

  const {
    recommendations,
    loading,
    error,
    isUsingFallback,
    refresh,
  } = useRecommendations(studentProfile)

  const setTab = (tab) => {
    setSearchParams({ tab })
  }

  const topSkills = studentProfile?.skills?.slice(0, 3) || []

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="shrink-0">
        <h2 className="text-[24px] font-bold text-navy mb-1">AI Tools</h2>
        <p className="text-[13px] text-text-muted">
          Personalized recommendations and AI-powered assistance
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setTab(tab.key)}
            className={`flex items-center gap-2 px-5 py-3.5 text-[14px] font-bold transition-colors duration-200 border-b-2 relative ${
              activeTab === tab.key
                ? 'border-accent text-accent'
                : 'border-transparent text-text-secondary hover:text-navy hover:bg-bg-secondary/50 rounded-t-xl'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 relative">
        {activeTab === 'suggestions' && (
          <div className="h-full overflow-y-auto space-y-6 pt-2 pb-6 pr-2 scrollbar-hide">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[18px] font-bold text-navy mb-1">Recommended For You</h3>
                {topSkills.length > 0 && (
                  <p className="text-[13px] text-text-muted font-medium">
                    Based on your skills: <span className="text-accent">{topSkills.join(', ')}</span>
                  </p>
                )}
              </div>
              <button
                onClick={refresh}
                disabled={loading}
                className="px-4 py-2 bg-bg-secondary text-text-primary rounded-xl font-bold text-[13px] hover:bg-bg-tertiary transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-accent' : ''}`} />
                Refresh Matches
              </button>
            </div>

            {isUsingFallback && (
              <div className="bg-warning-light border border-warning/20 rounded-xl p-4 flex gap-3">
                 <div className="w-2 h-2 bg-warning rounded-full mt-1.5 animate-pulse shrink-0" />
                 <p className="text-[13px] text-warning font-semibold">
                   Showing local recommendations based on project database. AI suggestions are temporarily unavailable.
                 </p>
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1,2,3].map(i => <div key={i} className="h-[320px] bg-surface rounded-2xl border border-border animate-pulse" />)}
              </div>
            ) : error ? (
              <div className="bg-surface border border-border rounded-2xl p-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-danger-light rounded-full flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-danger" />
                </div>
                <h3 className="text-[16px] font-bold text-navy mb-1">Could not load recommendations</h3>
                <p className="text-[14px] text-text-muted mb-4">{error}</p>
                <button onClick={refresh} className="px-5 py-2 bg-danger text-white rounded-xl font-bold text-[13px]">Try Again</button>
              </div>
            ) : recommendations.length === 0 ? (
              <div className="bg-surface border border-border rounded-2xl p-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-bg-secondary rounded-full flex items-center justify-center mb-4">
                  <Target className="w-8 h-8 text-text-muted" />
                </div>
                <h3 className="text-[16px] font-bold text-navy mb-1">No recommendations yet</h3>
                <p className="text-[14px] text-text-muted">Complete your profile to get personalized suggestions</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendations.map((rec, idx) => (
                  <ThreeDEffectWrapper key={idx}>
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.08, duration: 0.4 }}
                      className="group bg-surface rounded-2xl shadow-sm hover:shadow-lg border border-border overflow-hidden flex flex-col h-full transition-all duration-300 relative"
                    >
                      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-r from-accent-light/10 via-accent/5 to-accent-light/10 animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
                      
                      <div className="p-6 relative z-10 flex-1 flex flex-col">
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <CircularProgress percentage={rec.matchScore || 75} />
                          <div className="flex-1 text-right mt-2">
                             <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-bg-secondary text-text-secondary border border-border">
                               {rec.difficulty || 'Beginner'}
                             </span>
                          </div>
                        </div>

                        <h4 className="font-bold text-[18px] text-navy line-clamp-2 leading-snug mb-4 min-h-[50px]">
                          {rec.title}
                        </h4>

                        <div className="mb-4">
                          <p className="text-[11px] font-bold text-text-muted mb-2 uppercase tracking-wide">
                            Matched Skills
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {(rec.matchingTechs || rec.technologies || [])
                              .slice(0, 4)
                              .map((tech) => {
                                const isMatched = (studentProfile?.skills || []).includes(tech)
                                return (
                                  <span
                                    key={tech}
                                    className={`text-[11px] px-2.5 py-1 rounded-full font-bold flex items-center gap-1 border ${
                                      isMatched
                                        ? 'bg-accent-light/50 text-accent-dark border-accent/20'
                                        : 'bg-bg-secondary text-text-secondary border-border/50'
                                    }`}
                                  >
                                    {isMatched && <Sparkles className="w-3 h-3 text-accent" />}
                                    {tech}
                                  </span>
                                )
                              })}
                          </div>
                        </div>

                        <p className="text-[13px] text-text-muted line-clamp-2 mb-6 mt-auto">
                          {rec.description}
                        </p>

                        {rec.projectId ? (
                          <button
                            onClick={() => navigate(`/student/project/${rec.projectId}`)}
                            className="w-full h-[44px] text-[13px] font-bold text-accent bg-accent-light/50 rounded-xl hover:bg-accent hover:text-white transition-all duration-200 flex items-center justify-center gap-2"
                          >
                            View Project Details
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        ) : (
                           <div className="h-[44px]" />
                        )}
                      </div>
                    </motion.div>
                  </ThreeDEffectWrapper>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'generate' && (
          <div className="h-full overflow-y-auto scrollbar-hide">
            <IdeaGeneratorTab studentProfile={studentProfile} />
          </div>
        )}

        {activeTab === 'chatbot' && <ChatbotTab />}

        {activeTab === 'notepads' && <NotepadTab />}
      </div>
    </div>
  )
}
