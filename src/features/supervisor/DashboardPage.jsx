import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import {
  FolderKanban,
  Lock,
  ClipboardList,
  Users,
  ArrowRight,
  TrendingUp,
  Sparkles
} from 'lucide-react'
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
} from 'firebase/firestore'
import { formatDistanceToNow } from 'date-fns'
import { db } from '../../lib/firebase'
import { useAuthStore } from '../../stores/authStore'
import ThreeDEffectWrapper from '../../components/ui/3DEffectWrapper'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user, profile } = useAuthStore()
  const [stats, setStats] = useState({
    totalProjects: 0,
    lockedProjects: 0,
    pendingRequests: 0,
    activeGroups: 0,
  })
  const [pendingRequests, setPendingRequests] = useState([])
  const [loading, setLoading] = useState(true)

  const [greeting, setGreeting] = useState('Good morning')

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good morning')
    else if (hour < 17) setGreeting('Good afternoon')
    else setGreeting('Good evening')
  }, [])

  useEffect(() => {
    if (!user?.uid) return

    const loadStats = async () => {
      setLoading(true)
      try {
        // 1. Fetch all supervisor projects
        const projectsSnap = await getDocs(
          query(collection(db, 'projects'), where('supervisorId', '==', user.uid))
        )
        const projects = projectsSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
        const totalProjects = projects.length
        const lockedProjects = projects.filter((p) => p.isLocked).length
        const projectIds = projects.map((p) => p.id)

        // 2. Fetch lock requests only if supervisor has projects
        let pendingReqs = []
        let approvedReqs = []

        if (projectIds.length > 0) {
          const [pendingSnap, approvedSnap] = await Promise.all([
            getDocs(
              query(
                collection(db, 'lockRequests'),
                where('projectId', 'in', projectIds),
                where('status', '==', 'pending')
              )
            ),
            getDocs(
              query(
                collection(db, 'lockRequests'),
                where('projectId', 'in', projectIds),
                where('status', '==', 'approved')
              )
            ),
          ])
          pendingReqs = pendingSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
          approvedReqs = approvedSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
        }

        const activeGroupIds = new Set(approvedReqs.map((r) => r.groupId))

        setStats({
          totalProjects,
          lockedProjects,
          pendingRequests: pendingReqs.length,
          activeGroups: activeGroupIds.size,
        })

        // 3. Enrich up to 3 pending requests with names
        const enriched = await Promise.all(
          pendingReqs.slice(0, 3).map(async (req) => {
            const [leaderSnap, projectSnap] = await Promise.all([
              getDoc(doc(db, 'users', req.leaderId)),
              getDoc(doc(db, 'projects', req.projectId)),
            ])
            return {
              ...req,
              leaderName: leaderSnap.exists() ? leaderSnap.data().name : 'Unknown',
              projectTitle: projectSnap.exists() ? projectSnap.data().title : 'Unknown Project',
            }
          })
        )
        setPendingRequests(enriched)
      } catch (err) {
        console.error('[SupervisorDashboard] loadStats error:', err)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [user?.uid])


  const statCards = [
    { label: 'Total Projects', value: stats.totalProjects, icon: FolderKanban, iconBg: 'bg-accent-light', iconColor: 'text-accent', trend: 'up' },
    { label: 'Locked Projects', value: stats.lockedProjects, icon: Lock, iconBg: 'bg-success-light', iconColor: 'text-success', trend: 'up' },
    { label: 'Pending Requests', value: stats.pendingRequests, icon: ClipboardList, iconBg: 'bg-warning-light', iconColor: 'text-warning', trend: stats.pendingRequests > 0 ? 'up' : 'down' },
    { label: 'Active Groups', value: stats.activeGroups, icon: Users, iconBg: 'bg-purple-100', iconColor: 'text-purple-600', trend: 'up' },
  ]

  const quickActions = [
    {
      icon: FolderKanban,
      title: 'Upload Project',
      desc: 'Add a new FYP idea',
      path: '/supervisor/upload',
      color: 'from-accent to-accent-dark',
      iconBg: 'bg-white/20'
    },
    {
      icon: ClipboardList,
      title: 'Lock Requests',
      desc: 'Review student requests',
      path: '/supervisor/requests',
      color: 'from-amber-400 to-orange-500',
      iconBg: 'bg-white/20'
    },
    {
      icon: Users,
      title: 'Monitor Groups',
      desc: 'Check student progress',
      path: '/supervisor/monitor',
      color: 'from-emerald-400 to-teal-500',
      iconBg: 'bg-white/20'
    }
  ]

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
         <div className="h-32 bg-surface rounded-2xl border border-border" />
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-surface rounded-2xl border border-border" />)}
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
              {greeting}, {profile?.name?.split(' ')[0] || 'Supervisor'}!
            </h1>
            <p className="text-text-muted font-medium">
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
          <div className="inline-flex items-center px-4 py-2 bg-accent-light rounded-xl border border-accent/10 shadow-sm">
            <Sparkles className="w-4 h-4 text-accent mr-2" />
            <span className="text-[13px] font-bold text-accent">Ready to guide students?</span>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <div className={`flex items-center gap-1 text-[12px] font-bold px-2 py-1 rounded-full ${stat.trend === 'up' ? 'bg-success-light text-success' : 'bg-danger-light text-danger'}`}>
                  <TrendingUp className="w-3 h-3" />
                  {stat.value > 0 ? '+1' : '0'}
                </div>
              </div>
              <p className="text-[13px] font-semibold text-text-muted uppercase tracking-wider mb-1">{stat.label}</p>
              <h3 className="text-[24px] font-bold text-navy leading-tight truncate">{stat.value}</h3>
            </motion.div>
          </ThreeDEffectWrapper>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Quick Actions */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-[18px] font-bold text-navy mb-2">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-4">
            {quickActions.map((action, i) => (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                onClick={() => navigate(action.path)}
                className="group relative bg-surface rounded-2xl shadow-sm hover:shadow-md border border-border overflow-hidden cursor-pointer transition-all duration-300"
              >
                <div className={`h-20 bg-gradient-to-r ${action.color} p-4 flex items-center justify-between relative overflow-hidden`}>
                   <div className="flex items-center gap-4 relative z-10 text-white">
                      <div className={`w-10 h-10 rounded-xl ${action.iconBg} backdrop-blur-sm flex items-center justify-center`}>
                        <action.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-[15px]">{action.title}</h3>
                        <p className="text-[12px] opacity-90">{action.desc}</p>
                      </div>
                   </div>
                  {/* Decorative circle */}
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-24 h-24 bg-white opacity-10 rounded-full blur-sm group-hover:scale-125 transition-transform duration-500" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Pending Requests */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[18px] font-bold text-navy">Pending Lock Requests</h2>
            <button
              onClick={() => navigate('/supervisor/requests')}
              className="flex items-center gap-1 text-[13px] text-accent hover:text-accent-dark font-bold transition-colors duration-150"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="bg-surface border border-border rounded-2xl p-8 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-bg-secondary rounded-full flex items-center justify-center mb-4">
                <ClipboardList className="w-8 h-8 text-text-muted" />
              </div>
              <h3 className="text-[16px] font-bold text-navy mb-1">No pending requests</h3>
              <p className="text-[14px] text-text-muted">All lock requests have been handled</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((req, i) => (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  onClick={() => navigate('/supervisor/requests')}
                  className="group bg-surface border border-border hover:border-accent hover:shadow-md rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all duration-200"
                >
                  <div className="flex gap-4 items-center">
                     <div className="w-10 h-10 rounded-full bg-warning-light flex items-center justify-center flex-shrink-0">
                       <ClipboardList className="w-5 h-5 text-warning" />
                     </div>
                     <div>
                       <h4 className="font-bold text-[15px] text-navy">{req.projectTitle}</h4>
                       <p className="text-[13px] text-text-muted mt-0.5">
                         Requested by <span className="font-semibold text-text-primary">{req.leaderName}</span> • {req.createdAt?.toDate ? formatDistanceToNow(req.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                       </p>
                     </div>
                  </div>
                  <div className="flex items-center gap-2">
                     <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-warning-light text-warning uppercase tracking-wider">
                       Pending
                     </span>
                     <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-accent group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  )
}
