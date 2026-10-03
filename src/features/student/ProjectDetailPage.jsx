import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, User, Tag, ListOrdered, List, Wrench, Lock, Sparkles, RefreshCw, AlertCircle } from 'lucide-react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuthStore } from '../../stores/authStore'
import { projectService } from '../../services/projectService'
import { aiService } from '../../services/aiService'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import Card from '../../components/ui/Card'
import SkeletonLoader from '../../components/ui/SkeletonLoader'
import toast from 'react-hot-toast'

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25 } },
}

const domainAccentColors = {
  'AI/ML': '#3B82F6',
  'Mobile App': '#10B981',
  'Web Application': '#8B5CF6',
  'IoT': '#F59E0B',
  'Cybersecurity': '#EF4444',
  'Blockchain': '#6366F1',
  'Game Dev': '#EC4899',
}

export default function ProjectDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [studentProfile, setStudentProfile] = useState(null)
  const [group, setGroup] = useState(null)
  const [showLockModal, setShowLockModal] = useState(false)
  const [lockNote, setLockNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [enhancements, setEnhancements] = useState(null)
  const [loadingEnhancements, setLoadingEnhancements] = useState(false)
  const [enhancementsError, setEnhancementsError] = useState(null)

  useEffect(() => {
    const loadProject = async () => {
      setLoading(true)
      const p = await projectService.getProjectById(id)
      setProject(p)
      setLoading(false)
    }
    loadProject()
  }, [id])

  const fetchEnhancements = async (proj) => {
    if (!proj) return
    setLoadingEnhancements(true)
    setEnhancementsError(null)
    try {
      const result = await aiService.getProjectEnhancements(proj)
      setEnhancements(result)
    } catch (err) {
      console.error("Failed to fetch enhancements:", err)
      setEnhancementsError("Failed to load AI suggestions.")
    } finally {
      setLoadingEnhancements(false)
    }
  }

  useEffect(() => {
    if (project && !enhancements && !loadingEnhancements && !enhancementsError) {
      fetchEnhancements(project)
    }
  }, [project])

  useEffect(() => {
    if (!user?.uid) return
    const unsub = onSnapshot(doc(db, 'studentProfiles', user.uid), (snap) => {
      if (snap.exists()) setStudentProfile(snap.data())
    })
    return unsub
  }, [user?.uid])

  useEffect(() => {
    if (!studentProfile?.groupId) {
      setGroup(null)
      return
    }
    const unsub = onSnapshot(doc(db, 'groups', studentProfile.groupId), (snap) => {
      if (snap.exists()) setGroup({ id: snap.id, ...snap.data() })
    })
    return unsub
  }, [studentProfile?.groupId])

  const handleSubmitLock = async () => {
    if (lockNote.trim().length < 20) return
    setSubmitting(true)
    try {
      await projectService.submitLockRequest(group.id, id, user.uid, lockNote.trim())
      toast.success('Lock request submitted!')
      setShowLockModal(false)
      setLockNote('')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const isLeader = group?.leaderId === user?.uid
  const hasLockedProject = !!group?.lockedProjectId
  const isLocked = project?.isLocked
  const canRequestLock = isLeader && !hasLockedProject && !isLocked

  const difficultyBadge = {
    Beginner: { bg: '#ECFDF5', text: '#10B981', label: 'Beginner' },
    Intermediate: { bg: '#FFFBEB', text: '#F59E0B', label: 'Intermediate' },
    Advanced: { bg: '#FEF2F2', text: '#EF4444', label: 'Advanced' },
  }

  const accentColor = domainAccentColors[project?.domain] || '#3B82F6'

  if (loading) {
    return (
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        className="max-w-3xl mx-auto space-y-4"
      >
        <SkeletonLoader variant="text" lines={6} />
        <SkeletonLoader variant="card" />
      </motion.div>
    )
  }

  if (!project) {
    return (
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        className="text-center py-20"
      >
        <svg className="w-16 h-16 mx-auto mb-4 text-[#CBD5E1]" viewBox="0 0 64 64" fill="none">
          <rect x="12" y="20" width="40" height="28" rx="4" stroke="currentColor" strokeWidth="2"/>
          <path d="M20 28h24M20 34h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <p className="text-[#1A2332] font-semibold text-[16px] mb-1">Project not found</p>
        <p className="text-[#6B7A8D] text-[13px]">The project you are looking for does not exist.</p>
      </motion.div>
    )
  }

  const diff = difficultyBadge[project.difficultyLevel] || difficultyBadge.Beginner

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="max-w-3xl mx-auto pb-28"
    >
      {/* Back button */}
      <button
        onClick={() => navigate('/student/browse')}
        className="flex items-center gap-2 text-[13px] text-[#6B7A8D] hover:text-[#1A2332] mb-5 transition-colors duration-150"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Browse
      </button>

      {/* Title + badges */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span
            className="px-2.5 py-1 rounded-full text-[11px] font-semibold"
            style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
          >
            {project.domain}
          </span>
          <span
            className="px-2.5 py-1 rounded-full text-[11px] font-semibold"
            style={{ backgroundColor: diff.bg, color: diff.text }}
          >
            {diff.label}
          </span>
          {isLocked && (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#FEF2F2] text-[#EF4444]">
              Locked
            </span>
          )}
        </div>
        <h1 className="text-[24px] font-bold text-[#1A2332] leading-tight">{project.title}</h1>
      </div>

      {/* Description */}
      <Card className="mb-5" hover={false}>
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-[#F4F6F9]">
          <Tag className="w-4 h-4 text-[#3B82F6]" />
          <h3 className="text-[15px] font-semibold text-[#1A2332]">Description</h3>
        </div>
        <p className="text-[14px] text-[#6B7A8D] leading-relaxed">{project.description}</p>
      </Card>

      {/* Objectives */}
      {project.objectives?.length > 0 && (
        <Card className="mb-5" hover={false}>
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-[#F4F6F9]">
            <ListOrdered className="w-4 h-4 text-[#3B82F6]" />
            <h3 className="text-[15px] font-semibold text-[#1A2332]">Objectives</h3>
          </div>
          <ol className="space-y-3">
            {project.objectives.map((obj, i) => (
              <li key={i} className="flex gap-3 text-[14px] text-[#6B7A8D]">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#EFF6FF] text-[#3B82F6] text-[11px] font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{obj}</span>
              </li>
            ))}
          </ol>
        </Card>
      )}

      {/* Features */}
      {project.features?.length > 0 && (
        <Card className="mb-5" hover={false}>
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-[#F4F6F9]">
            <List className="w-4 h-4 text-[#3B82F6]" />
            <h3 className="text-[15px] font-semibold text-[#1A2332]">Features</h3>
          </div>
          <ul className="space-y-2">
            {project.features.map((feat, i) => (
              <li key={i} className="flex items-start gap-2 text-[14px] text-[#6B7A8D]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#CBD5E1] mt-[7px] flex-shrink-0" />
                <span className="leading-relaxed">{feat}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Technologies */}
      {project.technologies?.length > 0 && (
        <Card className="mb-5" hover={false}>
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-[#F4F6F9]">
            <Wrench className="w-4 h-4 text-[#3B82F6]" />
            <h3 className="text-[15px] font-semibold text-[#1A2332]">Technologies</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {project.technologies.map((tech) => (
              <span
                key={tech}
                className="px-3 py-[5px] bg-[#F4F6F9] rounded-full text-[12px] font-medium text-[#6B7A8D]"
              >
                {tech}
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* Supervisor (Developer Details) */}
      <Card className="mb-5" hover={false}>
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-[#F4F6F9]">
          <User className="w-4 h-4 text-[#3B82F6]" />
          <h3 className="text-[15px] font-semibold text-[#1A2332]">Developer / Supervisor Details</h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[#3B82F6] text-[13px] font-bold">
            {project.supervisorName?.charAt(0)?.toUpperCase() || 'S'}
          </div>
          <p className="text-[14px] text-[#1A2332] font-medium">{project.supervisorName}</p>
        </div>
      </Card>

      {/* AI Enhancement Suggestions */}
      <Card hover={false} className="relative overflow-hidden border-[#E8ECF0]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#F4F6F9] relative z-10">
          <Sparkles className="w-5 h-5 text-indigo-500" />
          <h3 className="text-[16px] font-bold text-[#1A2332]">AI Enhancement Suggestions</h3>
          {loadingEnhancements && (
            <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin ml-auto" />
          )}
        </div>
        
        <div className="relative z-10">
          {loadingEnhancements ? (
            <div className="space-y-4">
              <SkeletonLoader variant="text" lines={2} />
              <SkeletonLoader variant="text" lines={2} />
              <SkeletonLoader variant="text" lines={2} />
            </div>
          ) : enhancementsError ? (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
               <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
               <p className="text-[13px] text-red-600">{enhancementsError}</p>
            </div>
          ) : enhancements && enhancements.length > 0 ? (
            <div className="space-y-4">
              {enhancements.map((enh, i) => (
                <div key={i} className="p-4 bg-gradient-to-br from-indigo-50/50 to-white border border-indigo-100/50 rounded-xl hover:shadow-sm transition-all duration-200">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h4 className="text-[14px] font-bold text-indigo-900">{enh.title}</h4>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 shrink-0">
                      {enh.difficulty || 'Enhancement'}
                    </span>
                  </div>
                  <p className="text-[13px] text-slate-600 leading-relaxed">{enh.description}</p>
                </div>
              ))}
            </div>
          ) : (
             <p className="text-[13px] text-slate-500 italic">No suggestions available at the moment.</p>
          )}
        </div>
      </Card>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white border-t border-[#E8ECF0] px-4 py-4 z-30">
        <div className="max-w-3xl mx-auto">
          {canRequestLock ? (
            <Button fullWidth onClick={() => setShowLockModal(true)}>
              <Lock className="w-4 h-4 mr-2" />
              Request to Lock
            </Button>
          ) : !isLeader && !hasLockedProject ? (
            <p className="text-[13px] text-[#6B7A8D] text-center">
              Only your group leader can submit a lock request
            </p>
          ) : group?.lockStatus === 'pending' ? (
            <div className="flex items-center justify-center gap-2 text-[13px] text-[#F59E0B]">
              <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse" />
              <span className="font-medium">Lock request pending approval</span>
            </div>
          ) : hasLockedProject ? (
            <div className="flex items-center justify-center gap-2 text-[13px] text-[#10B981]">
              <span className="w-2 h-2 rounded-full bg-[#10B981]" />
              <span className="font-medium">Your group has already locked a project</span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Lock Modal */}
      <Modal
        open={showLockModal}
        onClose={() => setShowLockModal(false)}
        title="Request Project Lock"
      >
        <div className="space-y-4">
          <p className="text-[14px] text-[#6B7A8D]">
            Project: <span className="font-semibold text-[#1A2332]">{project.title}</span>
          </p>
          <div>
            <label className="block text-[13px] font-semibold text-[#1A2332] mb-[6px]">
              Why does your group want this project?
            </label>
            <textarea
              value={lockNote}
              onChange={(e) => setLockNote(e.target.value)}
              placeholder="Minimum 20 characters..."
              rows={4}
              className="w-full px-[14px] py-[11px] bg-white border-[1.5px] border-[#E8ECF0] rounded-xl text-[15px] text-[#1A2332] placeholder-[#9CA3AF] transition-all duration-150 ease-out focus:outline-none focus:border-[#3B82F6] focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] resize-none"
            />
            <p className="text-[12px] text-[#9CA3AF] mt-1 text-right">
              {lockNote.length} chars
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowLockModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitLock}
              loading={submitting}
              disabled={lockNote.trim().length < 20}
            >
              Submit Request
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}
