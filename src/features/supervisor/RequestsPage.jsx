import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  CheckCircle,
  XCircle,
  ClipboardList,
  Users,
  Loader2,
} from 'lucide-react'
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore'
import { formatDistanceToNow } from 'date-fns'
import { db } from '../../lib/firebase'
import { useAuthStore } from '../../stores/authStore'
import { notificationService } from '../../services/notificationService'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import SkeletonLoader from '../../components/ui/SkeletonLoader'
import EmptyState from '../../components/ui/EmptyState'
import toast from 'react-hot-toast'

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25 } },
}

export default function RequestsPage() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('pending')
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [approveNote, setApproveNote] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [processing, setProcessing] = useState(false)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)

  useEffect(() => {
    if (!user?.uid) return

    const loadRequests = async () => {
      setLoading(true)
      try {
        // 1. Get all this supervisor's project IDs
        const projectsSnap = await getDocs(
          query(collection(db, 'projects'), where('supervisorId', '==', user.uid))
        )
        const projectIds = projectsSnap.docs.map((d) => d.id)

        // 2. Guard: no projects → nothing to show
        if (projectIds.length === 0) {
          setRequests([])
          setLoading(false)
          return
        }

        // 3. Firestore 'in' supports max 10 items — chunk if needed
        const chunks = []
        for (let i = 0; i < projectIds.length; i += 10) {
          chunks.push(projectIds.slice(i, i + 10))
        }

        const allDocs = (
          await Promise.all(
            chunks.map((chunk) =>
              getDocs(
                query(
                  collection(db, 'lockRequests'),
                  where('projectId', 'in', chunk),
                  where('status', '==', activeTab)
                )
              )
            )
          )
        ).flatMap((snap) => snap.docs)

        // 4. Enrich each request with project + group + member data
        const enriched = await Promise.all(
          allDocs.map(async (d) => {
            const req = { id: d.id, ...d.data() }
            const [projectSnap, groupSnap] = await Promise.all([
              getDoc(doc(db, 'projects', req.projectId)),
              getDoc(doc(db, 'groups', req.groupId)),
            ])

            const members = []
            if (groupSnap.exists()) {
              const g = groupSnap.data()
              await Promise.all(
                (g.members || []).map(async (mUid) => {
                  const [uSnap, pSnap] = await Promise.all([
                    getDoc(doc(db, 'users', mUid)),
                    getDoc(doc(db, 'studentProfiles', mUid)),
                  ])
                  if (uSnap.exists()) {
                    members.push({
                      uid: mUid,
                      name: uSnap.data().name,
                      email: uSnap.data().email || '',
                      skills: pSnap.exists() ? pSnap.data().skills || [] : [],
                    })
                  }
                })
              )
            }

            return {
              ...req,
              projectTitle: projectSnap.exists() ? projectSnap.data().title : 'Unknown Project',
              groupName: groupSnap.exists() ? groupSnap.data().name : 'Unknown Group',
              members,
              leaderName: members.find((m) => m.uid === req.leaderId)?.name || 'Unknown',
              leaderEmail: members.find((m) => m.uid === req.leaderId)?.email || '',
            }
          })
        )

        setRequests(enriched)
      } catch (err) {
        console.error('[RequestsPage] loadRequests error:', err)
        setRequests([])
      } finally {
        setLoading(false)
      }
    }

    loadRequests()
  }, [user?.uid, activeTab])

  const handleApprove = async () => {
    if (!selectedRequest) return
    setProcessing(true)

    try {
      const batch = writeBatch(db)

      batch.update(doc(db, 'lockRequests', selectedRequest.id), {
        status: 'approved',
        supervisorNote: approveNote || '',
        resolvedAt: serverTimestamp(),
      })

      batch.update(doc(db, 'projects', selectedRequest.projectId), {
        isLocked: true,
        lockedByGroupId: selectedRequest.groupId,
        updatedAt: serverTimestamp(),
      })

      batch.update(doc(db, 'groups', selectedRequest.groupId), {
        lockStatus: 'approved',
        lockedProjectId: selectedRequest.projectId,
      })

      await batch.commit()

      const phases = [
        'Proposal Submission',
        'Requirements and SRS Document',
        'Development Phase 1 - Core Features',
        'Development Phase 2 - Testing and Refinement',
        'Final Submission and Documentation',
      ]

      for (let i = 0; i < phases.length; i++) {
        await addDoc(collection(db, 'milestones'), {
          groupId: selectedRequest.groupId,
          projectId: selectedRequest.projectId,
          phase: i + 1,
          phaseName: phases[i],
          isCompleted: false,
          completedAt: null,
          supervisorFeedback: null,
          createdAt: serverTimestamp(),
        })
      }

      await notificationService.sendToMany(
        selectedRequest.members.map((m) => m.uid),
        'Project Locked!',
        `Your request for "${selectedRequest.projectTitle}" has been approved. Start working on your FYP!`,
        'LOCK_APPROVED'
      )

      toast.success('Request approved successfully')
      setShowApproveModal(false)
      setSelectedRequest(null)
      setApproveNote('')

      setRequests((prev) => prev.filter((r) => r.id !== selectedRequest.id))
    } catch (err) {
      toast.error(err.message)
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!selectedRequest) return
    if (rejectReason.trim().length < 10) {
      toast.error('Rejection reason must be at least 10 characters')
      return
    }

    setProcessing(true)

    try {
      await updateDoc(doc(db, 'lockRequests', selectedRequest.id), {
        status: 'rejected',
        supervisorNote: rejectReason,
        resolvedAt: serverTimestamp(),
      })

      await updateDoc(doc(db, 'groups', selectedRequest.groupId), {
        lockStatus: 'rejected',
      })

      await notificationService.sendNotification(
        selectedRequest.leaderId,
        'Project Request Rejected',
        `Your request for "${selectedRequest.projectTitle}" was rejected. Reason: ${rejectReason}`,
        'LOCK_REJECTED'
      )

      toast.success('Request rejected')
      setShowRejectModal(false)
      setSelectedRequest(null)
      setRejectReason('')

      setRequests((prev) => prev.filter((r) => r.id !== selectedRequest.id))
    } catch (err) {
      toast.error(err.message)
    } finally {
      setProcessing(false)
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

  const tabs = ['pending', 'approved', 'rejected']
  const tabBadgeColor = {
    pending: { bg: '#FFFBEB', text: '#F59E0B' },
    approved: { bg: '#ECFDF5', text: '#10B981' },
    rejected: { bg: '#FEF2F2', text: '#EF4444' },
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      <div>
        <h2 className="text-[24px] font-bold text-[#1A2332] mb-1">Lock Requests</h2>
        <p className="text-[13px] text-[#6B7A8D]">Manage student project lock requests</p>
      </div>

      <div className="flex gap-1 border-b border-[#E8ECF0]">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-[13px] font-medium capitalize border-b-[2px] transition-colors duration-150 ${
              activeTab === tab
                ? 'border-[#3B82F6] text-[#3B82F6]'
                : 'border-transparent text-[#6B7A8D] hover:text-[#1A2332]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {requests.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={`No ${activeTab} requests`}
          subtitle="All clear for now"
        />
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <Card key={req.id} hover={false}>
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-bold text-[14px] text-[#1A2332]">{req.projectTitle}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[12px] text-[#6B7A8D]">
                      Leader: {req.leaderName}
                    </span>
                    <span className="text-[12px] text-[#E8ECF0]">|</span>
                    <span className="text-[12px] text-[#6B7A8D]">{req.leaderEmail || 'No email'}</span>
                  </div>

                  {req.note && (
                    <div className="mt-3 p-3 bg-[#FAFBFC] rounded-lg border-l-[3px] border-l-[#E8ECF0]">
                      <p className="text-[12px] text-[#6B7A8D] italic leading-relaxed">"{req.note}"</p>
                    </div>
                  )}

                  {req.members.length > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center gap-1 mb-1.5">
                        <Users className="w-3 h-3 text-[#9CA3AF]" />
                        <span className="text-[11px] text-[#6B7A8D]">
                          {req.members.length} member{req.members.length > 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {req.members.flatMap((m) => m.skills).slice(0, 8).map((skill, i) => (
                          <span key={i} className="px-2 py-[3px] bg-[#F4F6F9] text-[#6B7A8D] text-[10px] rounded-full font-medium">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-[11px] text-[#9CA3AF] mt-2">
                    {req.createdAt?.toDate
                      ? formatDistanceToNow(req.createdAt.toDate(), { addSuffix: true })
                      : 'Just now'}
                  </p>
                </div>

                {activeTab === 'pending' && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="danger"
                      onClick={() => { setSelectedRequest(req); setShowRejectModal(true) }}
                    >
                      <XCircle className="w-4 h-4 mr-1" /> Reject
                    </Button>
                    <Button
                      onClick={() => { setSelectedRequest(req); setShowApproveModal(true) }}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" /> Approve
                    </Button>
                  </div>
                )}
                {activeTab !== 'pending' && (
                  <span
                    className="px-2.5 py-[3px] rounded-full text-[10px] font-semibold"
                    style={{
                      backgroundColor: tabBadgeColor[activeTab].bg,
                      color: tabBadgeColor[activeTab].text,
                    }}
                  >
                    {activeTab === 'approved' ? 'Approved' : 'Rejected'}
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={showApproveModal}
        onClose={() => { setShowApproveModal(false); setSelectedRequest(null); setApproveNote('') }}
        title="Approve Request"
      >
        <div className="space-y-4">
          <p className="text-[14px] text-[#6B7A8D]">
            Approve the lock request for <span className="font-semibold text-[#1A2332]">"{selectedRequest?.projectTitle}"</span>?
          </p>
          <textarea
            value={approveNote}
            onChange={(e) => setApproveNote(e.target.value)}
            rows={3}
            className="w-full px-[14px] py-[11px] bg-white border-[1.5px] border-[#E8ECF0] rounded-xl text-[14px] text-[#1A2332] placeholder-[#9CA3AF] transition-all duration-150 ease-out focus:outline-none focus:border-[#3B82F6] focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] resize-none"
            placeholder="Optional note for the group (optional)"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => { setShowApproveModal(false); setSelectedRequest(null) }}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={processing}>
              {processing ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-1" />}
              Confirm Approval
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={showRejectModal}
        onClose={() => { setShowRejectModal(false); setSelectedRequest(null); setRejectReason('') }}
        title="Reject Request"
      >
        <div className="space-y-4">
          <p className="text-[14px] text-[#6B7A8D]">
            Reject the lock request for <span className="font-semibold text-[#1A2332]">"{selectedRequest?.projectTitle}"</span>?
          </p>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
            className="w-full px-[14px] py-[11px] bg-white border-[1.5px] border-[#E8ECF0] rounded-xl text-[14px] text-[#1A2332] placeholder-[#9CA3AF] transition-all duration-150 ease-out focus:outline-none focus:border-[#EF4444] focus:shadow-[0_0_0_3px_rgba(239,68,68,0.1)] resize-none"
            placeholder="Rejection reason (required, min 10 characters)"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => { setShowRejectModal(false); setSelectedRequest(null) }}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleReject}
              disabled={processing || rejectReason.trim().length < 10}
            >
              {processing ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <XCircle className="w-4 h-4 mr-1" />}
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}
