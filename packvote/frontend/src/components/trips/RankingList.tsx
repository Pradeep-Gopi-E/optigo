'use client'

import { useState, useEffect } from 'react'
import { Reorder, useDragControls, motion } from 'framer-motion'
import { Recommendation } from '@/lib/api'
import { GripVertical, X, DollarSign, MapPin, Loader2 } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { getUserCost } from '@/lib/voting-utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface RankingListProps {
    items: Recommendation[]
    onReorder: (newOrder: Recommendation[]) => void
    onRemove: (id: string) => void
    currency: string
    onSubmit: (finalOrder: Recommendation[]) => void
    isSubmitting: boolean
    currentUserId: string
    userCostBreakdown?: Record<string, Record<string, number>>
}

export const RankingList = ({
    items,
    onReorder,
    onRemove,
    currency,
    onSubmit,
    isSubmitting,
    currentUserId,
    userCostBreakdown
}: RankingListProps) => {
    // Local state to handle immediate updates for smoothness
    const [list, setList] = useState(items)

    useEffect(() => {
        setList(items)
    }, [items])

    const handleReorder = (newList: Recommendation[]) => {
        setList(newList)
        onReorder(newList)
    }

    if (items.length === 0) {
        return (
            <div className="text-center py-12 text-zinc-500">
                <p>No favorites yet. Swipe right on some cards to add them here!</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full">
            <Reorder.Group axis="y" values={list} onReorder={handleReorder} className="space-y-3 w-full max-w-md mx-auto flex-1 overflow-y-auto pr-2 custom-scrollbar pb-20">
                {list.map((item, index) => (
                    <Reorder.Item
                        key={item.id}
                        value={item}
                        whileDrag={{ scale: 1.05, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" }}
                        className="relative"
                    >
                        <RankingItem
                            item={item}
                            index={index}
                            onRemove={() => onRemove(item.id)}
                            currency={currency}
                            currentUserId={currentUserId}
                            userCostBreakdown={userCostBreakdown}
                        />
                    </Reorder.Item>
                ))}
            </Reorder.Group>

            {/* Submit Button Area */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#09090b] via-[#09090b] to-transparent z-20 flex justify-center">
                <Button
                    size="lg"
                    className="rounded-full px-8 bg-white text-black hover:bg-zinc-200 shadow-xl w-full max-w-xs"
                    onClick={() => onSubmit(list)}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Submit Ranking
                </Button>
            </div>
        </div>
    )
}

const RankingItem = ({
    item,
    index,
    onRemove,
    currency,
    currentUserId,
    userCostBreakdown
}: {
    item: Recommendation,
    index: number,
    onRemove: () => void,
    currency: string,
    currentUserId: string,
    userCostBreakdown?: Record<string, Record<string, number>>
}) => {
    const controls = useDragControls()



    return (
        <div className="relative group bg-zinc-900/80 backdrop-blur-sm border border-white/5 rounded-xl p-3 flex items-center gap-4 select-none hover:border-white/10 transition-colors shadow-sm">
            {/* Drag Handle & Rank */}
            <div className="flex items-center gap-3 pl-1">
                <div
                    className="cursor-grab active:cursor-grabbing p-1 text-zinc-600 hover:text-zinc-400"
                    onPointerDown={(e) => controls.start(e)}
                >
                    <GripVertical className="w-5 h-5" />
                </div>
                <div className="w-6 text-center font-heading text-xl text-white font-bold">
                    {index + 1}
                </div>
            </div>

            {/* Thumbnail */}
            <div className="flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden bg-zinc-800 border border-white/5 relative">
                <img
                    src={item.image_url || `https://source.unsplash.com/100x100/?${item.destination_name},travel`}
                    alt={item.destination_name}
                    className="w-full h-full object-cover"
                />
            </div>

            {/* Info */}
            <div className="flex-grow min-w-0 flex flex-col justify-center">
                <h4 className="text-zinc-200 font-medium truncate text-sm">{item.destination_name}</h4>
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                    {(item as any).match_score && (
                        <span className="text-emerald-500 font-medium">{(item as any).match_score}% Match</span>
                    )}
                </div>
            </div>

            {/* Cost Pill */}
            <div className="flex-shrink-0">
                <div className="bg-black/40 border border-white/5 rounded-lg px-2 py-1 flex flex-col items-end">
                    <span className="text-[8px] text-zinc-500 uppercase tracking-wider">My Cost</span>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                        {formatCurrency(getUserCost(item, currentUserId, userCostBreakdown), currency)}
                    </span>
                </div>
            </div>

            {/* Remove Button */}
            <button
                onClick={onRemove}
                className="absolute -top-2 -right-2 bg-zinc-800 border border-white/10 rounded-full p-1 text-zinc-400 hover:text-red-400 hover:bg-zinc-700 transition-all opacity-0 group-hover:opacity-100 shadow-lg"
            >
                <X className="w-3 h-3" />
            </button>
        </div>
    )
}
