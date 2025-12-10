import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MapPin, Calendar, DollarSign, Utensils, CloudSun, Sparkles, Clock, Plane, Info, ArrowRight } from 'lucide-react'
import { Recommendation } from '@/lib/api'
import { formatCurrency, cn, generateInitials } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface TripDetailSheetProps {
    isOpen: boolean
    onClose: () => void
    recommendation: Recommendation | null
    currency?: string
    participants?: any[]
}

export default function TripDetailSheet({ isOpen, onClose, recommendation, currency = 'USD', participants = [] }: TripDetailSheetProps) {
    const [activeTab, setActiveTab] = useState<'overview' | 'itinerary' | 'expenses' | 'dining'>('overview')

    // Prevent body scroll when sheet is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isOpen])

    if (!recommendation) return null

    const tabs = [
        { id: 'overview', label: 'Overview' },
        { id: 'itinerary', label: 'Itinerary' },
        { id: 'expenses', label: 'Expenses' },
        { id: 'dining', label: 'Dining' }
    ]

    const costBreakdown = recommendation.meta?.cost_breakdown || {}
    const itinerary = recommendation.meta?.itinerary || []
    const dining = recommendation.meta?.dining_recommendations || []

    // Helper to get user name from ID
    const getUserName = (userId: string) => {
        const participant = participants.find(p => p.user_id === userId || p.id === userId)
        return participant ? participant.user_name : userId
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Sheet */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed inset-y-0 right-0 z-50 w-full md:w-[85%] lg:w-[70%] xl:w-[60%] bg-[#09090b] border-l border-white/10 shadow-2xl flex flex-col overflow-hidden"
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 z-20 p-2 rounded-full bg-black/20 text-white/70 hover:text-white hover:bg-black/40 backdrop-blur-md transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        {/* Header / Hero */}
                        <div className="relative h-[40vh] min-h-[300px] w-full shrink-0">
                            <img
                                src={recommendation.image_url || `https://source.unsplash.com/1600x900/?${recommendation.destination_name},travel`}
                                alt={recommendation.destination_name}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/20 to-transparent" />

                            <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <div className="flex items-center gap-3 mb-4">
                                        {recommendation.ai_generated && (
                                            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 backdrop-blur-md px-3 py-1">
                                                <Sparkles className="w-3 h-3 mr-2" /> AI Recommended
                                            </Badge>
                                        )}
                                        <Badge variant="outline" className="border-white/20 text-zinc-300 backdrop-blur-md">
                                            {recommendation.meta?.experience_type || 'Travel'}
                                        </Badge>
                                    </div>
                                    <h2 className="text-5xl md:text-7xl font-heading text-white mb-4 tracking-tight leading-none">
                                        {recommendation.destination_name}
                                    </h2>
                                    <div className="flex items-center gap-2 text-xl md:text-2xl text-zinc-300 font-light">
                                        <span className="font-heading italic">Est. Total</span>
                                        <span className="font-medium text-emerald-400">
                                            {formatCurrency(recommendation.estimated_cost, currency)}
                                        </span>
                                        <span className="text-sm text-zinc-500 ml-2">per person</span>
                                    </div>
                                </motion.div>
                            </div>
                        </div>

                        {/* Sticky Tabs */}
                        <div className="sticky top-0 z-10 bg-[#09090b]/80 backdrop-blur-xl border-b border-white/5">
                            <div className="flex items-center gap-8 px-8 md:px-12 overflow-x-auto no-scrollbar">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={cn(
                                            "relative py-6 text-sm font-medium tracking-widest uppercase transition-colors whitespace-nowrap",
                                            activeTab === tab.id ? "text-white" : "text-zinc-500 hover:text-zinc-300"
                                        )}
                                    >
                                        {tab.label}
                                        {activeTab === tab.id && (
                                            <motion.div
                                                layoutId="activeSheetTab"
                                                className="absolute bottom-0 left-0 right-0 h-[2px] bg-white"
                                            />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto p-8 md:p-12">
                            <AnimatePresence mode="wait">
                                {activeTab === 'overview' && (
                                    <motion.div
                                        key="overview"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="max-w-4xl space-y-12"
                                    >
                                        {/* Match Reason */}
                                        {recommendation.meta?.match_reason && (
                                            <blockquote className="pl-6 border-l-2 border-purple-500/50 text-xl md:text-2xl font-heading text-zinc-200 italic leading-relaxed">
                                                "{recommendation.meta.match_reason}"
                                            </blockquote>
                                        )}

                                        {/* Description */}
                                        <div className="text-zinc-400 leading-relaxed text-lg">
                                            {recommendation.description}
                                        </div>

                                        {/* Highlights */}
                                        <div className="space-y-4">
                                            <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-widest">Highlights</h3>
                                            <div className="flex flex-wrap gap-3">
                                                {recommendation.activities?.map((activity, i) => (
                                                    <span key={i} className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-zinc-300 text-sm hover:bg-white/10 transition-colors">
                                                        {activity}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Weather Widget */}
                                        {recommendation.weather_info && (
                                            <div className="inline-flex items-start gap-4 p-6 rounded-2xl bg-blue-500/5 border border-blue-500/10 max-w-md">
                                                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
                                                    <CloudSun className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h4 className="text-blue-300 font-heading text-lg mb-1">Weather Forecast</h4>
                                                    <p className="text-blue-200/70 text-sm leading-relaxed">
                                                        {recommendation.weather_info}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                )}

                                {activeTab === 'itinerary' && (
                                    <motion.div
                                        key="itinerary"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="max-w-3xl"
                                    >
                                        {itinerary.length > 0 ? (
                                            <div className="relative border-l border-white/10 ml-4 md:ml-6 space-y-12 pb-12">
                                                {itinerary.map((day: any, idx: number) => (
                                                    <div key={idx} className="relative pl-8 md:pl-12">
                                                        {/* Timeline Dot */}
                                                        <div className="absolute -left-[5px] top-2 w-[9px] h-[9px] rounded-full bg-zinc-800 border border-zinc-600" />

                                                        <div className="space-y-6">
                                                            <div>
                                                                <span className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-1 block">Day {day.day}</span>
                                                                <h3 className="text-2xl font-heading text-white">{day.focus}</h3>
                                                            </div>

                                                            <div className="space-y-4">
                                                                {['morning', 'afternoon', 'evening'].map((time) => {
                                                                    if (!day[time]) return null
                                                                    const Icon = time === 'morning' ? CloudSun : time === 'afternoon' ? MapPin : Sparkles
                                                                    const colorClass = time === 'morning' ? 'text-orange-400' : time === 'afternoon' ? 'text-blue-400' : 'text-indigo-400'

                                                                    return (
                                                                        <div key={time} className="group p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                                                            <div className="flex items-start gap-4">
                                                                                <div className={`mt-1 ${colorClass}`}>
                                                                                    <Icon className="w-5 h-5" />
                                                                                </div>
                                                                                <div>
                                                                                    <span className={`text-xs font-bold uppercase tracking-wider block mb-2 ${colorClass}`}>
                                                                                        {time}
                                                                                    </span>
                                                                                    <p className="text-zinc-300 text-sm leading-relaxed">
                                                                                        {day[time]}
                                                                                    </p>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )
                                                                })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-24 text-zinc-600">
                                                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                                <p>No detailed itinerary available.</p>
                                            </div>
                                        )}
                                    </motion.div>
                                )}

                                {activeTab === 'expenses' && (
                                    <motion.div
                                        key="expenses"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="max-w-2xl"
                                    >
                                        <div className="bg-zinc-900/50 rounded-3xl border border-white/5 overflow-hidden">
                                            <div className="p-6 border-b border-white/5">
                                                <h3 className="text-xl font-heading text-white">Estimated Cost Breakdown</h3>
                                                <p className="text-zinc-500 text-sm mt-1">Projected expenses per person based on current rates.</p>
                                            </div>
                                            <div className="divide-y divide-white/5">
                                                {Object.entries(costBreakdown).map(([userId, costData]: [string, any], idx) => {
                                                    // Handle both old format (string) and new format (object)
                                                    const amountDisplay = (costData && typeof costData === 'object' && 'display_string' in costData)
                                                        ? costData.display_string
                                                        : costData
                                                    const userName = getUserName(userId)

                                                    return (
                                                        <div key={idx} className="flex items-center justify-between p-6 hover:bg-white/5 transition-colors">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 font-heading border border-white/10">
                                                                    {generateInitials(userName)}
                                                                </div>
                                                                <span className="text-zinc-200 font-medium">{userName}</span>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-emerald-400 font-mono font-medium">
                                                                    {amountDisplay}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                                {Object.keys(costBreakdown).length === 0 && (
                                                    <div className="p-12 text-center text-zinc-600">
                                                        No breakdown available.
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-6 bg-white/5 flex justify-between items-center">
                                                <span className="text-zinc-400 font-medium">Total Estimated</span>
                                                <span className="text-2xl font-heading text-white">
                                                    {formatCurrency(recommendation.estimated_cost, currency)}
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {activeTab === 'dining' && (
                                    <motion.div
                                        key="dining"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="grid grid-cols-1 md:grid-cols-2 gap-6"
                                    >
                                        {dining.map((place: any, idx: number) => (
                                            <div key={idx} className="group p-6 rounded-3xl bg-zinc-900/50 border border-white/5 hover:bg-zinc-900 hover:border-white/10 transition-all">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="p-3 rounded-xl bg-zinc-800 text-zinc-400 group-hover:bg-zinc-700 group-hover:text-white transition-colors">
                                                        <Utensils className="w-5 h-5" />
                                                    </div>
                                                    <Badge variant="outline" className="border-white/10 text-zinc-500">
                                                        {place.price_range}
                                                    </Badge>
                                                </div>
                                                <h4 className="text-xl font-heading text-white mb-2">{place.name}</h4>
                                                <div className="text-sm text-zinc-500 mb-4 font-medium uppercase tracking-wider">{place.cuisine}</div>
                                                <p className="text-zinc-400 leading-relaxed text-sm">
                                                    {place.description}
                                                </p>
                                            </div>
                                        ))}
                                        {dining.length === 0 && (
                                            <div className="col-span-full text-center py-24 text-zinc-600">
                                                <Utensils className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                                <p>No dining recommendations available.</p>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
