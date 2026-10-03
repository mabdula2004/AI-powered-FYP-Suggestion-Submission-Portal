import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

export default function Card({
  children,
  className,
  hover = false,
  onClick,
  header,
  ...props
}) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={hover && !onClick ? { y: -2, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' } : undefined}
      className={cn(
        'bg-white rounded-2xl border border-[#E8ECF0] transition-shadow duration-200',
        hover && 'cursor-pointer',
        className
      )}
      {...props}
    >
      {header && (
        <div className="px-6 pt-5 pb-3 border-b border-[#F4F6F9]">
          <h3 className="text-[15px] font-semibold text-[#1A2332]">{header}</h3>
        </div>
      )}
      <div className={cn('p-5', !header && 'p-6')}>
        {children}
      </div>
    </motion.div>
  )
}
