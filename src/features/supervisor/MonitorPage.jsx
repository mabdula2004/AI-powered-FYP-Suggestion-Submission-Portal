import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Monitor,
  Unlock,
  Loader2,
  X,
  Check,
  Save,
  AlertTriangle,
  Bell,
  Send,
} from 'lucide-react'
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore'
import { formatDate } from '../../lib/utils'
import { db } from '../../lib/firebase'
import { useAuthStore } from '../../stores/authStore'
import { notificationService } from '../../services/notificationService'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import SkeletonLoader from '../../components/ui/SkeletonLoader'
import EmptyState from '../../components/ui/EmptyState'
import toast from 'react-hot-toast'

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25 } },
}

export default function MonitorPage() {
  const { user } = useAuthStore()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [milestones, setMilestones] = useState([])
  const [showDetail, setShowDetail] = useState(false)
  const [showUnlockModal, setShowUnlockModal] = useState(false)
  const [feedbackMap, setFeedbackMap] = useState({})
  const [savingFeedback, setSavingFeedback] = useState(false)
  const [showNotifyModal, setShowNotifyModal] = useState(false)
  const [notifySubject, setNotifySubject] = useState('')
  const [notifyMessage, setNotifyMessage] = useState('')
  const [sendingNotify, setSendingNotify] = useState(false)
  const [notifyGroupTarget, setNotifyGroupTarget] = useState(null)

  useEffect(() => {
    if (!user?.uid) return

    const loadGroups = async () => {
      setLoading(true)

      const approvedSnap = await getDocs(
        query(collection(db, 'lockRequests'), where('status', '==', 'approved'))
      )

      const groupIds = new Set(approvedSnap.docs.map((d) => d.data().groupId))
      const projectIds = new Set(approvedSnap.docs.map((d) => d.data().projectId))

      if (projectIds.size === 0) {
        setGroups([])
        setLoading(false)
        return
      }

      // Chunk the projectIds to avoid Firestore's 10-item limit for 'in' queries
      const projectIdsArray = Array.from(projectIds)
      const projectChunks = []
      for (let i = 0; i < projectIdsArray.length; i += 10) {
        projectChunks.push(projectIdsArray.slice(i, i + 10))
      }

      const projectsDocs = (
        await Promise.all(
          projectChunks.map((chunk) =>
            getDocs(
              query(
                collection(db, 'projects'),
                where('__name__', 'in', chunk),
                where('supervisorId', '==', user.uid)
              )
            )
          )
        )
      ).flatMap((snap) => snap.docs)

      const supervisorProjectIds = new Set(projectsDocs.map((d) => d.id))

      const validGroupIds = approvedSnap.docs
        .filter((d) => supervisorProjectIds.has(d.data().projectId))
        .map((d) => d.data().groupId)

      if (validGroupIds.length === 0) {
        setGroups([])
        setLoading(false)
        return
      }

      const enriched = await Promise.all(
        validGroupIds.map(async (groupId) => {
          const groupSnap = await getDoc(doc(db, 'groups', groupId))
          if (!groupSnap.exists()) return null
          const g = { id: groupSnap.id, ...groupSnap.data() }

          const members = []
          for (const mUid of g.members || []) {
            const uSnap = await getDoc(doc(db, 'users', mUid))
            if (uSnap.exists()) members.push(uSnap.data().name)
          }

          const projectSnap = await getDoc(doc(db, 'projects', g.lockedProjectId))
          const projectTitle = projectSnap.exists() ? projectSnap.data().title : 'Unknown'

          const milestoneSnap = await getDocs(
            query(collection(db, 'milestones'), where('groupId', '==', groupId))
          )
          const ms = milestoneSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
          const completedCount = ms.filter((m) => m.isCompleted).length
          const lastCompleted = ms
            .filter((m) => m.isCompleted && m.completedAt)
            .sort((a, b) => b.completedAt.seconds - a.completedAt.seconds)[0]

          return {
            ...g,
            members,
            projectTitle,
            milestones: ms,
            completedCount,
            lastCompletedDate: lastCompleted?.completedAt,
          }
        })
      )

      setGroups(enriched.filter(Boolean))
      setLoading(false)
    }

    loadGroups()
  }, [user?.uid])

  const viewDetails = async (group) => {
    setSelectedGroup(group)
    const ms = group.milestones.sort((a, b) => a.phase - b.phase)
    setMilestones(ms)
    const fb = {}
    ms.forEach((m) => { fb[m.id] = m.supervisorFeedback || '' })
    setFeedbackMap(fb)
    setShowDetail(true)
  }

  const handleSaveFeedback = async (milestoneId) => {
    if (!feedbackMap[milestoneId]?.trim()) return
    setSavingFeedback(true)
    try {
      await updateDoc(doc(db, 'milestones', milestoneId), {
        supervisorFeedback: feedbackMap[milestoneId],
      })
      toast.success('Feedback saved')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSavingFeedback(false)
    }
  }

  const handleUnlock = async () => {
    if (!selectedGroup) return
    setSavingFeedback(true)

    try {
      const batch = writeBatch(db)

      batch.update(doc(db, 'projects', selectedGroup.lockedProjectId), {
        isLocked: false,
        lockedByGroupId: null,
      })

      batch.update(doc(db, 'groups', selectedGroup.id), {
        lockStatus: 'none',
        lockedProjectId: null,
      })

      await batch.commit()

      const msSnap = await getDocs(
        query(collection(db, 'milestones'), where('groupId', '==', selectedGroup.id))
      )
      await Promise.all(msSnap.docs.map((d) => deleteDoc(doc(db, 'milestones', d.id))))

      const members = selectedGroup.membersUids || []
      if (members.length > 0) {
        await notificationService.sendToMany(
          members,
          'Project Unlocked',
          `The project "${selectedGroup.projectTitle}" has been unlocked by your supervisor.`,
          'PROJECT_UNLOCKED'
        )
      }

      toast.success('Project unlocked successfully')
      setShowUnlockModal(false)
      setShowDetail(false)
      setSelectedGroup(null)
      setGroups((prev) => prev.filter((g) => g.id !== selectedGroup.id))
    } finally {
      setSavingFeedback(false)
    }
  }

  const handleSendNotification = async () => {
    if (!notifyGroupTarget || !notifySubject.trim() || !notifyMessage.trim()) return
    setSendingNotify(true)
    try {
      const gSnap = await getDoc(doc(db, 'groups', notifyGroupTarget.id))
      const uids = gSnap.exists() ? gSnap.data().members : []
      
      if (uids && uids.length > 0) {
        await notificationService.sendToMany(
          uids,
          notifySubject.trim(),
          notifyMessage.trim(),
          'SUPERVISOR_NOTE'
        )
        toast.success('Notification sent to all group members')
      } else {
        toast.error('No members found in this group')
      }
      
      setShowNotifyModal(false)
      setNotifySubject('')
      setNotifyMessage('')
      setNotifyGroupTarget(null)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSendingNotify(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonLoader variant="card" />
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
        <h2 className="text-[24px] font-bold text-[#1A2332] mb-1">Monitor Students</h2>
        <p className="text-[13px] text-[#6B7A8D]">Track progress of groups working on your projects</p>
      </div>

      {groups.length === 0 ? (
        <EmptyState
          icon={Monitor}
          title="No active groups"
          subtitle="Groups will appear here once they lock your projects"
        />
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <Card key={group.id} hover={false}>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-bold text-[14px] text-[#1A2332]">{group.projectTitle}</h4>
                  <p className="text-[12px] text-[#6B7A8D] mt-1">
                    Members: {group.members.join(', ')}
                  </p>

                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[12px] mb-1.5">
                      <span className="text-[#6B7A8D]">Milestone Progress</span>
                      <span className="font-semibold text-[#1A2332]">{group.completedCount} / 5</span>
                    </div>
                    <div className="w-full bg-[#F4F6F9] rounded-full h-2">
                      <div
                        className="bg-[#3B82F6] h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(group.completedCount / 5) * 100}%` }}
                      />
                    </div>
                  </div>

                  {group.lastCompletedDate && (
                    <p className="text-[11px] text-[#9CA3AF] mt-2">
                      Last milestone completed: {formatDate(group.lastCompletedDate)}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => { setNotifyGroupTarget(group); setShowNotifyModal(true) }}
                  >
                    <Bell className="w-4 h-4 mr-1" /> Notify
                  </Button>
                  <Button variant="secondary" onClick={() => viewDetails(group)}>
                    View Details
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showDetail && selectedGroup && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 right-0 w-full md:w-[480px] bg-white shadow-2xl z-50 overflow-y-auto border-l border-[#E8ECF0]"
          >
            <div className="sticky top-0 bg-white border-b border-[#E8ECF0] px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-[16px] font-bold text-[#1A2332]">{selectedGroup.projectTitle}</h3>
                <p className="text-[12px] text-[#6B7A8D]">{selectedGroup.members.join(', ')}</p>
              </div>
              <button onClick={() => setShowDetail(false)} className="p-2 hover:bg-[#F4F6F9] rounded-lg transition-colors duration-150">
                <X className="w-5 h-5 text-[#6B7A8D]" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {milestones.map((m) => (
                <div key={m.id} className="flex gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    m.isCompleted ? 'bg-[#10B981] text-white' : 'bg-[#F4F6F9] text-[#9CA3AF]'
                  }`}>
                    {m.isCompleted ? <Check className="w-4 h-4" /> : <span className="text-[11px] font-bold">{m.phase}</span>}
                  </div>
                  <div className="flex-1">
                    <p className="text-[14px] font-medium text-[#1A2332]">{m.phaseName}</p>
                    <p className="text-[12px] text-[#6B7A8D]">
                      {m.isCompleted ? `Completed on ${formatDate(m.completedAt)}` : 'Not started'}
                    </p>

                    {m.submissionLink && (
                      <div className="mt-3 p-3 bg-[#F4F6F9] rounded-lg border border-[#E8ECF0]">
                        <p className="text-[12px] font-bold text-[#1A2332] mb-1">Student Submission:</p>
                        <a href={m.submissionLink} target="_blank" rel="noopener noreferrer" className="text-[13px] text-[#3B82F6] hover:underline break-all">
                          {m.submissionLink}
                        </a>
                        {m.submissionNote && (
                          <p className="text-[12px] text-[#6B7A8D] mt-2 italic">"{m.submissionNote}"</p>
                        )}
                      </div>
                    )}

                    <div className="mt-3 space-y-2">
                      <textarea
                        value={feedbackMap[m.id] || ''}
                        onChange={(e) => setFeedbackMap({ ...feedbackMap, [m.id]: e.target.value })}
                        rows={2}
                        className="w-full px-[14px] py-[10px] bg-white border-[1.5px] border-[#E8ECF0] rounded-xl text-[13px] text-[#1A2332] placeholder-[#9CA3AF] transition-all duration-150 ease-out focus:outline-none focus:border-[#3B82F6] focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] resize-none"
                        placeholder="Supervisor feedback..."
                      />
                      <Button size="sm" onClick={() => handleSaveFeedback(m.id)} disabled={savingFeedback}>
                        <Save className="w-3 h-3 mr-1" /> Save Feedback
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              <div className="pt-4 border-t border-[#F4F6F9]">
                <Button
                  variant="danger"
                  fullWidth
                  onClick={() => setShowUnlockModal(true)}
                >
                  <Unlock className="w-4 h-4 mr-1" /> Unlock Project
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Modal
        open={showUnlockModal}
        onClose={() => setShowUnlockModal(false)}
        title="Unlock Project"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-[#F59E0B]">
            <AlertTriangle className="w-5 h-5" />
            <p className="text-[14px] font-medium">Are you sure?</p>
          </div>
          <p className="text-[14px] text-[#6B7A8D]">
            This will release the project "{selectedGroup?.projectTitle}" for other groups. All milestones will be deleted.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowUnlockModal(false)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={handleUnlock}
              disabled={savingFeedback}
            >
              {savingFeedback ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Unlock className="w-4 h-4 mr-1" />}
              Confirm Unlock
            </Button>
          </div>
        </div>
      </Modal>
      <Modal
        open={showNotifyModal}
        onClose={() => { setShowNotifyModal(false); setNotifySubject(''); setNotifyMessage(''); setNotifyGroupTarget(null) }}
        title="Notify Group Members"
      >
        <div className="space-y-4">
          <p className="text-[14px] text-[#6B7A8D]">
            Send a notification to all members of <span className="font-semibold text-[#1A2332]">"{notifyGroupTarget?.projectTitle}"</span>.
          </p>
          
          <div>
            <label className="block text-[13px] font-semibold text-[#1A2332] mb-1.5">Subject</label>
            <input
              type="text"
              value={notifySubject}
              onChange={(e) => setNotifySubject(e.target.value)}
              className="w-full px-[14px] py-[10px] bg-white border-[1.5px] border-[#E8ECF0] rounded-xl text-[14px] text-[#1A2332] placeholder-[#9CA3AF] transition-all duration-150 ease-out focus:outline-none focus:border-[#3B82F6] focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)]"
              placeholder="e.g. Milestone Review Meeting"
            />
          </div>
          
          <div>
            <label className="block text-[13px] font-semibold text-[#1A2332] mb-1.5">Message</label>
            <textarea
              value={notifyMessage}
              onChange={(e) => setNotifyMessage(e.target.value)}
              rows={4}
              className="w-full px-[14px] py-[10px] bg-white border-[1.5px] border-[#E8ECF0] rounded-xl text-[14px] text-[#1A2332] placeholder-[#9CA3AF] transition-all duration-150 ease-out focus:outline-none focus:border-[#3B82F6] focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] resize-none"
              placeholder="Type your message here..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-[#E8ECF0] mt-4">
            <Button variant="ghost" onClick={() => setShowNotifyModal(false)}>Cancel</Button>
            <Button
              onClick={handleSendNotification}
              disabled={sendingNotify || !notifySubject.trim() || !notifyMessage.trim()}
            >
              {sendingNotify ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
              Send Notification
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}
