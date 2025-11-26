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
  RotateCcw,
  Compass
} from 'lucide-react'
import { tripsAPI, votesAPI, VotingResult, UserVoteSummary, TripDetail } from '@/lib/api'
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
  const [trip, setTrip] = useState<TripDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isResetting, setIsResetting] = useState(false)
  const [isWaitingForFinalization, setIsWaitingForFinalization] = useState(false)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    } else {
      router.push('/auth/login')
      return
    }

    if (tripId) {
      fetchData()
    }
  }, [router, tripId])

  const fetchData = async () => {
    try {
      const [resultsResponse, summaryResponse, tripResponse] = await Promise.all([
        votesAPI.getResults(tripId as string).catch(err => {
          if (err.response?.status === 403 && err.response?.data?.detail === "Voting results are not yet finalized") {
            setIsWaitingForFinalization(true)
            return null
          }
          throw err
        }),
        votesAPI.getVotingSummary(tripId as string),
        tripsAPI.getTrip(tripId as string)
      ])

      if (resultsResponse) {
        setResults(resultsResponse)
      }
      setVoters(summaryResponse || [])
      setTrip(tripResponse)
    } catch (error: any) {
      console.error('Error fetching data:', error)
      toast.error(error.response?.data?.detail || 'Failed to fetch data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRevote = async () => {
    if (!confirm('Are you sure you want to reset all votes? This action cannot be undone.')) return

    setIsResetting(true)
    try {
      await votesAPI.resetVotes(tripId as string)
      toast.success('Votes reset successfully')
      // Reload data
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to reset votes')
    } finally {
      setIsResetting(false)
    }
  }

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="w-4 h-4 text-green-600" />
    ) : (
      <Clock className="w-4 h-4 text-yellow-600" />
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (isWaitingForFinalization) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center relative">
        <div className="noise-overlay" />
        <div className="text-center max-w-md p-8 bg-card/80 backdrop-blur-md rounded-2xl shadow-xl border border-border/50 relative z-10">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Clock className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-heading font-bold text-foreground mb-3">Voting in Progress</h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            The trip owner has not finalized the voting results yet. Please check back later or remind the owner to end the voting.
          </p>
          <div className="flex flex-col space-y-3">
            <Button onClick={() => router.push(`/trips/${tripId}`)} variant="outline" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Trip
            </Button>
            <Button onClick={() => window.location.reload()} variant="ghost" className="w-full">
              Refresh Status
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!results || !results.scores || Object.keys(results.scores).length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center relative">
        <div className="noise-overlay" />
        <div className="text-center max-w-md relative z-10">
          <div className="w-24 h-24 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <BarChart3 className="w-12 h-12 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-heading font-bold text-foreground mb-3">No Results Available</h2>
          <p className="text-muted-foreground mb-8">
            {results?.message || "Voting hasn't started or there are no votes to display."}
          </p>
          <Button onClick={() => router.push(`/trips/${tripId}`)} size="lg" className="shadow-lg">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Trip
          </Button>
        </div>
      </div>
    )
  }

  const isVotingComplete = !!results.winner || trip?.status === 'confirmed'
  const isOwner = trip?.created_by === user?.id || trip?.participants.some(p => p.user_id === user?.id && p.role === 'owner')

  return (
    <div className="min-h-screen bg-background relative">
      <div className="noise-overlay" />

      <Navigation user={user} currentPage="trips" />

      <div className="lg:ml-64 relative z-10">
        {/* Header */}
        <div className="bg-background/80 backdrop-blur-md border-b border-border/50 sticky top-0 z-20">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push(`/trips/${tripId}`)}
                  className="mr-4 text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h1 className="text-2xl font-heading font-bold text-foreground">Voting Results</h1>
                  <p className="text-sm text-muted-foreground">
                    Borda Count voting results
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Badge variant="secondary" className="flex items-center bg-secondary/50 backdrop-blur-sm border border-border/50 px-3 py-1">
                  <Users className="w-3 h-3 mr-1.5" />
                  {results.total_voters} Voters
                </Badge>
                <Badge
                  variant={isVotingComplete ? "default" : "secondary"}
                  className={`flex items-center px-3 py-1 ${isVotingComplete ? 'bg-green-100 text-green-800 border-green-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200'}`}
                >
                  {getStatusIcon(isVotingComplete)}
                  <span className="ml-1.5 font-medium">
                    {isVotingComplete ? 'Decided' : 'In Progress'}
                  </span>
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-10">
          <div className="max-w-5xl mx-auto space-y-10">
            {/* Winner Section */}
            {results.winner && isVotingComplete && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, type: "spring" }}
              >
                <Card className="bg-gradient-to-br from-yellow-500/10 via-orange-500/5 to-transparent border-yellow-500/30 shadow-2xl overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-10 opacity-10">
                    <Trophy className="w-64 h-64 text-yellow-600 transform rotate-12" />
                  </div>
                  <CardHeader className="text-center pb-2 relative z-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg ring-4 ring-yellow-100/50">
                      <Trophy className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="flex items-center justify-center text-3xl font-heading font-bold text-foreground">
                      Winning Destination
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-center max-w-2xl mx-auto">
                      <h2 className="text-5xl font-heading font-bold text-foreground mb-4 drop-shadow-sm">
                        {results.winner.destination_name}
                      </h2>
                      <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                        {results.winner.description}
                      </p>
                      <div className="inline-flex items-center justify-center px-4 py-2 bg-yellow-500/20 text-yellow-800 rounded-full text-sm font-bold border border-yellow-500/30">
                        <Vote className="w-4 h-4 mr-2" />
                        Official Winner
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Leaderboard */}
            <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <h2 className="text-xl font-heading font-semibold text-foreground mb-6 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-primary" />
                Leaderboard (Borda Count)
              </h2>
              <Card className="border-border/50 shadow-lg bg-card/80 backdrop-blur-sm">
                <CardContent className="pt-8 pb-8">
                  <div className="space-y-6">
                    {Object.entries(results.scores)
                      .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
                      .map(([candidateId, score], index) => {
                        const candidate = results.candidates.find(c => c.id === candidateId);
                        const maxScore = Math.max(...Object.values(results.scores));
                        const percentage = (score / maxScore) * 100;

                        return (
                          <div key={candidateId} className="relative group">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center">
                                <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold mr-4 shadow-sm transition-transform group-hover:scale-110 ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' :
                                    index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white' :
                                      index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white' :
                                        'bg-secondary text-muted-foreground'
                                  }`}>
                                  {index + 1}
                                </span>
                                <span className="font-heading font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                                  {candidate?.name || 'Unknown Destination'}
                                </span>
                              </div>
                              <span className="text-sm font-bold text-muted-foreground bg-secondary/50 px-2 py-1 rounded-md">
                                {score} pts
                              </span>
                            </div>
                            <div className="w-full bg-secondary/30 rounded-full h-3 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                transition={{ duration: 1, delay: 0.5 + (index * 0.1) }}
                                className={`h-full rounded-full shadow-sm ${index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' : 'bg-gradient-to-r from-primary/80 to-primary'
                                  }`}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Voters */}
            {voters.length > 0 && (
              <div className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                <h2 className="text-xl font-heading font-semibold text-foreground mb-6 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-primary" />
                  Who Voted
                </h2>
                <Card className="border-border/50 shadow-lg bg-card/80 backdrop-blur-sm">
                  <CardContent className="pt-8 pb-8">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {voters.map((voter, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: 0.6 + (index * 0.05) }}
                          className="flex items-center justify-between p-4 border border-border/50 rounded-xl bg-background/50 hover:bg-background/80 transition-colors"
                        >
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white text-sm font-bold mr-3 shadow-md">
                              {voter.user_name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-foreground">
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

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4 pt-8 pb-12 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
              {!isVotingComplete && (
                <Button onClick={() => router.push(`/trips/${tripId}/vote`)} size="lg" className="shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all">
                  <Vote className="w-4 h-4 mr-2" />
                  {user ? 'Cast Your Vote' : 'Sign In to Vote'}
                </Button>
              )}

              {isOwner && (
                <Button
                  variant="destructive"
                  onClick={handleRevote}
                  disabled={isResetting}
                  size="lg"
                  className="shadow-md"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  {isResetting ? 'Resetting...' : 'Revote (Reset All)'}
                </Button>
              )}

              <Button variant="outline" onClick={() => router.push(`/trips/${tripId}`)} size="lg" className="bg-background/50 backdrop-blur-sm">
                Back to Trip
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}