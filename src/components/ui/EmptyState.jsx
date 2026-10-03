import { motion } from 'framer-motion'
import Button from './Button'

export default function EmptyState({
  icon: Icon,
  title,
  subtitle,
  actionLabel,
  onAction,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      {/* SVG Geometric Illustration */}
      <div className="relative w-24 h-24 mb-6">
        <svg viewBox="0 0 96 96" fill="none" className="w-full h-full">
          <circle cx="48" cy="48" r="40" fill="#F4F6F9" />
          <rect x="32" y="32" width="24" height="24" rx="6" fill="#EFF6FF" />
          <rect x="48" y="48" width="24" height="24" rx="6" fill="#DBEAFE" opacity="0.5" />
          <circle cx="40" cy="40" r="6" fill="#3B82F6" opacity="0.2" />
          <circle cx="56" cy="56" r="4" fill="#1A2332" opacity="0.1" />
        </svg>
      </div>

      {Icon && (
        <div className="p-3 bg-[#F4F6F9] rounded-xl mb-4">
          <Icon className="w-6 h-6 text-[#9CA3AF]" />
        </div>
      )}
      <h3 className="text-base font-bold text-[#1A2332] mb-1.5">{title}</h3>
      <p className="text-sm text-[#6B7A8D] max-w-xs mb-5">{subtitle}</p>
      {actionLabel && onAction && (
        <Button variant="accent" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </motion.div>
  )
}
