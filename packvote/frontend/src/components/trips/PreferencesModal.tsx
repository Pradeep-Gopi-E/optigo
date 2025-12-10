'use client'

import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Button } from '../ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Loader2, X, Check, Plus, Minus, Palmtree, Mountain, PartyPopper, Heart, Landmark, Leaf, Wifi, Waves, Car, Coffee, Dumbbell, Dog, Eye, Utensils, WheatOff, Beef, FishOff, Info } from 'lucide-react'
import toast from 'react-hot-toast'
import { preferencesAPI, Preference } from '@/lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import { cn, formatCurrency } from '@/lib/utils'

interface PreferencesModalProps {
    isOpen: boolean
    onClose: () => void
    tripId: string
    currentPreferences: Preference | null
    onSuccess: () => void
}

const VIBE_OPTIONS = [
    { id: 'Relaxing', icon: Palmtree, color: 'from-blue-500/20 to-cyan-500/20' },
    { id: 'Adventure', icon: Mountain, color: 'from-orange-500/20 to-red-500/20' },
    { id: 'Party', icon: PartyPopper, color: 'from-purple-500/20 to-pink-500/20' },
    { id: 'Romantic', icon: Heart, color: 'from-rose-500/20 to-pink-500/20' },
    { id: 'Cultural', icon: Landmark, color: 'from-amber-500/20 to-yellow-500/20' },
    { id: 'Nature', icon: Leaf, color: 'from-green-500/20 to-emerald-500/20' },
]

const AMENITIES_OPTIONS = ['WiFi', 'Pool', 'Parking', 'Breakfast', 'Gym', 'Pet Friendly', 'Ocean View', 'Kitchen', 'Spa', 'Balcony']

const ACTIVITY_TAGS = [
    'Hiking', 'Museums', 'Nightlife', 'Food Tours', 'Shopping', 'Scuba', 'History',
    'Photography', 'Relaxation', 'Road Trips', 'Wildlife', 'Art', 'Music'
]

const DIETARY_OPTIONS = [
    { id: 'Vegan', icon: Leaf },
    { id: 'Vegetarian', icon: Utensils }, // Using Utensils as generic food/veg
    { id: 'Gluten-Free', icon: WheatOff },
    { id: 'Halal', icon: Beef }, // Using Beef as generic meat/halal indicator
    { id: 'Seafood Allergy', icon: FishOff, warning: true },
]

