'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { motion } from 'framer-motion'
import { ArrowLeft, Save, GripVertical, AlertCircle, CheckCircle2, Users, Lock, Compass, Eye, DollarSign } from 'lucide-react'
import { tripsAPI, recommendationsAPI, votesAPI, authAPI, UserVoteSummary, Recommendation } from '@/lib/api'
import { formatCurrency, getCurrencyFromLocale } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import RecommendationDetailsModal from '@/components/trips/RecommendationDetailsModal'

export default function VotingPage() {
  const params = useParams()
  const router = useRouter()
  const tripId = params.id as string

  const [candidates, setCandidates] = useState<Recommendation[]>([])
  const [voters, setVoters] = useState<UserVoteSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasVoted, setHasVoted] = useState(false)
  const [currency, setCurrency] = useState('USD')

  const [currentUser, setCurrentUser] = useState<any>(null)
  const [trip, setTrip] = useState<any>(null)

  // Modal State
  const [selectedRecommendation, setSelectedRecommendation] = useState<Recommendation | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    if (tripId) {
      fetchData()
    }
    setCurrency(getCurrencyFromLocale())
  }, [tripId])

  const fetchData = async () => {
    try {
      const [recsResponse, votesResponse, tripResponse, userResponse, summaryResponse] = await Promise.all([
        recommendationsAPI.getRecommendations(tripId),
        votesAPI.getMyVotes(tripId).catch(() => [] as any[]), // Handle 404 if no votes yet
        tripsAPI.getTrip(tripId),
        authAPI.getMe(),
        votesAPI.getVotingSummary(tripId)
      ])

      setTrip(tripResponse)
      setCurrentUser(userResponse)
      setVoters(summaryResponse || [])

      // If user has voted, order candidates by their rank
      if (votesResponse && votesResponse.length > 0) {
        setHasVoted(true)
        const votedRecIds = new Set(votesResponse.map((v: any) => v.recommendation_id))

        // Sort recommendations: voted ones first (in rank order), then unvoted
        const sortedRecs = [...recsResponse].sort((a, b) => {
          const voteA = votesResponse.find((v: any) => v.recommendation_id === a.id)
          const voteB = votesResponse.find((v: any) => v.recommendation_id === b.id)

          if (voteA && voteB) return voteA.rank - voteB.rank
          if (voteA) return -1
          if (voteB) return 1
          return 0
        })

        setCandidates(sortedRecs)
      } else {
        setCandidates(recsResponse)
      }
    } catch (error) {
      console.error('Failed to load voting data:', error)
      toast.error('Failed to load voting data')
    } finally {
      setIsLoading(false)
    }
  }

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return

    const items = Array.from(candidates)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setCandidates(items)
  }

  const submitVotes = async () => {
    setIsSubmitting(true)
    try {
      // Create votes payload: index + 1 is the rank
      const votes = candidates.map((rec, index) => ({
        recommendation_id: rec.id,
        rank: index + 1
      }))

      await votesAPI.castVotes(tripId, { votes })
      toast.success('Votes submitted successfully!')
      setHasVoted(true)
      // Refresh data to update voter summary
      fetchData()
      // Optionally redirect, but user might want to stay to see others
      // router.push(`/trips/${tripId}/results`) 
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to submit votes')
    } finally {
      setIsSubmitting(false)
    }
  }

  const endVoting = async () => {
    if (!confirm('Are you sure you want to end voting? This will finalize the results and set the destination.')) return
    setIsSubmitting(true)
    try {
      await votesAPI.finalizeVoting(tripId)
      toast.success('Voting finalized!')
      router.push(`/trips/${tripId}/results`)
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to finalize voting')
      setIsSubmitting(false)
    }
  }

  const openDetails = (rec: Recommendation) => {
    setSelectedRecommendation(rec)
    setIsModalOpen(true)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const isOwner = currentUser && trip && currentUser.id === trip.created_by
  const isAdmin = currentUser && trip && trip.participants.find((p: any) => p.user_id === currentUser.id)?.role === 'admin'
  const isOwnerOrAdmin = isOwner || isAdmin

  // Check if enough participants (at least 2)
  const participantCount = trip?.participants?.length || 0
  const isVotingLocked = participantCount < 2

  return (
    <div className="min-h-screen bg-background relative">
      <div className="noise-overlay" />

      <header className="bg-background/80 backdrop-blur-md border-b border-border/50 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center">
              <Link href={`/trips/${tripId}`} className="mr-6 group">
                <ArrowLeft className="w-6 h-6 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Link>
              <div>
                <h1 className="text-2xl font-heading font-bold text-foreground">Cast Your Vote</h1>
                <p className="text-sm text-muted-foreground hidden sm:block">Rank your favorite destinations</p>
              </div>
            </div>
            <div className="flex space-x-3">
              {isOwner && (
                <Button
                  onClick={endVoting}
                  disabled={isSubmitting || isVotingLocked}
                  variant="destructive"
                  className="shadow-md"
                  title={isVotingLocked ? "Need at least 2 participants" : "End voting"}
                >
                  End Voting
                </Button>
              )}
              <Button
                onClick={async () => {
                  if (!confirm('Are you sure you want to skip voting? This will be counted as a participation.')) return
                  setIsSubmitting(true)
                  try {
                    await votesAPI.skipVote(tripId)
                    toast.success('You skipped voting')
                    fetchData() // Refresh to update summary
                  } catch (error: any) {
                    toast.error(error.response?.data?.detail || 'Failed to skip vote')
                    setIsSubmitting(false)
                  }
                }}
                disabled={isSubmitting || isVotingLocked}
                variant="ghost"
                className="text-muted-foreground hover:text-foreground"
                title={isVotingLocked ? "Need at least 2 participants" : "Skip vote"}
              >
                Skip Vote
              </Button>
              <Button
                onClick={submitVotes}
                disabled={isSubmitting || candidates.length === 0 || isVotingLocked}
                className="shadow-lg"
                title={isVotingLocked ? "Need at least 2 participants" : "Submit votes"}
              >
                {isVotingLocked ? (
                  <Lock className="w-4 h-4 mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {isSubmitting ? 'Submitting...' : hasVoted ? 'Update Votes' : 'Submit Votes'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        {/* Locked Warning */}
        {isVotingLocked && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 mb-8 flex items-start backdrop-blur-sm">
            <Lock className="w-6 h-6 text-yellow-600 mr-4 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-heading font-semibold text-yellow-800 text-lg">Voting is Locked</h3>
              <p className="text-yellow-700 mt-1 leading-relaxed">
                You need at least 2 participants in the trip to start voting.
                Please invite more friends to join!
              </p>
            </div>
          </div>
        )}

        {/* Results Ready Notification */}
        {!isVotingLocked && voters.length > 0 && voters.every(v => v.has_voted) && trip.status !== 'confirmed' && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-8 mb-8 text-center backdrop-blur-sm animate-fade-in-up">
            <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-2xl font-heading font-bold text-green-900 mb-3">Results Are Ready!</h3>
            <p className="text-green-800 mb-8 max-w-lg mx-auto text-lg">
              All participants have cast their votes.
              {isOwner
                ? " As the trip owner, you can now finalize the voting to reveal the winning destination."
                : " Waiting for the trip owner to finalize the results."
              }
            </p>
            {isOwner && (
              <Button
                onClick={endVoting}
                disabled={isSubmitting}
                size="lg"
                className="shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all"
              >
                Finalize Results
              </Button>
            )}
          </div>
        )}

        {!isVotingLocked && !(voters.length > 0 && voters.every(v => v.has_voted) && trip.status !== 'confirmed') && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 mb-8 flex items-start backdrop-blur-sm">
            <Compass className="w-6 h-6 text-primary mr-4 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-heading font-semibold text-primary text-lg">Ranked Choice Voting</h3>
              <p className="text-muted-foreground mt-1 leading-relaxed">
                Drag and drop the destinations to rank them in order of preference.
                Put your favorite at the top!
              </p>
            </div>
          </div>
        )}

        {/* Voter Summary */}
        {voters.length > 0 && (
          <div className="mb-10 animate-fade-in-up">
            <h2 className="text-xl font-heading font-semibold text-foreground mb-4 flex items-center">
              <Users className="w-5 h-5 mr-3 text-primary" />
              Who Voted ({voters.filter(v => v.has_voted).length}/{voters.length})
            </h2>
            <Card className="border-border/50 shadow-md bg-card/80 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {voters.map((voter, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="flex items-center justify-between p-3 border border-border/50 rounded-lg bg-background/50"
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white text-sm font-bold mr-3 shadow-sm">
                          {voter.user_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-foreground truncate max-w-[100px]">
                          {voter.user_name}
                        </span>
                      </div>
                      <div className="flex items-center text-xs">
                        <Badge variant={voter.has_voted ? "default" : "secondary"} className={voter.has_voted ? "bg-primary/90" : "bg-secondary"}>
                          {voter.has_voted ? "Voted" : "Pending"}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="candidates" isDropDisabled={isVotingLocked}>
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={`space-y-4 ${isVotingLocked ? 'opacity-60 pointer-events-none' : ''}`}
              >
                {candidates.map((rec, index) => (
                  <Draggable key={rec.id} draggableId={rec.id} index={index} isDragDisabled={isVotingLocked}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`bg-card/90 backdrop-blur-sm rounded-xl border border-border/50 p-6 flex items-center transition-all duration-200 ${snapshot.isDragging
                          ? 'shadow-2xl scale-[1.02] ring-2 ring-primary ring-opacity-50 z-50'
                          : 'hover:shadow-lg hover:border-primary/30'
                          }`}
                      >
                        <div
                          {...provided.dragHandleProps}
                          className="mr-6 text-muted-foreground hover:text-primary cursor-grab active:cursor-grabbing transition-colors"
                        >
                          <GripVertical className="w-6 h-6" />
                        </div>

                        <div className="flex items-center justify-center w-10 h-10 bg-secondary rounded-full text-foreground font-heading font-bold mr-6 flex-shrink-0 border border-border/50 shadow-inner">
                          {index + 1}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-heading font-bold text-lg text-foreground truncate pr-4">{rec.destination_name}</h3>
                            <div className="flex items-center gap-2">
                              {rec.estimated_cost && (
                                <Badge variant="outline" className="text-sm font-medium text-muted-foreground bg-secondary/50 border-none">
                                  {formatCurrency(rec.estimated_cost, currency)}
                                </Badge>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openDetails(rec)}
                                className="text-primary hover:text-primary/80 hover:bg-primary/10"
                              >
                                <Eye className="w-4 h-4 mr-1" /> Details
                              </Button>
                            </div>
                          </div>
                          {rec.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">{rec.description}</p>
                          )}

                          {/* Budget Fit Indicator (Mock logic for now, can be enhanced) */}
                          {rec.estimated_cost && trip.budget_max && rec.estimated_cost <= trip.budget_max && (
                            <div className="mt-2 flex items-center text-xs text-green-600">
                              <DollarSign className="w-3 h-3 mr-1" /> Within Budget
                            </div>
                          )}
                          {rec.estimated_cost && trip.budget_max && rec.estimated_cost > trip.budget_max && (
                            <div className="mt-2 flex items-center text-xs text-orange-600">
                              <DollarSign className="w-3 h-3 mr-1" /> Over Budget
                            </div>
                          )}
                        </div>

                        {rec.ai_generated && (
                          <div className="ml-6 hidden sm:block">
                            <Badge variant="secondary" className="bg-purple-500/10 text-purple-700 border-purple-200">
                              AI Pick
                            </Badge>
                          </div>
                        )}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {candidates.length === 0 && (
          <div className="text-center py-20 bg-secondary/10 rounded-2xl border border-dashed border-border">
            <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Compass className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-lg mb-4">No destinations to vote on yet.</p>
            <Link href={`/trips/${tripId}`} className="text-primary font-medium hover:underline inline-block">
              Go back to generate recommendations
            </Link>
          </div>
        )}
      </main>

      <RecommendationDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        recommendation={selectedRecommendation}
        userCurrency={currency}
        tripId={tripId}
        isOwnerOrAdmin={isOwnerOrAdmin}
        onUpdate={fetchData}
        participants={trip?.participants}
      />
    </div>
  )
}
