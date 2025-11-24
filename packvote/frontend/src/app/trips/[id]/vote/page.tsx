'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { motion } from 'framer-motion'
import { ArrowLeft, Save, GripVertical, AlertCircle, CheckCircle2, Users, Lock } from 'lucide-react'
import { tripsAPI, recommendationsAPI, votesAPI, authAPI, UserVoteSummary } from '@/lib/api'
import { formatCurrency, getCurrencyFromLocale } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Recommendation {
  id: string
  destination_name: string
  description?: string
  estimated_cost?: number
  ai_generated: boolean
}

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const isOwner = currentUser && trip && currentUser.id === trip.created_by
  // Check if enough participants (at least 2)
  const participantCount = trip?.participants?.length || 0
  const isVotingLocked = participantCount < 2

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href={`/trips/${tripId}`} className="mr-4">
                <ArrowLeft className="w-5 h-5 text-gray-600 hover:text-gray-900" />
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">Cast Your Vote</h1>
            </div>
            <div className="flex space-x-2">
              {isOwner && (
                <button
                  onClick={endVoting}
                  disabled={isSubmitting || isVotingLocked}
                  className="btn btn-error text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  title={isVotingLocked ? "Need at least 2 participants" : "End voting"}
                >
                  End Voting
                </button>
              )}
              <button
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
                className="btn btn-ghost text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                title={isVotingLocked ? "Need at least 2 participants" : "Skip vote"}
              >
                Skip Vote
              </button>
              <button
                onClick={submitVotes}
                disabled={isSubmitting || candidates.length === 0 || isVotingLocked}
                className="btn btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                title={isVotingLocked ? "Need at least 2 participants" : "Submit votes"}
              >
                {isVotingLocked ? (
                  <Lock className="w-4 h-4 mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {isSubmitting ? 'Submitting...' : hasVoted ? 'Update Votes' : 'Submit Votes'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Locked Warning */}
        {isVotingLocked && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-8 flex items-start">
            <Lock className="w-5 h-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-yellow-900">Voting is Locked</h3>
              <p className="text-sm text-yellow-700 mt-1">
                You need at least 2 participants in the trip to start voting.
                Please invite more friends to join!
              </p>
            </div>
          </div>
        )}

        {/* Results Ready Notification */}
        {!isVotingLocked && voters.length > 0 && voters.every(v => v.has_voted) && trip.status !== 'confirmed' && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-green-900 mb-2">Results Are Ready!</h3>
            <p className="text-green-700 mb-6 max-w-md mx-auto">
              All participants have cast their votes.
              {isOwner
                ? " As the trip owner, you can now finalize the voting to reveal the winning destination."
                : " Waiting for the trip owner to finalize the results."
              }
            </p>
            {isOwner && (
              <button
                onClick={endVoting}
                disabled={isSubmitting}
                className="btn btn-primary text-white px-8 py-2 text-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
              >
                Finalize Results
              </button>
            )}
          </div>
        )}

        {!isVotingLocked && !(voters.length > 0 && voters.every(v => v.has_voted) && trip.status !== 'confirmed') && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8 flex items-start">
            <AlertCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-blue-900">Ranked Choice Voting</h3>
              <p className="text-sm text-blue-700 mt-1">
                Drag and drop the destinations to rank them in order of preference.
                Put your favorite at the top!
              </p>
            </div>
          </div>
        )}

        {/* Voter Summary */}
        {voters.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Who Voted ({voters.filter(v => v.has_voted).length}/{voters.length})
            </h2>
            <Card>
              <CardContent className="pt-6">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {voters.map((voter, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium mr-3">
                          {voter.user_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-gray-900 truncate max-w-[100px]">
                          {voter.user_name}
                        </span>
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <Badge variant={voter.has_voted ? "default" : "secondary"}>
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
                        className={`bg-white rounded-xl border p-4 flex items-center shadow-sm transition-shadow ${snapshot.isDragging ? 'shadow-lg ring-2 ring-primary ring-opacity-50' : 'hover:shadow-md'
                          }`}
                      >
                        <div
                          {...provided.dragHandleProps}
                          className="mr-4 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
                        >
                          <GripVertical className="w-6 h-6" />
                        </div>

                        <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full text-gray-600 font-bold mr-4 flex-shrink-0">
                          {index + 1}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-medium text-gray-900">{rec.destination_name}</h3>
                            {rec.estimated_cost && (
                              <span className="text-sm text-gray-500">
                                {formatCurrency(rec.estimated_cost, currency)}
                              </span>
                            )}
                          </div>
                          {rec.description && (
                            <p className="text-sm text-gray-600 line-clamp-1">{rec.description}</p>
                          )}
                        </div>

                        {rec.ai_generated && (
                          <div className="ml-4 hidden sm:block">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              AI
                            </span>
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
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500">No destinations to vote on yet.</p>
            <Link href={`/trips/${tripId}`} className="text-primary hover:underline mt-2 inline-block">
              Go back to generate recommendations
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
