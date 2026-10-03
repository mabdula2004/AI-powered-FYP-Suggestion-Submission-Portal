import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Upload,
  ClipboardList,
  Monitor,
} from 'lucide-react'
import SidebarNav from './SidebarNav'
import TopBar from './TopBar'

const navItems = [
  { label: 'Dashboard', path: '/supervisor/dashboard', icon: LayoutDashboard, group: 'Overview' },
  { label: 'Upload Project', path: '/supervisor/upload', icon: Upload, group: 'Management' },
  { label: 'Lock Requests', path: '/supervisor/requests', icon: ClipboardList, group: 'Management' },
  { label: 'Monitor Students', path: '/supervisor/monitor', icon: Monitor, group: 'Monitoring' },
]

const pageTitles = {
  '/supervisor/dashboard': 'Dashboard',
  '/supervisor/upload': 'Upload Project',
  '/supervisor/requests': 'Lock Requests',
  '/supervisor/monitor': 'Monitor Students',
}

export default function SupervisorLayout({ children }) {
  const location = useLocation()
  const title = pageTitles[location.pathname] || 'Supervisor Portal'

  return (
    <div className="min-h-screen bg-bg-secondary flex">
      <SidebarNav navItems={navItems} roleLabel="Supervisor Portal" />
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
