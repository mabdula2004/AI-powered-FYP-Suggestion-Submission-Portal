import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Camera, 
  User, 
  Hash, 
  Lock, 
  Loader2, 
  Save, 
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react'
import { doc, updateDoc } from 'firebase/firestore'
import { updatePassword } from 'firebase/auth'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, auth, storage } from '../../lib/firebase'
import { useAuthStore } from '../../stores/authStore'
import Modal from './Modal'
import Button from './Button'
import toast from 'react-hot-toast'

export default function SettingsModal({ open, onClose }) {
  const { profile, setProfile } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('profile') // 'profile' or 'security'

  // Profile States
  const [name, setName] = useState(profile?.name || '')
  const [rollNumber, setRollNumber] = useState(profile?.rollNumber || '')
  const [avatar, setAvatar] = useState(profile?.photoURL || '')
  const fileInputRef = useRef(null)

  // Security States
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (profile) {
      setName(profile.name || '')
      setRollNumber(profile.rollNumber || '')
      setAvatar(profile.photoURL || '')
    }
  }, [profile])

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB')
      return
    }

    setLoading(true)
    try {
      const storageRef = ref(storage, `avatars/${auth.currentUser.uid}`)
      await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(storageRef)
      
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        photoURL: downloadURL
      })
      
      setAvatar(downloadURL)
      setProfile({ ...profile, photoURL: downloadURL })
      toast.success('Profile picture updated!')
    } catch (err) {
      toast.error('Failed to upload image')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async () => {
    if (!name.trim()) {
      toast.error('Name cannot be empty')
      return
    }

    setLoading(true)
    try {
      const updates = { name }
      if (profile?.role === 'student') {
        updates.rollNumber = rollNumber
      }

      await updateDoc(doc(db, 'users', auth.currentUser.uid), updates)
      setProfile({ ...profile, ...updates })
      toast.success('Profile updated!')
    } catch (err) {
      toast.error('Failed to update profile')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      await updatePassword(auth.currentUser, newPassword)
      toast.success('Password updated!')
      setNewPassword('')
      setActiveTab('profile')
    } catch (err) {
      if (err.code === 'auth/requires-recent-login') {
        toast.error('Session expired. Please logout and login again to change password.')
      } else {
        toast.error(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full px-[14px] py-[11px] bg-white border-[1.5px] border-[#E8ECF0] rounded-xl text-[15px] text-[#1A2332] placeholder-[#9CA3AF] transition-all duration-150 ease-out focus:outline-none focus:border-[#3B82F6] focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)]"

  return (
    <Modal open={open} onClose={onClose} title="Account Settings">
      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-[#F4F6F9] rounded-xl">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-[13px] font-bold rounded-lg transition-all ${
              activeTab === 'profile' 
                ? 'bg-white text-navy shadow-sm' 
                : 'text-text-secondary hover:text-navy'
            }`}
          >
            <User className="w-4 h-4" />
            Profile
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-[13px] font-bold rounded-lg transition-all ${
              activeTab === 'security' 
                ? 'bg-white text-navy shadow-sm' 
                : 'text-text-secondary hover:text-navy'
            }`}
          >
            <Lock className="w-4 h-4" />
            Security
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'profile' ? (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              {/* Avatar Section */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-accent to-accent-dark border-4 border-white shadow-md flex items-center justify-center">
                    {avatar ? (
                      <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white text-3xl font-bold">
                        {profile?.name?.[0]?.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                  >
                    <Camera className="w-6 h-6" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
                <div className="text-center">
                  <h4 className="font-bold text-navy">{profile?.name}</h4>
                  <p className="text-[12px] text-text-muted capitalize">{profile?.role}</p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] font-bold text-navy mb-1.5 flex items-center gap-2">
                    <User className="w-3.5 h-3.5" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClass}
                    placeholder="Enter your name"
                  />
                </div>

                {profile?.role === 'student' && (
                  <div>
                    <label className="block text-[13px] font-bold text-navy mb-1.5 flex items-center gap-2">
                      <Hash className="w-3.5 h-3.5" />
                      Roll Number
                    </label>
                    <input
                      type="text"
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
                      className={inputClass}
                      placeholder="e.g. 21F-1234"
                    />
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-[#F4F6F9]">
                <Button variant="ghost" onClick={onClose} disabled={loading}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateProfile} loading={loading} leftIcon={Save}>
                  Save Changes
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="security"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              <div className="p-4 bg-[#FFFBEB] border border-[#FEF3C7] rounded-xl flex gap-3">
                <AlertCircle className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
                <p className="text-[13px] text-[#92400E] leading-relaxed">
                  For security, password updates are only allowed if you've logged in recently.
                </p>
              </div>

              <div>
                <label className="block text-[13px] font-bold text-navy mb-1.5 flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5" />
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={inputClass}
                    placeholder="Min. 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-navy transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-[#F4F6F9]">
                <Button variant="ghost" onClick={onClose} disabled={loading}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpdatePassword} 
                  loading={loading} 
                  disabled={!newPassword || newPassword.length < 6}
                  leftIcon={Lock}
                >
                  Update Password
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  )
}
