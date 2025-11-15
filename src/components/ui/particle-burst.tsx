'use client'

import { useEffect, useState } from 'react'

interface Particle {
  id: number
  angle: number
  distance: number
  delay: number
  size: number
}

interface ParticleBurstProps {
  active: boolean
  color?: 'yellow' | 'amber'
}

export function ParticleBurst({ active, color = 'yellow' }: ParticleBurstProps) {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    if (active) {
      // Generate 10 particles
      const newParticles = Array.from({ length: 10 }, (_, i) => ({
        id: i,
        angle: (360 / 10) * i + Math.random() * 20 - 10, // Evenly distributed with some randomness
        distance: 40 + Math.random() * 30, // Random distance 40-70px
        delay: Math.random() * 50, // Small delay variation
        size: 6 + Math.random() * 4, // Random size 6-10px
      }))

      setParticles(newParticles)

      // Clear particles after animation
      const timer = setTimeout(() => {
        setParticles([])
      }, 800)

      return () => clearTimeout(timer)
    }
  }, [active])

  if (particles.length === 0) return null

  const colorClass = color === 'amber' ? 'bg-amber-400' : 'bg-yellow-400'

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible">
      {particles.map((particle) => {
        const x = Math.cos((particle.angle * Math.PI) / 180) * particle.distance
        const y = Math.sin((particle.angle * Math.PI) / 180) * particle.distance

        return (
          <div
            key={particle.id}
            className={`absolute left-1/2 top-1/2 ${colorClass} rounded-full`}
            style={{
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animation: `particleBurst 600ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards`,
              animationDelay: `${particle.delay}ms`,
              '--particle-x': `${x}px`,
              '--particle-y': `${y}px`,
            } as React.CSSProperties}
          />
        )
      })}
      <style jsx>{`
        @keyframes particleBurst {
          0% {
            transform: translate(-50%, -50%) scale(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translate(calc(-50% + var(--particle-x)), calc(-50% + var(--particle-y))) scale(0.2) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
