'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Recommendation, Participant } from '@/lib/api'
// Import SwipeDeck component
import { SwipeDeck } from './SwipeDeck'
import { RankingList } from './RankingList'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CheckCircle2, Clock, Crown, AlertTriangle, Loader2, RotateCcw } from 'lucide-react'
import { cn, generateInitials } from '@/lib/utils'
import { generateMockSocialProof } from '@/lib/voting-utils'
import toast from 'react-hot-toast'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface VotingFlowProps {
    recommendations: Recommendation[]
    onVoteSubmit: (votes: { recommendation_id: string, rank: number }[]) => Promise<void>
    currency: string
    currentUserId: string
    userCostBreakdown?: Record<string, Record<string, number>> // Map of recId -> { userId -> cost }
    participants?: Participant[]
    isOwner?: boolean
    onForceComplete?: () => Promise<void>
    onUpdatePreferences?: () => void
    onRegenerate?: () => void
    onResetVoting?: () => Promise<void>
    onResetUserVote?: (userId: string) => Promise<void>
}

export type VotingState = 'discovery' | 'ranking' | 'waiting'

export const VotingFlow = ({
    recommendations,
    onVoteSubmit,
    currency,
    currentUserId,
    userCostBreakdown,
    participants = [],
    isOwner = false,
    onForceComplete,
    onUpdatePreferences,
    onRegenerate,
    onResetVoting,
    onResetUserVote
}: VotingFlowProps) => {
    const [viewState, setViewState] = useState<VotingState>('discovery')
    const [shortlistedIds, setShortlistedIds] = useState<Set<string>>(new Set())
    const [orderedIds, setOrderedIds] = useState<string[]>([])
    const [passedIds, setPassedIds] = useState<Set<string>>(new Set())
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [hasSubmitted, setHasSubmitted] = useState(false)
    const [isInitializing, setIsInitializing] = useState(true)
    const [isFinishing, setIsFinishing] = useState(false)

    // Stable mock social proof
    const [socialProof, setSocialProof] = useState<Record<string, string[]>>({})

    // Check for existing vote status on mount
    useEffect(() => {
        const checkVoteStatus = () => {
            // Wait for both participants and currentUserId to be available
            if (!currentUserId || participants.length === 0) {
                return
            }

            const currentUser = participants.find(p => p.user_id === currentUserId)
            if (currentUser?.vote_status === 'voted') {
                setHasSubmitted(true)
                setViewState('waiting')
            }

            // Initialization complete
            setIsInitializing(false)
        }

        checkVoteStatus()
    }, [participants, currentUserId])

    useEffect(() => {
        if (recommendations.length > 0 && participants.length > 0) {
            // Generate once on mount/data change to prevent flickering
            const userNames = participants.map(p => p.user_name)
            setSocialProof(generateMockSocialProof(recommendations, userNames))
        }
    }, [recommendations.length, participants.length])

    // Filter recommendations based on state
    // Derive shortlistedRecs from orderedIds to preserve order
    const shortlistedRecs = orderedIds
        .map(id => recommendations.find(r => r.id === id))
        .filter((r): r is Recommendation => !!r)
    const remainingRecs = recommendations.filter(r => !shortlistedIds.has(r.id) && !passedIds.has(r.id))

    const handleSwipe = (recId: string, direction: 'left' | 'right') => {
        if (direction === 'right') {
            setShortlistedIds(prev => new Set(prev).add(recId))
            setOrderedIds(prev => [...prev, recId])
        } else {
            setPassedIds(prev => new Set(prev).add(recId))
        }
    }

    const handleDeckComplete = (likedCount: number) => {
        // If we have items in shortlist OR if the local likedCount from SwipeDeck > 0
        // This handles the race condition where state hasn't updated yet
        if (shortlistedIds.size > 0 || likedCount > 0) {
            setViewState('ranking')
        }
        // If no items in shortlist, SwipeDeck handles the "Empty State" UI
        // We do NOT change viewState here, so SwipeDeck remains mounted
    }

    const handleReorder = (newOrder: Recommendation[]) => {
        setOrderedIds(newOrder.map(r => r.id))
    }

    const handleSubmit = async (finalOrder: Recommendation[]) => {
        setIsSubmitting(true)
        try {
            const votes = finalOrder.map((rec, index) => ({
                recommendation_id: rec.id,
                rank: index + 1
            }))
            await onVoteSubmit(votes)
            setHasSubmitted(true)
            setViewState('waiting')
        } catch (error: any) {
            if (error.response?.data?.detail === "Voting is closed for this trip") {
                toast.error("Voting is currently closed. Ask the Admin to reopen it.")
            } else {
                toast.error("Failed to submit votes. Please try again.")
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isInitializing) {
        return (
            <div className="w-full h-[600px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <p className="text-zinc-500 text-sm">Loading voting status...</p>
                </div>
            </div>
        )
    }

    const handleEditVote = () => {
        setHasSubmitted(false)
        setViewState('ranking')
    }

    const handleResetUserVote = async (userId: string) => {
        if (onResetUserVote) {
            await onResetUserVote(userId)

            // If the current user is being reset, update local state
            if (userId === currentUserId) {
                setHasSubmitted(false)
                // If we have a shortlist, go to ranking, otherwise discovery
                if (shortlistedIds.size > 0) {
                    setViewState('ranking')
                } else {
                    setViewState('discovery')
                }
            }
        }
    }

    return (
        <div className="w-full max-w-md mx-auto min-h-[600px] relative">
            <AnimatePresence mode="wait">
                {viewState === 'discovery' && !hasSubmitted ? (
                    <motion.div
                        key="discovery"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                        transition={{ duration: 0.5 }}
                        className="h-full"
                    >
                        <div className="mb-6 text-center">
                            <h2 className="text-2xl font-heading text-white mb-2">Discover & Shortlist</h2>
                            <p className="text-zinc-400 text-sm">Swipe right to shortlist, left to pass.</p>
                        </div>

                        <SwipeDeck
                            recommendations={remainingRecs}
                            onSwipe={handleSwipe}
                            onDeckEmpty={handleDeckComplete}
                            currency={currency}
                            currentUserId={currentUserId}
                            userCostBreakdown={userCostBreakdown}
                            socialProof={socialProof}
                            onUpdatePreferences={onUpdatePreferences}
                            onRegenerate={onRegenerate}
                        />

                        {/* Skip to Ranking Button (Only if we have shortlisted items) */}
                        {shortlistedIds.size > 0 && (
                            <div className="absolute bottom-0 left-0 right-0 flex justify-center pb-8">
                                <Button
                                    variant="ghost"
                                    className="text-zinc-500 hover:text-zinc-300 text-xs uppercase tracking-widest"
                                    onClick={() => setViewState('ranking')}
                                >
                                    Skip to Ranking
                                </Button>
                            </div>
                        )}
                    </motion.div>
                ) : viewState === 'ranking' && !hasSubmitted ? (
                    <motion.div
                        key="ranking"
                        initial={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                        transition={{ duration: 0.5 }}
                        className="h-full flex flex-col"
                    >
                        <div className="mb-6 text-center relative">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute left-0 top-0 text-zinc-500 hover:text-white"
                                onClick={() => setViewState('discovery')}
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                            <h2 className="text-2xl font-heading text-white mb-2">Rank Your Favorites</h2>
                            <p className="text-zinc-400 text-sm">Drag to reorder. Top is #1.</p>
                        </div>

                        <div className="flex-1">
                            <RankingList
                                items={shortlistedRecs}
                                onReorder={handleReorder}
                                onRemove={(id) => {
                                    setShortlistedIds(prev => {
                                        const next = new Set(prev)
                                        next.delete(id)
                                        return next
                                    })
                                    setOrderedIds(prev => prev.filter(oid => oid !== id))
                                    setPassedIds(prev => new Set(prev).add(id))
                                }}
                                currency={currency}
                                onSubmit={handleSubmit}
                                isSubmitting={isSubmitting}
                                currentUserId={currentUserId}
                                userCostBreakdown={userCostBreakdown}
                            />
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="waiting"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="h-full flex flex-col items-center justify-center p-6"
                    >
                        <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6 animate-pulse">
                            <CheckCircle2 className="w-10 h-10 text-green-500" />
                        </div>

                        <h2 className="text-3xl font-heading text-white mb-2 text-center">Votes Cast.</h2>
                        <p className="text-zinc-400 text-center mb-8">Waiting for Group.</p>

                        {/* Participants Status List */}
                        <div className="w-full max-w-sm bg-zinc-900/50 border border-white/5 rounded-2xl p-4 space-y-3 mb-8">
                            {participants.map(p => (
                                <div key={p.id} className="group flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-medium text-zinc-400 border border-white/5">
                                            {generateInitials(p.user_name)}
                                        </div>
                                        <span className="text-sm text-zinc-200">{p.user_name}</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {p.vote_status === 'voted' || (p.user_id === currentUserId && hasSubmitted) ? (
                                            <div className="flex items-center gap-2 text-green-500 text-xs font-medium bg-green-500/10 px-2 py-1 rounded-full border border-green-500/20">
                                                <CheckCircle2 className="w-3 h-3" />
                                                Ready
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-zinc-500 text-xs font-medium bg-zinc-800 px-2 py-1 rounded-full border border-zinc-700/50">
                                                <Clock className="w-3 h-3 animate-pulse" />
                                                Thinking...
                                            </div>
                                        )}

                                        {/* Individual Reset Button (Owner Only) */}
                                        {isOwner && p.vote_status === 'voted' && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 hover:text-red-400 hover:bg-red-950/30"
                                                onClick={() => handleResetUserVote(p.user_id)}
                                                title="Reset User Vote"
                                            >
                                                <RotateCcw className="w-3 h-3" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-col gap-4 w-full max-w-sm">
                            <Button
                                variant="outline"
                                className="w-full border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                                onClick={handleEditVote}
                            >
                                Edit My Vote
                            </Button>

                            {/* Admin Controls */}
                            {isOwner && (
                                <div className="space-y-3 pt-4 border-t border-white/5">
                                    <div className="flex items-center gap-2 text-red-400 justify-center">
                                        <Crown className="w-3 h-3" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Manager Actions</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
                                                >
                                                    <RotateCcw className="w-4 h-4 mr-2" />
                                                    Reset All
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Reset Voting?</AlertDialogTitle>
                                                    <AlertDialogDescription className="text-zinc-400">
                                                        This will wipe all current votes and reset the process. This action cannot be undone.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel className="border-zinc-800 hover:bg-zinc-800 hover:text-white">Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={onResetVoting} className="bg-red-600 hover:bg-red-700 text-white border-none">
                                                        Yes, Reset All
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>

                                        <Button
                                            className="bg-white text-black hover:bg-zinc-200"
                                            onClick={async () => {
                                                if (onForceComplete) {
                                                    setIsFinishing(true)
                                                    try {
                                                        await onForceComplete()
                                                    } finally {
                                                        setIsFinishing(false)
                                                    }
                                                }
                                            }}
                                            disabled={isFinishing}
                                        >
                                            {isFinishing ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Finalizing...
                                                </>
                                            ) : (
                                                "Force Complete"
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
