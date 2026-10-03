import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Search,
  Users,
  Sparkles,
  Flag,
  Bell,
} from 'lucide-react'
import SidebarNav from './SidebarNav'
import TopBar from './TopBar'

const navItems = [
  { label: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard, group: 'Overview' },
  { label: 'Browse Projects', path: '/student/browse', icon: Search, group: 'Discover' },
  { label: 'My Group', path: '/student/group', icon: Users, group: 'Collaboration' },
  { label: 'AI Tools', path: '/student/ai', icon: Sparkles, group: 'Intelligence' },
  { label: 'Milestones', path: '/student/milestones', icon: Flag, group: 'Progress' },
  { label: 'Notifications', path: '/student/notifications', icon: Bell, group: 'Updates' },
]

const pageTitles = {
  '/student/dashboard': 'Dashboard',
  '/student/profile-setup': 'Profile Setup',
  '/student/browse': 'Browse Projects',
  '/student/group': 'My Group',
  '/student/ai': 'AI Tools',
  '/student/milestones': 'Milestones',
  '/student/notifications': 'Notifications',
}

export default function StudentLayout({ children }) {
  const location = useLocation()
  const title = pageTitles[location.pathname] || 'Student Portal'

  return (
    <div className="min-h-screen bg-bg-secondary flex">
      <SidebarNav navItems={navItems} roleLabel="Student Portal" />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar title={title} />
        <main className="flex-1 p-6 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
