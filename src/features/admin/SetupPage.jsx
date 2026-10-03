import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldAlert,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react'
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth'
import { auth, db } from '../../lib/firebase'

const ALLOWED_DOMAIN = '@cuivehari.edu.pk'

const inputBase =
  'block w-full h-[52px] border-2 rounded-xl text-[15px] transition-all duration-200 outline-none bg-white text-navy'

export default function SetupPage() {
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [focusedInput, setFocusedInput] = useState(null)
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  // Guard: check if setup is already complete
  useEffect(() => {
    const check = async () => {
      try {
        const snap = await getDoc(doc(db, 'appConfig', 'setupComplete'))
        if (snap.exists()) {
          navigate('/login', { replace: true })
          return
        }
      } catch {
        // Firestore unreachable — allow setup to proceed
      }
      setChecking(false)
    }
    check()
  }, [navigate])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.id]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.name.trim()) return setError('Full name is required')
    if (!form.email.endsWith(ALLOWED_DOMAIN))
      return setError(`Email must end with ${ALLOWED_DOMAIN}`)
    if (form.password.length < 8)
      return setError('Password must be at least 8 characters')
    if (form.password !== form.confirmPassword)
      return setError("Passwords don't match")

    setLoading(true)
    try {
      // 1. Create Firebase Auth account
      const { user } = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      )

      // 2. Write user profile to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: form.email,
        name: form.name,
        role: 'admin',
        status: 'active',
        createdAt: serverTimestamp(),
      })

      // 3. Mark setup as complete
      await setDoc(doc(db, 'appConfig', 'setupComplete'), {
        value: true,
        completedAt: serverTimestamp(),
        adminEmail: form.email,
      })

      // 4. Sign in and redirect
      await signInWithEmailAndPassword(auth, form.email, form.password)
      navigate('/admin/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Setup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = (id) =>
    `${inputBase} pl-11 pr-4 ${
      focusedInput === id
        ? 'border-accent shadow-[0_0_0_4px_rgba(79,110,247,0.12)]'
        : 'border-border hover:border-border-strong'
    }`

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex w-full bg-navy relative overflow-hidden">
      {/* Background particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(18)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-accent/10"
            style={{
              width: Math.random() * 8 + 3 + 'px',
              height: Math.random() * 8 + 3 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
            }}
            animate={{ y: [0, -50, 0], opacity: [0.1, 0.4, 0.1] }}
            transition={{
              duration: Math.random() * 4 + 3,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Card */}
      <div className="relative z-10 w-full flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 22 }}
          className="w-full max-w-[480px]"
        >
          {/* Warning Banner */}
          <div className="bg-warning/10 border border-warning/30 rounded-2xl p-4 mb-6 flex gap-3 items-start">
            <ShieldAlert className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-warning font-bold text-[14px]">
                Admin Setup — This page can only be used once
              </p>
              <p className="text-warning/70 text-[13px] mt-0.5 leading-relaxed">
                After you create the admin account this page will be permanently
                disabled. Bookmark the login page instead.
              </p>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-surface rounded-3xl shadow-2xl border border-border overflow-hidden">
            {/* Header */}
            <div className="px-8 pt-8 pb-6 border-b border-border">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center shadow-lg mb-5">
                <span
                  className="text-white text-[20px] font-bold"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  F
                </span>
              </div>
              <h1 className="text-[22px] font-bold text-navy">
                Create Admin Account
              </h1>
              <p className="text-text-muted text-[14px] mt-1">
                Set up the portal administrator credentials
              </p>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">
              {/* Name */}
              <div className="relative">
                <div
                  className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${
                    focusedInput === 'name' || form.name
                      ? 'text-accent'
                      : 'text-text-muted'
                  }`}
                >
                  <User className="h-5 w-5" />
                </div>
                <input
                  id="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  onFocus={() => setFocusedInput('name')}
                  onBlur={() => setFocusedInput(null)}
                  className={inputClass('name')}
                  placeholder=" "
                  required
                />
                <label
                  htmlFor="name"
                  className={`absolute left-11 pointer-events-none font-medium transition-all duration-200 ${
                    focusedInput === 'name' || form.name
                      ? '-top-2.5 bg-white px-1 text-[12px] text-accent'
                      : 'top-3.5 text-[15px] text-text-muted'
                  }`}
                >
                  Full Name
                </label>
              </div>

              {/* Email */}
              <div className="relative">
                <div
                  className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${
                    focusedInput === 'email' || form.email
                      ? 'text-accent'
                      : 'text-text-muted'
                  }`}
                >
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => setFocusedInput(null)}
                  className={inputClass('email')}
                  placeholder=" "
                  required
                />
                <label
                  htmlFor="email"
                  className={`absolute left-11 pointer-events-none font-medium transition-all duration-200 ${
                    focusedInput === 'email' || form.email
                      ? '-top-2.5 bg-white px-1 text-[12px] text-accent'
                      : 'top-3.5 text-[15px] text-text-muted'
                  }`}
                >
                  Admin Email (@cuivehari.edu.pk)
                </label>
              </div>

              {/* Password */}
              <div className="relative">
                <div
                  className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${
                    focusedInput === 'password' || form.password
                      ? 'text-accent'
                      : 'text-text-muted'
                  }`}
                >
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
                  className={`${inputBase} pl-11 pr-12 ${
                    focusedInput === 'password'
                      ? 'border-accent shadow-[0_0_0_4px_rgba(79,110,247,0.12)]'
                      : 'border-border hover:border-border-strong'
                  }`}
                  placeholder=" "
                  required
                />
                <label
                  htmlFor="password"
                  className={`absolute left-11 pointer-events-none font-medium transition-all duration-200 ${
                    focusedInput === 'password' || form.password
                      ? '-top-2.5 bg-white px-1 text-[12px] text-accent'
                      : 'top-3.5 text-[15px] text-text-muted'
                  }`}
                >
                  Password (min 8 characters)
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-text-muted hover:text-navy"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>

              {/* Confirm Password */}
              <div className="relative">
                <div
                  className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${
                    focusedInput === 'confirmPassword' || form.confirmPassword
                      ? 'text-accent'
                      : 'text-text-muted'
                  }`}
                >
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={handleChange}
                  onFocus={() => setFocusedInput('confirmPassword')}
                  onBlur={() => setFocusedInput(null)}
                  className={inputClass('confirmPassword')}
                  placeholder=" "
                  required
                />
                <label
                  htmlFor="confirmPassword"
                  className={`absolute left-11 pointer-events-none font-medium transition-all duration-200 ${
                    focusedInput === 'confirmPassword' || form.confirmPassword
                      ? '-top-2.5 bg-white px-1 text-[12px] text-accent'
                      : 'top-3.5 text-[15px] text-text-muted'
                  }`}
                >
                  Confirm Password
                </label>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-danger-light border border-danger/20 text-danger rounded-xl p-3 flex items-start gap-2 text-[13px] font-medium"
                  >
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-[52px] bg-gradient-to-r from-accent to-accent-dark text-white rounded-xl font-bold text-[15px] shadow-sm hover:shadow-md hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Create Admin Account
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
