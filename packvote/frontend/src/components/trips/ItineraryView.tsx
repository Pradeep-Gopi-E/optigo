'use client'

import { TripDetail } from '@/lib/api'
import { motion } from 'framer-motion'
import { MapPin, Sun, Moon, Cloud } from 'lucide-react'

interface ItineraryViewProps {
    trip: TripDetail
}

interface ItineraryDay {
    day: number
    focus: string
    morning: string
    afternoon: string
    evening: string
}

export const ItineraryView = ({ trip }: ItineraryViewProps) => {
    // Parse itinerary data safely
    let itinerary: ItineraryDay[] = []
    console.log('ItineraryView trip:', trip)
    console.log('ItineraryView trip.itinerary:', trip.itinerary)
    console.log('Type of trip.itinerary:', typeof trip.itinerary)

    try {
        if (typeof trip.itinerary === 'string') {
            itinerary = JSON.parse(trip.itinerary)
        } else if (Array.isArray(trip.itinerary)) {
            itinerary = trip.itinerary as unknown as ItineraryDay[]
        }
    } catch (e) {
        console.error("Failed to parse itinerary", e)
    }

    // Loading/Empty State
    if (!itinerary || itinerary.length === 0) {
        return (
            <div className="max-w-4xl mx-auto py-12 px-6">
                <div className="flex flex-col items-center justify-center py-24 text-center space-y-6">
                    <div className="relative w-24 h-24">
                        <div className="absolute inset-0 rounded-full border-t-2 border-emerald-500 animate-spin"></div>
                        <div className="absolute inset-2 rounded-full border-r-2 border-emerald-500/50 animate-spin-slow"></div>
                        <MapPin className="absolute inset-0 m-auto w-8 h-8 text-emerald-500" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-heading text-white mb-2">Generating Itinerary...</h3>
                        <p className="text-zinc-500 max-w-md mx-auto">
                            Our AI is crafting the perfect day-by-day plan for {trip.destination}. This might take a moment.
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto px-6 py-12">
            <div className="relative">
                {/* Vertical Line */}
                <div className="absolute left-8 md:left-8 top-0 bottom-0 w-px bg-white/10" />

                <div className="space-y-12">
                    {itinerary.map((day, index) => (
                        <motion.div
                            key={day.day}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="relative pl-24"
                        >
                            {/* Sticky Day Header */}
                            <div className="absolute left-0 top-0 flex flex-col items-center sticky top-24 z-20">
                                <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.1)] mb-2">
                                    <div className="text-center">
                                        <span className="block text-[10px] text-zinc-500 uppercase tracking-wider">Day</span>
                                        <span className="font-heading text-2xl text-emerald-400">{day.day}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Content Card */}
                            <div className="group relative">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-3xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
                                <div className="relative bg-zinc-900/50 backdrop-blur-md border border-white/5 rounded-3xl p-8 hover:border-white/10 transition-colors">

                                    {/* Header */}
                                    <div className="mb-8 border-b border-white/5 pb-6">
                                        <h3 className="text-2xl font-heading text-white mb-2">{day.focus}</h3>
                                        <div className="h-1 w-20 bg-gradient-to-r from-emerald-500 to-transparent rounded-full" />
                                    </div>

                                    {/* Activities Grid */}
                                    <div className="grid gap-8">
                                        {/* Morning */}
                                        <div className="flex gap-4 items-start group/item">
                                            <div className="mt-1 p-2 rounded-lg bg-orange-500/10 text-orange-400 group-hover/item:bg-orange-500/20 transition-colors">
                                                <Sun className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-2">Morning</h4>
                                                <p className="text-zinc-200 leading-relaxed text-lg font-light">{day.morning}</p>
                                            </div>
                                        </div>

                                        {/* Afternoon */}
                                        <div className="flex gap-4 items-start group/item">
                                            <div className="mt-1 p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover/item:bg-blue-500/20 transition-colors">
                                                <Cloud className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-2">Afternoon</h4>
                                                <p className="text-zinc-200 leading-relaxed text-lg font-light">{day.afternoon}</p>
                                            </div>
                                        </div>

                                        {/* Evening */}
                                        <div className="flex gap-4 items-start group/item">
                                            <div className="mt-1 p-2 rounded-lg bg-purple-500/10 text-purple-400 group-hover/item:bg-purple-500/20 transition-colors">
                                                <Moon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-2">Evening</h4>
                                                <p className="text-zinc-200 leading-relaxed text-lg font-light">{day.evening}</p>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    )
}
