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
  MessageCircle
} from 'lucide-react'
import { tripsAPI, recommendationsAPI, telegramAPI } from '@/libr/api'
import { formatCurrency, formatDate, getStatusColor } from '@/libr/utils'
import Link from 'next/link'
import toast from 'react-hot-toast'

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

export default function TripDetailPage() {
  const params = useParams()
  const router = useRouter()
  const tripId = params.id as string

  const [trip, setTrip] = useState<Trip | null>(null)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGeneratingRecs, setIsGeneratingRecs] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'participants' | 'recommendations' | 'voting'>('overview')

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="mr-4">
                <ArrowLeft className="w-5 h-5 text-gray-600 hover:text-gray-900" />
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{trip.title}</h1>
                <p className="text-sm text-gray-600">{trip.destination || 'Destination TBD'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={generateRecommendations}
                disabled={isGeneratingRecs}
                className="btn btn-primary flex items-center disabled:opacity-50"
              >
                <Brain className="w-4 h-4 mr-2" />
                {isGeneratingRecs ? 'Generating...' : 'AI Recommendations'}
              </button>
              <button
                onClick={sendSurveyInvitations}
                className="btn btn-outline flex items-center"
              >
                <Send className="w-4 h-4 mr-2" />
                Send Survey
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Trip Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {['overview', 'participants', 'recommendations', 'voting'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`${
                  activeTab === tab
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm capitalize transition-colors`}
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
          className="mt-8"
        >
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Description */}
                {trip.description && (
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">About This Trip</h3>
                    <p className="text-gray-600 whitespace-pre-wrap">{trip.description}</p>
                  </div>
                )}

                {/* Key Details */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Trip Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <MapPin className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm text-gray-600">Destination</p>
                          <p className="font-medium">{trip.destination || 'To be determined'}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm text-gray-600">Dates</p>
                          <p className="font-medium">
                            {trip.start_date && trip.end_date
                              ? `${formatDate(trip.start_date)} - ${formatDate(trip.end_date)}`
                              : 'Flexible dates'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <DollarSign className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm text-gray-600">Budget per Person</p>
                          <p className="font-medium">{formatBudgetRange(trip.budget_min, trip.budget_max)}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Users className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm text-gray-600">Participants</p>
                          <p className="font-medium">{trip.participants.length} people</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Recommendations */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Recommendations</h3>
                    {recommendations.length === 0 && (
                      <button
                        onClick={generateRecommendations}
                        className="btn btn-primary btn-sm"
                      >
                        Generate AI Recommendations
                      </button>
                    )}
                  </div>
                  {recommendations.length === 0 ? (
                    <div className="text-center py-8">
                      <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No recommendations yet</h4>
                      <p className="text-gray-600 mb-4">Generate AI-powered suggestions based on your group's preferences</p>
                      <button
                        onClick={generateRecommendations}
                        className="btn btn-primary"
                      >
                        <Brain className="w-4 h-4 mr-2" />
                        Generate Recommendations
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recommendations.map((rec) => (
                        <div key={rec.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center mb-2">
                                <h4 className="font-medium text-gray-900">{rec.destination_name}</h4>
                                {rec.ai_generated && (
                                  <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                    <Brain className="w-3 h-3 mr-1" />
                                    AI Generated
                                  </span>
                                )}
                              </div>
                              {rec.description && (
                                <p className="text-gray-600 text-sm mb-2">{rec.description}</p>
                              )}
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                {rec.estimated_cost && (
                                  <span className="flex items-center">
                                    <DollarSign className="w-4 h-4 mr-1" />
                                    {formatCurrency(rec.estimated_cost)} per person
                                  </span>
                                )}
                                <span className="flex items-center">
                                  <Star className="w-4 h-4 mr-1" />
                                  AI Selected
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Status Card */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Trip Status</h3>
                  <div className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium ${getStatusColor(trip.status)}`}>
                    {trip.status}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Created on {formatDate(trip.created_at)}
                  </p>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <Link
                      href={`/trips/${trip.id}/preferences`}
                      className="w-full btn btn-outline justify-center"
                    >
                      Set Preferences
                    </Link>
                    <Link
                      href={`/trips/${trip.id}/vote`}
                      className="w-full btn btn-outline justify-center"
                    >
                      Start Voting
                    </Link>
                    <button className="w-full btn btn-outline justify-center">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Chat with Group
                    </button>
                  </div>
                </div>

                {/* Participants Preview */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Participants</h3>
                    <Link href={`/trips/${trip.id}/participants`} className="text-sm text-primary hover:text-primary/600">
                      View All
                    </Link>
                  </div>
                  <div className="space-y-3">
                    {trip.participants.slice(0, 5).map((participant) => (
                      <div key={participant.id} className="flex items-center">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-semibold">
                          {participant.user_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-3 flex-1">
                          <p className="text-sm font-medium text-gray-900">{participant.user_name}</p>
                          <p className="text-xs text-gray-500">{participant.role}</p>
                        </div>
                      </div>
                    ))}
                    {trip.participants.length > 5 && (
                      <p className="text-sm text-gray-500 text-center">
                        +{trip.participants.length - 5} more participants
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'participants' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Trip Participants</h2>
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
                      <tr key={participant.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-semibold">
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
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            {participant.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            participant.status === 'joined'
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
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">AI Recommendations</h2>
                    <button
                      onClick={generateRecommendations}
                      disabled={isGeneratingRecs}
                      className="btn btn-primary btn-sm disabled:opacity-50"
                    >
                      <Brain className="w-4 h-4 mr-2" />
                      {isGeneratingRecs ? 'Generating...' : 'Generate More'}
                    </button>
                  </div>
                  {recommendations.length === 0 ? (
                    <div className="text-center py-12">
                      <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Recommendations Yet</h3>
                      <p className="text-gray-600 mb-6">Generate AI-powered suggestions to find perfect destinations for your group</p>
                      <button
                        onClick={generateRecommendations}
                        disabled={isGeneratingRecs}
                        className="btn btn-primary"
                      >
                        <Brain className="w-5 h-5 mr-2" />
                        Generate AI Recommendations
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {recommendations.map((rec) => (
                        <div key={rec.id} className="border rounded-xl p-6 hover:shadow-lg transition-shadow">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <div className="flex items-center mb-2">
                                <h3 className="text-lg font-medium text-gray-900">{rec.destination_name}</h3>
                                {rec.ai_generated && (
                                  <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                    <Brain className="w-3 h-3 mr-1" />
                                    AI Generated
                                  </span>
                                )}
                              </div>
                              {rec.description && (
                                <p className="text-gray-600">{rec.description}</p>
                              )}
                            </div>
                            {rec.estimated_cost && (
                              <div className="text-right">
                                <p className="text-sm text-gray-500">Est. Cost/Person</p>
                                <p className="text-xl font-semibold text-gray-900">
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
                                  <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
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
                                  <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
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
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6">
                  <h3 className="font-medium text-gray-900 mb-4">How AI Recommendations Work</h3>
                  <div className="space-y-3 text-sm text-gray-600">
                    <div className="flex items-start">
                      <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-xs font-bold mr-3 mt-0.5">1</div>
                      <p>Collect group preferences through surveys</p>
                    </div>
                    <div className="flex items-start">
                      <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-xs font-bold mr-3 mt-0.5">2</div>
                      <p>AI analyzes preferences and finds suitable destinations</p>
                    </div>
                    <div className="flex items-start">
                      <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-xs font-bold mr-3 mt-0.5">3</div>
                      <p>Get personalized recommendations with activities and costs</p>
                    </div>
                    <div className="flex items-start">
                      <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-xs font-bold mr-3 mt-0.5">4</div>
                      <p>Vote fairly using ranked-choice voting system</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'voting' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="text-center py-12">
                <Vote className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Voting Coming Soon</h2>
                <p className="text-gray-600 mb-6">Generate recommendations first, then start the voting process</p>
                <button
                  onClick={() => setActiveTab('recommendations')}
                  className="btn btn-primary"
                >
                  Generate Recommendations
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  )
}