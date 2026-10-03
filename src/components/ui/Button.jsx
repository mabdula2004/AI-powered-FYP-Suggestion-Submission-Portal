import { Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

const variantStyles = {
  primary:
    'bg-[#1A2332] text-white hover:bg-[#2D3F55] active:scale-[0.97] shadow-sm',
  secondary:
    'bg-white text-[#1A2332] border-[1.5px] border-[#E8ECF0] hover:bg-[#F4F6F9] active:scale-[0.97]',
  accent:
    'bg-[#EFF6FF] text-[#3B82F6] hover:bg-[#DBEAFE] active:scale-[0.97]',
  danger:
    'bg-[#FEF2F2] text-[#EF4444] hover:bg-[#FEE2E2] active:scale-[0.97]',
  ghost:
    'bg-transparent text-[#6B7A8D] hover:bg-[#F4F6F9] hover:text-[#1A2332]',
  outline:
    'bg-white text-[#1A2332] border-[1.5px] border-[#E8ECF0] hover:bg-[#F4F6F9] active:scale-[0.97]',
}

const sizeStyles = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  loading = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  fullWidth = false,
  className,
  type = 'button',
  ...props
}) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileTap={!disabled && !loading ? { scale: 0.97 } : undefined}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-colors duration-150 ease-out disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {!loading && LeftIcon && <LeftIcon className="w-4 h-4" />}
      {children}
      {!loading && RightIcon && <RightIcon className="w-4 h-4" />}
    </motion.button>
  )
}
