'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd'
import { motion } from 'framer-motion'
import { ArrowLeft, Save, GripVertical, AlertCircle, CheckCircle2 } from 'lucide-react'
import { tripsAPI, recommendationsAPI, votesAPI } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Recommendation {
    id: string
    destination_name: string
    description?: string
    estimated_cost?: number
    ai_generated: boolean
}

interface VoteState {
    rank: number
    recommendation_id: string
}

export default function VotingPage() {
    const params = useParams()
    const router = useRouter()
    const tripId = params.id as string

    const [candidates, setCandidates] = useState<Recommendation[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [hasVoted, setHasVoted] = useState(false)
    // Fix for React 18 Strict Mode with react-beautiful-dnd
    const [enabled, setEnabled] = useState(false)

    useEffect(() => {
        const animation = requestAnimationFrame(() => setEnabled(true))
        return () => {
            cancelAnimationFrame(animation)
            setEnabled(false)
        }
    }, [])

    useEffect(() => {
        if (tripId) {
            fetchData()
        }
    }, [tripId])

    const fetchData = async () => {
        try {
            const [recsResponse, votesResponse] = await Promise.all([
                recommendationsAPI.getRecommendations(tripId),
                votesAPI.getMyVotes(tripId).catch(() => [] as any[]) // Handle 404 if no votes yet
            ])

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
            router.push(`/trips/${tripId}/results`)
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to submit votes')
        } finally {
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

    if (!enabled) {
        return null
    }

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
                        <button
                            onClick={submitVotes}
                            disabled={isSubmitting}
                            className="btn btn-primary flex items-center"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {isSubmitting ? 'Submitting...' : hasVoted ? 'Update Votes' : 'Submit Votes'}
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

                <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="candidates">
                        {(provided) => (
                            <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className="space-y-4"
                            >
                                {candidates.map((rec, index) => (
                                    <Draggable key={rec.id} draggableId={rec.id} index={index}>
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
                                                                {formatCurrency(rec.estimated_cost)}
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
