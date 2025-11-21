'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Users,
  Calendar,
  MapPin,
  DollarSign,
  Vote,
  Brain,
  Send,
  Settings,
  Trash2,
  Plus,
  Star,
  Clock,
  MessageCircle,
  Share2
} from 'lucide-react'
import { tripsAPI, recommendationsAPI, telegramAPI } from '@/lib/api'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import Link from 'next/link'
import toast from 'react-hot-toast'
import ShareTripModal from '@/components/trips/ShareTripModal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface Trip {
  id: string
  title: string
  description?: string
  destination?: string
  start_date?: string
  end_date?: string
  budget_min?: number
  budget_max?: number
  status: string
  participants: Array<{
    id: string
    user_name: string
    user_email: string
    role: string
    status: string
  }>
  created_at: string
  invite_code?: string
}

interface Recommendation {
  id: string
  destination_name: string
  description?: string
  estimated_cost?: number
  activities?: string[]
  accommodation_options?: string[]
  ai_generated: boolean
  created_at: string
}

type Tab = 'overview' | 'participants' | 'recommendations' | 'voting'

export default function TripDetailPage() {
  const params = useParams()
  const router = useRouter()
  const tripId = params.id as string

  const [trip, setTrip] = useState<Trip | null>(null)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGeneratingRecs, setIsGeneratingRecs] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)

  const tabs: Tab[] = ['overview', 'participants', 'recommendations', 'voting']

  useEffect(() => {
    if (tripId) {
      fetchTripDetails()
      fetchRecommendations()
    }
  }, [tripId])

  const fetchTripDetails = async () => {
    try {
      const response = await tripsAPI.getTrip(tripId)
      setTrip(response)
    } catch (error: any) {
      if (error.response?.status === 404) {
        router.push('/dashboard')
        toast.error('Trip not found')
      } else {
        toast.error('Failed to load trip details')
      }
    }
  }

  const fetchRecommendations = async () => {
    try {
      const response = await recommendationsAPI.getRecommendations(tripId)
      setRecommendations(response)
    } catch (error) {
      console.error('Failed to fetch recommendations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateRecommendations = async () => {
    setIsGeneratingRecs(true)
    try {
      const response = await recommendationsAPI.generateRecommendations(tripId)
      toast.success(response.message)
      fetchRecommendations()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to generate recommendations')
    } finally {
      setIsGeneratingRecs(false)
    }
  }

  const sendSurveyInvitations = async () => {
    try {
      const response = await telegramAPI.sendSurveyInvitation(tripId)
      toast.success(`Survey invitations sent to ${response.invitations_sent} participants`)
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to send invitations')
    }
  }

  const formatBudgetRange = (min?: number, max?: number) => {
    if (min === null && max === null) return 'Not specified'
    if (min === null) return `Up to ${formatCurrency(max)}`
    if (max === null) return `From ${formatCurrency(min)}`
    if (min === max) return formatCurrency(min)
    return `${formatCurrency(min)} - ${formatCurrency(max)}`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading trip details...</p>
        </div>
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Trip not found</h1>
          <Link href="/dashboard" className="btn btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header with Image */}
      <div className="relative h-[300px] w-full">
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/60 z-10" />
        <img
          src={trip.destination ? `https://source.unsplash.com/1600x900/?${trip.destination},travel` : "https://source.unsplash.com/1600x900/?travel,vacation"}
          alt={trip.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 p-6 z-20 text-white container mx-auto max-w-7xl">
          <div className="flex justify-between items-end">
            <div>
              <Badge className="mb-2 bg-primary/80 hover:bg-primary/90 backdrop-blur-sm text-white border-none">
                {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
              </Badge>
              <h1 className="text-4xl font-bold mb-2 text-white">{trip.title}</h1>
              <div className="flex items-center gap-4 text-sm opacity-90 text-white">
                {trip.destination && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {trip.destination}
                  </div>
                )}
                {trip.start_date && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(trip.start_date)} - {trip.end_date ? formatDate(trip.end_date) : 'TBD'}
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="gap-2"
                onClick={() => setIsShareModalOpen(true)}
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
              {trip.status === 'planning' && (
                <Button onClick={() => router.push(`/trips/${tripId}/preferences`)}>
                  Add Preferences
                </Button>
              )}
            </div>
          </div>
        </div>
        <Link href="/dashboard" className="absolute top-6 left-6 z-30 p-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-white transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </Link>
      </div>

      {/* Trip Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`${activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Description */}
                {trip.description && (
                  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">About This Trip</h3>
                    <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{trip.description}</p>
                  </div>
                )}

                {/* Key Details */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Trip Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <div className="p-2 bg-blue-50 rounded-lg mr-3">
                          <MapPin className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 font-medium">Destination</p>
                          <p className="font-medium text-gray-900">{trip.destination || 'To be determined'}</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="p-2 bg-purple-50 rounded-lg mr-3">
                          <Calendar className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 font-medium">Dates</p>
                          <p className="font-medium text-gray-900">
                            {trip.start_date && trip.end_date
                              ? `${formatDate(trip.start_date)} - ${formatDate(trip.end_date)}`
                              : 'Flexible dates'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <div className="p-2 bg-green-50 rounded-lg mr-3">
                          <DollarSign className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 font-medium">Budget per Person</p>
                          <p className="font-medium text-gray-900">{formatBudgetRange(trip.budget_min, trip.budget_max)}</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="p-2 bg-orange-50 rounded-lg mr-3">
                          <Users className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 font-medium">Participants</p>
                          <p className="font-medium text-gray-900">{trip.participants.length} people</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Recommendations */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Recommendations</h3>
                    {recommendations.length === 0 && (
                      <Button
                        onClick={generateRecommendations}
                        size="sm"
                        disabled={isGeneratingRecs}
                      >
                        {isGeneratingRecs ? 'Generating...' : 'Generate AI Recommendations'}
                      </Button>
                    )}
                  </div>
                  {recommendations.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                      <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No recommendations yet</h4>
                      <p className="text-gray-600 mb-4 max-w-md mx-auto">Generate AI-powered suggestions based on your group's preferences to find the perfect destination.</p>
                      <Button
                        onClick={generateRecommendations}
                        disabled={isGeneratingRecs}
                      >
                        <Brain className="w-4 h-4 mr-2" />
                        Generate Recommendations
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recommendations.slice(0, 3).map((rec) => (
                        <div key={rec.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center mb-2">
                                <h4 className="font-semibold text-gray-900">{rec.destination_name}</h4>
                                {rec.ai_generated && (
                                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                    <Brain className="w-3 h-3 mr-1" />
                                    AI Generated
                                  </span>
                                )}
                              </div>
                              {rec.description && (
                                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{rec.description}</p>
                              )}
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                {rec.estimated_cost && (
                                  <span className="flex items-center">
                                    <DollarSign className="w-4 h-4 mr-1" />
                                    {formatCurrency(rec.estimated_cost)} per person
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {recommendations.length > 3 && (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => setActiveTab('recommendations')}
                        >
                          View All Recommendations
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Status Card */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Trip Status</h3>
                  <div className="flex items-center justify-between">
                    <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(trip.status)}`}>
                      {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
                    </div>
                    <span className="text-xs text-gray-500">
                      Created {formatDate(trip.created_at)}
                    </span>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => router.push(`/trips/${trip.id}/preferences`)}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Set Preferences
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => router.push(`/trips/${trip.id}/vote`)}
                    >
                      <Vote className="w-4 h-4 mr-2" />
                      Start Voting
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setIsShareModalOpen(true)}
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share Trip
                    </Button>
                  </div>
                </div>

                {/* Participants Preview */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Participants</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary hover:text-primary/80 p-0 h-auto font-normal"
                      onClick={() => setActiveTab('participants')}
                    >
                      View All
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {trip.participants.slice(0, 5).map((participant) => (
                      <div key={participant.id} className="flex items-center p-2 hover:bg-gray-50 rounded-lg transition-colors">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary text-sm font-semibold">
                          {participant.user_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-3 flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{participant.user_name}</p>
                          <p className="text-xs text-gray-500 truncate">{participant.role}</p>
                        </div>
                        <span className={`w-2 h-2 rounded-full ${participant.status === 'joined' ? 'bg-green-500' :
                          participant.status === 'invited' ? 'bg-blue-500' : 'bg-gray-300'
                          }`} />
                      </div>
                    ))}
                    {trip.participants.length > 5 && (
                      <p className="text-sm text-gray-500 text-center pt-2">
                        +{trip.participants.length - 5} more participants
                      </p>
                    )}
                    <Button
                      className="w-full mt-2"
                      variant="secondary"
                      onClick={() => setIsShareModalOpen(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Invite People
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'participants' && (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Trip Participants</h2>
                <Button onClick={() => setIsShareModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Invite Participants
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {trip.participants.map((participant) => (
                      <tr key={participant.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary text-sm font-semibold">
                              {participant.user_name.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                {participant.user_name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {participant.user_email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                            {participant.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${participant.status === 'joined'
                            ? 'bg-green-100 text-green-800'
                            : participant.status === 'invited'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-red-100 text-red-800'
                            }`}>
                            {participant.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'recommendations' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">AI Recommendations</h2>
                    <Button
                      onClick={generateRecommendations}
                      disabled={isGeneratingRecs}
                      size="sm"
                    >
                      <Brain className="w-4 h-4 mr-2" />
                      {isGeneratingRecs ? 'Generating...' : 'Generate More'}
                    </Button>
                  </div>
                  {recommendations.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                      <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Recommendations Yet</h3>
                      <p className="text-gray-600 mb-6 max-w-md mx-auto">Generate AI-powered suggestions to find perfect destinations for your group</p>
                      <Button
                        onClick={generateRecommendations}
                        disabled={isGeneratingRecs}
                      >
                        <Brain className="w-5 h-5 mr-2" />
                        Generate AI Recommendations
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {recommendations.map((rec) => (
                        <div key={rec.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow bg-white">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <div className="flex items-center mb-2">
                                <h3 className="text-lg font-semibold text-gray-900">{rec.destination_name}</h3>
                                {rec.ai_generated && (
                                  <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                    <Brain className="w-3 h-3 mr-1" />
                                    AI Generated
                                  </span>
                                )}
                              </div>
                              {rec.description && (
                                <p className="text-gray-600 leading-relaxed">{rec.description}</p>
                              )}
                            </div>
                            {rec.estimated_cost && (
                              <div className="text-right min-w-[120px]">
                                <p className="text-sm text-gray-500">Est. Cost/Person</p>
                                <p className="text-xl font-bold text-gray-900">
                                  {formatCurrency(rec.estimated_cost)}
                                </p>
                              </div>
                            )}
                          </div>
                          {rec.activities && rec.activities.length > 0 && (
                            <div className="mb-4">
                              <p className="text-sm font-medium text-gray-900 mb-2">Activities</p>
                              <div className="flex flex-wrap gap-2">
                                {rec.activities.map((activity, idx) => (
                                  <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                    {activity}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {rec.accommodation_options && rec.accommodation_options.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-gray-900 mb-2">Accommodation Options</p>
                              <div className="flex flex-wrap gap-2">
                                {rec.accommodation_options.map((option, idx) => (
                                  <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                                    {option}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-100">
                  <h3 className="font-semibold text-gray-900 mb-4">How AI Recommendations Work</h3>
                  <div className="space-y-4 text-sm text-gray-600">
                    <div className="flex items-start">
                      <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-xs font-bold mr-3 mt-0.5 shrink-0">1</div>
                      <p>Collect group preferences through surveys</p>
                    </div>
                    <div className="flex items-start">
                      <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-xs font-bold mr-3 mt-0.5 shrink-0">2</div>
                      <p>AI analyzes preferences and finds suitable destinations</p>
                    </div>
                    <div className="flex items-start">
                      <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-xs font-bold mr-3 mt-0.5 shrink-0">3</div>
                      <p>Get personalized recommendations with activities and costs</p>
                    </div>
                    <div className="flex items-start">
                      <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-xs font-bold mr-3 mt-0.5 shrink-0">4</div>
                      <p>Vote fairly using ranked-choice voting system</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'voting' && (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Vote className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Ready to Vote?</h2>
                <p className="text-gray-600 mb-8 max-w-lg mx-auto">Rank your favorite destinations to help the group decide. The voting process uses a ranked-choice system to ensure the fairest outcome.</p>
                <Button
                  onClick={() => router.push(`/trips/${tripId}/vote`)}
                  size="lg"
                  className="px-8"
                >
                  <Vote className="w-5 h-5 mr-2" />
                  Go to Voting Page
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </main>

      <ShareTripModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        inviteCode={trip.invite_code || ''}
        tripTitle={trip.title}
      />
    </div>
  )
}