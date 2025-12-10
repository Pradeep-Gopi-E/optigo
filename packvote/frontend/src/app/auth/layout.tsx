'use client'

import { motion } from 'framer-motion'
import { Logo } from '@/components/ui/logo'
import { AnimatedLogo } from '@/components/ui/animated-logo'
import Link from 'next/link'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen w-full flex bg-[#09090b]">
      {/* Left Side - Animated Logo & Brand */}
      <div className="hidden lg:flex w-1/2 relative bg-zinc-900 items-center justify-center overflow-hidden border-r border-white/5">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-800/50 via-zinc-900 to-zinc-950 opacity-50" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150" />
        </div>

        {/* Animated Content */}
        <div className="relative z-10">
          <Link href="/" className="group block">
            <AnimatedLogo size="2xl" />
          </Link>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 relative bg-[#09090b]">
        <div className="lg:hidden absolute top-8 left-8">
          <Link href="/" className="group">
            <Logo />
          </Link>
        </div>

        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  )
}