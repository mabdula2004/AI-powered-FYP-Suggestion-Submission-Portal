import { motion } from 'framer-motion'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import Button from './Button'

export default function ErrorState({ title, subtitle, onRetry }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <div className="relative w-24 h-24 mb-6">
        <svg viewBox="0 0 96 96" fill="none" className="w-full h-full">
          <circle cx="48" cy="48" r="40" fill="#FEF2F2" />
          <polygon points="48,32 64,64 32,64" fill="#FEE2E2" />
          <circle cx="48" cy="56" r="3" fill="#EF4444" opacity="0.3" />
          <rect x="46" y="38" width="4" height="12" rx="2" fill="#EF4444" opacity="0.3" />
        </svg>
      </div>
      <div className="p-3 bg-[#FEF2F2] rounded-xl mb-4">
        <AlertTriangle className="w-6 h-6 text-[#EF4444]" />
      </div>
      <h3 className="text-base font-bold text-[#1A2332] mb-1.5">{title || 'Something went wrong'}</h3>
      <p className="text-sm text-[#6B7A8D] max-w-xs mb-5">{subtitle || 'Please try again later.'}</p>
      {onRetry && (
        <Button variant="accent" onClick={onRetry} leftIcon={RotateCcw}>
          Try Again
        </Button>
      )}
    </motion.div>
  )
}
