'use client'

import { motion, Variants } from 'framer-motion'
import { cn } from '@/lib/utils'
import { LOGO_PATHS } from './logo-data'

interface AnimatedLogoProps {
    className?: string
    size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function AnimatedLogo({ className, size = 'lg' }: AnimatedLogoProps) {
    const sizes = {
        sm: 'w-16 h-16',
        md: 'w-32 h-32',
        lg: 'w-48 h-48',
        xl: 'w-64 h-64',
    }

    const currentSize = sizes[size]

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05,
                delayChildren: 0.2,
            },
        },
    }

    const pathVariants: Variants = {
        hidden: { opacity: 0, scale: 0.8, y: 20 },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: {
                type: 'spring',
                stiffness: 50,
                damping: 15,
            },
        },
    }

    return (
        <div className={cn("relative flex items-center justify-center", currentSize, className)}>
            <motion.svg
                viewBox="0 0 2016 2112"
                preserveAspectRatio="xMidYMid meet"
                className="w-full h-full text-primary fill-current"
                initial="hidden"
                animate="visible"
                variants={containerVariants}
            >
                <g transform="translate(0,2112) scale(0.1,-0.1)">
                    {LOGO_PATHS.map((d, index) => (
                        <motion.path
                            key={index}
                            d={d}
                            variants={pathVariants}
                            stroke="none"
                        />
                    ))}
                </g>
            </motion.svg>
        </div>
    )
}
