import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Link2,
  Copy,
  Check,
  LogOut,
  Trash2,
  Search,
  Crown,
} from 'lucide-react'
import { doc, onSnapshot, getDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuthStore } from '../../stores/authStore'
import { groupService } from '../../services/groupService'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import toast from 'react-hot-toast'

export default function GroupPage() {
  const navigate = useNavigate()
  const { user, profile } = useAuthStore()
  const [studentProfile, setStudentProfile] = useState(null)
  const [group, setGroup] = useState(null)
  const [members, setMembers] = useState([])
  const [inviteCodeInput, setInviteCodeInput] = useState('')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [showDisbandModal, setShowDisbandModal] = useState(false)

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
      setMembers([])
      return
    }

    const unsub = onSnapshot(doc(db, 'groups', studentProfile.groupId), async (snap) => {
      if (!snap.exists()) {
        setGroup(null)
        setMembers([])
        return
      }

      const g = { id: snap.id, ...snap.data() }
      setGroup(g)

      const memberProfiles = await Promise.all(
        g.members.map(async (uid) => {
          const pSnap = await getDoc(doc(db, 'studentProfiles', uid))
          const uSnap = await getDoc(doc(db, 'users', uid))
          return {
            uid,
            name: uSnap.exists() ? uSnap.data().name : 'Unknown',
            ...pSnap.data(),
          }
        })
      )
      setMembers(memberProfiles)
    })

    return unsub
  }, [studentProfile?.groupId])

  const handleCreate = async () => {
    setLoading(true)
    setError('')
    try {
      await groupService.createGroup(user.uid)
      toast.success('Group created successfully!')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async () => {
    setLoading(true)
    setError('')
    try {
      await groupService.joinGroup(inviteCodeInput.trim().toUpperCase(), user.uid)
      toast.success('Joined group successfully!')
      setInviteCodeInput('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLeave = async () => {
    try {
      await groupService.leaveGroup(group.id, user.uid)
      setShowLeaveModal(false)
      toast.success('Left group')
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleDisband = async () => {
    try {
      await groupService.disbandGroup(group.id, group.members)
      setShowDisbandModal(false)
      toast.success('Group disbanded')
    } catch (err) {
      toast.error(err.message)
    }
  }

  const copyCode = () => {
    if (group?.inviteCode) {
      navigator.clipboard.writeText(group.inviteCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const isLeader = group?.leaderId === user?.uid

  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?'
  }

  const avatarColors = ['bg-[#3B82F6]', 'bg-[#10B981]', 'bg-[#8B5CF6]']

  const inputClass = 'w-full bg-white border-[1.5px] border-[#E8ECF0] rounded-xl px-4 py-3 text-[15px] text-[#1A2332] placeholder-[#9CA3AF] focus:outline-none focus:border-[#3B82F6] focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] transition-all duration-150'

  if (!studentProfile?.groupId) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="max-w-2xl mx-auto"
      >
        <h2 className="text-[24px] font-bold text-[#1A2332] mb-6">My Group</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <div className="text-center py-6">
              <div className="w-14 h-14 bg-[#EFF6FF] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Plus className="w-7 h-7 text-[#3B82F6]" />
              </div>
              <h3 className="font-bold text-[18px] text-[#1A2332] mb-2">Create a Group</h3>
              <p className="text-[14px] text-[#6B7A8D] mb-5">
                Start your own FYP group and invite teammates
              </p>
              <Button onClick={handleCreate} loading={loading} fullWidth>
                Create Group
              </Button>
            </div>
          </Card>

          <Card>
            <div className="text-center py-6">
              <div className="w-14 h-14 bg-[#ECFDF5] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Link2 className="w-7 h-7 text-[#10B981]" />
              </div>
              <h3 className="font-bold text-[18px] text-[#1A2332] mb-2">Join a Group</h3>
              <p className="text-[14px] text-[#6B7A8D] mb-4">
                Enter an invite code to join an existing group
              </p>
              <input
                type="text"
                value={inviteCodeInput}
                onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
                placeholder="Invite code"
                className={`${inputClass} mb-3 font-mono tracking-[6px] text-center text-[16px]`}
              />
              <Button onClick={handleJoin} loading={loading} fullWidth>
                Join Group
              </Button>
            </div>
          </Card>
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[#EF4444] text-[13px] text-center mt-4 bg-[#FEF2F2] rounded-xl p-3"
          >
            {error}
          </motion.p>
        )}
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="max-w-2xl mx-auto"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[24px] font-bold text-[#1A2332]">My Group</h2>
        <span className="text-[12px] px-2.5 py-1 bg-[#F4F6F9] rounded-full text-[#6B7A8D] font-medium">
          {group?.members?.length || 0} of 3
        </span>
      </div>

      {/* Invite Code Card */}
      <Card className="mb-6">
        <div className="text-center py-6">
          <p className="text-[12px] font-medium text-[#6B7A8D] uppercase tracking-[1px] mb-3">
            Your Group Invite Code
          </p>
          <span className="font-mono text-[40px] font-bold text-[#1A2332] tracking-[6px]">
            {group?.inviteCode}
          </span>
          <div className="mt-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={copyCode}
              leftIcon={copied ? Check : Copy}
            >
              {copied ? 'Copied!' : 'Copy Code'}
            </Button>
          </div>
        </div>
      </Card>

      <h3 className="text-[15px] font-semibold text-[#1A2332] mb-4">Members</h3>
      <div className="space-y-2 mb-6">
        {members.map((member, idx) => (
          <div
            key={member.uid}
            className="flex items-center gap-4 p-4 bg-white rounded-xl border border-[#E8ECF0]"
          >
            <div
              className={`w-10 h-10 rounded-full ${avatarColors[idx % avatarColors.length]} text-white flex items-center justify-center text-[13px] font-bold flex-shrink-0`}
            >
              {getInitials(member.name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-[14px] text-[#1A2332] truncate">{member.name}</p>
                {member.uid === group?.leaderId && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-[#EFF6FF] rounded text-[#3B82F6] font-semibold">
                    Leader
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {member.skills?.slice(0, 3).map((skill) => (
                  <span key={skill} className="text-[11px] px-2 py-0.5 bg-[#F4F6F9] rounded-full text-[#6B7A8D] font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        {isLeader && !group?.lockedProjectId && (
          <Button leftIcon={Search} onClick={() => navigate('/student/browse')}>
            Browse Projects
          </Button>
        )}
        {!isLeader && (
          <Button variant="secondary" leftIcon={LogOut} onClick={() => setShowLeaveModal(true)}>
            Leave Group
          </Button>
        )}
        {isLeader && !group?.lockedProjectId && (
          <Button variant="danger" leftIcon={Trash2} onClick={() => setShowDisbandModal(true)}>
            Disband Group
          </Button>
        )}
      </div>

      <Modal open={showLeaveModal} onClose={() => setShowLeaveModal(false)} title="Leave Group">
        <p className="text-[14px] text-[#6B7A8D] mb-6">
          Are you sure you want to leave this group? You will need a new invite code to rejoin.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setShowLeaveModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleLeave}>Leave</Button>
        </div>
      </Modal>

      <Modal open={showDisbandModal} onClose={() => setShowDisbandModal(false)} title="Disband Group">
        <p className="text-[14px] text-[#6B7A8D] mb-6">
          This will permanently delete the group and remove all members. This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setShowDisbandModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDisband}>Disband</Button>
        </div>
      </Modal>
    </motion.div>
  )
}
