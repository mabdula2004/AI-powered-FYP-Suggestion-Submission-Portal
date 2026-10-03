import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDoc,
} from 'firebase/firestore'
import {
  Search,
  Users,
  Sparkles,
  Lightbulb,
  UserCheck,
  Group,
  FolderKanban,
  Flag,
  Bell,
  TrendingUp,
  TrendingDown,
  ArrowRight
} from 'lucide-react'
import { db } from '../../lib/firebase'
import { useAuthStore } from '../../stores/authStore'
import ThreeDEffectWrapper from '../../components/ui/3DEffectWrapper'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user, profile } = useAuthStore()
  const [studentProfile, setStudentProfile] = useState(null)
  const [group, setGroup] = useState(null)
  const [project, setProject] = useState(null)
  const [milestones, setMilestones] = useState([])
  const [notifications, setNotifications] = useState([])

  const [greeting, setGreeting] = useState('Good morning')

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good morning')
    else if (hour < 17) setGreeting('Good afternoon')
    else setGreeting('Good evening')
  }, [])

  useEffect(() => {
    if (!user?.uid) return
    const unsubProfile = onSnapshot(
      doc(db, 'studentProfiles', user.uid),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data()
          setStudentProfile(data)
          if (!data.profileComplete) {
            navigate('/student/profile-setup')
          }
        }
      }
    )
    return unsubProfile
  }, [user?.uid, navigate])

  useEffect(() => {
    if (!studentProfile?.groupId) {
      setGroup(null)
      setProject(null)
      setMilestones([])
      return
    }

    const unsubGroup = onSnapshot(
      doc(db, 'groups', studentProfile.groupId),
      async (snap) => {
        if (snap.exists()) {
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
        }
      }
    )

    const q = query(
      collection(db, 'milestones'),
      where('groupId', '==', studentProfile.groupId),
      orderBy('phase', 'asc')
    )
    const unsubMilestones = onSnapshot(q, (snap) => {
      setMilestones(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })

    return () => {
      unsubGroup()
      unsubMilestones()
    }
  }, [studentProfile?.groupId])

  useEffect(() => {
    if (!user?.uid) return
    const q = query(
      collection(db, 'notifications'),
      where('recipientId', '==', user.uid),
      where('isRead', '==', false),
      orderBy('createdAt', 'desc'),
      limit(3)
    )
    const unsub = onSnapshot(q, (snap) => {
      setNotifications(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [user?.uid])

  const completedMilestones = milestones.filter((m) => m.isCompleted).length
  const totalMilestones = milestones.length || 5

  const quickActions = [
    {
      icon: Search,
      title: 'Browse Projects',
      desc: 'Find your perfect FYP',
      path: '/student/browse',
      color: 'from-blue-500 to-indigo-600',
      iconBg: 'bg-white/20'
    },
    {
      icon: Users,
      title: 'My Group',
      desc: 'Manage your team',
      path: '/student/group',
      color: 'from-purple-500 to-pink-600',
      iconBg: 'bg-white/20'
    },
    {
      icon: Sparkles,
      title: 'AI Tools',
      desc: 'Get recommendations',
      path: '/student/ai',
      color: 'from-amber-400 to-orange-500',
      iconBg: 'bg-white/20'
    },
    {
      icon: Lightbulb,
      title: 'Generate Idea',
      desc: 'Create project ideas',
      path: '/student/ai?tab=generate',
      color: 'from-emerald-400 to-teal-500',
      iconBg: 'bg-white/20'
    },
  ]

  const stats = [
    {
      label: 'Profile Status',
      value: studentProfile?.profileComplete ? 'Complete' : 'Pending',
      icon: UserCheck,
      iconBg: 'bg-success-light',
      iconColor: 'text-success',
      trend: 'up',
      percent: '100%'
    },
    {
      label: 'Group Status',
      value: group ? 'Formed' : 'None',
      icon: Group,
      iconBg: 'bg-accent-light',
      iconColor: 'text-accent',
      trend: group ? 'up' : 'down',
      percent: group ? 'Active' : 'Missing'
    },
    {
      label: 'Current Project',
      value: project?.title || 'None selected',
      icon: FolderKanban,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      trend: project ? 'up' : 'down',
      percent: project ? 'Locked' : 'Browse'
    },
    {
      label: 'Milestones Completed',
      value: `${completedMilestones}/${totalMilestones}`,
      icon: Flag,
      iconBg: 'bg-warning-light',
      iconColor: 'text-warning',
      trend: 'up',
      percent: `${Math.round((completedMilestones / totalMilestones) * 100) || 0}%`
    },
  ]

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
              {greeting}, {profile?.name?.split(' ')[0] || 'Student'}!
            </h1>
            <p className="text-text-muted font-medium">
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
          <div className="inline-flex items-center px-4 py-2 bg-accent-light rounded-xl border border-accent/10 shadow-sm">
            <Sparkles className="w-4 h-4 text-accent mr-2" />
            <span className="text-[13px] font-bold text-accent">Ready to build something great?</span>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
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
                <div className={`flex items-center gap-1 text-[12px] font-bold px-2 py-1 rounded-full ${stat.trend === 'up' ? 'bg-success-light text-success' : 'bg-danger-light text-danger'}`}>
                  {stat.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {stat.percent}
                </div>
              </div>
              <p className="text-[13px] font-semibold text-text-muted uppercase tracking-wider mb-1">{stat.label}</p>
              <h3 className="text-[24px] font-bold text-navy leading-tight truncate">{stat.value}</h3>
            </motion.div>
          </ThreeDEffectWrapper>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-[18px] font-bold text-navy mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, i) => (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.05 }}
              onClick={() => navigate(action.path)}
              className="group relative bg-surface rounded-2xl shadow-sm hover:shadow-lg border border-border overflow-hidden cursor-pointer transition-all duration-300"
            >
              <div className={`h-24 bg-gradient-to-br ${action.color} p-4 flex items-start justify-between relative overflow-hidden`}>
                <div className={`w-10 h-10 rounded-xl ${action.iconBg} backdrop-blur-sm flex items-center justify-center z-10 text-white`}>
                  <action.icon className="w-5 h-5" />
                </div>
                {/* Decorative circle */}
                <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-white opacity-10 rounded-full blur-sm group-hover:scale-150 transition-transform duration-500" />
              </div>
              <div className="p-4 relative">
                <h3 className="font-bold text-[16px] text-navy mb-1">{action.title}</h3>
                <p className="text-[13px] text-text-muted">{action.desc}</p>
                <div className="absolute bottom-4 right-4 text-text-muted group-hover:text-accent group-hover:translate-x-1 transition-all duration-300">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

    </div>
  )
}
