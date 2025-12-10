'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion'
import { Recommendation } from '@/lib/api'
import { X, Heart, Users, Star, RefreshCw, Settings } from 'lucide-react'
import { formatCurrency, generateInitials } from '@/lib/utils'
import { getUserCost, getUserCostDisplay } from '@/lib/voting-utils'
import { Button } from '@/components/ui/button'

interface SwipeDeckProps {
    recommendations: Recommendation[]
    onSwipe: (recId: string, direction: 'left' | 'right') => void
    onDeckEmpty: (likedCount: number) => void
    currency: string
    currentUserId: string
    userCostBreakdown?: Record<string, Record<string, number>>
    socialProof?: Record<string, string[]> // recId -> list of user names/ids
    onUpdatePreferences?: () => void
    onRegenerate?: () => void
}

export const SwipeDeck = ({
    recommendations,
    onSwipe,
    onDeckEmpty,
    currency,
    currentUserId,
    userCostBreakdown,
    socialProof,
    onUpdatePreferences,
    onRegenerate
}: SwipeDeckProps) => {
    // We always show the first card in the list
    const activeRec = recommendations[0]
    const nextRec = recommendations[1]
    const [isRegenerating, setIsRegenerating] = useState(false)

    // Track local likes to avoid race conditions with parent state
    const likedCount = useRef(0)

    // Handle empty deck
    useEffect(() => {
        if (recommendations.length === 0) {
            onDeckEmpty(likedCount.current)
        }
    }, [recommendations.length, onDeckEmpty])

    const handleRegenerate = () => {
        setIsRegenerating(true)
        if (onRegenerate) {
            onRegenerate()
        }
    }

    if (!activeRec) {
        return (
            <div className="h-[600px] w-full flex flex-col items-center justify-center text-center p-8 border border-white/10 rounded-3xl bg-[#09090b] relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-800 via-[#09090b] to-[#09090b]" />

                <div className="z-10 flex flex-col items-center max-w-md mx-auto">
                    <div className="w-20 h-20 rounded-full bg-zinc-900/80 border border-white/10 flex items-center justify-center mb-6 shadow-2xl">
                        <Star className="w-10 h-10 text-zinc-600" />
                    </div>

                    <h3 className="text-3xl font-heading text-white mb-3">No Matches Found</h3>
                    <p className="text-zinc-400 mb-8 leading-relaxed">
                        You've swiped through all recommendations. Try updating your preferences or generating new options.
                    </p>

                    <div className="flex flex-col w-full gap-3">
                        <Button
                            variant="outline"
                            className="w-full h-12 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                            onClick={onUpdatePreferences}
                        >
                            <Settings className="w-4 h-4 mr-2" />
                            Update Preferences
                        </Button>

                        <Button
                            className="w-full h-12 bg-white text-black hover:bg-zinc-200"
                            onClick={handleRegenerate}
                            disabled={isRegenerating}
                        >
                            {isRegenerating ? (
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <RefreshCw className="w-4 h-4 mr-2" />
                            )}
                            {isRegenerating ? 'Regenerating...' : 'Regenerate Trips'}
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="relative h-[600px] w-full perspective-1000">
            {/* Next Card (Background) */}
            {nextRec && (
                <div className="absolute top-0 left-0 w-full h-full p-4 scale-95 opacity-50 translate-y-4 -z-10">
                    <div className="w-full h-full rounded-3xl bg-zinc-900 border border-white/5 overflow-hidden relative">
                        <img
                            src={nextRec.image_url || `https://source.unsplash.com/800x600/?${nextRec.destination_name},travel`}
                            alt={nextRec.destination_name}
                            className="w-full h-full object-cover grayscale opacity-50"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                    </div>
                </div>
            )}

            {/* Active Card */}
            <AnimatePresence mode="popLayout">
                <SwipeCard
                    key={activeRec.id}
                    rec={activeRec}
                    onSwipe={(recId, direction) => {
                        if (direction === 'right') {
                            likedCount.current += 1
                        }
                        onSwipe(recId, direction)
                    }}
                    currency={currency}
                    currentUserId={currentUserId}
                    userCostBreakdown={userCostBreakdown}
                    socialProof={socialProof?.[activeRec.id]}
                />
            </AnimatePresence>
        </div>
    )
}

interface SwipeCardProps {
    rec: Recommendation
    onSwipe: (recId: string, direction: 'left' | 'right') => void
    currency: string
    currentUserId: string
    userCostBreakdown?: Record<string, Record<string, number>>
    socialProof?: string[] // List of user names/ids who liked this
}

const SwipeCard = ({
    rec,
    onSwipe,
    currency,
    currentUserId,
    userCostBreakdown,
    socialProof
}: SwipeCardProps) => {
    const [exitX, setExitX] = useState<number>(0)
    const x = useMotionValue(0)
    const scale = useTransform(x, [-150, 0, 150], [0.9, 1, 0.9])
    const rotate = useTransform(x, [-150, 0, 150], [-10, 0, 10])

    // Background color interpolation based on drag
    const overlayColor = useTransform(
        x,
        [-150, 0, 150],
        ['rgba(239, 68, 68, 0.4)', 'rgba(0,0,0,0)', 'rgba(34, 197, 94, 0.4)']
    )

    const handleDragEnd = (event: any, info: any) => {
        if (info.offset.x > 100) {
            // Swiped Right
            triggerSwipe('right')
        } else if (info.offset.x < -100) {
            // Swiped Left
            triggerSwipe('left')
        }
    }

    const triggerSwipe = (direction: 'left' | 'right') => {
        setExitX(direction === 'right' ? 200 : -200)
        // Small delay to allow state to update before unmounting
        setTimeout(() => {
            onSwipe(rec.id, direction)
        }, 50)
    }

    const hasSocialProof = socialProof && socialProof.length > 0

    return (
        <motion.div
            style={{ x, rotate, scale }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0, x: 0 }}
            exit={{ x: exitX, opacity: 0, transition: { duration: 0.2 } }}
            className="absolute top-0 left-0 w-full h-full cursor-grab active:cursor-grabbing"
        >
            <div className="w-full h-full rounded-3xl bg-[#09090b] border border-white/10 overflow-hidden shadow-2xl relative flex flex-col">

                {/* Full Height Image */}
                <div className="absolute inset-0">
                    <img
                        src={rec.image_url || `https://source.unsplash.com/800x600/?${rec.destination_name},travel`}
                        alt={rec.destination_name}
                        className="w-full h-full object-cover"
                    />
                    {/* Scrim Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                    {/* Swipe Feedback Overlay */}
                    <motion.div
                        style={{ backgroundColor: overlayColor }}
                        className="absolute inset-0 pointer-events-none"
                    />
                </div>

                {/* Top Bar */}
                <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
                    {/* Social Proof Badge */}
                    {hasSocialProof ? (
                        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-3 py-1">
                            <div className="flex -space-x-2">
                                {socialProof.slice(0, 3).map((userName, i) => (
                                    <div key={i} className="w-5 h-5 rounded-full bg-zinc-800 border border-black flex items-center justify-center text-[8px] text-white font-medium overflow-hidden">
                                        {generateInitials(userName)}
                                    </div>
                                ))}
                            </div>
                            <span className="text-[10px] font-medium text-zinc-300">
                                {socialProof.length} Friend{socialProof.length > 1 ? 's' : ''} Liked
                            </span>
                        </div>
                    ) : (
                        <div /> /* Spacer */
                    )}

                    {/* Personalized Cost Pill */}
                    <div className="bg-black/40 backdrop-blur-md border border-white/10 text-white rounded-full px-4 py-1 font-mono text-xs flex items-center gap-2 shadow-lg">
                        <span className="text-zinc-400 text-[10px] uppercase tracking-wider">My Cost</span>
                        <span className="font-bold text-emerald-400">
                            {getUserCostDisplay(rec, currentUserId, currency, userCostBreakdown)}
                        </span>
                    </div>
                </div>

                {/* Bottom Content */}
                <div className="absolute bottom-0 left-0 right-0 p-8 z-10">
                    <h2 className="text-4xl font-heading text-white mb-2 leading-tight drop-shadow-lg">
                        {rec.destination_name}
                    </h2>
                    <p className="text-zinc-300 line-clamp-2 text-sm font-light leading-relaxed mb-6 drop-shadow-md">
                        {rec.description}
                    </p>

                    {/* Action Buttons (Alternative to Swipe) */}
                    <div className="flex justify-center gap-6">
                        <button
                            onClick={() => triggerSwipe('left')}
                            className="w-14 h-14 rounded-full border border-white/10 bg-black/40 backdrop-blur-md flex items-center justify-center text-red-400 hover:bg-red-500/20 hover:scale-110 transition-all shadow-lg"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <button
                            onClick={() => triggerSwipe('right')}
                            className="w-14 h-14 rounded-full border border-white/10 bg-black/40 backdrop-blur-md flex items-center justify-center text-green-400 hover:bg-green-500/20 hover:scale-110 transition-all shadow-lg"
                        >
                            <Heart className="w-6 h-6 fill-current" />
                        </button>
                    </div>
                </div>

                {/* Swipe Indicators (Icons that appear when dragging) */}
                <motion.div
                    style={{ opacity: useTransform(x, [50, 150], [0, 1]) }}
                    className="absolute top-1/2 right-8 -translate-y-1/2 border-4 border-green-500 rounded-full p-4 rotate-12 z-20 bg-black/20 backdrop-blur-sm"
                >
                    <Heart className="w-12 h-12 text-green-500 fill-green-500" />
                </motion.div>

                <motion.div
                    style={{ opacity: useTransform(x, [-150, -50], [1, 0]) }}
                    className="absolute top-1/2 left-8 -translate-y-1/2 border-4 border-red-500 rounded-full p-4 -rotate-12 z-20 bg-black/20 backdrop-blur-sm"
                >
                    <X className="w-12 h-12 text-red-500" />
                </motion.div>

            </div>
        </motion.div>
    )
}
