'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Plus, Users, Calendar, MapPin, Search, MoreHorizontal, Compass } from 'lucide-react'
import { tripsAPI, Trip } from '@/lib/api'
import { formatDate, formatCurrency, getStatusColor, getCurrencyFromLocale } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Navigation } from '@/components/layout/navigation'
import toast from 'react-hot-toast'

export default function TripsPage() {
  const router = useRouter()
  const [trips, setTrips] = useState<Trip[]>([])
  const [filteredTrips, setFilteredTrips] = useState<Trip[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [user, setUser] = useState<any>(null)
  const [currency, setCurrency] = useState('USD')

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    } else {
      router.push('/auth/login')
      return
    }

    fetchTrips()
    setCurrency(getCurrencyFromLocale())
  }, [router])

  useEffect(() => {
    filterTrips()
  }, [trips, searchQuery, statusFilter])

  const fetchTrips = async () => {
    try {
      const response = await tripsAPI.getTrips()
      setTrips(response)
    } catch (error) {
      toast.error('Failed to fetch trips')
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

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'planning': return <Compass className="w-3 h-3" />
      case 'voting': return <MoreHorizontal className="w-3 h-3" />
      case 'confirmed': return <Calendar className="w-3 h-3" />
      default: return <Calendar className="w-3 h-3" />
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background relative flex">
      <div className="noise-overlay" />

      <Navigation user={user} currentPage="trips" />

      <div className="flex-1 lg:ml-0 relative z-10">
        {/* Header */}
        <div className="bg-background/80 backdrop-blur-md border-b border-border/50 sticky top-0 z-20">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-heading font-bold text-foreground">My Journeys</h1>
              <p className="text-sm text-muted-foreground">
                {filteredTrips.length} {filteredTrips.length === 1 ? 'adventure' : 'adventures'} planned
              </p>
            </div>
            <Button onClick={() => router.push('/trips/create')} className="shadow-lg">
              <Plus className="w-4 h-4 mr-2" />
              New Trip
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="px-6 py-8">
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search destinations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/50 backdrop-blur-sm border-border/50"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 bg-white/50 backdrop-blur-sm border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              >
                <option value="all">All Status</option>
                <option value="planning">Planning</option>
                <option value="voting">Voting</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Trips Grid */}
          {filteredTrips.length === 0 ? (
            <div className="text-center py-20 bg-secondary/10 rounded-2xl border border-dashed border-border">
              <div className="w-20 h-20 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <MapPin className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-heading font-medium text-foreground mb-2">
                {searchQuery || statusFilter !== 'all' ? 'No journeys found' : 'Start your first adventure'}
              </h3>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your search terms or filters to find what you are looking for.'
                  : 'Create a trip, invite your friends, and let AI help you plan the perfect getaway.'
                }
              </p>
              {!searchQuery && statusFilter === 'all' && (
                <Button onClick={() => router.push('/trips/create')} size="lg">
                  <Plus className="w-5 h-5 mr-2" />
                  Create Your First Trip
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredTrips.map((trip, index) => (
                <motion.div
                  key={trip.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className="h-full flex flex-col hover:border-primary/30 group cursor-pointer" onClick={() => router.push(`/trips/${trip.id}`)}>
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant="secondary" className={`${getStatusColor(trip.status)} px-2 py-1`}>
                          {getStatusIcon(trip.status)}
                          <span className="ml-1.5 capitalize font-medium">{trip.status}</span>
                        </Badge>
                        {trip.created_by === user?.id && (
                          <span className="text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded-full">Admin</span>
                        )}
                      </div>
                      <CardTitle className="text-xl font-heading line-clamp-1 group-hover:text-primary transition-colors">
                        {trip.title}
                      </CardTitle>
                      {trip.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{trip.description}</p>
                      )}
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-end space-y-4">
                      <div className="space-y-2 pt-4 border-t border-border/30">
                        {trip.destination && (
                          <div className="flex items-center text-sm text-foreground/80">
                            <MapPin className="w-4 h-4 mr-2 text-primary/70" />
                            {trip.destination}
                          </div>
                        )}
                        <div className="flex items-center text-sm text-foreground/80">
                          <Users className="w-4 h-4 mr-2 text-primary/70" />
                          {trip.participant_count} {trip.participant_count === 1 ? 'traveler' : 'travelers'}
                        </div>
                        {trip.start_date && (
                          <div className="flex items-center text-sm text-foreground/80">
                            <Calendar className="w-4 h-4 mr-2 text-primary/70" />
                            {formatDate(trip.start_date)}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
