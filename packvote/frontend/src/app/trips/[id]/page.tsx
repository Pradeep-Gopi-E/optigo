'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
    ArrowLeft,
    Users,
    Calendar,
    MapPin,
    Share2,
    Settings,
    Vote,
    DollarSign,
    Sparkles,
    ArrowRight,
    Globe,
    CheckCircle2,
    Plus,
    Loader2,
    MoreVertical,
    Edit,
    Trash2,
    Crown,
    Shield,
    User as UserIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import toast from 'react-hot-toast'
import Link from 'next/link'
import { tripsAPI, recommendationsAPI, preferencesAPI, votesAPI, TripDetail, Recommendation, Preference, Participant } from '@/lib/api'
import { cn, formatCurrency as formatCurrencyUtil, generateInitials, formatDate, getCurrencyFromLocale, convertCurrency } from '@/lib/utils'
import { generateMockCostBreakdown } from '@/lib/voting-utils'
import { VotingResults } from '@/components/trips/VotingResults'
import { ItineraryView } from '@/components/trips/ItineraryView'
import { RankingList } from '@/components/trips/RankingList'
import { VotingFlow } from '@/components/trips/VotingFlow'
import PreferencesModal from '@/components/trips/PreferencesModal'
import EditTripModal from '@/components/trips/EditTripModal'
import GenerateRecommendationsModal from '@/components/trips/GenerateRecommendationsModal'
import CustomRecommendationModal from '@/components/trips/CustomRecommendationModal'
import TripDetailSheet from '@/components/trips/TripDetailSheet'

