import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Search,
  MoreVertical,
  Loader2,
  Trash2,
  Eye,
  Ban,
  CheckCircle,
  UserPlus,
  X,
  AlertCircle,
  ShieldCheck,
  Bell,
} from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { signOut as firebaseSignOut } from 'firebase/auth'
import { format } from 'date-fns'
import { db, secondaryAuth } from '../../lib/firebase'
import { useAuthStore } from '../../stores/authStore'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import SkeletonLoader from '../../components/ui/SkeletonLoader'
import EmptyState from '../../components/ui/EmptyState'
import toast from 'react-hot-toast'
import { notificationService } from '../../services/notificationService'

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25 } },
}

const inputClass =
  'w-full px-[14px] py-[10px] bg-white border-[1.5px] border-border rounded-xl text-[14px] text-navy placeholder-text-muted transition-all duration-150 focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_rgba(79,110,247,0.12)]'

export default function UserManagementPage() {
  const { profile: adminProfile } = useAuthStore()
  const [activeTab, setActiveTab] = useState('students')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [addForm, setAddForm] = useState({ name: '', email: '', password: '' })
  const [addFormError, setAddFormError] = useState('')

  const [showNotifyModal, setShowNotifyModal] = useState(false)
  const [notifySubject, setNotifySubject] = useState('')
  const [notifyMessage, setNotifyMessage] = useState('')
  const [notifyUserTarget, setNotifyUserTarget] = useState(null)
  const [sendingNotify, setSendingNotify] = useState(false)

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true)
      const snap = await getDocs(
        query(
          collection(db, 'users'),
          where('role', '==', activeTab === 'students' ? 'student' : 'supervisor')
        )
      )
      setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }
    loadUsers()
  }, [activeTab])

  const filtered = users.filter((u) => {
    const q = search.toLowerCase()
    return (
      (u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q)
    )
  })

  const handleSuspend = async (uid) => {
    try {
      await updateDoc(doc(db, 'users', uid), { status: 'suspended' })
      setUsers((prev) =>
        prev.map((u) => (u.id === uid ? { ...u, status: 'suspended' } : u))
      )
      toast.success('Account suspended')
    } catch (err) {
      toast.error(err.message)
    }
    setDropdownOpen(null)
  }

  const handleActivate = async (uid) => {
    try {
      await updateDoc(doc(db, 'users', uid), { status: 'active' })
      setUsers((prev) =>
        prev.map((u) => (u.id === uid ? { ...u, status: 'active' } : u))
      )
      toast.success('Account activated')
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleSendNotification = async () => {
    if (!notifyUserTarget || !notifySubject.trim() || !notifyMessage.trim()) return
    setSendingNotify(true)
    try {
      await notificationService.sendNotification(
        notifyUserTarget.id,
        notifySubject.trim(),
        notifyMessage.trim(),
        'info',
        `/`
      )
      toast.success('Notification sent!')
      setShowNotifyModal(false)
      setNotifySubject('')
      setNotifyMessage('')
      setNotifyUserTarget(null)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSendingNotify(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedUser) return
    setProcessing(true)
    try {
      if (activeTab === 'students') {
        await deleteDoc(doc(db, 'studentProfiles', selectedUser.id))
      }
      await deleteDoc(doc(db, 'users', selectedUser.id))
      setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id))
      toast.success('User deleted')
    } catch (err) {
      toast.error(err.message)
    }
    setShowDeleteModal(false)
    setSelectedUser(null)
    setProcessing(false)
    setDropdownOpen(null)
  }

  const handleAddSupervisor = async () => {
    setAddFormError('')
    const { name, email, password } = addForm

    if (!name.trim() || !email.trim() || !password.trim()) {
      setAddFormError('All fields are required')
      return
    }
    if (!email.endsWith('@cuivehari.edu.pk')) {
      setAddFormError('Email must end with @cuivehari.edu.pk')
      return
    }
    if (password.length < 6) {
      setAddFormError('Password must be at least 6 characters')
      return
    }

    setProcessing(true)
    try {
      // Step 1: Create the supervisor's Firebase Auth account using the SECONDARY
      // app instance. This does NOT affect the admin's primary auth session.
      const { user: newUser } = await createUserWithEmailAndPassword(
        secondaryAuth,
        email,
        password
      )

      // Step 2: Write the supervisor profile to Firestore
      const userData = {
        uid: newUser.uid,
        email,
        name: name.trim(),
        role: 'supervisor',
        status: 'active',
        createdAt: serverTimestamp(),
      }
      await setDoc(doc(db, 'users', newUser.uid), userData)

      // Step 3: Sign out the secondary auth instance immediately (it's a throwaway)
      await firebaseSignOut(secondaryAuth)

      // Step 4: Update local state
      setUsers((prev) => [...prev, { id: newUser.uid, ...userData }])
      toast.success('Supervisor account created successfully')
      setShowAddModal(false)
      setAddForm({ name: '', email: '', password: '' })
    } catch (err) {
      // Clean up secondary auth if something went wrong after account creation
      try { await firebaseSignOut(secondaryAuth) } catch {}

      const msg = err.code === 'auth/email-already-in-use'
        ? 'An account with this email already exists'
        : err.message || 'Failed to create supervisor'
      setAddFormError(msg)
    } finally {
      setProcessing(false)
    }
  }

  const viewProfile = async (user) => {
    const snap = await getDoc(doc(db, 'studentProfiles', user.id))
    setSelectedUser({ ...user, profile: snap.exists() ? snap.data() : null })
    setShowProfileModal(true)
    setDropdownOpen(null)
  }

  const statusBadge = (status) => ({
    bg: status === 'suspended' ? '#FEF2F2' : '#ECFDF5',
    color: status === 'suspended' ? '#EF4444' : '#10B981',
    label: status === 'suspended' ? 'Suspended' : 'Active',
  })

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-[24px] font-bold text-navy mb-1">
            User Management
          </h2>
          <p className="text-[13px] text-text-muted">
            Manage students and supervisors
          </p>
        </div>
        {activeTab === 'supervisors' && (
          <button
            onClick={() => { setShowAddModal(true); setAddFormError('') }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-accent to-accent-dark text-white rounded-xl font-bold text-[14px] shadow-sm hover:shadow-md hover:brightness-110 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            Add Supervisor
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {['students', 'supervisors'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-3 text-[14px] font-bold capitalize border-b-2 transition-colors duration-150 ${
              activeTab === tab
                ? 'border-accent text-accent'
                : 'border-transparent text-text-secondary hover:text-navy'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-[14px] top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${activeTab}...`}
          className={`${inputClass} pl-10`}
        />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={`No ${activeTab} found`}
          subtitle={search ? 'Try a different search term' : 'No users in this category'}
        />
      ) : (
        <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-[14px]">
              <thead>
                <tr className="bg-bg-secondary border-b border-border">
                  <th className="text-left py-3 px-4 font-bold text-text-muted text-[12px] uppercase tracking-wide">Name</th>
                  <th className="text-left py-3 px-4 font-bold text-text-muted text-[12px] uppercase tracking-wide">Email</th>
                  <th className="text-left py-3 px-4 font-bold text-text-muted text-[12px] uppercase tracking-wide">Role</th>
                  <th className="text-left py-3 px-4 font-bold text-text-muted text-[12px] uppercase tracking-wide">Join Date</th>
                  <th className="text-left py-3 px-4 font-bold text-text-muted text-[12px] uppercase tracking-wide">Status</th>
                  <th className="text-right py-3 px-4 font-bold text-text-muted text-[12px] uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => {
                  const badge = statusBadge(u.status)
                  return (
                    <tr
                      key={u.id}
                      className="border-b border-border/50 hover:bg-bg-secondary/60 transition-colors duration-150"
                      style={{ height: '56px' }}
                    >
                      <td className="py-3 px-4 font-bold text-navy">{u.name || 'N/A'}</td>
                      <td className="py-3 px-4 text-text-secondary text-[13px]">{u.email}</td>
                      <td className="py-3 px-4 capitalize">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-accent-light/50 text-accent rounded-lg text-[12px] font-bold">
                          <ShieldCheck className="w-3 h-3" />
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-text-muted text-[13px]">
                        {u.createdAt?.toDate
                          ? format(u.createdAt.toDate(), 'MMM d, yyyy')
                          : 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide"
                          style={{ backgroundColor: badge.bg, color: badge.color }}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <DropdownMenu.Root>
                          <DropdownMenu.Trigger asChild>
                            <button className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors outline-none">
                              <MoreVertical className="w-4 h-4 text-text-muted" />
                            </button>
                          </DropdownMenu.Trigger>

                          <DropdownMenu.Portal>
                            <DropdownMenu.Content
                              align="end"
                              sideOffset={4}
                              className="w-52 bg-surface rounded-xl border border-border shadow-xl z-50 overflow-hidden outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
                            >
                              <DropdownMenu.Item
                                onClick={() => viewProfile(u)}
                                className="flex items-center gap-2 w-full px-4 py-2.5 text-[13px] text-navy hover:bg-bg-secondary transition-colors cursor-pointer outline-none"
                              >
                                <Eye className="w-4 h-4 text-text-muted" /> View Profile
                              </DropdownMenu.Item>
                              
                              <DropdownMenu.Item
                                onClick={() => {
                                  setNotifyUserTarget(u)
                                  setShowNotifyModal(true)
                                }}
                                className="flex items-center gap-2 w-full px-4 py-2.5 text-[13px] text-accent hover:bg-accent-light/30 transition-colors cursor-pointer outline-none border-b border-border"
                              >
                                <Bell className="w-4 h-4" /> Send Notification
                              </DropdownMenu.Item>

                              {u.status !== 'suspended' ? (
                                <DropdownMenu.Item
                                  onClick={() => handleSuspend(u.id)}
                                  className="flex items-center gap-2 w-full px-4 py-2.5 text-[13px] text-warning hover:bg-warning-light transition-colors cursor-pointer outline-none"
                                >
                                  <Ban className="w-4 h-4" /> Suspend Account
                                </DropdownMenu.Item>
                              ) : (
                                <DropdownMenu.Item
                                  onClick={() => handleActivate(u.id)}
                                  className="flex items-center gap-2 w-full px-4 py-2.5 text-[13px] text-success hover:bg-success-light transition-colors cursor-pointer outline-none"
                                >
                                  <CheckCircle className="w-4 h-4" /> Activate Account
                                </DropdownMenu.Item>
                              )}
                              <DropdownMenu.Item
                                onClick={() => {
                                  setSelectedUser(u)
                                  setShowDeleteModal(true)
                                }}
                                className="flex items-center gap-2 w-full px-4 py-2.5 text-[13px] text-danger hover:bg-danger-light transition-colors cursor-pointer outline-none"
                              >
                                <Trash2 className="w-4 h-4" /> Delete User
                              </DropdownMenu.Item>
                            </DropdownMenu.Content>
                          </DropdownMenu.Portal>
                        </DropdownMenu.Root>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      <Modal
        open={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        title="User Profile"
      >
        {selectedUser && (
          <div className="space-y-4 text-[14px]">
            <div className="flex items-center gap-4 pb-4 border-b border-border">
              <div className="w-12 h-12 rounded-full bg-accent-light flex items-center justify-center">
                <span className="text-accent font-bold text-[18px]">
                  {selectedUser.name?.[0]?.toUpperCase() || '?'}
                </span>
              </div>
              <div>
                <p className="font-bold text-navy text-[16px]">{selectedUser.name || 'N/A'}</p>
                <p className="text-text-muted text-[13px]">{selectedUser.email}</p>
              </div>
            </div>
            {[
              { label: 'Role', value: selectedUser.role },
              { label: 'Status', value: selectedUser.status || 'active' },
              { label: 'UID', value: selectedUser.id },
            ].map(({ label, value }) => (
              <div key={label} className="flex gap-3">
                <span className="font-semibold text-text-muted w-20 shrink-0">{label}:</span>
                <span className="text-navy">{value}</span>
              </div>
            ))}
            {selectedUser.profile && (
              <>
                <div className="pt-3 border-t border-border" />
                {selectedUser.profile.rollNumber && (
                  <div className="flex gap-3">
                    <span className="font-semibold text-text-muted w-20 shrink-0">Roll No:</span>
                    <span className="text-navy">{selectedUser.profile.rollNumber}</span>
                  </div>
                )}
                {selectedUser.profile.skills?.length > 0 && (
                  <div className="flex gap-3">
                    <span className="font-semibold text-text-muted w-20 shrink-0">Skills:</span>
                    <div className="flex flex-wrap gap-1">
                      {selectedUser.profile.skills.map((s) => (
                        <span key={s} className="px-2 py-0.5 bg-accent-light text-accent text-[11px] font-bold rounded-full">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Notify Modal */}
      <Modal
        open={showNotifyModal}
        onClose={() => { setShowNotifyModal(false); setNotifySubject(''); setNotifyMessage(''); setNotifyUserTarget(null) }}
        title="Send Notification"
      >
        <div className="space-y-4">
          <p className="text-[13px] text-text-muted">
            Send a notification directly to <strong>{notifyUserTarget?.name}</strong>.
          </p>
          <div>
            <label className="block text-[13px] font-bold text-navy mb-1.5">Subject</label>
            <input
              type="text"
              value={notifySubject}
              onChange={(e) => setNotifySubject(e.target.value)}
              placeholder="e.g. Action Required"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-[13px] font-bold text-navy mb-1.5">Message</label>
            <textarea
              value={notifyMessage}
              onChange={(e) => setNotifyMessage(e.target.value)}
              placeholder="Type your message here..."
              rows={4}
              className={`${inputClass} resize-none`}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowNotifyModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendNotification} disabled={sendingNotify || !notifySubject.trim() || !notifyMessage.trim()}>
              {sendingNotify ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Bell className="w-4 h-4 mr-1" />
              )}
              Send
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        open={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setSelectedUser(null) }}
        title="Delete User"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-danger-light rounded-xl border border-danger/20">
            <AlertCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
            <p className="text-[14px] text-danger font-medium">
              Are you sure you want to delete{' '}
              <strong>{selectedUser?.name}</strong>? This cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => { setShowDeleteModal(false); setSelectedUser(null) }}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={processing}>
              {processing ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Trash2 className="w-4 h-4 mr-1" />}
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Supervisor Modal */}
      <Modal
        open={showAddModal}
        onClose={() => { setShowAddModal(false); setAddForm({ name: '', email: '', password: '' }); setAddFormError('') }}
        title="Add Supervisor"
      >
        <div className="space-y-4">
          <p className="text-[13px] text-text-muted">
            Creates a Firebase Auth account for the supervisor. They can log in at the standard{' '}
            <strong>/login</strong> page immediately.
          </p>
          {[
            { id: 'name', label: 'Full Name', type: 'text', placeholder: 'Dr. Ahmed Khan' },
            { id: 'email', label: 'Email', type: 'email', placeholder: 'supervisor@cuivehari.edu.pk' },
            { id: 'password', label: 'Temporary Password', type: 'password', placeholder: 'Min 6 characters' },
          ].map(({ id, label, type, placeholder }) => (
            <div key={id}>
              <label className="block text-[13px] font-bold text-navy mb-1.5">{label}</label>
              <input
                type={type}
                value={addForm[id]}
                onChange={(e) => { setAddForm({ ...addForm, [id]: e.target.value }); setAddFormError('') }}
                className={inputClass}
                placeholder={placeholder}
              />
            </div>
          ))}

          <AnimatePresence>
            {addFormError && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-start gap-2 p-3 bg-danger-light border border-danger/20 rounded-xl text-[13px] text-danger font-medium"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                {addFormError}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSupervisor} disabled={processing}>
              {processing ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4 mr-1" />
              )}
              Create Supervisor
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}
