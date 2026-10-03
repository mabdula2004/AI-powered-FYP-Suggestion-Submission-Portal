import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { collection, query, where, onSnapshot, limit, orderBy } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuthStore } from '../../stores/authStore'
import { motion, AnimatePresence } from 'framer-motion'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { formatDistanceToNow } from 'date-fns'

export default function NotificationBell() {
  const { user, profile } = useAuthStore()
  const navigate = useNavigate()
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [swing, setSwing] = useState(false)

  // Fetch notifications
  useEffect(() => {
    if (!user?.uid) return
    const q = query(
      collection(db, 'notifications'),
      where('recipientId', '==', user.uid)
    )
    const unsub = onSnapshot(q, (snap) => {
      let unread = 0
      const notifs = []
      snap.forEach(doc => {
        const data = doc.data()
        notifs.push({ id: doc.id, ...data })
        if (!data.isRead) unread++
      })
      
      // Sort manually in JS
      notifs.sort((a, b) => {
        const tA = a.createdAt?.toMillis() || 0
        const tB = b.createdAt?.toMillis() || 0
        return tB - tA
      })
      
      setNotifications(notifs.slice(0, 5))
      
      // If unread count goes up, do a quick swing
      if (unread > unreadCount) {
        setSwing(true)
        setTimeout(() => setSwing(false), 600)
      }
      setUnreadCount(unread)
    }, (error) => {
      console.error('Bell fetch error:', error)
    })
    return unsub
  }, [user?.uid])

  // Periodic swing every 5 seconds if there are unread notifications
  useEffect(() => {
    if (unreadCount === 0) return
    const interval = setInterval(() => {
      setSwing(true)
      setTimeout(() => setSwing(false), 600)
    }, 5000)
    return () => clearInterval(interval)
  }, [unreadCount])

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="relative p-2 rounded-full text-text-muted hover:text-navy hover:bg-bg-secondary transition-colors duration-150 outline-none">
          <motion.div
            animate={swing ? { rotate: [0, 15, -10, 5, -2, 0] } : {}}
            transition={{ duration: 0.6 }}
          >
            <Bell className="w-5 h-5" />
          </motion.div>
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                key={unreadCount} // Re-animate if count changes
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                className="absolute top-1.5 right-2 w-[16px] h-[16px] bg-danger text-white text-[9px] font-bold rounded-full flex items-center justify-center translate-x-1/2 -translate-y-1/2 shadow-sm border-[1.5px] border-surface"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 w-[380px] bg-surface rounded-2xl shadow-xl border border-border p-0 overflow-hidden outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-bg-secondary/50">
            <h3 className="font-bold text-navy text-[15px]">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-xs text-accent font-medium bg-accent-light px-2 py-0.5 rounded-full">
                {unreadCount} unread
              </span>
            )}
          </div>
          
          <div className="max-h-[320px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-5 py-8 text-center text-text-muted text-sm">
                No new notifications
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`px-5 py-3 border-b border-border last:border-0 hover:bg-bg-secondary transition-colors cursor-pointer ${
                    !notif.isRead ? 'bg-accent-light/30' : ''
                  }`}
                  onClick={() => navigate(`/${profile?.role || user?.role}/notifications`)}
                >
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent-light text-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-navy leading-tight mb-0.5">
                        {notif.title}
                      </p>
                      <p className="text-[12px] text-text-secondary line-clamp-2">
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-text-muted mt-1 font-medium">
                        {notif.createdAt?.toDate ? formatDistanceToNow(notif.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="p-3 border-t border-border bg-surface text-center">
            <button
              onClick={() => navigate(`/${profile?.role || user?.role}/notifications`)}
              className="text-[13px] font-semibold text-accent hover:text-accent-dark transition-colors"
            >
              View all notifications
            </button>
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
