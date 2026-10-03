import { Search } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import NotificationBell from './NotificationBell'

export default function TopBar({ title }) {
  const { profile } = useAuthStore()
  const location = useLocation()
  
  // Simple breadcrumb generator
  const paths = location.pathname.split('/').filter(Boolean)
  const breadcrumb = paths.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' / ')

  return (
    <header className="sticky top-0 z-20 bg-surface border-b border-border shadow-sm h-[64px]">
      <div className="flex items-center justify-between h-full px-6">
        {/* Left Side: Title & Breadcrumb */}
        <div className="flex flex-col justify-center">
          <h1 className="text-[18px] font-bold text-navy leading-tight">
            {title}
          </h1>
          <p className="text-[13px] text-text-muted leading-tight mt-0.5">
            {breadcrumb}
          </p>
        </div>

        {/* Right Side: Actions & Avatar */}
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-full text-text-muted hover:text-navy hover:bg-bg-secondary transition-colors">
            <Search className="w-5 h-5" />
          </button>
          
          <NotificationBell />

          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center cursor-pointer shadow-sm ml-2">
             <span className="text-white text-xs font-bold">
               {profile?.name?.charAt(0).toUpperCase() || 'U'}
             </span>
          </div>
        </div>
      </div>
    </header>
  )
}
