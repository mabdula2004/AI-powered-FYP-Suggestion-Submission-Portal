import { cn } from '../../lib/utils'

const variants = {
  success: 'bg-[#ECFDF5] text-[#10B981]',
  error: 'bg-[#FEF2F2] text-[#EF4444]',
  warning: 'bg-[#FFFBEB] text-[#F59E0B]',
  info: 'bg-[#EFF6FF] text-[#3B82F6]',
  default: 'bg-[#F4F6F9] text-[#6B7A8D]',
}

export default function Badge({ label, variant = 'default', className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold',
        variants[variant],
        className
      )}
    >
      {label}
    </span>
  )
}
