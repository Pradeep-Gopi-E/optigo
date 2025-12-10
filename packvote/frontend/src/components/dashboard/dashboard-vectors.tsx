'use client'

import { motion } from 'framer-motion'

export const TotalJourneysVector = () => {
    return (
        <svg className="w-full h-full absolute inset-0 pointer-events-none" viewBox="0 0 400 200" preserveAspectRatio="none">
            <defs>
                <linearGradient id="journey-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
                    <stop offset="50%" stopColor="rgba(255,255,255,0.4)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
                </linearGradient>
            </defs>

            {/* Abstract Arcs */}
            <motion.path
                d="M-50,150 Q200,-50 450,150"
                stroke="url(#journey-gradient)"
                strokeWidth="1.5"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 2, ease: "easeInOut" }}
            />
            <motion.path
                d="M-50,180 Q200,0 450,180"
                stroke="url(#journey-gradient)"
                strokeWidth="1"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.8 }}
                transition={{ duration: 2.5, ease: "easeInOut", delay: 0.2 }}
            />
            <motion.path
                d="M0,200 Q200,50 400,200"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="1"
                fill="none"
            />

            {/* Mesh-like subtle grid */}
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
    )
}

export const CreateTripVector = () => {
    return (
        <svg className="w-full h-full absolute inset-0 pointer-events-none" viewBox="0 0 400 200" preserveAspectRatio="none">
            <defs>
                <linearGradient id="road-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.05)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0.25)" />
                </linearGradient>
            </defs>

            {/* Diagonal Waves */}
            <motion.path
                d="M-100,200 C0,150 100,250 200,200 S400,150 500,200"
                fill="none"
                stroke="url(#road-gradient)"
                strokeWidth="40"
                className="opacity-40"
                initial={{ x: -20 }}
                animate={{ x: 0 }}
                transition={{ duration: 5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
            />

            {/* Winding Road Line */}
            <motion.path
                d="M-50,220 C50,180 150,240 250,180 S450,140 550,180"
                fill="none"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="2"
                strokeDasharray="4 8"
                initial={{ strokeDashoffset: 0 }}
                animate={{ strokeDashoffset: -100 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            />
        </svg>
    )
}

export const JoinTripVector = () => {
    return (
        <svg className="w-full h-full absolute inset-0 pointer-events-none" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice">
            {/* Nodes and Connections */}
            <g stroke="rgba(255,255,255,0.2)" strokeWidth="1.5">
                <line x1="100" y1="50" x2="200" y2="100" />
                <line x1="200" y1="100" x2="300" y2="60" />
                <line x1="200" y1="100" x2="150" y2="150" />
                <line x1="300" y1="60" x2="350" y2="120" />
            </g>

            {/* Glowing Nodes */}
            <circle cx="100" cy="50" r="3" fill="rgba(255,255,255,0.4)" />
            <circle cx="200" cy="100" r="4" fill="rgba(255,255,255,0.5)">
                <animate attributeName="r" values="4;6;4" dur="3s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.5;0.8;0.5" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx="300" cy="60" r="3" fill="rgba(255,255,255,0.4)" />
            <circle cx="150" cy="150" r="2" fill="rgba(255,255,255,0.3)" />
            <circle cx="350" cy="120" r="2" fill="rgba(255,255,255,0.3)" />

            {/* Soft Glow Circles (Background) */}
            <circle cx="250" cy="100" r="80" fill="url(#glow-gradient)" className="opacity-30" />

            <defs>
                <radialGradient id="glow-gradient" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                </radialGradient>
            </defs>
        </svg>
    )
}
