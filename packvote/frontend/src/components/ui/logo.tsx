import React from 'react'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  className?: string
}

export function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const sizes = {
    sm: { icon: 'w-8 h-8', text: 'text-lg' },
    md: { icon: 'w-12 h-12', text: 'text-2xl' },
    lg: { icon: 'w-16 h-16', text: 'text-3xl' },
    xl: { icon: 'w-24 h-24', text: 'text-5xl' },
  }

  const currentSize = sizes[size]

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Futuristic Logo Icon */}
      <div className={`${currentSize.icon} relative`}>
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Outer Circle with Gradient */}
          <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
            <linearGradient id="innerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>

          {/* Hexagon Background */}
          <path
            d="M50 5 L85 25 L85 65 L50 85 L15 65 L15 25 Z"
            fill="url(#logoGradient)"
            className="animate-pulse"
            opacity="0.2"
          />

          {/* Double Arrow Forward (Go Together Symbol) */}
          <g transform="translate(20, 35)">
            {/* First Arrow */}
            <path
              d="M0 15 L20 15 L20 5 L35 20 L20 35 L20 25 L0 25 Z"
              fill="url(#innerGradient)"
            />
            {/* Second Arrow */}
            <path
              d="M25 15 L45 15 L45 5 L60 20 L45 35 L45 25 L25 25 Z"
              fill="url(#logoGradient)"
            />
          </g>

          {/* Tech Circles */}
          <circle cx="15" cy="25" r="3" fill="#06b6d4" opacity="0.8" />
          <circle cx="85" cy="25" r="3" fill="#8b5cf6" opacity="0.8" />
          <circle cx="50" cy="85" r="3" fill="#10b981" opacity="0.8" />
        </svg>
      </div>

      {/* Brand Text */}
      {showText && (
        <div className="flex flex-col">
          <span className={`${currentSize.text} font-bold bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 bg-clip-text text-transparent`}>
            TooGo
          </span>
          <span className="text-xs text-gray-500 -mt-1 tracking-wider">GO TOGETHER</span>
        </div>
      )}
    </div>
  )
}

export default Logo
