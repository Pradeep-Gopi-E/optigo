'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Plus, Users, Calendar, Vote, Brain, MapPin, TrendingUp, LogOut, Menu } from 'lucide-react'
import { tripsAPI } from '@/lib/api'
import { formatCurrency, formatDate, generateInitials } from '@/lib/utils'
import Link from 'next/link'

interface Trip {
  id: string
  title: string
  destination?: string
  start_date?: string
  end_date?: string
  status: string
  participant_count: number
  created_at: string
}

interface User {
  id: string
  name: string
  email: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [trips, setTrips] = useState<Trip[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'planning': return 'bg-blue-100 text-blue-800'
      case 'voting': return 'bg-orange-100 text-orange-800'
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'planning': return <MapPin className="w-4 h-4" />
      case 'voting': return <Vote className="w-4 h-4" />
      case 'confirmed': return <Calendar className="w-4 h-4" />
      default: return <Calendar className="w-4 h-4" />
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-25 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">PackVote</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden"
            >
              <Menu className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            <Link
              href="/dashboard"
              className="flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-primary text-white"
            >
              <TrendingUp className="w-5 h-5 mr-3" />
              Dashboard
            </Link>
            <Link
              href="/trips"
              className="flex items-center px-4 py-2 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-100"
            >
              <MapPin className="w-5 h-5 mr-3" />
              My Trips
            </Link>
            <Link
              href="/trips/create"
              className="flex items-center px-4 py-2 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-100"
            >
              <Plus className="w-5 h-5 mr-3" />
              Create Trip
            </Link>
          </nav>

          {/* User Menu */}
          <div className="border-t px-4 py-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                {user ? generateInitials(user.name) : 'U'}
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden"
                >
                  <Menu className="w-6 h-6 text-gray-500" />
                </button>
                <h1 className="ml-4 text-xl font-semibold text-gray-900">Dashboard</h1>
              </div>
              <Link
                href="/trips/create"
                className="btn btn-primary flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Trip
              </Link>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome back, {user?.name}! 👋
            </h2>
            <p className="text-gray-600">
              Here's what's happening with your group trips
            </p>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{trips.length}</p>
                  <p className="text-sm text-gray-600">Total Trips</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">
                    {trips.reduce((sum, trip) => sum + trip.participant_count, 0)}
                  </p>
                  <p className="text-sm text-gray-600">Total Participants</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Vote className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">
                    {trips.filter(t => t.status === 'voting').length}
                  </p>
                  <p className="text-sm text-gray-600">Active Votes</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <div className="flex items-center">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Brain className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">
                    {trips.filter(t => t.status === 'confirmed').length}
                  </p>
                  <p className="text-sm text-gray-600">Confirmed Trips</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Recent Trips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <div className="bg-white rounded-xl shadow-sm">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Recent Trips</h3>
              </div>
              <div className="divide-y">
                {trips.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MapPin className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No trips yet</h3>
                    <p className="text-gray-600 mb-4">Start planning your first group trip!</p>
                    <Link
                      href="/trips/create"
                      className="btn btn-primary"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Trip
                    </Link>
                  </div>
                ) : (
                  trips.slice(0, 5).map((trip) => (
                    <Link
                      key={trip.id}
                      href={`/trips/${trip.id}`}
                      className="block hover:bg-gray-50 transition-colors"
                    >
                      <div className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <h4 className="text-lg font-medium text-gray-900 mr-3">
                                {trip.title}
                              </h4>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(trip.status)}`}>
                                {getStatusIcon(trip.status)}
                                <span className="ml-1">{trip.status}</span>
                              </span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600 space-x-4">
                              {trip.destination && (
                                <div className="flex items-center">
                                  <MapPin className="w-4 h-4 mr-1" />
                                  {trip.destination}
                                </div>
                              )}
                              <div className="flex items-center">
                                <Users className="w-4 h-4 mr-1" />
                                {trip.participant_count} participants
                              </div>
                              {trip.start_date && (
                                <div className="flex items-center">
                                  <Calendar className="w-4 h-4 mr-1" />
                                  {formatDate(trip.start_date)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
              {trips.length > 5 && (
                <div className="px-6 py-4 border-t">
                  <Link
                    href="/trips"
                    className="text-sm font-medium text-primary hover:text-primary/600"
                  >
                    View all trips →
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  )
}