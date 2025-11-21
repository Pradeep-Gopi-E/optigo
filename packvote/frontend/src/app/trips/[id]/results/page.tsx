'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Trophy,
  Users,
  Vote,
  BarChart3,
  Clock,
  TrendingUp,
  CheckCircle,
  XCircle,
  DollarSign
} from 'lucide-react'
import { tripsAPI, votesAPI, VotingResult, UserVoteSummary } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Navigation } from '@/components/layout/navigation'
import toast from 'react-hot-toast'

export default function ResultsPage() {
  const router = useRouter()
  const { id: tripId } = useParams()
  const [user, setUser] = useState<any>(null)
  const [results, setResults] = useState<VotingResult | null>(null)
  const [voters, setVoters] = useState<UserVoteSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    } else {
      router.push('/auth/login')
      return
    }

    fetchResults()
  }, [router, tripId])

  const fetchResults = async () => {
    try {
      const [resultsResponse, summaryResponse] = await Promise.all([
        votesAPI.getResults(tripId as string),
        votesAPI.getVotingSummary(tripId as string)
      ])
      setResults(resultsResponse)
      setVoters(summaryResponse || [])
    } catch (error: any) {
      console.error('Error fetching results:', error)
      toast.error(error.response?.data?.detail || 'Failed to fetch results')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="w-5 h-5 text-green-600" />
    ) : (
      <XCircle className="w-5 h-5 text-red-600" />
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!results || !results.rounds || results.rounds.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Results Available</h2>
          <p className="text-gray-600 mb-4">
            {results?.message || "Voting hasn't started or there are no votes to display."}
          </p>
          <Button onClick={() => router.push(`/trips/${tripId}`)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Trip
          </Button>
        </div>
      </div>
    )
  }

  const isVotingComplete = !!results.winner

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
                  <h1 className="text-xl font-semibold text-gray-900">Voting Results</h1>
                  <p className="text-sm text-gray-500">
                    Instant-runoff voting results
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Badge variant="secondary" className="flex items-center">
                  <Users className="w-3 h-3 mr-1" />
                  {results.total_voters} Voters
                </Badge>
                <Badge
                  variant={isVotingComplete ? "success" : "warning"}
                  className="flex items-center"
                >
                  {getStatusIcon(isVotingComplete)}
                  <span className="ml-1">
                    {isVotingComplete ? 'Complete' : 'In Progress'}
                  </span>
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Winner Section */}
            {results.winner && isVotingComplete && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300">
                  <CardHeader className="text-center">
                    <CardTitle className="flex items-center justify-center text-2xl">
                      <Trophy className="w-8 h-8 mr-2 text-yellow-600" />
                      Winning Destination
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <h2 className="text-3xl font-bold text-gray-900 mb-2">
                        {results.winner.destination_name}
                      </h2>
                      <p className="text-gray-600 mb-4">
                        {results.winner.description}
                      </p>
                      <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Vote className="w-4 h-4 mr-1" />
                          Winner
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Voting Rounds */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Voting Rounds
              </h2>
              <div className="grid gap-6 lg:grid-cols-2">
                {results.rounds.map((round, index) => (
                  <motion.div
                    key={round.round}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          Round {round.round}
                          {round.eliminated && (
                            <Badge variant="destructive" className="ml-2">
                              1 Eliminated
                            </Badge>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {/* Remaining Options */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Votes Remaining:</h4>
                            <div className="space-y-2">
                              {Object.entries(round.vote_counts).map(([destinationId, votes]) => {
                                const candidateName = results.candidates?.find(c => c.id === destinationId)?.name || 'Unknown Candidate';
                                return (
                                  <div key={destinationId} className="flex items-center justify-between">
                                    <span className="text-sm text-gray-900 truncate max-w-[200px]" title={candidateName}>
                                      {candidateName}
                                    </span>
                                    <div className="flex items-center">
                                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                        <div
                                          className="bg-primary h-2 rounded-full"
                                          style={{
                                            width: `${(votes / Math.max(1, ...Object.values(round.vote_counts))) * 100}%`
                                          }}
                                        ></div>
                                      </div>
                                      <span className="text-sm font-medium">{votes}</span>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>

                          {/* Eliminated Options */}
                          {round.eliminated && (
                            <div>
                              <h4 className="text-sm font-medium text-red-700 mb-2">Eliminated:</h4>
                              <div className="flex flex-wrap gap-2">
                                {(() => {
                                  const eliminatedName = results.candidates?.find(c => c.id === round.eliminated)?.name || 'Unknown Candidate';
                                  return (
                                    <Badge key={round.eliminated} variant="destructive">
                                      {eliminatedName}
                                    </Badge>
                                  );
                                })()}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Voters */}
            {voters.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Who Voted
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
                            <span className="text-sm font-medium text-gray-900">
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

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4">
              {!isVotingComplete && (
                <Button onClick={() => router.push(`/trips/${tripId}/vote`)}>
                  <Vote className="w-4 h-4 mr-2" />
                  {user ? 'Cast Your Vote' : 'Sign In to Vote'}
                </Button>
              )}
              <Button variant="outline" onClick={() => router.push(`/trips/${tripId}`)}>
                Back to Trip
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}