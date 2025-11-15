'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Vote,
  Trophy,
  Star,
  MapPin,
  DollarSign,
  Users,
  Clock,
  Save,
  BarChart3,
  Info
} from 'lucide-react'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { tripsAPI } from '@/lib/api'
import { formatCurrency, getConfidenceColor } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Navigation } from '@/components/layout/navigation'
import toast from 'react-hot-toast'

interface RecommendationData {
  id: string
  destination: string
  description: string
  estimated_cost: number
  ai_confidence: number
  created_at: string
}

interface VoteRanking {
  id: string
  destination: string
  description: string
  estimated_cost: number
  ai_confidence: number
}

export default function VotingPage() {
  const router = useRouter()
  const { id: tripId } = useParams()
  const [user, setUser] = useState<any>(null)
  const [recommendations, setRecommendations] = useState<RecommendationData[]>([])
  const [rankings, setRankings] = useState<VoteRanking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isVoting, setIsVoting] = useState(false)
  const [existingVote, setExistingVote] = useState<any>(null)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    } else {
      router.push('/auth/login')
      return
    }

    fetchRecommendations()
    checkExistingVote()
  }, [router, tripId])

  const fetchRecommendations = async () => {
    try {
      const response = await tripsAPI.getRecommendations(tripId as string)
      setRecommendations(response)

      // Initialize rankings in current order
      const initialRankings = response.map((rec: RecommendationData) => ({
        id: rec.id,
        destination: rec.destination,
        description: rec.description,
        estimated_cost: rec.estimated_cost,
        ai_confidence: rec.ai_confidence
      }))
      setRankings(initialRankings)
    } catch (error) {
      toast.error('Failed to fetch recommendations')
    } finally {
      setIsLoading(false)
    }
  }

  const checkExistingVote = async () => {
    try {
      const votes = await tripsAPI.getVotes(tripId as string)
      const userVote = votes.find((vote: any) => vote.user_id === user?.id)
      if (userVote) {
        setExistingVote(userVote)
        // Pre-fill existing rankings
        if (userVote.rankings && recommendations.length > 0) {
          const rankedRecommendations = userVote.rankings
            .map((id: string) => recommendations.find((rec: any) => rec.id === id))
            .filter(Boolean)
          setRankings(rankedRecommendations)
        }
      }
    } catch (error) {
      console.error('Failed to check existing vote:', error)
    }
  }

  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    const items = Array.from(rankings)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setRankings(items)
  }

  const handleSubmitVote = async () => {
    if (rankings.length === 0) {
      toast.error('Please rank at least one option')
      return
    }

    setIsVoting(true)
    try {
      const voteData = rankings.map(ranking => ranking.id)
      await tripsAPI.createVote(tripId as string, voteData)
      toast.success(existingVote ? 'Vote updated successfully' : 'Vote submitted successfully')
      router.push(`/trips/${tripId}`)
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to submit vote')
    } finally {
      setIsVoting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (recommendations.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <Vote className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Recommendations Available</h2>
          <p className="text-gray-600 mb-4">
            AI recommendations need to be generated before voting can begin.
          </p>
          <Button onClick={() => router.push(`/trips/${tripId}`)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Trip
          </Button>
        </div>
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/trips/${tripId}`)}
                  className="mr-4"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    {existingVote ? 'Update Your Vote' : 'Cast Your Vote'}
                  </h1>
                  <p className="text-sm text-gray-500">
                    Rank destinations by preference (#1 is your top choice)
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Badge variant="secondary" className="flex items-center">
                  <Users className="w-3 h-3 mr-1" />
                  {recommendations.length} Options
                </Badge>
                {existingVote && (
                  <Badge variant="success" className="flex items-center">
                    <Vote className="w-3 h-3 mr-1" />
                    Voted
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border-b border-blue-200">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-start">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="text-sm text-blue-800">
                  <span className="font-medium">How voting works:</span> Drag and drop destinations to rank them by preference.
                  Your #1 choice gets the highest ranking. The system uses instant-runoff voting to determine the winner.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Voting Area */}
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-4xl mx-auto">
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="space-y-6">
                {/* Rankings List */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
                    Your Rankings
                  </h2>
                  <Droppable droppableId="rankings">
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`space-y-3 min-h-[200px] p-4 border-2 border-dashed rounded-lg transition-colors ${
                          snapshot.isDraggingOver ? 'border-primary bg-primary/5' : 'border-gray-300'
                        }`}
                      >
                        {rankings.length === 0 ? (
                          <div className="text-center py-12 text-gray-500">
                            <Vote className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <p>Drag destinations here to rank them</p>
                          </div>
                        ) : (
                          rankings.map((ranking, index) => (
                            <Draggable key={ranking.id} draggableId={ranking.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`vote-item bg-white p-4 rounded-lg border-2 transition-all ${
                                    snapshot.isDragging ? 'shadow-lg border-primary' : 'border-gray-200'
                                  }`}
                                >
                                  <div className="flex items-center">
                                    {/* Rank Number */}
                                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold mr-4 ${
                                      index === 0 ? 'bg-yellow-100 text-yellow-800' :
                                      index === 1 ? 'bg-gray-100 text-gray-800' :
                                      index === 2 ? 'bg-orange-100 text-orange-800' :
                                      'bg-gray-100 text-gray-600'
                                    }`}>
                                      {index + 1}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1">
                                      <h3 className="font-semibold text-gray-900 text-lg">
                                        {ranking.destination}
                                      </h3>
                                      <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                                        {ranking.description}
                                      </p>

                                      {/* Tags */}
                                      <div className="flex items-center space-x-4 mt-2">
                                        <span className="flex items-center text-sm text-gray-500">
                                          <DollarSign className="w-3 h-3 mr-1" />
                                          {formatCurrency(ranking.estimated_cost)}
                                        </span>
                                        <Badge
                                          variant="secondary"
                                          className={`text-xs ${getConfidenceColor(ranking.ai_confidence)}`}
                                        >
                                          <Star className="w-3 h-3 mr-1" />
                                          {Math.round(ranking.ai_confidence)}% AI Score
                                        </Badge>
                                      </div>
                                    </div>

                                    {/* Drag Handle */}
                                    <div className="ml-4 flex flex-col space-y-1">
                                      <div className="w-1 h-1 bg-gray-400 rounded"></div>
                                      <div className="w-1 h-1 bg-gray-400 rounded"></div>
                                      <div className="w-1 h-1 bg-gray-400 rounded"></div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              </div>
            </DragDropContext>

            {/* Action Buttons */}
            <div className="mt-8 flex justify-between items-center">
              <Button
                variant="outline"
                onClick={() => router.push(`/trips/${tripId}`)}
              >
                Cancel
              </Button>

              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  onClick={() => router.push(`/trips/${tripId}/results`)}
                  className="flex items-center"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Current Results
                </Button>

                <Button
                  onClick={handleSubmitVote}
                  disabled={isVoting || rankings.length === 0}
                  size="lg"
                  className="min-w-[150px]"
                >
                  {isVoting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {existingVote ? 'Updating...' : 'Submitting...'}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {existingVote ? 'Update Vote' : 'Submit Vote'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}