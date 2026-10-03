import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, ChevronRight, Layers } from 'lucide-react'
import { authService } from '../../services/authService'
import { motion, AnimatePresence } from 'framer-motion'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  // For floating labels
  const [focusedInput, setFocusedInput] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { profile } = await authService.signIn(email, password)
      if (profile.role === 'student') navigate('/student/dashboard')
      else if (profile.role === 'supervisor') navigate('/supervisor/dashboard')
      else if (profile.role === 'admin') navigate('/admin/dashboard')
    } catch (err) {
      if (err.code === 'auth/invalid-credential' || err.message?.includes('auth/invalid-credential')) {
        setError('Invalid email or password. If you do not have an account yet, please click "Create an account" below.')
      } else {
        setError(err.message || 'Invalid credentials')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex w-full bg-surface">
      {/* Left Panel */}
      <div className="hidden lg:flex flex-col w-[55%] bg-gradient-to-br from-navy to-navy-mid relative overflow-hidden">
        {/* Abstract 3D Illustration */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-full h-full max-w-2xl max-h-2xl">
            {/* Card 1 */}
            <motion.div 
              initial={{ y: 50, opacity: 0, rotateX: 20, rotateY: -15, rotateZ: -10 }}
              animate={{ y: 0, opacity: 1, rotateX: 20, rotateY: -15, rotateZ: -10 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="absolute top-[20%] left-[10%] w-64 h-40 bg-gradient-to-br from-[#4F6EF7]/20 to-[#7C3AED]/20 rounded-2xl border border-white/10 backdrop-blur-md shadow-2xl"
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div className="absolute top-4 left-4 w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                 <Layers className="w-6 h-6 text-[#4F6EF7]" />
              </div>
              <div className="absolute bottom-4 left-4 right-4 h-2 bg-white/10 rounded-full" />
              <div className="absolute bottom-8 left-4 right-12 h-2 bg-white/10 rounded-full" />
            </motion.div>
            
            {/* Card 2 */}
            <motion.div 
              initial={{ y: 50, opacity: 0, rotateX: 15, rotateY: 10, rotateZ: 5 }}
              animate={{ y: 0, opacity: 1, rotateX: 15, rotateY: 10, rotateZ: 5 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="absolute top-[40%] right-[10%] w-72 h-48 bg-gradient-to-br from-[#7C3AED]/30 to-[#4F6EF7]/30 rounded-2xl border border-white/20 backdrop-blur-md shadow-2xl z-10"
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div className="p-6">
                <div className="flex gap-2 mb-6">
                   <div className="w-3 h-3 rounded-full bg-danger-light" />
                   <div className="w-3 h-3 rounded-full bg-warning-light" />
                   <div className="w-3 h-3 rounded-full bg-success-light" />
                </div>
                <div className="space-y-3">
                  <div className="h-3 bg-white/20 rounded-full w-full" />
                  <div className="h-3 bg-white/20 rounded-full w-4/5" />
                  <div className="h-3 bg-white/20 rounded-full w-2/3" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Floating Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(10)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute bg-accent-light/20 rounded-full"
              style={{
                width: Math.random() * 8 + 4 + 'px',
                height: Math.random() * 8 + 4 + 'px',
                left: Math.random() * 100 + '%',
                top: Math.random() * 100 + '%',
              }}
              animate={{
                y: [0, -60, 0],
                x: [0, Math.random() * 40 - 20, 0],
                opacity: [0.1, 0.4, 0.1]
              }}
              transition={{
                duration: Math.random() * 5 + 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>

        <div className="relative z-20 flex flex-col justify-center flex-1 px-16 lg:px-24 pt-20 pb-20">
          <h1 className="text-white text-[40px] font-bold leading-[1.1] mb-8 relative inline-block">
            Manage Your <br/> Final Year Project
            <span className="absolute bottom-1 left-0 w-[120px] h-2 bg-accent rounded-full -z-10" />
          </h1>
          
          <div className="space-y-6 mt-4">
            {[
              "Streamline collaboration between students and supervisors",
              "Track project milestones and manage submissions easily",
              "AI-powered recommendations for project topics and teams"
            ].map((text, i) => (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                key={i} 
                className="flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/10 relative">
                  <div className="absolute w-2 h-2 bg-accent rounded-full animate-pulse" style={{ boxShadow: '0 0 10px 2px rgba(79, 110, 247, 0.5)' }} />
                </div>
                <p className="text-white/80 text-[15px] font-medium leading-relaxed">{text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-surface">
        <div className="w-full max-w-[420px]">
          {/* Logo */}
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center shadow-lg mb-8">
            <span className="text-white text-lg font-bold tracking-tight">FYP</span>
          </div>

          <h2 className="text-[24px] font-bold text-navy mb-2">Welcome back</h2>
          <p className="text-text-muted text-[15px] mb-8">Sign in to your account to continue</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Email Input */}
            <div className="relative">
              <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-200 ${focusedInput === 'email' || email ? 'text-accent' : 'text-text-muted'}`}>
                <Mail className="h-5 w-5" />
              </div>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedInput('email')}
                onBlur={() => setFocusedInput(null)}
                className={`block w-full pl-11 pr-4 h-[52px] bg-white border-2 rounded-xl text-[15px] text-text-primary transition-all duration-200 outline-none
                  ${focusedInput === 'email' ? 'border-accent shadow-[0_0_0_4px_rgba(79,110,247,0.12)]' : 'border-border hover:border-border-strong'}`}
                placeholder=" "
                required
              />
              <label 
                htmlFor="email"
                className={`absolute left-11 transition-all duration-200 pointer-events-none font-medium
                  ${focusedInput === 'email' || email 
                    ? '-top-2.5 bg-white px-1 text-[12px] text-accent' 
                    : 'top-3.5 text-[15px] text-text-muted'}`}
              >
                Email Address
              </label>
            </div>

            {/* Password Input */}
            <div className="relative">
              <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-200 ${focusedInput === 'password' || password ? 'text-accent' : 'text-text-muted'}`}>
                <Lock className="h-5 w-5" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedInput('password')}
                onBlur={() => setFocusedInput(null)}
                className={`block w-full pl-11 pr-12 h-[52px] bg-white border-2 rounded-xl text-[15px] text-text-primary transition-all duration-200 outline-none
                  ${focusedInput === 'password' ? 'border-accent shadow-[0_0_0_4px_rgba(79,110,247,0.12)]' : 'border-border hover:border-border-strong'}`}
                placeholder=" "
                required
              />
              <label 
                htmlFor="password"
                className={`absolute left-11 transition-all duration-200 pointer-events-none font-medium
                  ${focusedInput === 'password' || password 
                    ? '-top-2.5 bg-white px-1 text-[12px] text-accent' 
                    : 'top-3.5 text-[15px] text-text-muted'}`}
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-text-muted hover:text-navy focus:outline-none"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            {/* Error Banner */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0, x: [-5, 5, -5, 5, 0] }} // Shake animation
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                  className="bg-danger-light border border-danger/20 text-danger rounded-xl p-3 flex items-start gap-2 text-[13px] font-medium"
                >
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-end">
              <Link to="/forgot-password" className="text-[13px] font-semibold text-accent hover:text-accent-dark transition-colors">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-[52px] bg-gradient-to-r from-accent to-accent-dark text-white rounded-xl font-bold text-[15px] shadow-sm hover:shadow-md hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Sign In
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>

          </form>

          <p className="mt-8 text-center text-[14px] text-text-muted">
            New student?{' '}
            <Link to="/register" className="font-bold text-accent hover:text-accent-dark transition-colors">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
