import { cn } from '../../lib/utils'

export default function SkeletonLoader({ variant = 'text', className, count = 1 }) {
  const baseClass = 'bg-[#F4F6F9] rounded-xl relative overflow-hidden'
  const shimmer = 'after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer_1.5s_infinite] after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent'

  const variants = {
    text: 'h-4 w-full',
    card: 'h-28 w-full',
    avatar: 'h-10 w-10 rounded-full',
    title: 'h-5 w-1/3',
    button: 'h-10 w-24',
  }

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(baseClass, shimmer, variants[variant], className)}
        />
      ))}
    </>
  )
}