export default function PreferencesModal({
    isOpen,
    onClose,
    tripId,
    currentPreferences,
    onSuccess
}: PreferencesModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [activeTab, setActiveTab] = useState<'vibe' | 'stay' | 'activities' | 'details'>('vibe')

    // Form State
    const [vibe, setVibe] = useState<string[]>([])
    const [customVibe, setCustomVibe] = useState('')
    const [isCustomVibeActive, setIsCustomVibeActive] = useState(false)

    const [amenities, setAmenities] = useState<string[]>([])
    const [accommodationType, setAccommodationType] = useState<string>('hotel') // Default
    const [targetBudget, setTargetBudget] = useState<string>('') // Stored as string for input handling

    const [activities, setActivities] = useState<string[]>([]) // General/Must-Do
    const [avoidActivities, setAvoidActivities] = useState<string[]>([])

    const [dietary, setDietary] = useState<string[]>([])
    const [duration, setDuration] = useState<number>(5)
    const [tripDescription, setTripDescription] = useState('')

    const customVibeInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (currentPreferences?.preference_data) {
            const data = currentPreferences.preference_data
            setVibe(data.vibe || [])
            setAmenities(data.accommodation_amenities || [])
            setAccommodationType(data.accommodation_type || 'hotel')
            setTargetBudget(data.target_budget?.toString() || '')
            setActivities(data.activities || [])
            setAvoidActivities(data.avoid_activities || [])
            setDietary(data.dietary_restrictions || [])
            setDuration(data.duration_days || 5)
            setTripDescription(data.trip_description || '')
        }
    }, [currentPreferences, isOpen])

    useEffect(() => {
        if (isCustomVibeActive && customVibeInputRef.current) {
            customVibeInputRef.current.focus()
        }
    }, [isCustomVibeActive])

    const handleVibeToggle = (id: string) => {
        setVibe(prev => prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id])
    }

    const handleCustomVibeSubmit = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && customVibe.trim()) {
            e.preventDefault()
            setVibe(prev => [...prev, customVibe.trim()])
            setCustomVibe('')
            setIsCustomVibeActive(false)
        }
    }

    const handleAmenityToggle = (amenity: string) => {
        setAmenities(prev => prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity])
    }

    const handleActivityToggle = (activity: string, type: 'general' | 'avoid') => {
        if (type === 'general') {
            // If in avoid, remove from avoid first
            if (avoidActivities.includes(activity)) {
                setAvoidActivities(prev => prev.filter(a => a !== activity))
            }
            setActivities(prev => prev.includes(activity) ? prev.filter(a => a !== activity) : [...prev, activity])
        } else {
            // If in general, remove from general first
            if (activities.includes(activity)) {
                setActivities(prev => prev.filter(a => a !== activity))
            }
            setAvoidActivities(prev => prev.includes(activity) ? prev.filter(a => a !== activity) : [...prev, activity])
        }
    }

    const handleDietaryToggle = (id: string) => {
        setDietary(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id])
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const payload = {
                preference_type: 'detailed',
                preference_data: {
                    vibe,
                    accommodation_type: accommodationType,
                    accommodation_amenities: amenities,
                    target_budget: targetBudget ? parseInt(targetBudget) : undefined,
                    activities, // Combined General & Must-Have for now as per UI simplification, or we can split if needed. 
                    // The prompt asked for "General & Must-Do" as one section and "Avoid" as another.
                    // I'll map 'activities' to both 'activities' and 'must_have_activities' in backend if needed, 
                    // but for now 'activities' covers interests.
                    must_have_activities: activities, // Mapping same list to must-have for stronger weighting
                    avoid_activities: avoidActivities,
                    dietary_restrictions: dietary,
                    duration_days: duration,
                    trip_description: tripDescription
                }
            }

            await preferencesAPI.createPreference(tripId, payload)
            toast.success('Preferences updated')
            onSuccess()
            onClose()
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to update preferences')
        } finally {
            setIsLoading(false)
        }
    }

    const tabVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as any } },
        exit: { opacity: 0, y: -10, transition: { duration: 0.2, ease: "easeIn" as any } }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[700px] bg-[#09090b] border-zinc-800 text-zinc-50 p-0 overflow-hidden gap-0 duration-300 ease-out">
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-zinc-900/50 backdrop-blur-xl">
                    <DialogTitle className="text-2xl font-heading tracking-tight">Curate Your Trip</DialogTitle>
                    <DialogClose className="rounded-full p-2 hover:bg-white/10 transition-colors">
                        <X className="w-4 h-4" />
                    </DialogClose>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col h-[80vh] sm:h-[600px]">
                    {/* Tabs Navigation */}
                    <div className="px-6 pt-6 pb-2">
                        <div className="flex p-1 bg-zinc-900/80 rounded-full border border-white/5 relative">
                            {['vibe', 'stay', 'activities', 'details'].map((tab) => (
                                <button
                                    key={tab}
                                    type="button"
                                    onClick={() => setActiveTab(tab as any)}
                                    className={cn(
                                        "flex-1 relative py-2 text-xs sm:text-sm font-medium rounded-full transition-all duration-300 z-10 capitalize",
                                        activeTab === tab ? "text-black" : "text-zinc-500 hover:text-zinc-300"
                                    )}
                                >
                                    {tab}
                                    {activeTab === tab && (
                                        <motion.div
                                            layoutId="activeTabPill"
                                            className="absolute inset-0 bg-white rounded-full -z-10 shadow-lg"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
                        <AnimatePresence mode="wait">
                            {activeTab === 'vibe' && (
                                <motion.div
                                    key="vibe"
                                    variants={tabVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    className="space-y-8"
                                >
                                    <div className="text-center space-y-2">
                                        <h3 className="text-3xl font-heading">What is the vibe?</h3>
                                        <p className="text-zinc-500 text-sm">Select all that apply to your ideal getaway.</p>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                        {VIBE_OPTIONS.map((option) => {
                                            const isSelected = vibe.includes(option.id)
                                            const Icon = option.icon
                                            return (
                                                <motion.button
                                                    key={option.id}
                                                    type="button"
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => handleVibeToggle(option.id)}
                                                    className={cn(
                                                        "aspect-square rounded-3xl flex flex-col items-center justify-center gap-3 border transition-all duration-300 relative overflow-hidden group",
                                                        isSelected
                                                            ? "border-white bg-zinc-900 shadow-[0_0_30px_-10px_rgba(255,255,255,0.3)]"
                                                            : "border-white/5 bg-zinc-900/30 hover:bg-zinc-900/50 hover:border-white/10"
                                                    )}
                                                >
                                                    <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-500", option.color, isSelected && "opacity-100")} />
                                                    <Icon className={cn("w-8 h-8 z-10 transition-colors", isSelected ? "text-white" : "text-zinc-500 group-hover:text-zinc-300")} />
                                                    <span className={cn("text-sm font-medium z-10 transition-colors", isSelected ? "text-white" : "text-zinc-500 group-hover:text-zinc-300")}>{option.id}</span>
                                                </motion.button>
                                            )
                                        })}

                                        {/* Custom Option */}
                                        <motion.div
                                            whileTap={!isCustomVibeActive ? { scale: 0.95 } : {}}
                                            onClick={() => setIsCustomVibeActive(true)}
                                            className={cn(
                                                "aspect-square rounded-3xl flex flex-col items-center justify-center border transition-all duration-300 relative overflow-hidden cursor-pointer",
                                                isCustomVibeActive || customVibe
                                                    ? "border-white bg-zinc-900"
                                                    : "border-white/5 bg-zinc-900/30 hover:bg-zinc-900/50 hover:border-white/10"
                                            )}
                                        >
                                            {isCustomVibeActive ? (
                                                <div className="w-full px-4">
                                                    <Input
                                                        ref={customVibeInputRef}
                                                        value={customVibe}
                                                        onChange={(e) => {
                                                            if (!e.target.value.includes(' ')) {
                                                                setCustomVibe(e.target.value)
                                                            }
                                                        }}
                                                        onKeyDown={handleCustomVibeSubmit}
                                                        onBlur={() => {
                                                            if (!customVibe) setIsCustomVibeActive(false)
                                                        }}
                                                        placeholder="One word..."
                                                        className="bg-transparent border-none text-center text-lg focus-visible:ring-0 p-0 placeholder:text-zinc-600"
                                                    />
                                                    <p className="text-[10px] text-zinc-500 text-center mt-2">Press Enter</p>
                                                </div>
                                            ) : (
                                                <>
                                                    <Plus className="w-8 h-8 text-zinc-600 mb-2" />
                                                    <span className="text-sm font-medium text-zinc-500">Custom</span>
                                                </>
                                            )}
                                        </motion.div>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'stay' && (
                                <motion.div
                                    key="stay"
                                    variants={tabVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    className="space-y-10"
                                >
                                    {/* Budget Section */}
                                    <div className="space-y-4 text-center">
                                        <h3 className="text-3xl font-heading">Target Budget</h3>
                                        <div className="relative max-w-xs mx-auto">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-4xl font-light text-zinc-500">$</span>
                                            <Input
                                                type="number"
                                                value={targetBudget}
                                                onChange={(e) => setTargetBudget(e.target.value)}
                                                placeholder="0"
                                                className="h-24 text-6xl font-light text-center bg-transparent border-none focus-visible:ring-0 placeholder:text-zinc-800"
                                            />
                                            <p className="text-sm text-zinc-500 uppercase tracking-widest mt-2">Per Person</p>
                                        </div>
                                    </div>

                                    {/* Amenities Section */}
                                    <div className="space-y-4">
                                        <h3 className="text-xl font-heading text-center">Must-Have Amenities</h3>
                                        <div className="flex flex-wrap justify-center gap-3">
                                            {AMENITIES_OPTIONS.map((amenity) => {
                                                const isSelected = amenities.includes(amenity)
                                                return (
                                                    <motion.button
                                                        key={amenity}
                                                        type="button"
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => handleAmenityToggle(amenity)}
                                                        className={cn(
                                                            "px-4 py-2 rounded-full text-sm transition-all duration-200 border",
                                                            isSelected
                                                                ? "bg-white text-black border-white"
                                                                : "bg-white/5 text-zinc-400 border-white/5 hover:bg-white/10"
                                                        )}
                                                    >
                                                        {amenity}
                                                    </motion.button>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    {/* Accommodation Type */}
                                    <div className="space-y-4">
                                        <h3 className="text-xl font-heading text-center">Accommodation Style</h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            {['Hotel', 'Airbnb', 'Resort', 'Hostel'].map((type) => (
                                                <button
                                                    key={type}
                                                    type="button"
                                                    onClick={() => setAccommodationType(type.toLowerCase())}
                                                    className={cn(
                                                        "p-4 rounded-2xl border text-left transition-all",
                                                        accommodationType === type.toLowerCase()
                                                            ? "bg-zinc-800 border-zinc-600 text-white"
                                                            : "bg-zinc-900/50 border-white/5 text-zinc-500 hover:bg-zinc-900"
                                                    )}
                                                >
                                                    <span className="block text-sm font-medium">{type}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'activities' && (
                                <motion.div
                                    key="activities"
                                    variants={tabVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    className="space-y-8"
                                >
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-xl font-heading">Interests & Must-Dos</h3>
                                            <span className="text-xs text-zinc-500">Select to include</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {ACTIVITY_TAGS.map((tag) => {
                                                const isSelected = activities.includes(tag)
                                                const isAvoided = avoidActivities.includes(tag)
                                                if (isAvoided) return null // Don't show in general if avoided
                                                return (
                                                    <motion.button
                                                        key={tag}
                                                        type="button"
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => handleActivityToggle(tag, 'general')}
                                                        className={cn(
                                                            "px-4 py-2 rounded-xl text-sm border transition-all duration-200",
                                                            isSelected
                                                                ? "bg-zinc-100 text-zinc-900 border-zinc-100 font-medium"
                                                                : "bg-zinc-900/50 text-zinc-400 border-white/5 hover:border-white/20"
                                                        )}
                                                    >
                                                        {tag}
                                                    </motion.button>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-4 border-t border-white/5">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-xl font-heading text-red-400/90">The Red Zone (Avoid)</h3>
                                            <span className="text-xs text-zinc-500">Select to exclude</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {ACTIVITY_TAGS.map((tag) => {
                                                const isSelected = avoidActivities.includes(tag)
                                                const isGeneral = activities.includes(tag)
                                                if (isGeneral) return null // Don't show in avoid if general
                                                return (
                                                    <motion.button
                                                        key={tag}
                                                        type="button"
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => handleActivityToggle(tag, 'avoid')}
                                                        className={cn(
                                                            "px-4 py-2 rounded-xl text-sm border transition-all duration-200",
                                                            isSelected
                                                                ? "bg-red-950/30 text-red-400 border-red-900/50"
                                                                : "bg-zinc-900/30 text-zinc-500 border-white/5 hover:border-red-900/30 hover:text-red-400/50"
                                                        )}
                                                    >
                                                        {tag}
                                                    </motion.button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'details' && (
                                <motion.div
                                    key="details"
                                    variants={tabVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    className="space-y-10"
                                >
                                    {/* Dietary */}
                                    <div className="space-y-4">
                                        <h3 className="text-xl font-heading">Dietary Restrictions</h3>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                            {DIETARY_OPTIONS.map((option) => {
                                                const isSelected = dietary.includes(option.id)
                                                const Icon = option.icon
                                                return (
                                                    <motion.button
                                                        key={option.id}
                                                        type="button"
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => handleDietaryToggle(option.id)}
                                                        className={cn(
                                                            "flex items-center gap-3 p-3 rounded-2xl border transition-all duration-200",
                                                            isSelected
                                                                ? option.warning
                                                                    ? "bg-amber-950/30 border-amber-900/50 text-amber-400"
                                                                    : "bg-zinc-800 border-zinc-600 text-white"
                                                                : "bg-zinc-900/50 border-white/5 text-zinc-500 hover:bg-zinc-900"
                                                        )}
                                                    >
                                                        <Icon className="w-5 h-5" />
                                                        <span className="text-sm">{option.id}</span>
                                                    </motion.button>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    {/* Duration */}
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-xl font-heading">Trip Duration</h3>
                                            <span className="text-2xl font-light">{duration} Days</span>
                                        </div>
                                        <div className="px-2">
                                            <Slider
                                                value={[duration]}
                                                onValueChange={(val) => setDuration(val[0])}
                                                min={1}
                                                max={30}
                                                step={1}
                                                className="py-4"
                                            />
                                            <div className="flex justify-between text-xs text-zinc-600 mt-2">
                                                <span>1 Day</span>
                                                <span>2 Weeks</span>
                                                <span>1 Month</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Notes */}
                                    <div className="space-y-4">
                                        <h3 className="text-xl font-heading">Vision Board (Notes)</h3>
                                        <Textarea
                                            value={tripDescription}
                                            onChange={(e) => setTripDescription(e.target.value)}
                                            placeholder="Describe your perfect trip in your own words..."
                                            className="bg-zinc-900/50 border-white/5 focus:border-white/10 min-h-[120px] resize-none text-zinc-300 placeholder:text-zinc-700"
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-white/5 bg-zinc-900/50 backdrop-blur-xl flex justify-between items-center">
                        <Button type="button" variant="ghost" onClick={onClose} className="text-zinc-500 hover:text-white">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading} className="bg-white text-black hover:bg-zinc-200 rounded-full px-8">
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Preferences
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
