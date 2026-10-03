import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Mail, Lock, CheckCircle2, ChevronRight, Loader2, AlertCircle, Users, BookOpen, GraduationCap, Eye, EyeOff } from 'lucide-react'
import { authService } from '../../services/authService'
import { motion, AnimatePresence } from 'framer-motion'

const InputField = ({ id, type, label, icon: Icon, isPassword, showToggle, onToggle, value, onChange, focusedInput, setFocusedInput }) => (
  <div className="relative">
    <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-200 ${focusedInput === id || value ? 'text-accent' : 'text-text-muted'}`}>
      <Icon className="h-5 w-5" />
    </div>
    <input
      type={type}
      id={id}
      value={value}
      onChange={onChange}
      onFocus={() => setFocusedInput(id)}
      onBlur={() => setFocusedInput(null)}
      className={`block w-full pl-11 ${isPassword ? 'pr-12' : 'pr-4'} h-[52px] bg-white border-2 rounded-xl text-[15px] text-text-primary transition-all duration-200 outline-none relative z-10 bg-transparent
        ${focusedInput === id ? 'border-accent shadow-[0_0_0_4px_rgba(79,110,247,0.12)]' : 'border-border hover:border-border-strong'}`}
      placeholder=" "
      required
    />
    <label 
      htmlFor={id}
      className={`absolute left-11 transition-all duration-200 pointer-events-none font-medium z-20
        ${focusedInput === id || value 
          ? '-top-2.5 bg-white px-1 text-[12px] text-accent' 
          : 'top-3.5 text-[15px] text-text-muted'}`}
    >
      {label}
    </label>
    {isPassword && (
      <button
        type="button"
        onClick={onToggle}
        className="absolute inset-y-0 right-0 pr-4 flex items-center text-text-muted hover:text-navy focus:outline-none z-20"
      >
        {showToggle ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
      </button>
    )}
  </div>
)

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    rollNumber: '',
    password: '',
    confirmPassword: ''
  })
  
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [focusedInput, setFocusedInput] = useState(null)
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value })
  }

  // Calculate completion percentage
  const filledFieldsCount = Object.values(formData).filter(v => v.length > 0).length
  const progressPercentage = (filledFieldsCount / 5) * 100

  // Calculate password strength
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: 'None', color: 'bg-border' }
    if (pass.length < 6) return { score: 1, label: 'Weak', color: 'bg-danger' }
    if (pass.length < 8 || !/\d/.test(pass)) return { score: 2, label: 'Medium', color: 'bg-warning' }
    if (/[A-Z]/.test(pass) && /[^A-Za-z0-9]/.test(pass)) return { score: 4, label: 'Very Strong', color: 'bg-success' }
    return { score: 3, label: 'Strong', color: 'bg-success-light' }
  }
  const strength = getPasswordStrength(formData.password)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match")
      setLoading(false)
      return
    }

    try {
      await authService.signUp(
        formData.email, 
        formData.password, 
        formData.name,
        'student',
        formData.rollNumber
      )
      navigate('/student/dashboard')
    } catch (err) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex w-full bg-surface">
      {/* Left Panel */}
      <div className="hidden lg:flex flex-col w-[55%] bg-gradient-to-br from-navy to-navy-mid relative overflow-hidden">
        
        {/* Abstract 3D Illustration - Students/Collaboration */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-full h-full max-w-2xl max-h-2xl">
            {/* Base Card */}
            <motion.div 
              initial={{ y: 30, opacity: 0, rotateX: 25, rotateY: 15, rotateZ: 5 }}
              animate={{ y: 0, opacity: 1, rotateX: 25, rotateY: 15, rotateZ: 5 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="absolute top-[30%] left-[15%] w-80 h-56 bg-gradient-to-tr from-[#0BAB6A]/20 to-[#4F6EF7]/20 rounded-3xl border border-white/10 backdrop-blur-md shadow-2xl"
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div className="absolute top-6 left-6 flex gap-3">
                <div className="w-10 h-10 rounded-full bg-[#0BAB6A] flex items-center justify-center shadow-lg transform translate-z-10">
                   <Users className="w-5 h-5 text-white" />
                </div>
                <div className="w-10 h-10 rounded-full bg-[#4F6EF7] flex items-center justify-center shadow-lg transform translate-z-20 -ml-4 border-2 border-navy">
                   <BookOpen className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="absolute bottom-8 left-6 right-6 space-y-4">
                <div className="flex items-center gap-3">
                   <div className="w-6 h-6 rounded bg-white/20" />
                   <div className="h-3 bg-white/20 rounded-full w-full" />
                </div>
                <div className="flex items-center gap-3">
                   <div className="w-6 h-6 rounded bg-white/20" />
                   <div className="h-3 bg-white/20 rounded-full w-4/5" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Floating Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute bg-success-light/20 rounded-full"
              style={{
                width: Math.random() * 8 + 4 + 'px',
                height: Math.random() * 8 + 4 + 'px',
                left: Math.random() * 100 + '%',
                top: Math.random() * 100 + '%',
              }}
              animate={{
                y: [0, -40, 0],
                opacity: [0.1, 0.4, 0.1]
              }}
              transition={{
                duration: Math.random() * 4 + 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>

        <div className="relative z-20 flex flex-col justify-center flex-1 px-16 lg:px-24 pt-20 pb-20">
          <h1 className="text-white text-[40px] font-bold leading-[1.1] mb-8 relative inline-block">
            Start Your Journey <br/> To Graduation
            <span className="absolute bottom-1 left-0 w-[120px] h-2 bg-success rounded-full -z-10" />
          </h1>
          
          <div className="space-y-6 mt-4">
            {[
              "Join your university's official FYP platform",
              "Form groups and select from approved project domains",
              "Get AI-driven matching with supervisors"
            ].map((text, i) => (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                key={i} 
                className="flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/10 relative">
                  <div className="absolute w-2 h-2 bg-success rounded-full animate-pulse" style={{ boxShadow: '0 0 10px 2px rgba(11, 171, 106, 0.5)' }} />
                </div>
                <p className="text-white/80 text-[15px] font-medium leading-relaxed">{text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col pt-12 pb-12 px-8 bg-surface overflow-y-auto relative">
        {/* Form Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-bg-tertiary">
          <motion.div 
            className="h-full bg-gradient-to-r from-accent to-accent-dark"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <div className="w-full max-w-[420px] mx-auto my-auto">
          {/* Logo */}
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center shadow-lg mb-8">
            <span className="text-white text-lg font-bold tracking-tight">FYP</span>
          </div>

          <h2 className="text-[24px] font-bold text-navy mb-2">Create Student Account</h2>
          <p className="text-text-muted text-[15px] mb-8">Fill in your details to register</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            <InputField 
              id="name" 
              type="text" 
              label="Full Name" 
              icon={User} 
              value={formData.name} 
              onChange={handleChange} 
              focusedInput={focusedInput} 
              setFocusedInput={setFocusedInput} 
            />
            <InputField 
              id="email" 
              type="email" 
              label="University Email" 
              icon={Mail} 
              value={formData.email} 
              onChange={handleChange} 
              focusedInput={focusedInput} 
              setFocusedInput={setFocusedInput} 
            />
            <InputField 
              id="rollNumber" 
              type="text" 
              label="Roll Number (e.g. FA20-BCS-001)" 
              icon={GraduationCap} 
              value={formData.rollNumber} 
              onChange={handleChange} 
              focusedInput={focusedInput} 
              setFocusedInput={setFocusedInput} 
            />
            
            <div className="space-y-2">
              <InputField 
                id="password" 
                type={showPassword ? "text" : "password"} 
                label="Password" 
                icon={Lock} 
                isPassword 
                showToggle={showPassword}
                onToggle={() => setShowPassword(!showPassword)}
                value={formData.password} 
                onChange={handleChange} 
                focusedInput={focusedInput} 
                setFocusedInput={setFocusedInput} 
              />
              {/* Password Strength Meter */}
              {formData.password.length > 0 && (
                <div className="px-1 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-bg-tertiary rounded-full overflow-hidden flex">
                     <motion.div 
                        className={`h-full ${strength.color}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${(strength.score / 4) * 100}%` }}
                        transition={{ duration: 0.3 }}
                     />
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${strength.color.replace('bg-', 'text-')}`}>
                    {strength.label}
                  </span>
                </div>
              )}
            </div>

            <InputField 
              id="confirmPassword" 
              type={showPassword ? "text" : "password"} 
              label="Confirm Password" 
              icon={CheckCircle2} 
              value={formData.confirmPassword} 
              onChange={handleChange} 
              focusedInput={focusedInput} 
              setFocusedInput={setFocusedInput} 
            />

            {/* Error Banner */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0, x: [-5, 5, -5, 5, 0] }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                  className="bg-danger-light border border-danger/20 text-danger rounded-xl p-3 flex items-start gap-2 text-[13px] font-medium mt-2"
                >
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading || progressPercentage < 100}
              className="w-full h-[52px] bg-gradient-to-r from-accent to-accent-dark text-white rounded-xl font-bold text-[15px] shadow-sm hover:shadow-md hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Create Account
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>

          </form>

          <p className="mt-8 text-center text-[14px] text-text-muted">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-accent hover:text-accent-dark transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
