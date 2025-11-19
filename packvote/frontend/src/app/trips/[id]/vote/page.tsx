'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Brain,
  DollarSign,
  MapPin,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { recommendationsAPI, votesAPI } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Recommendation {
  id: string
  destination: string
  description?: string
  estimated_cost?: number
  activities?: string[]
  tags?: string[]
  ai_generated: boolean
}

interface RankedDestination extends Recommendation {
  rank: number
}

export default function VotingPage() {
  const params = useParams()
  const router = useRouter()
  const tripId = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [availableDestinations, setAvailableDestinations] = useState<Recommendation[]>([])
  const [rankedDestinations, setRankedDestinations] = useState<RankedDestination[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasExistingVote, setHasExistingVote] = useState(false)

  useEffect(() => {
    if (tripId) {
      fetchVotingData()
    }
  }, [tripId])

  const fetchVotingData = async () => {
    try {
      // Fetch recommendations
      const recommendations = await recommendationsAPI.getRecommendations(tripId)

      // Fetch existing votes
      let existingVotes: any[] = []
      try {
        existingVotes = await votesAPI.getUserVote(tripId)
        if (existingVotes.length > 0) {
          setHasExistingVote(true)
        }
      } catch (error) {
        // User hasn't voted yet
      }

      // Separate into ranked and available
      if (existingVotes.length > 0) {
        // User has existing votes - populate ranked list
        const votedRecIds = existingVotes.map((v: any) => v.recommendation_id)
        const ranked = existingVotes
          .map((vote: any) => {
            const rec = recommendations.find((r: any) => r.id === vote.recommendation_id)
            return rec ? { ...rec, rank: vote.rank } : null
          })
          .filter(Boolean)
          .sort((a: any, b: any) => a.rank - b.rank) as RankedDestination[]

        const available = recommendations.filter(
          (rec: any) => !votedRecIds.includes(rec.id)
        )

        setRankedDestinations(ranked)
        setAvailableDestinations(available)
      } else {
        // No existing votes - all destinations are available
        setAvailableDestinations(recommendations)
        setRankedDestinations([])
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        toast.error('No recommendations found for this trip')
      } else {
        toast.error('Failed to load voting options')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result

    // Dropped outside a droppable area
    if (!destination) {
      return
    }

    // Same position
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return
    }

    // Moving from available to ranked
    if (source.droppableId === 'available' && destination.droppableId === 'ranked') {
      const destItem = availableDestinations[source.index]
      const newAvailable = Array.from(availableDestinations)
      newAvailable.splice(source.index, 1)

      const newRanked = Array.from(rankedDestinations)
      newRanked.splice(destination.index, 0, { ...destItem, rank: destination.index + 1 })

      // Update ranks
      newRanked.forEach((item, idx) => {
        item.rank = idx + 1
      })

      setAvailableDestinations(newAvailable)
      setRankedDestinations(newRanked)
    }
    // Moving from ranked to available
    else if (source.droppableId === 'ranked' && destination.droppableId === 'available') {
      const destItem = rankedDestinations[source.index]
      const newRanked = Array.from(rankedDestinations)
      newRanked.splice(source.index, 1)

      // Update ranks
      newRanked.forEach((item, idx) => {
        item.rank = idx + 1
      })

      const newAvailable = Array.from(availableDestinations)
      newAvailable.splice(destination.index, 0, destItem)

      setRankedDestinations(newRanked)
      setAvailableDestinations(newAvailable)
    }
    // Reordering within ranked
    else if (source.droppableId === 'ranked' && destination.droppableId === 'ranked') {
      const newRanked = Array.from(rankedDestinations)
      const [removed] = newRanked.splice(source.index, 1)
      newRanked.splice(destination.index, 0, removed)

      // Update ranks
      newRanked.forEach((item, idx) => {
        item.rank = idx + 1
      })

      setRankedDestinations(newRanked)
    }
    // Reordering within available
    else if (source.droppableId === 'available' && destination.droppableId === 'available') {
      const newAvailable = Array.from(availableDestinations)
      const [removed] = newAvailable.splice(source.index, 1)
      newAvailable.splice(destination.index, 0, removed)

      setAvailableDestinations(newAvailable)
    }
  }

  const handleSubmitVote = async () => {
    if (rankedDestinations.length === 0) {
      toast.error('Please rank at least one destination')
      return
    }

    setIsSubmitting(true)
    try {
      const votes = rankedDestinations.map((dest) => ({
        recommendation_id: dest.id,
        rank: dest.rank,
      }))

      await votesAPI.castVotes(tripId, { votes })
      toast.success('Vote submitted successfully!')
      router.push(`/trips/${tripId}/results`)
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to submit vote')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading voting options...</p>
        </div>
      </div>
    )
  }

  if (availableDestinations.length === 0 && rankedDestinations.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-16">
              <Link href={`/trips/${tripId}`} className="mr-4">
                <ArrowLeft className="w-5 h-5 text-gray-600 hover:text-gray-900" />
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">Vote on Destinations</h1>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Destinations Available</h2>
            <p className="text-gray-600 mb-6">Generate recommendations first before voting</p>
            <Link href={`/trips/${tripId}`} className="btn btn-primary">
              Go to Trip Details
            </Link>
          </div>
        </main>
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
              <Link href={`/trips/${tripId}`} className="mr-4">
                <ArrowLeft className="w-5 h-5 text-gray-600 hover:text-gray-900" />
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Vote on Destinations</h1>
                <p className="text-sm text-gray-600">
                  {hasExistingVote ? 'Update your vote' : 'Drag destinations to rank them'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {hasExistingVote && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start">
            <CheckCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-900">You've already voted</h3>
              <p className="text-sm text-blue-700 mt-1">
                You can update your vote by reordering destinations below and submitting again.
              </p>
            </div>
          </div>
        )}

        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Available Destinations Column */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Available Destinations
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({availableDestinations.length})
                </span>
              </h2>
              <Droppable droppableId="available">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-[400px] space-y-3 ${
                      snapshot.isDraggingOver ? 'bg-blue-50 rounded-lg' : ''
                    } transition-colors p-2`}
                  >
                    {availableDestinations.length === 0 ? (
                      <div className="flex items-center justify-center h-40 text-gray-500 text-sm">
                        All destinations ranked!
                      </div>
                    ) : (
                      availableDestinations.map((dest, index) => (
                        <Draggable key={dest.id} draggableId={dest.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`border rounded-lg p-4 bg-white hover:shadow-md transition-all ${
                                snapshot.isDragging ? 'opacity-50 shadow-lg' : ''
                              }`}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <h3 className="font-medium text-gray-900">{dest.destination}</h3>
                                {dest.ai_generated && (
                                  <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                    <Brain className="w-3 h-3 mr-1" />
                                    AI
                                  </span>
                                )}
                              </div>
                              {dest.description && (
                                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                  {dest.description}
                                </p>
                              )}
                              <div className="flex flex-wrap gap-2">
                                {dest.estimated_cost && (
                                  <span className="inline-flex items-center text-xs text-gray-600">
                                    <DollarSign className="w-3 h-3 mr-1" />
                                    {formatCurrency(dest.estimated_cost)}
                                  </span>
                                )}
                                {dest.activities?.slice(0, 3).map((activity, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                  >
                                    {activity}
                                  </span>
                                ))}
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

            {/* Ranked Destinations Column */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Your Ranked Choices
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({rankedDestinations.length})
                </span>
              </h2>
              <Droppable droppableId="ranked">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-[400px] space-y-3 ${
                      snapshot.isDraggingOver ? 'bg-green-50 rounded-lg' : ''
                    } transition-colors p-2`}
                  >
                    {rankedDestinations.length === 0 ? (
                      <div className="flex items-center justify-center h-40 text-gray-500 text-sm border-2 border-dashed border-gray-300 rounded-lg">
                        Drag destinations here to rank them
                      </div>
                    ) : (
                      rankedDestinations.map((dest, index) => (
                        <Draggable key={dest.id} draggableId={dest.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`border-2 border-green-300 rounded-lg p-4 bg-green-50 hover:shadow-md transition-all ${
                                snapshot.isDragging ? 'opacity-50 shadow-lg' : ''
                              }`}
                            >
                              <div className="flex items-start mb-2">
                                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm mr-3 flex-shrink-0">
                                  #{dest.rank}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-start justify-between">
                                    <h3 className="font-medium text-gray-900">{dest.destination}</h3>
                                    {dest.ai_generated && (
                                      <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                        <Brain className="w-3 h-3 mr-1" />
                                        AI
                                      </span>
                                    )}
                                  </div>
                                  {dest.description && (
                                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                      {dest.description}
                                    </p>
                                  )}
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {dest.estimated_cost && (
                                      <span className="inline-flex items-center text-xs text-gray-600">
                                        <DollarSign className="w-3 h-3 mr-1" />
                                        {formatCurrency(dest.estimated_cost)}
                                      </span>
                                    )}
                                    {dest.activities?.slice(0, 3).map((activity, idx) => (
                                      <span
                                        key={idx}
                                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                      >
                                        {activity}
                                      </span>
                                    ))}
                                  </div>
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

        {/* Submit Button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={handleSubmitVote}
            disabled={rankedDestinations.length === 0 || isSubmitting}
            className={`px-8 py-3 rounded-lg font-medium text-white transition-colors ${
              rankedDestinations.length === 0 || isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isSubmitting
              ? 'Submitting...'
              : hasExistingVote
              ? 'Update My Vote'
              : 'Submit My Vote'}
          </button>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 rounded-lg p-6">
          <h3 className="font-medium text-gray-900 mb-3">How Ranked-Choice Voting Works</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• Drag destinations from left to right to rank them</p>
            <p>• Higher ranked destinations (closer to #1) get more points</p>
            <p>• You can reorder your rankings by dragging within the right column</p>
            <p>• Remove a ranking by dragging it back to the left column</p>
            <p>• You must rank at least one destination to submit your vote</p>
          </div>
        </div>
      </main>
    </div>
  )
}
