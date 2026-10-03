import { useRef, useState, useEffect } from 'react'

export default function ThreeDEffectWrapper({ children, className = '' }) {
  const cardRef = useRef(null)
  const [rotation, setRotation] = useState({ x: 0, y: 0 })
  const [highlight, setHighlight] = useState({ x: 50, y: 50, opacity: 0 })

  useEffect(() => {
    const card = cardRef.current
    if (!card) return

    const handleMouseMove = (e) => {
      const rect = card.getBoundingClientRect()
      const x = e.clientX - rect.left // x position within the element
      const y = e.clientY - rect.top  // y position within the element

      const centerX = rect.width / 2
      const centerY = rect.height / 2

      const rotateX = ((y - centerY) / centerY) * -8
      const rotateY = ((x - centerX) / centerX) * 8

      setRotation({ x: rotateX, y: rotateY })

      const highlightX = (x / rect.width) * 100
      const highlightY = (y / rect.height) * 100
      setHighlight({ x: highlightX, y: highlightY, opacity: 0.15 })
    }

    const handleMouseEnter = () => {
      card.style.transition = 'none'
    }

    const handleMouseLeave = () => {
      setRotation({ x: 0, y: 0 })
      setHighlight((prev) => ({ ...prev, opacity: 0 }))
      card.style.transition = 'transform 0.5s ease, box-shadow 0.5s ease'
    }

    card.addEventListener('mousemove', handleMouseMove)
    card.addEventListener('mouseenter', handleMouseEnter)
    card.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      card.removeEventListener('mousemove', handleMouseMove)
      card.removeEventListener('mouseenter', handleMouseEnter)
      card.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  return (
    <div
      ref={cardRef}
      className={`perspective-1000 relative overflow-hidden ${className}`}
      style={{
        transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
        transformStyle: 'preserve-3d',
      }}
    >
      {children}
      {/* Specular Highlight */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at ${highlight.x}% ${highlight.y}%, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 60%)`,
          opacity: highlight.opacity,
          mixBlendMode: 'overlay',
        }}
      />
    </div>
  )
}
