import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import {
  Users,
  UserCheck,
  FolderKanban,
  Lock,
  ClipboardList,
  Zap,
  Sparkles,
  TrendingUp,
  Settings
} from 'lucide-react'
import {
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuthStore } from '../../stores/authStore'
import ThreeDEffectWrapper from '../../components/ui/3DEffectWrapper'

export default function DashboardPage() {
  const { profile } = useAuthStore()
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalSupervisors: 0,
    totalProjects: 0,
    lockedProjects: 0,
    pendingRequests: 0,
    geminiStatus: null,
  })
  const [loading, setLoading] = useState(true)
  const [greeting, setGreeting] = useState('Good morning')

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good morning')
    else if (hour < 17) setGreeting('Good afternoon')
    else setGreeting('Good evening')
  }, [])

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true)

      const studentsSnap = await getDocs(
        query(collection(db, 'users'), where('role', '==', 'student'))
      )
      const supervisorsSnap = await getDocs(
        query(collection(db, 'users'), where('role', '==', 'supervisor'))
      )
      const projectsSnap = await getDocs(collection(db, 'projects'))
      const lockedSnap = await getDocs(
        query(collection(db, 'projects'), where('isLocked', '==', true))
      )
      const pendingSnap = await getDocs(
        query(collection(db, 'lockRequests'), where('status', '==', 'pending'))
      )

      let geminiStatus = false
      try {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY
        const resp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: 'ping' }] }],
            }),
          }
        )
        geminiStatus = resp.ok
      } catch {
        geminiStatus = false
      }

      setStats({
        totalStudents: studentsSnap.size,
        totalSupervisors: supervisorsSnap.size,
        totalProjects: projectsSnap.size,
        lockedProjects: lockedSnap.size,
        pendingRequests: pendingSnap.size,
        geminiStatus,
      })
      setLoading(false)
    }

    loadStats()
  }, [])

  const statCards = [
    { label: 'Total Students', value: stats.totalStudents, icon: Users, iconBg: 'bg-accent-light', iconColor: 'text-accent', trend: 'up' },
    { label: 'Supervisors', value: stats.totalSupervisors, icon: UserCheck, iconBg: 'bg-purple-100', iconColor: 'text-purple-600', trend: 'up' },
    { label: 'Total Projects', value: stats.totalProjects, icon: FolderKanban, iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', trend: 'up' },
    { label: 'Locked Projects', value: stats.lockedProjects, icon: Lock, iconBg: 'bg-amber-100', iconColor: 'text-amber-600', trend: 'up' },
    { label: 'Pending Locks', value: stats.pendingRequests, icon: ClipboardList, iconBg: 'bg-danger-light', iconColor: 'text-danger', trend: stats.pendingRequests > 0 ? 'up' : 'down' },
    {
      label: 'Gemini AI',
      value: stats.geminiStatus ? 'Operational' : 'Unavailable',
      icon: Zap,
      iconBg: stats.geminiStatus ? 'bg-success-light' : 'bg-danger-light',
      iconColor: stats.geminiStatus ? 'text-success' : 'text-danger',
      trend: stats.geminiStatus ? 'up' : 'down',
      isStatus: true,
    },
  ]

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
         <div className="h-32 bg-surface rounded-2xl border border-border" />
         <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-32 bg-surface rounded-2xl border border-border" />)}
         </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Greeting Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-surface rounded-2xl shadow-sm border border-border p-8 overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-accent-light/50 via-surface to-surface rounded-full opacity-50 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-[28px] font-bold text-navy leading-tight mb-1">
              {greeting}, {profile?.name?.split(' ')[0] || 'Admin'}!
            </h1>
            <p className="text-text-muted font-medium">
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
          <div className="inline-flex items-center px-4 py-2 bg-accent-light rounded-xl border border-accent/10 shadow-sm">
            <Settings className="w-4 h-4 text-accent mr-2" />
            <span className="text-[13px] font-bold text-accent">System running smoothly</span>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat, i) => (
          <ThreeDEffectWrapper key={stat.label}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="group bg-surface rounded-2xl shadow-sm hover:shadow-md border border-border p-5 transition-all duration-200 hover:-translate-y-[2px] h-full flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-[44px] h-[44px] rounded-xl ${stat.iconBg} ${stat.iconColor} flex items-center justify-center`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                {!stat.isStatus ? (
                  <div className={`flex items-center gap-1 text-[12px] font-bold px-2 py-1 rounded-full ${stat.trend === 'up' ? 'bg-success-light text-success' : 'bg-danger-light text-danger'}`}>
                    <TrendingUp className="w-3 h-3" />
                    +1
                  </div>
                ) : (
                  <div className={`flex items-center gap-1 text-[12px] font-bold px-2 py-1 rounded-full ${stat.trend === 'up' ? 'bg-success-light text-success' : 'bg-danger-light text-danger'}`}>
                    <span className="relative flex h-2 w-2 mr-1">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${stat.trend === 'up' ? 'bg-success' : 'bg-danger'}`}></span>
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${stat.trend === 'up' ? 'bg-success' : 'bg-danger'}`}></span>
                    </span>
                    Live
                  </div>
                )}
              </div>
              <p className="text-[13px] font-semibold text-text-muted uppercase tracking-wider mb-1">{stat.label}</p>
              <h3 className="text-[24px] font-bold text-navy leading-tight truncate">{stat.value}</h3>
            </motion.div>
          </ThreeDEffectWrapper>
        ))}
      </div>
    </div>
  )
}
