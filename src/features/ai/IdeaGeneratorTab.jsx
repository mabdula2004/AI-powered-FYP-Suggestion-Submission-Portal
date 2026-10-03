import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Save, ChevronDown, ChevronUp } from 'lucide-react'
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuthStore } from '../../stores/authStore'
import useFeatureFlag from '../../hooks/useFeatureFlag'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import Card from '../../components/ui/Card'
import toast from 'react-hot-toast'

import { aiService } from '../../services/aiService'

const DOMAINS = ['AI/ML', 'Mobile App', 'Web Application', 'IoT', 'Cybersecurity', 'Blockchain', 'Game Dev']

export default function IdeaGeneratorTab({ studentProfile }) {
  const { user } = useAuthStore()
  const { ideaGeneratorEnabled } = useFeatureFlag()

  // ✅ All hooks declared BEFORE any conditional return
  const [prompt, setPrompt] = useState('')
  const [selectedTechs, setSelectedTechs] = useState([])
  const [domain, setDomain] = useState('')
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState(null)
  const [parseError, setParseError] = useState('')
  const [savedIdeas, setSavedIdeas] = useState([])
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    if (studentProfile?.skills) {
      setSelectedTechs(studentProfile.skills.slice(0, 5))
    }
  }, [studentProfile])

  useEffect(() => {
    if (!user?.uid) return
    const q = query(
      collection(db, 'savedIdeas'),
      where('studentId', '==', user.uid)
    )
    const unsub = onSnapshot(q, (snap) => {
      setSavedIdeas(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [user?.uid])

  // ✅ Conditional render AFTER all hooks
  if (!ideaGeneratorEnabled) {
    return (
      <EmptyState
        icon={Sparkles}
        title="Feature Disabled"
        subtitle="This feature is currently disabled by the administrator."
      />
    )
  }

  const toggleTech = (tech) => {
    setSelectedTechs((prev) =>
      prev.includes(tech) ? prev.filter((t) => t !== tech) : [...prev, tech]
    )
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt')
      return
    }
    setGenerating(true)
    setParseError('')
    setResult(null)

    try {
      const geminiPrompt = `Generate a detailed Final Year Project idea based on this prompt: "${prompt}".
Technologies: ${selectedTechs.join(', ') || 'Any'}
Domain: ${domain || 'Any'}

Return ONLY a valid JSON object with no markdown formatting, no code fences, no extra text. The object must have these exact fields:
- title (string)
- description (string, 3-4 sentences)
- objectives (array of exactly 4 strings)
- features (array of exactly 5 strings)
- technologies (array of strings)
- futureScope (string, 2-3 sentences)`

      const text = await aiService.callGemini(geminiPrompt)

      // Strip any accidental markdown fences
      const cleaned = text
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim()

      const parsed = JSON.parse(cleaned)
      setResult(parsed)
    } catch (err) {
      console.error('[IdeaGenerator] Error:', err)
      setParseError(
        err.message?.includes('JSON')
          ? 'AI returned an unexpected format. Please try again.'
          : err.message || 'Could not generate idea. Please try again.'
      )
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!result) return
    try {
      await addDoc(collection(db, 'savedIdeas'), {
        studentId: user.uid,
        ...result,
        status: 'saved',
        createdAt: serverTimestamp(),
      })
      toast.success('Idea saved!')
      setResult(null)
      setPrompt('')
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="space-y-8">
      <div className="max-w-2xl">
        <div className="mb-4">
          <label className="block text-[13px] font-semibold text-[#1A2332] mb-[6px]">
            Describe your idea
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value.slice(0, 200))}
            placeholder="I want to build a mobile app for..."
            rows={3}
            className="w-full px-[14px] py-[11px] bg-white border-[1.5px] border-[#E8ECF0] rounded-xl text-[15px] text-[#1A2332] placeholder-[#9CA3AF] transition-all duration-150 ease-out focus:outline-none focus:border-[#3B82F6] focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] resize-none"
          />
          <p className="text-[12px] text-[#9CA3AF] mt-1 text-right">{prompt.length}/200</p>
        </div>

        <div className="mb-4">
          <label className="block text-[13px] font-semibold text-[#1A2332] mb-[6px]">
            Technologies
          </label>
          <div className="flex flex-wrap gap-2">
            {studentProfile?.skills?.map((skill) => (
              <button
                key={skill}
                onClick={() => toggleTech(skill)}
                className={`px-3 py-[6px] rounded-full text-[12px] font-medium transition-all duration-150 ${
                  selectedTechs.includes(skill)
                    ? 'bg-[#1A2332] text-white shadow-sm'
                    : 'bg-[#F4F6F9] text-[#6B7A8D] hover:bg-[#E8ECF0] border border-[#E8ECF0]'
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-[13px] font-semibold text-[#1A2332] mb-[6px]">
            Domain
          </label>
          <select
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="w-full px-[14px] py-[11px] bg-white border-[1.5px] border-[#E8ECF0] rounded-xl text-[15px] text-[#1A2332] transition-all duration-150 ease-out focus:outline-none focus:border-[#3B82F6] focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] appearance-none cursor-pointer"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236B7A8D' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center' }}
          >
            <option value="">Select domain</option>
            {DOMAINS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <Button
          onClick={handleGenerate}
          loading={generating}
          leftIcon={Sparkles}
          fullWidth
        >
          Generate Idea
        </Button>

        {parseError && (
          <p className="text-[#EF4444] text-[13px] mt-3">{parseError}</p>
        )}
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.25 }}
          >
            <Card hover={false}>
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-[#F4F6F9]">
                <Sparkles className="w-4 h-4 text-[#3B82F6]" />
                <h3 className="text-[15px] font-semibold text-[#1A2332]">Generated Idea</h3>
              </div>
              <div className="space-y-5">
                <div>
                  <h4 className="font-bold text-[18px] text-[#1A2332] mb-2">{result.title}</h4>
                  <p className="text-[14px] text-[#6B7A8D] leading-relaxed">{result.description}</p>
                </div>

                <div>
                  <h5 className="font-semibold text-[13px] text-[#1A2332] mb-2">Objectives</h5>
                  <ol className="space-y-2">
                    {result.objectives?.map((obj, i) => (
                      <li key={i} className="flex gap-3 text-[14px] text-[#6B7A8D]">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#EFF6FF] text-[#3B82F6] text-[10px] font-bold flex items-center justify-center mt-0.5">
                          {i + 1}
                        </span>
                        <span className="leading-relaxed">{obj}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div>
                  <h5 className="font-semibold text-[13px] text-[#1A2332] mb-2">Features</h5>
                  <ul className="space-y-2">
                    {result.features?.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2 text-[14px] text-[#6B7A8D]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#CBD5E1] mt-[7px] flex-shrink-0" />
                        <span className="leading-relaxed">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h5 className="font-semibold text-[13px] text-[#1A2332] mb-2">Technologies</h5>
                  <div className="flex flex-wrap gap-2">
                    {result.technologies?.map((tech) => (
                      <span
                        key={tech}
                        className="px-2.5 py-[3px] bg-[#EFF6FF] text-[#3B82F6] rounded-full text-[11px] font-medium"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h5 className="font-semibold text-[13px] text-[#1A2332] mb-2">Future Scope</h5>
                  <p className="text-[14px] text-[#6B7A8D] leading-relaxed">{result.futureScope}</p>
                </div>

                <Button onClick={handleSave} leftIcon={Save} fullWidth>
                  Save Idea
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {savedIdeas.length > 0 && (
        <div>
          <h3 className="text-[16px] font-bold text-[#1A2332] mb-4">Saved Ideas</h3>
          <div className="space-y-3">
            {savedIdeas.map((idea) => (
              <Card
                key={idea.id}
                className="cursor-pointer"
                onClick={() => setExpandedId(expandedId === idea.id ? null : idea.id)}
                hover={false}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-[14px] text-[#1A2332]">{idea.title}</h4>
                    <p className="text-[11px] text-[#9CA3AF] mt-1">
                      {idea.createdAt?.toDate
                        ? idea.createdAt.toDate().toLocaleDateString()
                        : 'Just now'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-[2px] rounded-full text-[10px] font-semibold bg-[#ECFDF5] text-[#10B981]">
                      {idea.status}
                    </span>
                    {expandedId === idea.id ? (
                      <ChevronUp className="w-4 h-4 text-[#6B7A8D]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#6B7A8D]" />
                    )}
                  </div>
                </div>
                <AnimatePresence>
                  {expandedId === idea.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-4 border-t border-[#F4F6F9] mt-4 space-y-3">
                        <p className="text-[13px] text-[#6B7A8D] leading-relaxed">{idea.description}</p>
                        
                        {idea.objectives && (
                          <div>
                            <h5 className="font-semibold text-[12px] text-[#1A2332] mb-1">Objectives</h5>
                            <ol className="list-decimal pl-4 space-y-1">
                              {idea.objectives.map((obj, i) => (
                                <li key={i} className="text-[12px] text-[#6B7A8D] leading-relaxed">{obj}</li>
                              ))}
                            </ol>
                          </div>
                        )}

                        {idea.features && (
                          <div>
                            <h5 className="font-semibold text-[12px] text-[#1A2332] mb-1">Features</h5>
                            <ul className="list-disc pl-4 space-y-1">
                              {idea.features.map((feat, i) => (
                                <li key={i} className="text-[12px] text-[#6B7A8D] leading-relaxed">{feat}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div>
                          <h5 className="font-semibold text-[12px] text-[#1A2332] mb-1">Technologies</h5>
                          <div className="flex flex-wrap gap-2">
                            {idea.technologies?.map((tech) => (
                              <span
                                key={tech}
                                className="px-2.5 py-[3px] bg-[#EFF6FF] text-[#3B82F6] rounded-full text-[11px] font-medium"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        </div>

                        {idea.futureScope && (
                          <div>
                            <h5 className="font-semibold text-[12px] text-[#1A2332] mb-1">Future Scope</h5>
                            <p className="text-[12px] text-[#6B7A8D] leading-relaxed">{idea.futureScope}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
