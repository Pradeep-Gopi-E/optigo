'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Users,
  Calendar,
  MapPin,
  Share2,
  Settings,
  Vote,
  DollarSign,
  Brain,
  Star,
  Plus,
  Trash2,
  Loader2,
  Sparkles,
  Copy,
  CheckCircle2,
  ArrowRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { tripsAPI, recommendationsAPI, TripDetail, Recommendation } from '@/lib/api'
import { cn, formatCurrency, generateInitials, formatDate } from '@/lib/utils'
import ShareTripModal from '@/components/trips/ShareTripModal'
import CustomRecommendationModal from '@/components/trips/CustomRecommendationModal'

export default function TripDetailPage() {
  const params = useParams()
  const router = useRouter()
  const tripId = params.id as string

  const [trip, setTrip] = useState<TripDetail | null>(null)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'participants' | 'recommendations' | 'voting'>('overview')
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [isCustomRecModalOpen, setIsCustomRecModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isGeneratingRecs, setIsGeneratingRecs] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }

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

  const generateRecommendations = async (clearExisting: boolean = true) => {
    setIsGeneratingRecs(true)
    try {
      const response = await recommendationsAPI.generateRecommendations(tripId, clearExisting)
      toast.success(response.message)
      fetchRecommendations()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to generate recommendations')
    } finally {
      setIsGeneratingRecs(false)
    }
  }

  const handleToggleMemberRecommendations = async (checked: boolean) => {
    if (!trip) return
    try {
      const updatedTrip = await tripsAPI.updateTrip(tripId, { allow_member_recommendations: checked })
      setTrip({ ...trip, allow_member_recommendations: updatedTrip.allow_member_recommendations })
      toast.success(checked ? 'Member suggestions allowed' : 'Member suggestions disabled')
    } catch (error) {
      toast.error('Failed to update settings')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatBudgetRange = (min?: number | null, max?: number | null) => {
    if (!min && !max) return 'Not set'
    if (min && !max) return `From ${formatCurrency(min)}`
    if (!min && max) return `Up to ${formatCurrency(max)}`
    if (min === max) return formatCurrency(min!)
    return `${formatCurrency(min!)} - ${formatCurrency(max!)}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-blue-100 text-blue-800'
      case 'voting': return 'bg-purple-100 text-purple-800'
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!trip) return null

  const tabs = ['overview', 'participants', 'recommendations', 'voting']
  const isOwner = trip.created_by === user?.id
  const canAddRecommendation = isOwner || trip.allow_member_recommendations

  return (
    <div className="min-h-screen bg-gray-50 pb-12 relative">
      {/* Hero Section */}
      <div className="relative h-[300px] w-full bg-gray-900">
        <img
          src={trip.destination ? `https://source.unsplash.com/1600x900/?${trip.destination},travel` : "https://source.unsplash.com/1600x900/?travel,vacation"}
          alt={trip.title}
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 to-transparent" />

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
        <div className="flex space-x-1 rounded-xl bg-gray-200 p-1 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={cn(
                'w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all duration-200',
                activeTab === tab
                  ? 'bg-white text-primary shadow'
                  : 'text-gray-600 hover:bg-white/[0.12] hover:text-primary'
              )}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Trip Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-1">Description</h3>
                      <p className="text-gray-600">{trip.description || 'No description provided.'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-semibold mb-1">Budget Range</h3>
                        <p className="text-gray-600">
                          {formatCurrency(trip.budget_min)} - {formatCurrency(trip.budget_max)}
                        </p>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Expected Participants</h3>
                        <p className="text-gray-600">{trip.expected_participants || 'Not specified'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'participants' && (
              <Card>
                <CardHeader>
                  <CardTitle>Participants ({trip.participants?.length || 0})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {trip.participants?.map((participant) => (
                      <div key={participant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {generateInitials(participant.user_name)}
                          </div>
                          <div>
                            <p className="font-medium">{participant.user_name}</p>
                            <p className="text-sm text-gray-500 capitalize">{participant.role}</p>
                          </div>
                        </div>
                        <Badge variant={participant.status === 'joined' ? 'default' : 'secondary'}>
                          {participant.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'recommendations' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Recommendations</h2>
                  <div className="flex gap-2">
                    {canAddRecommendation && (
                      <Button onClick={() => setIsCustomRecModalOpen(true)} variant="outline" className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Custom
                      </Button>
                    )}
                    {(isOwner || recommendations.length === 0) && (
                      <Button onClick={() => generateRecommendations(true)} disabled={isGeneratingRecs}>
                        {isGeneratingRecs ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Generate with AI
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                {recommendations.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                      <Sparkles className="h-12 w-12 text-gray-300 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No recommendations yet</h3>
                      <p className="text-gray-500 mb-6 max-w-sm">
                        Generate AI recommendations based on group preferences or add your own custom suggestions.
                      </p>
                      <div className="flex gap-3">
                        <Button onClick={() => generateRecommendations(true)} disabled={isGeneratingRecs}>
                          Generate with AI
                        </Button>
                        {canAddRecommendation && (
                          <Button variant="outline" onClick={() => setIsCustomRecModalOpen(true)}>
                            Add Custom
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-6">
                    {recommendations.map((rec) => (
                      <Card key={rec.id} className="overflow-hidden hover:shadow-md transition-shadow">
                        <div className="md:flex">
                          <div className="md:w-1/3 h-48 md:h-auto relative">
                            <img
                              src={`https://source.unsplash.com/800x600/?${rec.destination_name},travel`}
                              alt={rec.destination_name}
                              className="w-full h-full object-cover"
                            />
                            {rec.ai_generated && (
                              <Badge className="absolute top-2 right-2 bg-purple-500/90 backdrop-blur-sm">
                                <Sparkles className="w-3 h-3 mr-1" /> AI Pick
                              </Badge>
                            )}
                          </div>
                          <div className="p-6 md:w-2/3 flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="text-xl font-bold">{rec.destination_name}</h3>
                                {rec.estimated_cost && (
                                  <Badge variant="secondary" className="text-green-700 bg-green-50">
                                    {formatCurrency(rec.estimated_cost)}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-gray-600 mb-4 line-clamp-2">{rec.description}</p>

                              <div className="space-y-3">
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-900 mb-1">Activities</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {rec.activities.slice(0, 3).map((activity, i) => (
                                      <Badge key={i} variant="outline" className="bg-gray-50">
                                        {activity}
                                      </Badge>
                                    ))}
                                    {rec.activities.length > 3 && (
                                      <Badge variant="outline" className="bg-gray-50">+{rec.activities.length - 3}</Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'voting' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Voting Session</CardTitle>
                    <CardDescription>
                      Rank your preferred destinations using Borda Count method.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {trip.status === 'voting' ? (
                      <div className="text-center py-8">
                        <div className="mb-6">
                          <h3 className="text-lg font-medium mb-2">Voting is Active!</h3>
                          <p className="text-gray-500">
                            Please cast your votes to help decide the destination.
                          </p>
                        </div>
                        <Button
                          size="lg"
                          className="w-full sm:w-auto"
                          onClick={() => router.push(`/trips/${tripId}/vote`)}
                        >
                          Go to Voting Page
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    ) : trip.status === 'confirmed' ? (
                      <div className="text-center py-8">
                        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">Destination Confirmed!</h3>
                        <p className="text-gray-500 mb-6">
                          The group has decided on <strong>{trip.destination}</strong>.
                        </p>
                        <Button variant="outline" onClick={() => router.push(`/trips/${tripId}/results`)}>
                          View Results
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500 mb-4">
                          Voting has not started yet. Wait for the trip organizer to initiate the voting session.
                        </p>
                        {isOwner && recommendations.length > 0 && (
                          <Button onClick={() => router.push(`/trips/${tripId}/vote`)}>
                            Start Voting
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Admin Controls */}
            {isOwner && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Admin Controls</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="member-suggestions">Allow Member Suggestions</Label>
                      <p className="text-xs text-gray-500">
                        Let members add custom recommendations
                      </p>
                    </div>
                    <Switch
                      id="member-suggestions"
                      checked={trip.allow_member_recommendations}
                      onCheckedChange={handleToggleMemberRecommendations}
                    />
                  </div>

                  <div className="pt-2 border-t">
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => generateRecommendations(true)}
                      disabled={isGeneratingRecs || recommendations.length === 0}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Clear AI Recommendations
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Invite Friends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <Input readOnly value={trip.invite_code || ''} />
                  <Button size="icon" variant="outline" onClick={() => {
                    navigator.clipboard.writeText(trip.invite_code || '')
                    toast.success('Copied to clipboard')
                  }}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <Button className="w-full" variant="outline" onClick={() => setIsShareModalOpen(true)}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share Invite Link
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <ShareTripModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        inviteCode={trip.invite_code || ''}
        tripTitle={trip.title}
      />

      <CustomRecommendationModal
        isOpen={isCustomRecModalOpen}
        onClose={() => setIsCustomRecModalOpen(false)}
        tripId={tripId}
        onSuccess={() => {
          fetchRecommendations()
          toast.success('Recommendation added successfully')
        }}
      />
    </div>
  )
}