export default function TripDetailPage() {
    const params = useParams()
    const router = useRouter()
    const tripId = params.id as string

    const [trip, setTrip] = useState<TripDetail | null>(null)
    const [recommendations, setRecommendations] = useState<Recommendation[]>([])
    const [preferences, setPreferences] = useState<Preference | null>(null)
    const [activeTab, setActiveTab] = useState<'overview' | 'itinerary' | 'voting' | 'settings' | 'preferences'>('overview')
    const [isLoading, setIsLoading] = useState(true)
    const [user, setUser] = useState<any>(null)
    const [currency, setCurrency] = useState('USD')

    // Voting State
    const [shortlistedRecs, setShortlistedRecs] = useState<Recommendation[]>([])
    const [isVotingComplete, setIsVotingComplete] = useState(false)
    const [userCostBreakdown, setUserCostBreakdown] = useState<Record<string, Record<string, number>>>({})

    // Post-Voting State
    const [showReveal, setShowReveal] = useState(false)

    // Modals State
    const [isPreferencesModalOpen, setIsPreferencesModalOpen] = useState(false)
    const [isEditTripModalOpen, setIsEditTripModalOpen] = useState(false)
    const [isGenerateRecsModalOpen, setIsGenerateRecsModalOpen] = useState(false)
    const [isCustomRecModalOpen, setIsCustomRecModalOpen] = useState(false)
    const [isTripDetailSheetOpen, setIsTripDetailSheetOpen] = useState(false)
    const [selectedRecommendation, setSelectedRecommendation] = useState<Recommendation | null>(null)

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

    useEffect(() => {
        if (recommendations.length > 0 && trip?.participants) {
            const userIds = trip.participants.map(p => p.user_id)
            const breakdown = generateMockCostBreakdown(recommendations, userIds)
            setUserCostBreakdown(breakdown)
        }
    }, [recommendations, trip])

    // Check for reveal status
    useEffect(() => {
        if (trip?.status === 'confirmed') {
            const hasSeen = localStorage.getItem(`hasSeenReveal_${trip.id}`)
            if (!hasSeen) {
                setShowReveal(true)
            }
        }
    }, [trip?.status, trip?.id])

    const handleViewItinerary = () => {
        setShowReveal(false)
        setActiveTab('itinerary')
        if (trip?.id) {
            localStorage.setItem(`hasSeenReveal_${trip.id}`, 'true')
        }
    }

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
            if (response.length > 0) {
                setPreferences(response[0])
            }
        } catch (error) {
            console.error('Failed to fetch preferences:', error)
        }
    }

    const handleRoleChange = async (participantId: string, newRole: string) => {
        try {
            await tripsAPI.updateParticipantRole(tripId, participantId, newRole)
            toast.success('Role updated')
            fetchTripDetails() // Refresh list
        } catch (error) {
            toast.error('Failed to update role')
        }
    }

    const handleDeleteTrip = async () => {
        try {
            await tripsAPI.deleteTrip(tripId)
            toast.success('Trip deleted')
            router.push('/dashboard')
        } catch (error) {
            toast.error('Failed to delete trip')
        }
    }

    const handleResetVoting = async () => {
        try {
            await votesAPI.resetVotes(tripId)
            toast.success('Voting reset successfully')

            // Optimistically update trip status to 'voting'
            setTrip(prev => {
                if (!prev) return prev
                return {
                    ...prev,
                    status: 'voting'
                }
            })

            fetchTripDetails()
        } catch (error) {
            toast.error('Failed to reset voting')
        }
    }

    const handleResetUserVote = async (userId: string) => {
        try {
            await votesAPI.resetUserVote(tripId, userId)
            toast.success('User vote reset')

            // Optimistically update trip status to 'voting' if it was confirmed
            setTrip(prev => {
                if (!prev) return prev
                return {
                    ...prev,
                    status: 'voting'
                }
            })

            fetchTripDetails()
        } catch (error) {
            toast.error('Failed to reset user vote')
        }
    }

    const handleVoteSubmit = async (votes: { recommendation_id: string; rank: number }[]) => {
        try {
            await votesAPI.castVotes(tripId, { votes })
            toast.success('Votes submitted successfully')
            fetchTripDetails()
        } catch (error) {
            toast.error('Failed to submit votes')
        }
    }

    const handleForceComplete = async () => {
        try {
            await votesAPI.finalizeVoting(tripId)

            // 1. Optimistic Update (Don't wait for fetch)
            setTrip(prev => prev ? ({ ...prev, status: 'confirmed' }) : null)

            // 2. CRITICAL: Move user to the "Stage" (Overview Tab)
            setActiveTab('overview')

            // 3. Trigger the Curtain Raise
            setShowReveal(true)

            // 4. Background refresh (Just to be safe)
            fetchTripDetails()

            toast.success("Voting finalized!")
        } catch (error) {
            console.error("Failed to force complete:", error)
            toast.error("Failed to finalize voting")
        }
    }

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

    if (!trip) return null

    const isOwner = trip.created_by === user?.id
    const isImmersive = showReveal && trip?.status === 'confirmed' && activeTab === 'overview'

    return (
        <div className="min-h-screen bg-[#09090b] text-zinc-200 font-body selection:bg-zinc-800 selection:text-zinc-100">
            {/* Modals */}
            <PreferencesModal
                isOpen={isPreferencesModalOpen}
                onClose={() => setIsPreferencesModalOpen(false)}
                tripId={tripId}
                currentPreferences={preferences}
                onSuccess={fetchPreferences}
            />
            {trip && (
                <EditTripModal
                    isOpen={isEditTripModalOpen}
                    onClose={() => setIsEditTripModalOpen(false)}
                    trip={trip}
                    onSuccess={fetchTripDetails}
                    currentUserId={user?.id}
                    onRoleChange={handleRoleChange}
                    onDeleteTrip={handleDeleteTrip}
                />
            )}
            <GenerateRecommendationsModal
                isOpen={isGenerateRecsModalOpen}
                onClose={() => setIsGenerateRecsModalOpen(false)}
                tripId={tripId}
                onSuccess={fetchRecommendations}
            />
            <CustomRecommendationModal
                isOpen={isCustomRecModalOpen}
                onClose={() => setIsCustomRecModalOpen(false)}
                tripId={tripId}
                onSuccess={fetchRecommendations}
            />
            <TripDetailSheet
                isOpen={isTripDetailSheetOpen}
                onClose={() => setIsTripDetailSheetOpen(false)}
                recommendation={selectedRecommendation}
                currency={currency}
                participants={trip?.participants}
            />

            {/* Winner Reveal Overlay */}
            <AnimatePresence mode="wait">
                {isImmersive && (
                    <VotingResults trip={trip} onViewItinerary={handleViewItinerary} />
                )}
            </AnimatePresence>

            {/* Hero Section - Cinematic */}
            <div className="relative h-[50vh] min-h-[500px] w-full overflow-hidden">
                <motion.div
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="absolute inset-0"
                >
                    <img
                        src={trip.image_url || (trip.destination ? `https://source.unsplash.com/1600x900/?${trip.destination},travel` : "https://source.unsplash.com/1600x900/?travel,vacation")}
                        alt={trip.title}
                        className="w-full h-full object-cover opacity-60 grayscale-[0.3]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/40 to-transparent" />
                </motion.div>

                <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12 max-w-7xl mx-auto w-full z-10">
                    <div className="absolute top-8 left-8 right-8 flex justify-between items-start">
                        <Link href="/dashboard" className="p-3 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white hover:bg-black/40 transition-colors group">
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        </Link>

                        {isOwner && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white hover:bg-black/40">
                                        <MoreVertical className="w-5 h-5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-zinc-200">
                                    <DropdownMenuItem onClick={() => setIsEditTripModalOpen(true)} className="hover:bg-zinc-800 cursor-pointer">
                                        <Edit className="w-4 h-4 mr-2" /> Edit Trip
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setIsGenerateRecsModalOpen(true)} className="hover:bg-zinc-800 cursor-pointer">
                                        <Sparkles className="w-4 h-4 mr-2" /> Generate Recommendations
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-zinc-800" />
                                    <DropdownMenuItem className="text-red-400 hover:bg-red-900/20 cursor-pointer">
                                        <Trash2 className="w-4 h-4 mr-2" /> Delete Trip
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <Badge className="bg-white/10 backdrop-blur-md border-white/10 text-white hover:bg-white/20 px-3 py-1 uppercase tracking-widest text-[10px]">
                                {trip.status} Phase
                            </Badge>
                            {trip.destination && (
                                <div className="flex items-center gap-2 text-zinc-300 text-sm font-medium bg-black/30 backdrop-blur-md px-3 py-1 rounded-full border border-white/5">
                                    <MapPin className="w-3 h-3" />
                                    {trip.destination}
                                </div>
                            )}
                        </div>
                        <h1 className="text-5xl md:text-7xl font-heading text-white mb-6 tracking-tight leading-none">
                            {trip.title}
                        </h1>
                        <div className="flex flex-wrap items-center gap-8 text-zinc-400 font-light">
                            {trip.start_date && (
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-zinc-500" />
                                    <span>{formatDate(trip.start_date)} - {trip.end_date ? formatDate(trip.end_date) : 'TBD'}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-zinc-500" />
                                <span>{trip.participants.length} Travelers</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-zinc-500 font-medium">{formatCurrencyUtil(trip.budget_min, currency, false)} - {formatCurrencyUtil(trip.budget_max, currency, false)} {currency}</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Control Bar - Sticky */}
            {!isImmersive && (
                <div className="sticky top-0 z-50 bg-[#09090b]/80 backdrop-blur-xl border-b border-white/5">
                    <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between overflow-x-auto no-scrollbar">
                        <div className="flex items-center gap-8 h-full min-w-max">
                            {['overview', 'itinerary', 'voting', 'preferences'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab as any)}
                                    className={cn(
                                        "h-full relative px-2 text-sm font-medium tracking-wide transition-colors uppercase",
                                        activeTab === tab ? "text-white" : "text-zinc-500 hover:text-zinc-300"
                                    )}
                                >
                                    {tab}
                                    {activeTab === tab && (
                                        <motion.div
                                            layoutId="activeTabIndicator"
                                            className="absolute bottom-0 left-0 right-0 h-[2px] bg-white"
                                        />
                                    )}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-4 ml-4">
                            <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white hidden md:flex">
                                <Share2 className="w-4 h-4 mr-2" />
                                Share
                            </Button>
                            {isOwner && (
                                <Button size="sm" className="bg-zinc-100 text-zinc-950 hover:bg-white rounded-full px-6">
                                    Invite
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <main className="max-w-7xl mx-auto px-6 py-8">
                <AnimatePresence mode="wait">
                    {activeTab === 'overview' && (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-12"
                        >
                            {/* Participants Section */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="md:col-span-2 p-6 rounded-3xl bg-zinc-900/50 border border-white/5 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-heading text-zinc-300">Participants</h3>
                                        <Button variant="link" className="text-zinc-500 hover:text-white" onClick={() => setIsEditTripModalOpen(true)}>
                                            Manage
                                        </Button>
                                    </div>
                                    <div className="flex flex-wrap gap-4">
                                        {trip.participants.map((participant) => (
                                            <div key={participant.id} className="flex items-center gap-3 bg-black/20 rounded-full pl-2 pr-4 py-2 border border-white/5">
                                                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-medium text-zinc-400">
                                                    {generateInitials(participant.user_name)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm text-zinc-200">{participant.user_name}</span>
                                                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{participant.role}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-6 rounded-3xl bg-zinc-900/50 border border-white/5 space-y-4">
                                    <h3 className="text-lg font-heading text-zinc-300">Quick Actions</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2 border-zinc-800 hover:bg-zinc-800 hover:text-white" onClick={() => setIsGenerateRecsModalOpen(true)}>
                                            <Sparkles className="w-5 h-5" />
                                            <span className="text-xs">Generate</span>
                                        </Button>
                                        <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2 border-zinc-800 hover:bg-zinc-800 hover:text-white" onClick={() => setIsPreferencesModalOpen(true)}>
                                            <Settings className="w-5 h-5" />
                                            <span className="text-xs">Preferences</span>
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Recommendations Section */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-heading text-white">Recommendations</h2>
                                    {isOwner && (
                                        <Button onClick={() => setIsGenerateRecsModalOpen(true)} variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                                            <Sparkles className="w-4 h-4 mr-2" />
                                            Generate
                                        </Button>
                                    )}
                                </div>

                                {recommendations.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {recommendations.map((rec) => (
                                            <Card key={rec.id} className="bg-zinc-900/50 border-white/5 overflow-hidden hover:border-white/10 transition-colors group cursor-pointer" onClick={() => {
                                                setSelectedRecommendation(rec)
                                                setIsTripDetailSheetOpen(true)
                                            }}>
                                                <div className="h-48 relative overflow-hidden">
                                                    <img src={rec.image_url || `https://source.unsplash.com/800x600/?${rec.destination_name}`} alt={rec.destination_name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-xs text-white font-medium">
                                                        {formatCurrencyUtil(rec.estimated_cost, currency, false)} {currency}
                                                    </div>
                                                </div>
                                                <CardContent className="p-4">
                                                    <h3 className="font-heading text-lg text-white mb-1">{rec.destination_name}</h3>
                                                    <p className="text-sm text-zinc-400 line-clamp-2">{rec.description}</p>
                                                    <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500">
                                                        <MapPin className="w-3 h-3" />
                                                        {rec.destination_name}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-zinc-500">
                                        <p className="mb-4">No recommendations yet.</p>
                                        {isOwner && (
                                            <Button onClick={() => setIsGenerateRecsModalOpen(true)}>
                                                Generate Recommendations
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'voting' && (
                        <motion.div
                            key="voting"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <VotingFlow
                                recommendations={recommendations}
                                onVoteSubmit={handleVoteSubmit}
                                currency={currency}
                                currentUserId={user?.id}
                                userCostBreakdown={userCostBreakdown}
                                participants={trip.participants}
                                isOwner={isOwner}
                                onForceComplete={handleForceComplete}
                                onUpdatePreferences={() => setIsPreferencesModalOpen(true)}
                                onRegenerate={() => setIsGenerateRecsModalOpen(true)}
                                onResetVoting={handleResetVoting}
                                onResetUserVote={handleResetUserVote}
                            />
                        </motion.div>
                    )}

                    {activeTab === 'preferences' && (
                        <motion.div
                            key="preferences"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-6"
                        >
                            {preferences ? (
                                <div className="space-y-6">
                                    <div className="p-6 rounded-3xl bg-zinc-900/50 border border-white/5 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-heading text-zinc-300">Trip Vibe</h3>
                                            {isOwner && (
                                                <Button variant="ghost" size="sm" onClick={() => setIsPreferencesModalOpen(true)}>
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {preferences.preference_data?.vibe?.map((v: string) => (
                                                <Badge key={v} variant="secondary" className="bg-zinc-800 text-zinc-300">
                                                    {v}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="p-6 rounded-3xl bg-zinc-900/50 border border-white/5 space-y-4">
                                        <h3 className="text-lg font-heading text-zinc-300">Activities</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {preferences.preference_data?.activities?.map((a: string) => (
                                                <Badge key={a} variant="outline" className="border-zinc-700 text-zinc-400">
                                                    {a}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12 text-zinc-500">
                                    <p>No preferences set for this trip yet.</p>
                                    {isOwner && (
                                        <Button onClick={() => setIsPreferencesModalOpen(true)} className="mt-4">
                                            Set Preferences
                                        </Button>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'itinerary' && (
                        <motion.div
                            key="itinerary"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <ItineraryView trip={trip} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    )
}
