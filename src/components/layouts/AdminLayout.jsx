import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  Settings,
} from 'lucide-react'
import SidebarNav from './SidebarNav'
import TopBar from './TopBar'

const navItems = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard, group: 'Overview' },
  { label: 'User Management', path: '/admin/users', icon: Users, group: 'Users' },
  { label: 'System Config', path: '/admin/config', icon: Settings, group: 'Settings' },
]

const pageTitles = {
  '/admin/dashboard': 'Dashboard',
  '/admin/users': 'User Management',
  '/admin/config': 'System Configuration',
}

export default function AdminLayout({ children }) {
  const location = useLocation()
  const title = pageTitles[location.pathname] || 'Admin Portal'

  return (
    <div className="min-h-screen bg-bg-secondary flex">
      <SidebarNav navItems={navItems} roleLabel="Admin Portal" />
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
