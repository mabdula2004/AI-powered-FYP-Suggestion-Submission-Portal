import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import { formatDistanceToNow } from 'date-fns'
import { Bell, CheckCheck, Info, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react'
import { db } from '../../lib/firebase'
import { useAuthStore } from '../../stores/authStore'
import { notificationService } from '../../services/notificationService'
import EmptyState from '../../components/ui/EmptyState'

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25 } },
}

const typeConfig = {
  info: { color: '#3B82F6', bg: '#EFF6FF', icon: Info },
  success: { color: '#10B981', bg: '#ECFDF5', icon: CheckCircle },
  warning: { color: '#F59E0B', bg: '#FFFBEB', icon: AlertTriangle },
  danger: { color: '#EF4444', bg: '#FEF2F2', icon: AlertCircle },
}

export default function NotificationsPage() {
  const { user } = useAuthStore()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.uid) return

    const q = query(
      collection(db, 'notifications'),
      where('recipientId', '==', user.uid)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }))
      
      // Sort in memory to avoid needing a composite index
      docs.sort((a, b) => {
        const timeA = a.createdAt?.toMillis() || 0
        const timeB = b.createdAt?.toMillis() || 0
        return timeB - timeA
      })
      
      setNotifications(docs)
      setLoading(false)
    }, (error) => {
      console.error('Notifications fetch error:', error)
      setLoading(false)
    })

    return unsubscribe
  }, [user?.uid])

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead(user.uid)
  }

  const handleClick = async (notif) => {
    if (!notif.isRead) {
      await notificationService.markAsRead(notif.id)
    }
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="max-w-3xl mx-auto"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[24px] font-bold text-[#1A2332] mb-1">Notifications</h2>
          <p className="text-[13px] text-[#6B7A8D]">Stay updated on your FYP activity</p>
        </div>
        <button
          onClick={handleMarkAllRead}
          className="flex items-center gap-2 text-[13px] text-[#6B7A8D] hover:text-[#1A2332] font-medium transition-colors duration-150"
        >
          <CheckCheck className="w-4 h-4" />
          Mark all as read
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-[#F4F6F9] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          subtitle="You're all caught up!"
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => {
            const type = (notif.type || 'info').toLowerCase()
            const config = typeConfig[type] || typeConfig.info
            const Icon = config.icon
            return (
              <div
                key={notif.id}
                onClick={() => handleClick(notif)}
                className={`p-4 rounded-xl border transition-all duration-150 cursor-pointer ${
                  notif.isRead
                    ? 'bg-white border-[#E8ECF0]'
                    : 'bg-[#FAFBFF] border-[#E8ECF0] border-l-[3px]'
                }`}
                style={!notif.isRead ? { borderLeftColor: config.color } : {}}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: config.bg }}
                    >
                      <Icon className="w-4 h-4" style={{ color: config.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold text-[14px] ${notif.isRead ? 'text-[#1A2332]' : 'text-[#1A2332]'}`}>
                        {notif.title}
                      </h3>
                      <p className="text-[#6B7A8D] text-[13px] mt-1 leading-relaxed">{notif.message}</p>
                      <p className="text-[#9CA3AF] text-[11px] mt-2">
                        {notif.createdAt?.toDate
                          ? formatDistanceToNow(notif.createdAt.toDate(), { addSuffix: true })
                          : 'Just now'}
                      </p>
                    </div>
                  </div>
                  {!notif.isRead && (
                    <span className="w-2.5 h-2.5 bg-[#3B82F6] rounded-full mt-2 flex-shrink-0" />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}
