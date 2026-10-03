import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const Blob = ({ color, initialX, initialY, duration }) => (
  <motion.div
    className={`absolute rounded-full blur-[100px] opacity-20 ${color}`}
    initial={{ x: initialX, y: initialY, scale: 1 }}
    animate={{ 
      x: [initialX, initialX + 100, initialX - 50, initialX],
      y: [initialY, initialY - 100, initialY + 50, initialY],
      scale: [1, 1.2, 0.9, 1],
    }}
    transition={{ 
      duration, 
      repeat: Infinity, 
      ease: "easeInOut" 
    }}
    style={{ width: '400px', height: '400px' }}
  />
)

export default function SplashScreen({ onComplete }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete()
    }, 3500) // Slightly longer to appreciate the "4 chand"
    return () => clearTimeout(timer)
  }, [onComplete])

  const letterVariants = {
    hidden: { opacity: 0, y: 30, rotateX: -90 },
    visible: { 
      opacity: 1, 
      y: 0, 
      rotateX: 0,
      transition: { 
        type: "spring", 
        stiffness: 100, 
        damping: 10 
      }
    }
  }

  const text = "FYP PORTAL"

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ 
        opacity: 0,
        transition: { duration: 0.8, ease: [0.43, 0.13, 0.23, 0.96] }
      }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#050811] overflow-hidden"
    >
      {/* Dynamic Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <Blob color="bg-[#4F46E5]" initialX="-10%" initialY="-10%" duration={15} />
        <Blob color="bg-[#7C3AED]" initialX="70%" initialY="60%" duration={18} />
        <Blob color="bg-[#3B82F6]" initialX="20%" initialY="40%" duration={20} />
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="relative z-10 flex flex-col items-center">
        {/* Futuristic Logo Container */}
        <div className="relative mb-12">
          {/* Logo Glow */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: [0.2, 0.5, 0.2], scale: [1, 1.2, 1] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute inset-0 bg-accent blur-3xl rounded-full"
          />
          
          <motion.div
            initial={{ scale: 0, rotate: -180, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 120,
              damping: 15,
              delay: 0.2
            }}
            className="relative w-24 h-24 rounded-[28%] bg-white/[0.03] backdrop-blur-md border border-white/10 shadow-2xl flex items-center justify-center group"
          >
            {/* Shimmer Effect */}
            <motion.div 
              className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-full"
              animate={{ x: ['100%', '-100%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
            
            <motion.div
              animate={{ 
                rotateY: [0, 360],
                filter: ["drop-shadow(0 0 0px #4F46E5)", "drop-shadow(0 0 15px #4F46E5)", "drop-shadow(0 0 0px #4F46E5)"]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="relative"
            >
              <div className="w-12 h-12 border-4 border-accent rounded-lg flex items-center justify-center">
                <div className="w-6 h-6 bg-accent rounded-sm" />
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Animated Typography */}
        <motion.div
          className="flex space-x-3 mb-12"
          initial="hidden"
          animate="visible"
          variants={{
            visible: {
              transition: { staggerChildren: 0.1, delayChildren: 0.5 }
            }
          }}
        >
          {text.split('').map((char, index) => (
            <motion.span
              key={index}
              variants={letterVariants}
              className={`text-4xl md:text-5xl font-black tracking-tighter ${
                char === " " ? "w-4" : ""
              } bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40 drop-shadow-2xl`}
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              {char}
            </motion.span>
          ))}
        </motion.div>

        {/* Minimalist Progress Loader */}
        <div className="relative w-48 h-[2px] bg-white/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 2.8, ease: [0.65, 0, 0.35, 1] }}
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-accent to-[#7C3AED] shadow-[0_0_10px_rgba(79,70,229,0.5)]"
          />
        </div>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 1, duration: 1 }}
          className="mt-6 text-[10px] uppercase tracking-[0.3em] text-white font-medium"
        >
          Initializing Secure Environment
        </motion.p>
      </div>
      
      {/* Corner Accents */}
      <div className="absolute top-0 left-0 w-32 h-32 border-t border-l border-white/5 m-8 rounded-tl-3xl" />
      <div className="absolute bottom-0 right-0 w-32 h-32 border-b border-r border-white/5 m-8 rounded-br-3xl" />
    </motion.div>
  )
}
