import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Menu, X, LogOut, Settings, Loader2 } from 'lucide-react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import Button from '../ui/Button'
import toast from 'react-hot-toast'
import SettingsModal from '../ui/SettingsModal'
import { cn } from '../../lib/utils'
import { useAuthStore } from '../../stores/authStore'
import ThreeDEffectWrapper from '../ui/3DEffectWrapper'

export default function SidebarNav({ navItems, roleLabel }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const { user, profile, logout } = useAuthStore()
  const navigate = useNavigate()

  const toggleMobile = () => setMobileOpen((prev) => !prev)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const handleOpenSettings = () => {
    setShowSettings(true)
  }



  const initials = profile?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U'

  // Helper to determine role color
  const getRoleColor = (role) => {
    switch(role) {
      case 'student': return 'bg-blue-100 text-blue-700'
      case 'supervisor': return 'bg-purple-100 text-purple-700'
      case 'admin': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  // Group nav items
  const groups = []
  let currentGroup = null
  let currentGroupItems = []

  navItems.forEach((item) => {
    const groupName = item.group || 'Menu'
    if (groupName !== currentGroup) {
      if (currentGroup !== null) {
        groups.push({ name: currentGroup, items: currentGroupItems })
      }
      currentGroup = groupName
      currentGroupItems = [item]
    } else {
      currentGroupItems.push(item)
    }
  })
  if (currentGroupItems.length > 0) {
    groups.push({ name: currentGroup, items: currentGroupItems })
  }

  const SidebarContent = (
    <div className="flex flex-col h-full bg-surface border-r border-border w-[260px]">
      {/* Top Section */}
      <div className="h-[72px] px-6 flex items-center gap-3 border-b border-border/50">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center shadow-sm">
          <span className="text-white text-xs font-bold tracking-tight">FYP</span>
        </div>
        <div className="flex flex-col justify-center">
          <h2 className="text-[16px] font-bold text-navy leading-tight">FYP Portal</h2>
          <p className="text-[11px] text-text-muted">{roleLabel}</p>
        </div>
      </div>

      {/* Nav Section */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-6">
        {groups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            <h3 className="px-3 text-[10px] uppercase text-text-muted tracking-[1.5px] mb-2 font-semibold">
              {group.name}
            </h3>
            {group.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 h-[42px] mx-[2px] rounded-lg text-[14px] font-medium transition-all duration-150',
                    isActive
                      ? 'bg-accent-light text-accent border-l-[3px] border-accent -ml-[2px] shadow-inner'
                      : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {item.icon && (
                      <item.icon className={cn('w-[18px] h-[18px] flex-shrink-0', isActive ? 'text-accent' : '')} />
                    )}
                    {item.label}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Bottom User Section */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-bg-secondary transition-colors cursor-pointer border border-transparent hover:border-border/50">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden">
            {profile?.photoURL ? (
              <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-sm font-bold">{initials}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-bold text-navy truncate">{profile?.name || 'User'}</p>
            <span className={cn("inline-flex items-center px-2 py-0.5 mt-0.5 rounded-full text-[10px] font-bold capitalize", getRoleColor(profile?.role))}>
              {profile?.role}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleOpenSettings}
              className="p-1.5 rounded-lg text-text-muted hover:text-accent hover:bg-accent-light/30 transition-colors"
              title="Edit Profile"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger-light transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <button
        onClick={toggleMobile}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-surface border border-border text-navy shadow-sm"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-navy/50 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop Sidebar with 3D Effect */}
      <aside className="hidden lg:block z-30 flex-shrink-0 h-screen sticky top-0">
        <ThreeDEffectWrapper className="h-full">
          {SidebarContent}
        </ThreeDEffectWrapper>
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'lg:hidden fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {SidebarContent}
      </aside>

      <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
    </>
  )
}
