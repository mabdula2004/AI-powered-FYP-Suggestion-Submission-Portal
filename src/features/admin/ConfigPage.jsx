import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Settings,
  Loader2,
  Zap,
  Users,
} from 'lucide-react'
import {
  collection,
  getDocs,
  setDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import SkeletonLoader from '../../components/ui/SkeletonLoader'
import toast from 'react-hot-toast'

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25 } },
}

const inputClass = "w-full px-[14px] py-[10px] bg-white border-[1.5px] border-[#E8ECF0] rounded-xl text-[14px] text-[#1A2332] placeholder-[#9CA3AF] transition-all duration-150 ease-out focus:outline-none focus:border-[#3B82F6] focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)]"

export default function ConfigPage() {
  const [config, setConfig] = useState({
    geminiApiKey: '',
    similarityThreshold: '70',
    maxGroupSize: '3',
    chatbotEnabled: 'true',
    ideaGeneratorEnabled: 'true',
    roadmapEnabled: 'true',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testingGemini, setTestingGemini] = useState(false)

  useEffect(() => {
    const loadConfig = async () => {
      setLoading(true)
      try {
        const snap = await getDocs(collection(db, 'systemConfig'))
        const data = {}
        snap.docs.forEach((d) => { data[d.id] = d.data().value || '' })
        setConfig((prev) => ({ ...prev, ...data }))
      } catch (err) {
        toast.error('Failed to load config')
      }
      setLoading(false)
    }
    loadConfig()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await Promise.all(
        Object.entries(config).map(([key, value]) =>
          setDoc(doc(db, 'systemConfig', key), {
            key,
            value: String(value),
            updatedAt: serverTimestamp(),
          })
        )
      )
      toast.success('Settings saved')
    } catch (err) {
      toast.error(err.message)
    }
    setSaving(false)
  }

  const testConnection = async () => {
    setTestingGemini(true)
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || config.geminiApiKey
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'test' }] }],
          }),
        }
      )
      if (resp.ok) toast.success('Connection successful')
      else toast.error('Connection failed')
    } catch {
      toast.error('Connection failed')
    }
    setTestingGemini(false)
  }

  const toggle = (key) => {
    setConfig({ ...config, [key]: config[key] === 'true' ? 'false' : 'true' })
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonLoader variant="card" />
        <SkeletonLoader variant="card" />
      </div>
    )
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      <div>
        <h2 className="text-[24px] font-bold text-[#1A2332] mb-1">System Configuration</h2>
        <p className="text-[13px] text-[#6B7A8D]">Manage global settings and feature toggles</p>
      </div>

      <Card hover={false}>
        <div className="flex items-center gap-2 mb-5 pb-4 border-b border-[#F4F6F9]">
          <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] flex items-center justify-center">
            <Zap className="w-4 h-4 text-[#3B82F6]" />
          </div>
          <h3 className="font-semibold text-[15px] text-[#1A2332]">AI Settings</h3>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-[13px] font-semibold text-[#1A2332] mb-[6px]">Gemini API Key</label>
            <div className="flex gap-2">
              <input
                type="password"
                value={config.geminiApiKey}
                onChange={(e) => setConfig({ ...config, geminiApiKey: e.target.value })}
                className={`${inputClass} flex-1`}
                placeholder="Enter Gemini API Key"
              />
              <Button size="sm" onClick={testConnection} disabled={testingGemini}>
                {testingGemini ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Zap className="w-4 h-4 mr-1" />}
                Test
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-[#1A2332] mb-3">
              Similarity Threshold: <span className="text-[#3B82F6]">{config.similarityThreshold}%</span>
            </label>
            <input
              type="range"
              min={50}
              max={95}
              value={parseInt(config.similarityThreshold)}
              onChange={(e) => setConfig({ ...config, similarityThreshold: e.target.value })}
              className="w-full accent-[#3B82F6]"
            />
            <div className="flex justify-between text-[11px] text-[#9CA3AF] mt-1">
              <span>50%</span>
              <span>95%</span>
            </div>
          </div>
        </div>
      </Card>

      <Card hover={false}>
        <div className="flex items-center gap-2 mb-5 pb-4 border-b border-[#F4F6F9]">
          <div className="w-8 h-8 rounded-lg bg-[#ECFDF5] flex items-center justify-center">
            <Users className="w-4 h-4 text-[#10B981]" />
          </div>
          <h3 className="font-semibold text-[15px] text-[#1A2332]">Group Settings</h3>
        </div>

        <div>
          <label className="block text-[13px] font-semibold text-[#1A2332] mb-3">Max Group Size</label>
          <div className="flex gap-3">
            {[2, 3].map((size) => (
              <button
                key={size}
                onClick={() => setConfig({ ...config, maxGroupSize: String(size) })}
                className={`px-5 py-2.5 rounded-xl border-[1.5px] font-semibold text-[14px] transition-all duration-150 ${
                  config.maxGroupSize === String(size)
                    ? 'border-[#3B82F6] bg-[#EFF6FF] text-[#3B82F6]'
                    : 'border-[#E8ECF0] text-[#6B7A8D] hover:border-[#CBD5E1]'
                }`}
              >
                {size} Members
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card hover={false}>
        <div className="flex items-center gap-2 mb-5 pb-4 border-b border-[#F4F6F9]">
          <div className="w-8 h-8 rounded-lg bg-[#F5F3FF] flex items-center justify-center">
            <Settings className="w-4 h-4 text-[#8B5CF6]" />
          </div>
          <h3 className="font-semibold text-[15px] text-[#1A2332]">Feature Toggles</h3>
        </div>

        <div className="space-y-4">
          {[
            { key: 'chatbotEnabled', label: 'Enable AI Chatbot' },
            { key: 'ideaGeneratorEnabled', label: 'Enable Idea Generator' },
            { key: 'roadmapEnabled', label: 'Enable Learning Roadmap' },
          ].map((feat) => (
            <div key={feat.key} className="flex items-center justify-between py-1">
              <span className="text-[14px] font-medium text-[#1A2332]">{feat.label}</span>
              <button
                onClick={() => toggle(feat.key)}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                  config[feat.key] === 'true' ? 'bg-[#3B82F6]' : 'bg-[#E8ECF0]'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                    config[feat.key] === 'true' ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Settings className="w-4 h-4 mr-1" />}
          Save Settings
        </Button>
      </div>
    </motion.div>
  )
}
