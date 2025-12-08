'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Plus, Users, Calendar, Vote, Brain, MapPin, TrendingUp, LogOut, Menu, Palette } from 'lucide-react'
import { tripsAPI, Trip, authAPI } from '@/lib/api'
import { formatDate, generateInitials } from '@/lib/utils'
import Link from 'next/link'
import { Logo } from '@/components/ui/logo'
import SplitText from '@/components/ui/SplitText'
import ParallaxHero from '@/components/ui/ParallaxHero'
import { themes } from '@/lib/themes'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu"
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'

interface User {
  id: string
  name: string
  email: string
  dashboard_theme?: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [trips, setTrips] = useState<Trip[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentTheme, setCurrentTheme] = useState('wilderness')

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      if (parsedUser.dashboard_theme) {
        setCurrentTheme(parsedUser.dashboard_theme)
      }
    } else {
      router.push('/auth/login')
      return
    }

    fetchTrips()
    fetchUserProfile()
  }, [router])

  const fetchUserProfile = async () => {
    try {
      const profile = await authAPI.getMe()
      setUser(profile)
      if (profile.dashboard_theme) {
        setCurrentTheme(profile.dashboard_theme)
        // Update local storage to keep it in sync
        localStorage.setItem('user', JSON.stringify(profile))
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    }
  }

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

  const handleThemeChange = async (themeId: string) => {
    setCurrentTheme(themeId)
    try {
      await authAPI.updateProfile({ dashboard_theme: themeId })
      toast.success(`Theme updated to ${themes[themeId].name}`)
      // Update local user state
      if (user) {
        const updatedUser = { ...user, dashboard_theme: themeId }
        setUser(updatedUser)
        localStorage.setItem('user', JSON.stringify(updatedUser))
      }
    } catch (error) {
      console.error('Failed to update theme:', error)
      toast.error('Failed to save theme preference')
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
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Parallax Background */}
      <div className="absolute inset-0 z-0">
        <ParallaxHero theme={currentTheme} title="" className="h-full w-full" />
      </div>

      {/* Mobile menu overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-25 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white/90 backdrop-blur-md shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200/50">
            <div className="flex items-center">
              <Logo />
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
              className="flex items-center px-4 py-2 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-100/50"
            >
              <MapPin className="w-5 h-5 mr-3" />
              My Trips
            </Link>
            <Link
              href="/trips/create"
              className="flex items-center px-4 py-2 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-100/50"
            >
              <Plus className="w-5 h-5 mr-3" />
              Create Trip
            </Link>
          </nav>

          {/* User Menu */}
          <div className="border-t border-gray-200/50 px-4 py-6">
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
              className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100/50"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-64 relative z-10">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200/50">
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

              {/* Theme Switcher */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="ml-auto">
                    <Palette className="h-5 w-5 text-gray-600" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {Object.values(themes).map((theme) => (
                    <DropdownMenuItem
                      key={theme.id}
                      onClick={() => handleThemeChange(theme.id)}
                      className={currentTheme === theme.id ? "bg-accent" : ""}
                    >
                      {theme.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {/* Welcome Section */}
          <div className="mb-12 text-center">
            <SplitText
              text={`Welcome back, ${user?.name}!`}
              className="text-5xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg"
              delay={50}
              duration={1}
              tag="h1"
            />
            <p className="text-xl text-white/90 drop-shadow-md">
              Here's what's happening with your group trips
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white/90 backdrop-blur-md rounded-xl shadow-lg p-6 border border-white/20"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-2xl font-bold text-gray-900">
                  {trips.filter(t => t.status === 'planning').length}
                </span>
              </div>
              <h3 className="text-gray-600 font-medium">Planning</h3>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white/90 backdrop-blur-md rounded-xl shadow-lg p-6 border border-white/20"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Vote className="w-6 h-6 text-orange-600" />
                </div>
                <span className="text-2xl font-bold text-gray-900">
                  {trips.filter(t => t.status === 'voting').length}
                </span>
              </div>
              <h3 className="text-gray-600 font-medium">Voting Active</h3>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white/90 backdrop-blur-md rounded-xl shadow-lg p-6 border border-white/20"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-2xl font-bold text-gray-900">
                  {trips.filter(t => t.status === 'confirmed').length}
                </span>
              </div>
              <h3 className="text-gray-600 font-medium">Confirmed</h3>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white/90 backdrop-blur-md rounded-xl shadow-lg p-6 border border-white/20"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Brain className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-2xl font-bold text-gray-900">
                  {trips.length}
                </span>
              </div>
              <h3 className="text-gray-600 font-medium">Total Trips</h3>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  )
}