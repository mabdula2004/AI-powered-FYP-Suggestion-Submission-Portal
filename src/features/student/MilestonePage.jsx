import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check,
  Flag,
  MessageSquareQuote,
} from 'lucide-react'
import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
  updateDoc,
  serverTimestamp,
  getDoc,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuthStore } from '../../stores/authStore'
import { formatDate } from '../../lib/utils'
import { notificationService } from '../../services/notificationService'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import toast from 'react-hot-toast'

export default function MilestonePage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [studentProfile, setStudentProfile] = useState(null)
  const [group, setGroup] = useState(null)
  const [project, setProject] = useState(null)
  const [milestones, setMilestones] = useState([])
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [activeMilestone, setActiveMilestone] = useState(null)
  const [submissionLink, setSubmissionLink] = useState('')
  const [submissionNote, setSubmissionNote] = useState('')

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
      setProject(null)
      setMilestones([])
      return
    }

    const unsubGroup = onSnapshot(doc(db, 'groups', studentProfile.groupId), async (snap) => {
      if (!snap.exists()) {
        setGroup(null)
        setProject(null)
        return
      }
      const g = { id: snap.id, ...snap.data() }
      setGroup(g)

      if (g.lockedProjectId) {
        const projSnap = await getDoc(doc(db, 'projects', g.lockedProjectId))
        if (projSnap.exists()) {
          setProject({ id: projSnap.id, ...projSnap.data() })
        }
      } else {
        setProject(null)
      }
    })

    const q = query(
      collection(db, 'milestones'),
      where('groupId', '==', studentProfile.groupId)
    )
    const unsubMilestones = onSnapshot(q, (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      docs.sort((a, b) => (a.phase || 0) - (b.phase || 0))
      setMilestones(docs)
    })

    return () => {
      unsubGroup()
      unsubMilestones()
    }
  }, [studentProfile?.groupId])

  const handleMarkComplete = (milestone) => {
    setActiveMilestone(milestone)
    setSubmissionLink('')
    setSubmissionNote('')
    setShowConfirmModal(true)
  }

  const confirmComplete = async () => {
    if (!activeMilestone) return
    if (!submissionLink.trim()) {
      toast.error('Submission Link is required')
      return
    }

    try {
      await updateDoc(doc(db, 'milestones', activeMilestone.id), {
        isCompleted: true,
        completedAt: serverTimestamp(),
        submissionLink: submissionLink.trim(),
        submissionNote: submissionNote.trim(),
      })

      if (project?.supervisorId) {
        await notificationService.sendNotification(
          project.supervisorId,
          'Milestone Completed',
          `Phase ${activeMilestone.phase}: "${activeMilestone.phaseName}" for "${project.title}" has been marked complete.`,
          'MILESTONE_COMPLETED'
        )
      }

      toast.success('Milestone marked complete!')
      setShowConfirmModal(false)
      setActiveMilestone(null)
      setSubmissionLink('')
      setSubmissionNote('')
    } catch (err) {
      toast.error(err.message)
    }
  }

  const isLeader = group?.leaderId === user?.uid

  const getCurrentActivePhase = () => {
    for (let i = 0; i < milestones.length; i++) {
      if (!milestones[i].isCompleted) return i
    }
    return milestones.length
  }

  const currentActiveIndex = getCurrentActivePhase()

  if (!group?.lockedProjectId) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-12 flex flex-col items-center justify-center text-center max-w-2xl mx-auto mt-12 shadow-sm">
        <div className="w-16 h-16 bg-bg-secondary rounded-full flex items-center justify-center mb-6">
          <Flag className="w-8 h-8 text-text-muted" />
        </div>
        <h3 className="text-[20px] font-bold text-navy mb-2">No active project yet</h3>
        <p className="text-[14px] text-text-muted mb-8">Browse and lock a project to start tracking your milestones</p>
        <button
          onClick={() => navigate('/student/browse')}
          className="px-6 py-3 bg-gradient-to-r from-accent to-accent-dark text-white rounded-xl font-bold shadow-sm hover:shadow-md transition-all"
        >
          Browse Projects
        </button>
      </div>
    )
  }

  const inputClass = "w-full px-[14px] py-[10px] bg-white border-[1.5px] border-[#E8ECF0] rounded-xl text-[14px] text-navy placeholder-text-muted transition-all duration-150 ease-out focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)]"

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="bg-surface rounded-2xl shadow-sm border border-border p-6 flex items-center justify-between">
        <div>
          <h2 className="text-[24px] font-bold text-navy leading-tight mb-1">Project Milestones</h2>
          <p className="text-[14px] text-text-muted font-medium">{project?.title}</p>
        </div>
        <div className="px-4 py-2 bg-bg-secondary rounded-xl border border-border flex items-center gap-2">
           <Flag className="w-4 h-4 text-text-secondary" />
           <span className="text-[13px] font-bold text-text-secondary">
             {currentActiveIndex} / {milestones.length} Completed
           </span>
        </div>
      </div>

      <div className="relative pl-8 pr-4 py-4">
        {/* Vertical background line */}
        <div className="absolute left-[54px] top-4 bottom-4 w-[3px] bg-bg-tertiary rounded-full" />
        
        {/* Vertical active line with shimmer */}
        {currentActiveIndex > 0 && (
          <div 
            className="absolute left-[54px] top-4 w-[3px] rounded-full overflow-hidden" 
            style={{ height: `calc(${(currentActiveIndex / milestones.length) * 100}% - 24px)` }}
          >
            <div className="w-full h-full bg-gradient-to-b from-success to-accent animate-shimmer" style={{ backgroundSize: '100% 200%' }} />
          </div>
        )}

        <div className="space-y-12">
          {milestones.map((milestone, index) => {
            const isCompleted = milestone.isCompleted
            const isActive = index === currentActiveIndex && !isCompleted
            const isFuture = index > currentActiveIndex

            return (
              <motion.div
                key={milestone.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative flex gap-8 items-start"
              >
                {/* Circle */}
                <div className="relative z-10 flex-shrink-0 mt-1.5">
                  <div
                    className={`w-[52px] h-[52px] rounded-full flex items-center justify-center transition-all duration-300 ${
                      isCompleted
                        ? 'bg-gradient-to-br from-success to-emerald-600 shadow-[0_0_15px_rgba(11,171,106,0.3)]'
                        : isActive
                        ? 'bg-gradient-to-br from-accent to-accent-dark animate-breathing-glow'
                        : 'bg-bg-tertiary border-[3px] border-border text-text-muted'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-6 h-6 text-white" strokeWidth={3} />
                    ) : isActive ? (
                      <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                    ) : (
                      <span className="text-[16px] font-bold">{milestone.phase}</span>
                    )}
                  </div>
                </div>

                {/* Content Card */}
                <div className={`flex-1 rounded-2xl p-5 transition-all duration-300 relative overflow-hidden ${
                  isCompleted 
                    ? 'bg-success-light/30 border border-success/20 border-l-[4px] border-l-success shadow-sm hover:shadow-md' 
                    : isActive 
                    ? 'bg-accent-light/30 border border-accent/20 border-l-[4px] border-l-accent shadow-md hover:shadow-lg' 
                    : 'bg-surface border border-border shadow-sm border-l-[4px] border-l-bg-tertiary hover:shadow-md'
                }`}>
                  
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
                  )}

                  <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className={`font-bold text-[16px] ${isCompleted ? 'text-success' : isActive ? 'text-accent-dark' : 'text-navy'}`}>
                          {milestone.phaseName}
                        </h4>
                        {isCompleted && (
                           <span className="text-[10px] uppercase tracking-wider font-bold bg-success text-white px-2 py-0.5 rounded-full">
                             Done
                           </span>
                        )}
                        {isActive && (
                           <span className="text-[10px] uppercase tracking-wider font-bold bg-accent text-white px-2 py-0.5 rounded-full">
                             In Progress
                           </span>
                        )}
                      </div>
                      
                      <p className="text-[13px] text-text-muted font-medium mt-1">
                        {isCompleted
                          ? `Completed on ${formatDate(milestone.completedAt)}`
                          : isActive
                          ? 'Focus on this phase now'
                          : 'Upcoming phase'}
                      </p>

                      {milestone.supervisorFeedback && (
                        <div className="mt-4 p-4 bg-white/60 rounded-xl border border-border/50">
                          <div className="flex items-center gap-2 mb-2">
                            <MessageSquareQuote className="w-4 h-4 text-accent" />
                            <span className="text-[12px] font-bold text-navy uppercase tracking-wider">
                              Supervisor Feedback
                            </span>
                          </div>
                          <p className="text-[13px] text-text-secondary leading-relaxed">
                            {milestone.supervisorFeedback}
                          </p>
                        </div>
                      )}

                      {isCompleted && milestone.submissionLink && (
                        <div className="mt-3 text-[12px]">
                          <span className="text-text-muted">Your Submission: </span>
                          <a 
                            href={milestone.submissionLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-accent font-medium hover:underline truncate inline-block max-w-[250px] align-bottom"
                          >
                            {milestone.submissionLink}
                          </a>
                        </div>
                      )}
                    </div>

                    {isActive && isLeader && (
                      <button 
                        onClick={() => handleMarkComplete(milestone)}
                        className="px-5 py-2.5 bg-gradient-to-r from-accent to-accent-dark text-white text-[13px] font-bold rounded-xl shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all whitespace-nowrap"
                      >
                        Mark Complete
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Custom Modal for Confirmation */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-navy/50 backdrop-blur-sm"
              onClick={() => setShowConfirmModal(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative bg-surface rounded-2xl shadow-xl w-full max-w-[400px] overflow-hidden"
            >
              <div className="p-6 bg-bg-secondary border-b border-border flex items-center justify-between">
                 <h3 className="text-[18px] font-bold text-navy">Confirm Completion</h3>
              </div>
              <div className="p-6 space-y-6">
                <p className="text-[14px] text-text-secondary leading-relaxed">
                  Provide a link to your work for <span className="font-bold text-navy">"{activeMilestone?.phaseName}"</span>.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[13px] font-bold text-navy mb-1.5">Submission Link (Required) *</label>
                    <input
                      type="url"
                      placeholder="https://github.com/... or Google Drive link"
                      className={inputClass}
                      value={submissionLink}
                      onChange={(e) => setSubmissionLink(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-bold text-navy mb-1.5">Notes (Optional)</label>
                    <textarea
                      placeholder="Briefly describe what you are submitting..."
                      rows={2}
                      className={`${inputClass} resize-none`}
                      value={submissionNote}
                      onChange={(e) => setSubmissionNote(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/50 mt-2">
                  <button 
                    onClick={() => setShowConfirmModal(false)}
                    className="px-4 py-2 text-[14px] font-bold text-text-secondary hover:text-navy transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={confirmComplete}
                    disabled={!submissionLink.trim()}
                    className="px-5 py-2 bg-success text-white text-[14px] font-bold rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Confirm Complete
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
