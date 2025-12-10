'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowRight, LogIn, UserPlus, LayoutDashboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BackgroundBeamsWithCollision } from '@/components/ui/background-beams-with-collision'
import { Logo } from '@/components/ui/logo'
import { AnimatedLogo } from '@/components/ui/animated-logo'

export default function HomePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden font-body">
      {/* Hero Section with Background Beams */}
      <BackgroundBeamsWithCollision className="min-h-screen flex flex-col justify-center">
        <div className="relative z-20 container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-4xl mx-auto"
          >
            <div className="flex justify-center mb-8">
              <AnimatedLogo size="lg" />
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-heading font-bold mb-8 leading-tight tracking-tight text-foreground drop-shadow-sm">
              Travel Together, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-300 to-white animate-gradient-x">
                Decide Together.
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed font-light">
              Plan group trips without the chaos. Collaborate on itineraries, vote on destinations, and make memories that last a lifetime.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pb-24">
              {user ? (
                <Button
                  size="lg"
                  onClick={() => router.push('/dashboard')}
                  className="text-lg px-10 py-7 rounded-full shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 bg-primary hover:bg-primary/90"
                >
                  Go to Dashboard <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              ) : (
                <>
                  <Button
                    size="lg"
                    onClick={() => router.push('/auth/register')}
                    className="text-lg px-10 py-7 rounded-full shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 bg-primary hover:bg-primary/90"
                  >
                    Start Planning Free <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => router.push('/auth/login')}
                    className="text-lg px-10 py-7 rounded-full border-2 border-primary/20 hover:border-primary/50 bg-background/50 backdrop-blur-sm hover:bg-secondary/50 transition-all duration-300"
                  >
                    Log In
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </BackgroundBeamsWithCollision>

      {/* Footer */}
      <footer className="absolute bottom-0 w-full py-6 border-t border-border/40 bg-background/80 backdrop-blur-md z-20">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Cohere. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}