'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Plus, Users, Calendar, MapPin, Search, MoreHorizontal } from 'lucide-react'
import { tripsAPI, Trip } from '@/libr/api'
import { formatDate, formatCurrency, getStatusColor } from '@/libr/utils'
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
      case 'planning': return <MapPin className="w-4 h-4" />
      case 'voting': return <MoreHorizontal className="w-4 h-4" />
      case 'confirmed': return <Calendar className="w-4 h-4" />
      default: return <Calendar className="w-4 h-4" />
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} currentPage="trips" />

      <div className="lg:ml-64">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">My Trips</h1>
                <p className="ml-2 text-sm text-gray-500">
                  {filteredTrips.length} {filteredTrips.length === 1 ? 'trip' : 'trips'}
                </p>
              </div>
              <Button onClick={() => router.push('/trips/create')}>
                <Plus className="w-4 h-4 mr-2" />
                New Trip
              </Button>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search trips..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Status</option>
                <option value="planning">Planning</option>
                <option value="voting">Voting</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Trips Grid */}
        <div className="px-4 sm:px-6 lg:px-8 pb-8">
          {filteredTrips.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery || statusFilter !== 'all' ? 'No trips found' : 'No trips yet'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Start planning your first group trip!'
                }
              </p>
              {!searchQuery && statusFilter === 'all' && (
                <Button onClick={() => router.push('/trips/create')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Trip
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredTrips.map((trip, index) => (
                <motion.div
                  key={trip.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card
                    className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
                    onClick={() => router.push(`/trips/${trip.id}`)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg line-clamp-2">{trip.title}</CardTitle>
                        <Badge variant="secondary" className={getStatusColor(trip.status)}>
                          {getStatusIcon(trip.status)}
                          <span className="ml-1 capitalize">{trip.status}</span>
                        </Badge>
                      </div>
                      {trip.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">{trip.description}</p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {trip.destination && (
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                            {trip.destination}
                          </div>
                        )}
                        <div className="flex items-center text-sm text-gray-600">
                          <Users className="w-4 h-4 mr-2 text-gray-400" />
                          {trip.participant_count} {trip.participant_count === 1 ? 'participant' : 'participants'}
                        </div>
                        {trip.start_date && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                            {formatDate(trip.start_date)}
                          </div>
                        )}
                        {trip.budget_min && trip.budget_max && (
                          <div className="text-sm text-gray-600">
                            <span>Budget: </span>
                            <span className="font-medium">
                              {formatCurrency(trip.budget_min)} - {formatCurrency(trip.budget_max)}
                            </span>
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
