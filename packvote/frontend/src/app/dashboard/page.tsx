'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Plus, Users, Calendar, Vote, Brain, MapPin, ArrowRight, Globe, Sparkles } from 'lucide-react'
import { tripsAPI, Trip } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { Logo } from '@/components/ui/logo'
import { TotalJourneysVector, CreateTripVector, JoinTripVector } from '@/components/dashboard/dashboard-vectors'

interface User {
  id: string
  name: string
  email: string
}

const SplitText = ({ text, className }: { text: string, className?: string }) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      transition={{ staggerChildren: 0.03, delayChildren: 0.2 }}
      className={className}
      aria-label={text}
    >
      {text.split("").map((char, index) => (
        <motion.span
          key={`${char}-${index}`}
          transition={{ duration: 0.5, ease: [0.2, 0.65, 0.3, 0.9] }}
          variants={{
            hidden: { opacity: 0, y: 40 },
            visible: { opacity: 1, y: 0 },
          }}
          className="inline-block"
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </motion.div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [trips, setTrips] = useState<Trip[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    } else {
      router.push('/auth/login')
      return
    }

    fetchTrips()
  }, [router])

  const fetchTrips = async () => {
    try {
      const response = await tripsAPI.getTrips()
      setTrips(response)
    } catch (error) {
      console.error('Failed to fetch trips:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    router.push('/auth/login')
  }

  // Calculate stats
  const totalTrips = trips.length

  // Find next upcoming trip
  const nextTrip = trips
    .filter(t => t.status !== 'cancelled' && t.start_date && new Date(t.start_date) > new Date())
    .sort((a, b) => new Date(a.start_date!).getTime() - new Date(b.start_date!).getTime())[0]

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-px w-24 bg-zinc-800 overflow-hidden">
            <div className="h-full w-1/2 bg-zinc-200 animate-shimmer-line" />
          </div>
          <p className="text-zinc-500 font-body tracking-widest text-xs uppercase">Loading Experience</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-200 font-body selection:bg-zinc-800 selection:text-zinc-100">
      {/* Navigation Bar - Minimalist */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="group">
            <Logo />
          </Link>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-8 text-sm font-medium tracking-wide text-zinc-500">
              <Link href="/dashboard" className="text-zinc-100 transition-colors">Dashboard</Link>
              <Link href="/trips" className="hover:text-zinc-300 transition-colors">Journeys</Link>
              <Link href="/settings" className="hover:text-zinc-300 transition-colors">Settings</Link>
            </div>
            <div className="h-4 w-px bg-zinc-800 hidden md:block" />
            <button
              onClick={handleLogout}
              className="text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors uppercase tracking-wider"
            >
              Log Out
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-32 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-16">
            <div className="overflow-hidden">
              <SplitText
                text={`Welcome back, ${user?.name?.split(' ')[0]}`}
                className="text-5xl md:text-6xl font-heading font-normal text-zinc-100 mb-3 tracking-tight"
              />
            </div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="text-zinc-500 text-lg font-light tracking-wide"
            >
              Here is an overview of your adventures.
            </motion.p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[minmax(180px,auto)]">

            {/* Cell 1: Total Trips (Compact with World Map) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0A0A0A] p-6 flex flex-col justify-between group"
            >
              <div className="absolute inset-0 opacity-60 pointer-events-none">
                <TotalJourneysVector />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent" />
              </div>

              <div className="relative z-10 flex justify-between items-start">
                <div className="p-2 rounded-full border border-white/5 bg-white/5 text-zinc-400">
                  <Globe className="w-4 h-4" strokeWidth={1.5} />
                </div>
              </div>

              <div className="relative z-10">
                <span className="text-4xl font-heading text-zinc-100 block mb-1">{totalTrips}</span>
                <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Total Journeys</span>
              </div>
            </motion.div>

            {/* Cell 2: Quick Action - Create Trip */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              onClick={() => router.push('/trips/create')}
              className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0A0A0A] p-6 flex flex-col justify-between cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:border-zinc-700 hover:shadow-2xl group"
            >
              <div className="absolute inset-0 opacity-50 pointer-events-none group-hover:opacity-70 transition-opacity duration-500">
                <CreateTripVector />
              </div>

              <div className="relative z-10 flex justify-between items-start">
                <div className="p-2 rounded-full border border-white/5 bg-white/5 text-zinc-400 group-hover:text-zinc-100 transition-colors">
                  <Plus className="w-5 h-5" strokeWidth={1.5} />
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-700 group-hover:text-zinc-400 transition-colors -rotate-45 group-hover:rotate-0 duration-300" />
              </div>
              <div className="relative z-10">
                <h3 className="text-xl font-heading text-zinc-200 mb-1 group-hover:text-white transition-colors">Create Trip</h3>
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Start a new chapter</p>
              </div>
            </motion.div>

            {/* Cell 3: Quick Action - Join Trip */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0A0A0A] p-6 flex flex-col justify-between cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:border-zinc-700 hover:shadow-2xl group"
            >
              <div className="absolute inset-0 opacity-50 pointer-events-none group-hover:opacity-70 transition-opacity duration-500">
                <JoinTripVector />
              </div>

              <div className="relative z-10 flex justify-between items-start">
                <div className="p-2 rounded-full border border-white/5 bg-white/5 text-zinc-400 group-hover:text-zinc-100 transition-colors">
                  <Users className="w-5 h-5" strokeWidth={1.5} />
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-700 group-hover:text-zinc-400 transition-colors -rotate-45 group-hover:rotate-0 duration-300" />
              </div>
              <div className="relative z-10">
                <h3 className="text-xl font-heading text-zinc-200 mb-1 group-hover:text-white transition-colors">Join Trip</h3>
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Enter invite code</p>
              </div>
            </motion.div>

            {/* Cell 4: Active Trip (Large) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="md:col-span-3 lg:col-span-2 row-span-2 relative overflow-hidden rounded-3xl border border-white/10 bg-[#0A0A0A] group"
            >
              {nextTrip ? (
                <>
                  <div className="absolute inset-0 z-0">
                    <img
                      src={nextTrip.image_url || `https://source.unsplash.com/1200x800/?${nextTrip.destination},landscape`}
                      alt={nextTrip.title}
                      className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-1000 ease-out grayscale-[0.2] group-hover:grayscale-0"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/40 to-transparent" />
                  </div>
                  <div className="relative z-10 h-full flex flex-col justify-between p-8">
                    <div className="flex justify-between items-start">
                      <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[10px] font-medium text-white uppercase tracking-widest">
                        Up Next
                      </span>
                      <Link href={`/trips/${nextTrip.id}`} className="p-3 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-colors border border-white/10">
                        <ArrowRight className="w-5 h-5 text-white" strokeWidth={1.5} />
                      </Link>
                    </div>
                    <div>
                      <h2 className="text-4xl md:text-5xl font-heading text-white mb-3">{nextTrip.title}</h2>
                      <div className="flex items-center gap-6 text-zinc-300">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-zinc-400" strokeWidth={1.5} />
                          <span className="text-sm font-light tracking-wide">{formatDate(nextTrip.start_date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-zinc-400" strokeWidth={1.5} />
                          <span className="text-sm font-light tracking-wide">{nextTrip.destination || 'Destination TBD'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="w-16 h-16 rounded-full border border-white/5 bg-white/5 flex items-center justify-center mb-6">
                    <Sparkles className="w-6 h-6 text-zinc-400" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-2xl font-heading text-zinc-200 mb-2">No Upcoming Journeys</h3>
                  <p className="text-zinc-500 max-w-xs mx-auto mb-8 font-light">
                    The world is waiting. Start planning your next unforgettable experience.
                  </p>
                  <button
                    onClick={() => router.push('/trips/create')}
                    className="px-8 py-3 rounded-full bg-zinc-100 text-zinc-950 font-medium hover:bg-white transition-colors tracking-wide text-sm"
                  >
                    Plan a Trip
                  </button>
                </div>
              )}
            </motion.div>

            {/* Cell 5: Recent Activity List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="md:col-span-3 lg:col-span-2 row-span-2 rounded-3xl border border-white/10 bg-[#0A0A0A] p-8 flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-heading text-zinc-200">Recent Activity</h3>
                <Link href="/trips" className="text-[10px] font-medium text-zinc-500 hover:text-zinc-300 transition-colors uppercase tracking-widest border-b border-transparent hover:border-zinc-500 pb-0.5">
                  View All
                </Link>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-1 custom-scrollbar">
                {trips.slice(0, 5).map((trip, i) => (
                  <motion.div
                    key={trip.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + (i * 0.1), duration: 0.4 }}
                    onClick={() => router.push(`/trips/${trip.id}`)}
                    className="group flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-all cursor-pointer border border-transparent hover:border-white/5"
                  >
                    <div className="w-10 h-10 rounded-full border border-white/10 bg-zinc-900 flex items-center justify-center flex-shrink-0 text-zinc-500 group-hover:text-zinc-300 transition-colors">
                      {trip.status === 'planning' && <Brain className="w-4 h-4" strokeWidth={1.5} />}
                      {trip.status === 'voting' && <Vote className="w-4 h-4" strokeWidth={1.5} />}
                      {trip.status === 'confirmed' && <Calendar className="w-4 h-4" strokeWidth={1.5} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors tracking-wide">
                        {trip.title}
                      </h4>
                      <p className="text-xs text-zinc-600 truncate font-light">
                        {trip.destination || 'No destination'}
                      </p>
                    </div>
                    <div className={`px-2.5 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider ${trip.status === 'planning' ? 'bg-blue-950/30 text-blue-400/80' :
                      trip.status === 'voting' ? 'bg-amber-950/30 text-amber-400/80' :
                        'bg-emerald-950/30 text-emerald-400/80'
                      }`}>
                      {trip.status}
                    </div>
                  </motion.div>
                ))}

                {trips.length === 0 && (
                  <div className="h-full flex items-center justify-center text-zinc-700 text-sm font-light">
                    No recent activity to display
                  </div>
                )}
              </div>
            </motion.div>

          </div>
        </div>
      </main>
    </div>
  )
}