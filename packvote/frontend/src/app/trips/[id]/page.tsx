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
  ArrowRight,
  Pencil,
  Globe,
  Compass
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { tripsAPI, recommendationsAPI, preferencesAPI, TripDetail, Recommendation, Preference } from '@/lib/api'
import { cn, formatCurrency as formatCurrencyUtil, generateInitials, formatDate, getCurrencyFromLocale, convertCurrency } from '@/lib/utils'
import ShareTripModal from '@/components/trips/ShareTripModal'
import CustomRecommendationModal from '@/components/trips/CustomRecommendationModal'
import EditRecommendationModal from '@/components/trips/EditRecommendationModal'
import RecommendationDetailsModal from '@/components/trips/RecommendationDetailsModal'

export default function TripDetailPage() {
  const params = useParams()
  const router = useRouter()
  const tripId = params.id as string

  const [trip, setTrip] = useState<TripDetail | null>(null)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [preferences, setPreferences] = useState<Preference | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'participants' | 'preferences' | 'recommendations' | 'voting'>('overview')
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [isCustomRecModalOpen, setIsCustomRecModalOpen] = useState(false)
  const [isEditRecModalOpen, setIsEditRecModalOpen] = useState(false)
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [viewingRec, setViewingRec] = useState<Recommendation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGeneratingRecs, setIsGeneratingRecs] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [currency, setCurrency] = useState('USD')

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }

    if (tripId) {
      fetchTripDetails()
      fetchRecommendations()
      fetchPreferences()
    }

    setCurrency(getCurrencyFromLocale())
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

  const fetchPreferences = async () => {
    try {
      const response = await preferencesAPI.getPreferences(tripId)
      const userData = localStorage.getItem('user')
      const currentUser = userData ? JSON.parse(userData) : null

      if (currentUser) {
        const userPref = response.find(p => p.user_id === currentUser.id && p.preference_type === 'detailed')
        setPreferences(userPref || null)
      }
    } catch (error) {
      console.error('Failed to fetch preferences:', error)
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

  const handleEditRecommendation = (rec: Recommendation) => {
    setSelectedRec(rec)
    setIsEditRecModalOpen(true)
  }

  const handleViewRecommendation = (rec: Recommendation) => {
    setViewingRec(rec)
    setIsDetailsModalOpen(true)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatCurrency = (amount: number | null | undefined) => {
    return formatCurrencyUtil(amount, currency)
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!trip) return null

  const tabs = ['overview', 'participants', 'preferences', 'recommendations', 'voting']
  const isOwner = trip.created_by === user?.id
  const canAddRecommendation = isOwner || trip.allow_member_recommendations

  return (
    <div className="min-h-screen bg-background pb-12 relative">
      <div className="noise-overlay" />

      {/* Hero Section */}
      <div className="relative h-[40vh] min-h-[400px] w-full bg-gray-900 overflow-hidden">
        <img
          src={trip.destination ? `https://source.unsplash.com/1600x900/?${trip.destination},travel` : "https://source.unsplash.com/1600x900/?travel,vacation"}
          alt={trip.title}
          className="w-full h-full object-cover opacity-70 scale-105 animate-fade-in-up"
          style={{ animationDuration: '1.5s' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-8 z-20 container mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6">
            <div className="animate-fade-in-up">
              <Badge className="mb-4 bg-primary/90 backdrop-blur-md text-white border-none px-3 py-1 text-sm font-medium tracking-wide uppercase">
                {trip.status} Phase
              </Badge>
              <h1 className="text-5xl md:text-7xl font-heading font-bold mb-4 text-foreground drop-shadow-sm leading-tight">{trip.title}</h1>
              <div className="flex flex-wrap items-center gap-6 text-foreground/90 font-medium">
                {trip.destination && (
                  <div className="flex items-center gap-2 bg-background/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                    <MapPin className="h-4 w-4" />
                    {trip.destination}
                  </div>
                )}
                {trip.start_date && (
                  <div className="flex items-center gap-2 bg-background/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                    <Calendar className="h-4 w-4" />
                    {formatDate(trip.start_date)} - {trip.end_date ? formatDate(trip.end_date) : 'TBD'}
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center gap-2 bg-background/40 backdrop-blur-md rounded-lg px-3 py-2 border border-white/10 shadow-lg">
                <Globe className="h-4 w-4 text-foreground/70" />
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="bg-transparent text-foreground text-sm font-medium focus:outline-none cursor-pointer border-none outline-none appearance-none pr-2"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="JPY">JPY (¥)</option>
                  <option value="AUD">AUD (A$)</option>
                  <option value="CAD">CAD (C$)</option>
                  <option value="INR">INR (₹)</option>
                </select>
              </div>
              <Button
                variant="secondary"
                className="gap-2 shadow-lg hover:shadow-xl transition-all"
                onClick={() => setIsShareModalOpen(true)}
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
              {trip.status === 'planning' && (
                <Button onClick={() => router.push(`/trips/${tripId}/preferences`)} className="shadow-lg">
                  Edit Preferences
                </Button>
              )}
            </div>
          </div>
        </div>
        <Link href="/dashboard" className="absolute top-6 left-6 z-30 p-3 bg-background/20 hover:bg-background/40 backdrop-blur-md rounded-full text-foreground transition-all border border-white/10 group">
          <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Trip Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="flex space-x-2 p-1 mb-10 overflow-x-auto border-b border-border/50 pb-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={cn(
                'relative px-6 py-3 text-sm font-medium transition-all duration-200 whitespace-nowrap',
                activeTab === tab
                  ? 'text-primary font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {activeTab === tab && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                />
              )}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {activeTab === 'overview' && (
              <div className="space-y-8 animate-fade-in-up">
                <Card className="border-border/50 shadow-lg">
                  <CardHeader>
                    <CardTitle className="font-heading text-2xl">Trip Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="font-semibold mb-2 text-foreground/80">Description</h3>
                      <p className="text-muted-foreground leading-relaxed">{trip.description || 'No description provided.'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="bg-secondary/20 p-4 rounded-lg border border-border/50">
                        <h3 className="font-semibold mb-1 text-foreground/80 flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-primary" /> Budget Range
                        </h3>
                        <p className="text-lg font-medium text-foreground">
                          {formatCurrency(trip.budget_min)} - {formatCurrency(trip.budget_max)}
                        </p>
                      </div>
                      <div className="bg-secondary/20 p-4 rounded-lg border border-border/50">
                        <h3 className="font-semibold mb-1 text-foreground/80 flex items-center gap-2">
                          <Users className="w-4 h-4 text-primary" /> Participants
                        </h3>
                        <p className="text-lg font-medium text-foreground">{trip.expected_participants || 'Not specified'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'participants' && (
              <Card className="border-border/50 shadow-lg animate-fade-in-up">
                <CardHeader>
                  <CardTitle className="font-heading text-2xl">Participants ({trip.participants?.length || 0})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {trip.participants?.map((participant) => (
                      <div key={participant.id} className="flex items-center justify-between p-4 bg-secondary/10 rounded-xl border border-border/50 hover:border-primary/30 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold shadow-md">
                            {generateInitials(participant.user_name)}
                          </div>
                          <div>
                            <p className="font-medium text-lg text-foreground">{participant.user_name}</p>
                            <p className="text-sm text-muted-foreground capitalize">{participant.role}</p>
                          </div>
                        </div>
                        <Badge variant={participant.status === 'joined' ? 'default' : 'secondary'} className="capitalize">
                          {participant.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'preferences' && (
              <div className="space-y-8 animate-fade-in-up">
                <Card className="border-border/50 shadow-lg">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="font-heading text-2xl">Group Preferences</CardTitle>
                      <CardDescription>
                        Preferences used to generate AI recommendations.
                      </CardDescription>
                    </div>
                    {isOwner && (
                      <Button onClick={() => router.push(`/trips/${tripId}/preferences`)} variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Edit Preferences
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent>
                    {preferences ? (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-secondary/10 p-4 rounded-xl border border-border/50">
                            <h3 className="font-semibold mb-3 text-xs text-muted-foreground uppercase tracking-wider">Vibe</h3>
                            <div className="flex flex-wrap gap-2">
                              {preferences.preference_data?.vibe?.map((v: string) => (
                                <Badge key={v} variant="secondary" className="bg-background/80 backdrop-blur-sm border border-border/50">{v}</Badge>
                              )) || 'Not specified'}
                            </div>
                          </div>
                          <div className="bg-secondary/10 p-4 rounded-xl border border-border/50">
                            <h3 className="font-semibold mb-3 text-xs text-muted-foreground uppercase tracking-wider">Activities</h3>
                            <div className="flex flex-wrap gap-2">
                              {preferences.preference_data?.activities?.map((a: string) => (
                                <Badge key={a} variant="outline" className="bg-background/50">{a}</Badge>
                              )) || 'Not specified'}
                            </div>
                          </div>
                          <div className="bg-secondary/10 p-4 rounded-xl border border-border/50">
                            <h3 className="font-semibold mb-3 text-xs text-muted-foreground uppercase tracking-wider">Budget Level</h3>
                            <p className="font-medium capitalize text-foreground">{preferences.preference_data?.budget_level || 'Not specified'}</p>
                          </div>
                          <div className="bg-secondary/10 p-4 rounded-xl border border-border/50">
                            <h3 className="font-semibold mb-3 text-xs text-muted-foreground uppercase tracking-wider">Duration</h3>
                            <p className="font-medium text-foreground">{preferences.preference_data?.duration_days ? `${preferences.preference_data.duration_days} days` : 'Not specified'}</p>
                          </div>
                        </div>

                        {isOwner && (
                          <div className="pt-6 border-t border-border/50">
                            <div className="bg-primary/5 p-6 rounded-xl border border-primary/20 flex items-center justify-between">
                              <div>
                                <h4 className="font-semibold text-primary mb-1">Want new recommendations?</h4>
                                <p className="text-sm text-muted-foreground">Regenerating will replace existing AI recommendations.</p>
                              </div>
                              <Button onClick={() => generateRecommendations(true)} disabled={isGeneratingRecs} size="sm" className="shadow-md">
                                {isGeneratingRecs ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Generating...
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    Regenerate
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-secondary/10 rounded-xl border border-dashed border-border">
                        <p className="text-muted-foreground mb-4">No preferences set yet.</p>
                        {isOwner && (
                          <Button onClick={() => router.push(`/trips/${tripId}/preferences`)}>
                            Set Preferences
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'recommendations' && (
              <div className="space-y-8 animate-fade-in-up">
                <div className="flex justify-between items-center">
                  <h2 className="text-3xl font-heading font-bold text-foreground">Recommendations</h2>
                  <div className="flex gap-3">
                    {canAddRecommendation && (
                      <Button onClick={() => setIsCustomRecModalOpen(true)} variant="outline" className="gap-2 bg-background/50 backdrop-blur-sm">
                        <Plus className="h-4 w-4" />
                        Add Custom
                      </Button>
                    )}
                    {(isOwner || recommendations.length === 0) && (
                      <Button onClick={() => generateRecommendations(true)} disabled={isGeneratingRecs} className="shadow-lg">
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
                  <Card className="border-dashed border-2 border-border/60 bg-transparent shadow-none">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="w-20 h-20 bg-secondary/20 rounded-full flex items-center justify-center mb-6">
                        <Sparkles className="h-10 w-10 text-primary/50" />
                      </div>
                      <h3 className="text-xl font-heading font-semibold mb-2 text-foreground">No recommendations yet</h3>
                      <p className="text-muted-foreground mb-8 max-w-md">
                        Generate AI recommendations based on group preferences or add your own custom suggestions.
                      </p>
                      <div className="flex gap-4">
                        <Button onClick={() => generateRecommendations(true)} disabled={isGeneratingRecs} size="lg">
                          Generate with AI
                        </Button>
                        {canAddRecommendation && (
                          <Button variant="outline" onClick={() => setIsCustomRecModalOpen(true)} size="lg">
                            Add Custom
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-8">
                    {recommendations.map((rec) => (
                      <Card
                        key={rec.id}
                        className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group border-border/50 bg-card/90 backdrop-blur-sm"
                        onClick={() => handleViewRecommendation(rec)}
                      >
                        <div className="md:flex">
                          <div className="md:w-2/5 h-64 md:h-auto relative overflow-hidden">
                            <img
                              src={rec.image_url || `https://source.unsplash.com/800x600/?${rec.destination_name},travel`}
                              alt={rec.destination_name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent md:bg-gradient-to-r" />
                            {rec.ai_generated && (
                              <Badge className="absolute top-4 left-4 bg-primary/90 backdrop-blur-md border-none shadow-lg">
                                <Sparkles className="w-3 h-3 mr-1" /> AI Pick
                              </Badge>
                            )}
                          </div>
                          <div className="p-8 md:w-3/5 flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-start mb-4">
                                <h3 className="text-2xl font-heading font-bold group-hover:text-primary transition-colors text-foreground">{rec.destination_name}</h3>
                                <div className="flex items-center gap-3">
                                  {rec.estimated_cost && (
                                    <Badge variant="secondary" className="text-green-700 bg-green-50/80 backdrop-blur-sm border border-green-100">
                                      {formatCurrency(convertCurrency(rec.estimated_cost, 'USD', currency))}
                                    </Badge>
                                  )}
                                  {(isOwner || rec.created_by === user?.id) && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleEditRecommendation(rec)
                                      }}
                                    >
                                      <Pencil className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                              <p className="text-muted-foreground mb-6 line-clamp-2 leading-relaxed">{rec.description}</p>

                              <div className="space-y-4">
                                <div>
                                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Activities</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {(Array.isArray(rec.activities) ? rec.activities : []).slice(0, 3).map((activity, i) => (
                                      <Badge key={i} variant="outline" className="bg-secondary/30 border-border/50">
                                        {activity}
                                      </Badge>
                                    ))}
                                    {(Array.isArray(rec.activities) ? rec.activities : []).length > 3 && (
                                      <Badge variant="outline" className="bg-secondary/30 border-border/50">+{(Array.isArray(rec.activities) ? rec.activities : []).length - 3}</Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="mt-6 pt-6 border-t border-border/50 flex justify-end">
                              <span className="text-sm font-medium text-primary group-hover:translate-x-1 transition-transform flex items-center">
                                View Details <ArrowRight className="ml-1 w-4 h-4" />
                              </span>
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
              <div className="space-y-8 animate-fade-in-up">
                <Card className="border-border/50 shadow-lg overflow-hidden">
                  <div className="h-2 bg-gradient-to-r from-primary to-accent" />
                  <CardHeader>
                    <CardTitle className="font-heading text-2xl">Voting Session</CardTitle>
                    <CardDescription>
                      Rank your preferred destinations using Borda Count method.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {trip.status === 'voting' ? (
                      <div className="text-center py-12">
                        <div className="mb-8">
                          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                            <Vote className="w-8 h-8 text-primary" />
                          </div>
                          <h3 className="text-xl font-bold mb-2 text-foreground">Voting is Active!</h3>
                          <p className="text-muted-foreground max-w-md mx-auto">
                            Please cast your votes to help decide the destination. Every vote counts towards the final decision.
                          </p>
                        </div>
                        <Button
                          size="lg"
                          className="w-full sm:w-auto shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
                          onClick={() => router.push(`/trips/${tripId}/vote`)}
                        >
                          Go to Voting Page
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    ) : trip.status === 'confirmed' ? (
                      <div className="text-center py-12">
                        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-6" />
                        <h3 className="text-2xl font-bold mb-2 text-foreground">Destination Confirmed!</h3>
                        <p className="text-muted-foreground mb-8 text-lg">
                          The group has decided on <strong className="text-primary">{trip.destination}</strong>.
                        </p>
                        <Button variant="outline" size="lg" onClick={() => router.push(`/trips/${tripId}/results`)}>
                          View Results
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-secondary/10 rounded-xl">
                        <p className="text-muted-foreground mb-6">
                          Voting has not started yet. Wait for the trip organizer to initiate the voting session.
                        </p>
                        {isOwner && recommendations.length > 0 && (
                          <Button onClick={() => router.push(`/trips/${tripId}/vote`)} size="lg" className="shadow-lg">
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
          <div className="space-y-8">
            {/* Admin Controls */}
            {isOwner && (
              <Card className="border-border/50 shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg font-heading">Admin Controls</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="member-suggestions" className="text-foreground">Allow Member Suggestions</Label>
                      <p className="text-xs text-muted-foreground">
                        Let members add custom recommendations
                      </p>
                    </div>
                    <Switch
                      id="member-suggestions"
                      checked={trip.allow_member_recommendations}
                      onCheckedChange={handleToggleMemberRecommendations}
                    />
                  </div>

                  <div className="pt-4 border-t border-border/50">
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

            <Card className="border-border/50 shadow-md bg-gradient-to-br from-card to-secondary/20">
              <CardHeader>
                <CardTitle className="text-lg font-heading">Invite Friends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <Input readOnly value={trip.invite_code || ''} className="bg-background/50" />
                  <Button size="icon" variant="outline" onClick={() => {
                    navigator.clipboard.writeText(trip.invite_code || '')
                    toast.success('Copied to clipboard')
                  }}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <Button className="w-full shadow-md" variant="outline" onClick={() => setIsShareModalOpen(true)}>
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

      <EditRecommendationModal
        isOpen={isEditRecModalOpen}
        onClose={() => setIsEditRecModalOpen(false)}
        recommendation={selectedRec}
        tripId={tripId}
        onSuccess={() => {
          fetchRecommendations()
          setIsEditRecModalOpen(false)
        }}
      />

      <RecommendationDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        recommendation={viewingRec}
        userCurrency={currency}
      />
    </div>
  )
}