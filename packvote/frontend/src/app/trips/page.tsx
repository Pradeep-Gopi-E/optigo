'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Plus, Users, Calendar, MapPin, Search, Filter, ArrowRight, Sparkles, Brain, Vote } from 'lucide-react'
import { tripsAPI, Trip } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Logo } from '@/components/ui/logo' // Ensure this exists
import toast from 'react-hot-toast'

export default function TripsPage() {
  const router = useRouter()
  const [trips, setTrips] = useState<Trip[]>([])
  const [filteredTrips, setFilteredTrips] = useState<Trip[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [user, setUser] = useState<any>(null)

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

  useEffect(() => {
    filterTrips()
  }, [trips, searchQuery, statusFilter])

  const fetchTrips = async () => {
    try {
      const response = await tripsAPI.getTrips()
      setTrips(response)
    } catch (error) {
      toast.error('Failed to fetch journeys')
    } finally {
      setIsLoading(false)
    }
  }

  const filterTrips = () => {
    let filtered = trips

    if (searchQuery) {
      filtered = filtered.filter(trip =>
        trip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (trip.destination && trip.destination.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(trip => trip.status === statusFilter)
    }

    setFilteredTrips(filtered)
  }

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    router.push('/auth/login')
  }

  // Helper to get status visuals
  const getStatusVisuals = (status: string) => {
    switch (status) {
      case 'planning': return { color: 'text-blue-400', bg: 'bg-blue-950/40', border: 'border-blue-500/20', icon: Brain, label: 'Planning' }
      case 'voting': return { color: 'text-amber-400', bg: 'bg-amber-950/40', border: 'border-amber-500/20', icon: Vote, label: 'Voting' }
      case 'confirmed': return { color: 'text-emerald-400', bg: 'bg-emerald-950/40', border: 'border-emerald-500/20', icon: Calendar, label: 'Confirmed' }
      default: return { color: 'text-zinc-400', bg: 'bg-zinc-800/50', border: 'border-zinc-700', icon: Calendar, label: status }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-px w-24 bg-zinc-800 overflow-hidden">
            <div className="h-full w-1/2 bg-zinc-200 animate-shimmer-line" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-200 font-body selection:bg-zinc-800 selection:text-zinc-100">

      {/* 1. TOP NAVIGATION (Consistent) */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-6 bg-[#09090b]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="group">
            <Logo />
          </Link>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-8 text-sm font-medium tracking-wide text-zinc-500">
              <Link href="/dashboard" className="hover:text-zinc-300 transition-colors">Dashboard</Link>
              <Link href="/trips" className="text-zinc-100 transition-colors">Journeys</Link>
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

      <main className="pt-32 pb-20 px-6 relative min-h-screen">
        {/* Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-white/[0.02] blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">

          {/* Header Area */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-5xl md:text-6xl font-heading text-zinc-100 mb-4"
              >
                Your Journeys
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-zinc-500 font-light text-lg max-w-md"
              >
                Curate your collection of unforgettable experiences.
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Button
                onClick={() => router.push('/trips/create')}
                className="rounded-full h-14 px-8 bg-zinc-100 text-black hover:bg-white hover:scale-105 transition-all shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] text-base font-medium"
              >
                <Plus className="w-5 h-5 mr-2" />
                Start New Journey
              </Button>
            </motion.div>
          </div>

          {/* Controls Bar (Glass) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="sticky top-24 z-40 mb-12"
          >
            <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 p-2 rounded-2xl flex flex-col md:flex-row gap-2 shadow-2xl">
              <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-zinc-300 transition-colors" />
                <input
                  placeholder="Search destinations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent h-12 pl-12 pr-4 text-zinc-200 placeholder:text-zinc-600 focus:outline-none rounded-xl hover:bg-white/5 focus:bg-white/5 transition-colors"
                />
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                {['all', 'planning', 'voting', 'confirmed'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-6 h-12 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${statusFilter === status
                        ? 'bg-white text-black shadow-lg'
                        : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                      }`}
                  >
                    {status === 'all' ? 'All Journeys' : status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Grid Layout */}
          {filteredTrips.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-32 flex flex-col items-center justify-center text-center border border-dashed border-white/10 rounded-3xl bg-white/[0.02]"
            >
              <div className="w-20 h-20 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center mb-6">
                <Sparkles className="w-8 h-8 text-zinc-600" />
              </div>
              <h3 className="text-2xl font-heading text-zinc-200 mb-2">
                {searchQuery ? 'No matches found' : 'The canvas is empty'}
              </h3>
              <p className="text-zinc-500 max-w-md mb-8 font-light">
                {searchQuery
                  ? "Try adjusting your search terms or filters."
                  : "Every great story begins with a destination. Where will you go next?"}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => router.push('/trips/create')}
                  className="text-sm uppercase tracking-widest text-zinc-400 hover:text-white border-b border-white/20 hover:border-white pb-1 transition-all"
                >
                  Create your first trip
                </button>
              )}
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTrips.map((trip, index) => {
                const statusStyle = getStatusVisuals(trip.status);
                const StatusIcon = statusStyle.icon;

                return (
                  <motion.div
                    key={trip.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => router.push(`/trips/${trip.id}`)}
                    className="group relative aspect-[4/3] rounded-3xl overflow-hidden cursor-pointer border border-white/10 bg-zinc-900"
                  >
                    {/* Background Image */}
                    <img
                      src={trip.image_url || `https://source.unsplash.com/800x600/?${trip.destination},landscape`}
                      alt={trip.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-60 group-hover:opacity-40 grayscale-[0.2] group-hover:grayscale-0"
                    />

                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90 group-hover:opacity-80 transition-opacity" />

                    {/* Content */}
                    <div className="absolute inset-0 p-8 flex flex-col justify-between">
                      {/* Top Bar */}
                      <div className="flex justify-between items-start">
                        <div className={`px-3 py-1.5 rounded-full backdrop-blur-md border flex items-center gap-2 ${statusStyle.bg} ${statusStyle.border}`}>
                          <StatusIcon className={`w-3 h-3 ${statusStyle.color}`} />
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${statusStyle.color}`}>
                            {statusStyle.label}
                          </span>
                        </div>

                        {trip.created_by === user?.id && (
                          <span className="px-2 py-1 bg-white/10 rounded text-[10px] uppercase tracking-widest text-zinc-400 font-medium">
                            Owner
                          </span>
                        )}
                      </div>

                      {/* Bottom Info */}
                      <div>
                        <h2 className="text-3xl font-heading text-white mb-2 group-hover:translate-x-1 transition-transform duration-300">
                          {trip.title}
                        </h2>

                        <div className="space-y-3">
                          {trip.destination && (
                            <div className="flex items-center gap-2 text-zinc-400 group-hover:text-zinc-200 transition-colors">
                              <MapPin className="w-4 h-4" />
                              <span className="text-sm font-light tracking-wide">{trip.destination}</span>
                            </div>
                          )}

                          <div className="flex items-center gap-6 text-zinc-500 text-xs uppercase tracking-wider font-medium">
                            <span className="flex items-center gap-2">
                              <Users className="w-3 h-3" />
                              {trip.participant_count} Travelers
                            </span>
                            {trip.start_date && (
                              <span className="flex items-center gap-2">
                                <Calendar className="w-3 h-3" />
                                {formatDate(trip.start_date)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Hover Arrow */}
                      <div className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                        <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center">
                          <ArrowRight className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}