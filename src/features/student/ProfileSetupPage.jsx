import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, Plus, Loader2, Check } from 'lucide-react'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuthStore } from '../../stores/authStore'
import Button from '../../components/ui/Button'

const DEFAULT_SKILLS = [
  'Flutter', 'React', 'Python', 'Firebase', 'Node.js', 'AI/ML',
  'Java', 'MongoDB', 'Docker', 'Swift', 'Kotlin', 'PostgreSQL',
  'Django', 'Angular', 'Vue', 'TensorFlow',
]

const DOMAINS = [
  'AI/ML', 'Mobile App', 'Web Application', 'IoT',
  'Cybersecurity', 'Blockchain', 'Game Dev',
]

const EXPERIENCE_LEVELS = [
  { value: 'Beginner', label: 'Beginner', desc: 'New to programming, learning basics' },
  { value: 'Intermediate', label: 'Intermediate', desc: 'Comfortable with frameworks, built projects' },
  { value: 'Advanced', label: 'Advanced', desc: 'Expert-level, production experience' },
]

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25 } },
}

const stepVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.25 } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.2 } },
}

export default function ProfileSetupPage() {
  const navigate = useNavigate()
  const { user, profile } = useAuthStore()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState(profile?.name || '')
  const [rollNumber, setRollNumber] = useState('')
  const [skills, setSkills] = useState([])
  const [customSkill, setCustomSkill] = useState('')
  const [experienceLevel, setExperienceLevel] = useState('')
  const [preferredDomains, setPreferredDomains] = useState([])
  const [interests, setInterests] = useState('')

  useEffect(() => {
    if (profile?.name) setName(profile.name)
  }, [profile])

  const toggleSkill = (skill) => {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    )
  }

  const addCustomSkill = () => {
    if (customSkill.trim() && !skills.includes(customSkill.trim())) {
      setSkills((prev) => [...prev, customSkill.trim()])
      setCustomSkill('')
    }
  }

  const toggleDomain = (domain) => {
    setPreferredDomains((prev) =>
      prev.includes(domain) ? prev.filter((d) => d !== domain) : [...prev, domain]
    )
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateDoc(doc(db, 'studentProfiles', user.uid), {
        skills,
        experienceLevel,
        preferredDomains,
        interests,
        profileComplete: true,
        updatedAt: serverTimestamp(),
      })
      await updateDoc(doc(db, 'users', user.uid), {
        name,
        rollNumber,
      })
      navigate('/student/dashboard')
    } finally {
      setSaving(false)
    }
  }

  const canProceedStep1 = name.trim() && rollNumber.trim()
  const canProceedStep2 = skills.length > 0 && experienceLevel
  const canSaveStep3 = true

  const stepLabels = ['Basic Info', 'Skills', 'Preferences']

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="max-w-2xl mx-auto"
    >
      <div className="mb-8">
        <h2 className="text-[24px] font-bold text-[#1A2332] mb-2">Complete Your Profile</h2>
        <p className="text-[13px] text-[#6B7A8D]">
          Step {step} of 3 — {stepLabels[step - 1]}
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center mb-10">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 ${
                s === step
                  ? 'bg-[#1A2332] text-white shadow-sm'
                  : s < step
                  ? 'bg-[#10B981] text-white'
                  : 'bg-[#F4F6F9] text-[#9CA3AF] border border-[#E8ECF0]'
              }`}
            >
              {s < step ? <Check className="w-4 h-4" /> : s}
            </div>
            {s < 3 && (
              <div
                className={`w-16 h-[2px] mx-3 rounded-full transition-colors duration-200 ${
                  s < step ? 'bg-[#10B981]' : 'bg-[#E8ECF0]'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Card container */}
      <div className="bg-white rounded-2xl border border-[#E8ECF0] p-6 sm:p-8">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-5"
            >
              <div>
                <label className="block text-[13px] font-semibold text-[#1A2332] mb-[6px]">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-[14px] py-[11px] bg-white border-[1.5px] border-[#E8ECF0] rounded-xl text-[15px] text-[#1A2332] placeholder-[#9CA3AF] transition-all duration-150 ease-out focus:outline-none focus:border-[#3B82F6] focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)]"
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-[#1A2332] mb-[6px]">
                  Roll Number <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="text"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  placeholder="e.g., 21F-1234"
                  className="w-full px-[14px] py-[11px] bg-white border-[1.5px] border-[#E8ECF0] rounded-xl text-[15px] text-[#1A2332] placeholder-[#9CA3AF] transition-all duration-150 ease-out focus:outline-none focus:border-[#3B82F6] focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)]"
                />
              </div>
              <div className="pt-4 flex justify-end">
                <Button
                  onClick={() => setStep(2)}
                  disabled={!canProceedStep1}
                  rightIcon={ChevronRight}
                >
                  Next
                </Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6"
            >
              <div>
                <label className="block text-[13px] font-semibold text-[#1A2332] mb-3">
                  Select Your Skills
                </label>
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_SKILLS.map((skill) => (
                    <button
                      key={skill}
                      onClick={() => toggleSkill(skill)}
                      className={`px-3 py-[6px] rounded-full text-[13px] font-medium transition-all duration-150 ${
                        skills.includes(skill)
                          ? 'bg-[#1A2332] text-white shadow-sm'
                          : 'bg-[#F4F6F9] text-[#6B7A8D] hover:bg-[#E8ECF0] border border-[#E8ECF0]'
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 mt-3">
                  <input
                    type="text"
                    value={customSkill}
                    onChange={(e) => setCustomSkill(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addCustomSkill()}
                    placeholder="Add custom skill"
                    className="flex-1 px-[14px] py-[10px] bg-white border-[1.5px] border-[#E8ECF0] rounded-xl text-[14px] text-[#1A2332] placeholder-[#9CA3AF] transition-all duration-150 ease-out focus:outline-none focus:border-[#3B82F6] focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)]"
                  />
                  <Button size="sm" onClick={addCustomSkill} leftIcon={Plus}>
                    Add
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#1A2332] mb-3">
                  Experience Level
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {EXPERIENCE_LEVELS.map((level) => (
                    <button
                      key={level.value}
                      onClick={() => setExperienceLevel(level.value)}
                      className={`p-4 rounded-xl border-[1.5px] text-left transition-all duration-150 ${
                        experienceLevel === level.value
                          ? 'border-[#3B82F6] bg-[#EFF6FF]'
                          : 'border-[#E8ECF0] bg-white hover:border-[#CBD5E1]'
                      }`}
                    >
                      <div className="font-semibold text-[14px] text-[#1A2332]">{level.label}</div>
                      <div className="text-[12px] text-[#6B7A8D] mt-1 leading-relaxed">{level.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <Button variant="ghost" onClick={() => setStep(1)} leftIcon={ChevronLeft}>
                  Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!canProceedStep2}
                  rightIcon={ChevronRight}
                >
                  Next
                </Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6"
            >
              <div>
                <label className="block text-[13px] font-semibold text-[#1A2332] mb-3">
                  Preferred Domains
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {DOMAINS.map((domain) => (
                    <label
                      key={domain}
                      className={`flex items-center gap-2 p-3 rounded-xl border-[1.5px] cursor-pointer transition-all duration-150 ${
                        preferredDomains.includes(domain)
                          ? 'border-[#3B82F6] bg-[#EFF6FF]'
                          : 'border-[#E8ECF0] bg-white hover:border-[#CBD5E1]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={preferredDomains.includes(domain)}
                        onChange={() => toggleDomain(domain)}
                        className="w-4 h-4 accent-[#3B82F6]"
                      />
                      <span className="text-[13px] font-medium text-[#1A2332]">{domain}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#1A2332] mb-[6px]">
                  Interests (optional)
                </label>
                <textarea
                  value={interests}
                  onChange={(e) => setInterests(e.target.value.slice(0, 300))}
                  placeholder="Tell us about your interests..."
                  rows={4}
                  className="w-full px-[14px] py-[11px] bg-white border-[1.5px] border-[#E8ECF0] rounded-xl text-[15px] text-[#1A2332] placeholder-[#9CA3AF] transition-all duration-150 ease-out focus:outline-none focus:border-[#3B82F6] focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] resize-none"
                />
                <p className="text-[12px] text-[#9CA3AF] mt-1 text-right">
                  {interests.length}/300
                </p>
              </div>

              <div className="pt-4 flex justify-between">
                <Button variant="ghost" onClick={() => setStep(2)} leftIcon={ChevronLeft}>
                  Back
                </Button>
                <Button
                  onClick={handleSave}
                  loading={saving}
                  disabled={!canSaveStep3}
                >
                  Save Profile
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
