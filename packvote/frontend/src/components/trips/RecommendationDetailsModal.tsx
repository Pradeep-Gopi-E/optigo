import { useState, useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from '@/components/ui/badge'
import { Button } from '../ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Recommendation, recommendationsAPI } from '@/lib/api'
import { formatCurrency, convertCurrency } from '@/lib/utils'
import { DollarSign, Sparkles, CloudSun, X, Clock, MapPin, Calendar, Utensils, Hotel, Edit2, Save, Check, User, Plane } from 'lucide-react'
import toast from 'react-hot-toast'


interface RecommendationDetailsModalProps {
    isOpen: boolean
    onClose: () => void
    recommendation: Recommendation | null
    userCurrency: string
    tripId: string
    isOwnerOrAdmin: boolean
    onUpdate?: () => void
    participants?: any[]
}

export default function RecommendationDetailsModal({
    isOpen,
    onClose,
    recommendation,
    userCurrency,
    tripId,
    isOwnerOrAdmin,
    onUpdate,
    participants = []
}: RecommendationDetailsModalProps) {
    // ... (keep existing state and effects)

    // Helper to get user name from ID
    const getUserName = (userId: string) => {
        const participant = participants.find(p => p.user_id === userId || p.id === userId)
        return participant ? participant.user_name : userId
    }

    // ... (keep existing render logic until cost breakdown)


    const [activeTab, setActiveTab] = useState("overview")
    const [isEditing, setIsEditing] = useState(false)
    const [editForm, setEditForm] = useState<Partial<Recommendation>>({})
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        if (recommendation) {
            setEditForm({
                destination_name: recommendation.destination_name,
                description: recommendation.description,
                estimated_cost: recommendation.estimated_cost,
                activities: recommendation.activities,
                accommodation_options: recommendation.accommodation_options,
                meta: recommendation.meta
            })
        }
    }, [recommendation])

    if (!recommendation) return null

    // Use currency from AI recommendation if available, otherwise default to USD
    const baseCurrency = recommendation.meta?.currency || 'USD'

    // Helper to convert any cost string/number to user's currency
    const getConvertedCost = (cost: string | number | undefined | null) => {
        if (!cost) return null
        // If it's a string like "$1,200", try to parse it
        let numericCost = typeof cost === 'number' ? cost : parseFloat(String(cost).replace(/[^0-9.]/g, ''))
        if (isNaN(numericCost)) return null

        return convertCurrency(numericCost, baseCurrency, userCurrency)
    }

    const convertedMainCost = getConvertedCost(recommendation.estimated_cost)

    const handleSave = async () => {
        if (!recommendation) return
        setIsSaving(true)
        try {
            await recommendationsAPI.updateRecommendation(tripId, recommendation.id, editForm)
            toast.success("Recommendation updated successfully")
            setIsEditing(false)
            if (onUpdate) onUpdate()
        } catch (error) {
            console.error("Update error:", error)
            toast.error("Failed to update recommendation")
        } finally {
            setIsSaving(false)
        }
    }

    const itinerary = recommendation.meta?.itinerary || []
    const dining = recommendation.meta?.dining_recommendations || []
    const costBreakdown = recommendation.meta?.cost_breakdown || {}

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !isEditing && onClose()}>
            <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden bg-zinc-950 border-zinc-800 shadow-2xl h-[85vh] flex flex-col text-zinc-50 duration-300 ease-out">
                {/* Header Image Area */}
                <div className="relative h-56 w-full shrink-0">
                    <img
                        src={recommendation.image_url || `https://source.unsplash.com/1200x800/?${recommendation.destination_name},travel`}
                        alt={recommendation.destination_name}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

                    <div className="absolute bottom-0 left-0 right-0 p-6 flex justify-between items-end">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                {recommendation.ai_generated && (
                                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 backdrop-blur-md">
                                        <Sparkles className="w-3 h-3 mr-1" /> AI Recommended
                                    </Badge>
                                )}
                                <Badge variant="secondary" className="bg-zinc-800/80 text-zinc-300 backdrop-blur-md border-zinc-700">
                                    {recommendation.meta?.experience_type || 'Travel'}
                                </Badge>
                            </div>
                            {isEditing ? (
                                <Input
                                    value={editForm.destination_name}
                                    onChange={(e) => setEditForm({ ...editForm, destination_name: e.target.value })}
                                    className="text-2xl font-bold text-zinc-100 bg-zinc-900/80 border-zinc-700"
                                />
                            ) : (
                                <h2 className="text-4xl font-heading font-bold text-white tracking-tight">{recommendation.destination_name}</h2>
                            )}
                        </div>

                        {isOwnerOrAdmin && !isEditing && (
                            <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)} className="bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 border border-zinc-700">
                                <Edit2 className="w-4 h-4 mr-2" /> Edit
                            </Button>
                        )}
                        {isEditing && (
                            <div className="flex gap-2">
                                <Button variant="destructive" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
                                <Button size="sm" onClick={handleSave} disabled={isSaving} className="bg-white text-black hover:bg-zinc-200">
                                    {isSaving ? <Sparkles className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                    Save
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content Tabs */}
                <div className="flex-1 overflow-hidden flex flex-col min-h-0 bg-zinc-950">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                        <div className="px-6 border-b border-zinc-800 shrink-0">
                            <TabsList className="grid w-full grid-cols-4 bg-zinc-900/50 p-1">
                                <TabsTrigger value="overview" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100 text-zinc-400">Overview</TabsTrigger>
                                <TabsTrigger value="itinerary" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100 text-zinc-400">Itinerary</TabsTrigger>
                                <TabsTrigger value="accommodation" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100 text-zinc-400">Stays</TabsTrigger>
                                <TabsTrigger value="dining" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100 text-zinc-400">Dining</TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 min-h-0">
                            <TabsContent value="overview" className="mt-0 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-lg font-semibold mb-2 flex items-center text-zinc-100">
                                                About this destination
                                            </h3>
                                            {isEditing ? (
                                                <Textarea
                                                    value={editForm.description}
                                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                                    className="min-h-[100px] bg-zinc-900 border-zinc-800 text-zinc-200"
                                                />
                                            ) : (
                                                <p className="text-zinc-400 leading-relaxed">
                                                    {recommendation.description || "No description available."}
                                                </p>
                                            )}
                                        </div>

                                        {recommendation.weather_info && (
                                            <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
                                                <h4 className="font-medium text-blue-400 mb-1 flex items-center">
                                                    <CloudSun className="w-4 h-4 mr-2" />
                                                    Weather Info
                                                </h4>
                                                <p className="text-sm text-blue-300/80">
                                                    {recommendation.weather_info}
                                                </p>
                                            </div>
                                        )}

                                        {recommendation.meta?.match_reason && (
                                            <div className="bg-purple-500/10 rounded-xl p-4 border border-purple-500/20">
                                                <h4 className="font-medium text-purple-400 mb-1 flex items-center">
                                                    <Sparkles className="w-4 h-4 mr-2" />
                                                    Why this fits
                                                </h4>
                                                <p className="text-sm text-purple-300/80">
                                                    {recommendation.meta.match_reason}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-6">
                                        <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
                                            <h4 className="font-medium text-emerald-400 mb-2 flex items-center">
                                                <DollarSign className="w-4 h-4 mr-2" />
                                                Estimated Cost
                                            </h4>

                                            <div className="flex items-baseline gap-2">
                                                {isEditing ? (
                                                    <Input
                                                        type="number"
                                                        value={editForm.estimated_cost}
                                                        onChange={(e) => setEditForm({ ...editForm, estimated_cost: parseFloat(e.target.value) })}
                                                        className="w-32 bg-zinc-900 border-zinc-700 text-zinc-200"
                                                    />
                                                ) : (
                                                    <span className="text-3xl font-bold text-emerald-400">
                                                        {formatCurrency(convertedMainCost, userCurrency)}
                                                    </span>
                                                )}

                                                {userCurrency !== baseCurrency && !isEditing && (
                                                    <span className="text-sm text-emerald-500/60">
                                                        (approx. {formatCurrency(recommendation.estimated_cost, baseCurrency)})
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-emerald-500/60 mt-1">
                                                Per person (avg)
                                            </p>

                                            {/* Cost Breakdown */}
                                            {Object.keys(costBreakdown).length > 0 && (
                                                <div className="mt-4 pt-4 border-t border-emerald-500/20">
                                                    <h5 className="text-xs font-semibold text-emerald-400 mb-3 uppercase tracking-wider opacity-80">Group Estimates</h5>
                                                    <div className="space-y-2">
                                                        {Object.entries(costBreakdown).map(([userId, costData]: [string, any], idx) => {
                                                            // Handle both old format (string) and new format (object)
                                                            const amountDisplay = typeof costData === 'object' ? costData.display_string : costData
                                                            const userName = getUserName(userId)

                                                            return (
                                                                <div key={idx} className="flex justify-between text-xs text-emerald-300/80 gap-2 items-center">
                                                                    <div className="flex items-center gap-2 truncate">
                                                                        <User className="w-3 h-3 opacity-50" />
                                                                        <span className="truncate" title={userName}>{userName}</span>
                                                                    </div>
                                                                    <span className="font-mono bg-emerald-500/10 px-2 py-0.5 rounded text-emerald-300">
                                                                        {amountDisplay}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <h3 className="font-semibold mb-3 text-zinc-100">Suggested Activities</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {(Array.isArray(recommendation.activities) ? recommendation.activities : []).map((activity, i) => (
                                                    <Badge
                                                        key={i}
                                                        variant="outline"
                                                        className="py-1.5 px-3 border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
                                                    >
                                                        {activity}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="itinerary" className="mt-0">
                                {itinerary.length > 0 ? (
                                    <Accordion type="single" collapsible className="w-full space-y-3">
                                        {itinerary.map((day: any, idx: number) => (
                                            <AccordionItem key={idx} value={`day-${day.day}`} className="border-zinc-800 rounded-xl px-4 bg-zinc-900/50 shadow-sm data-[state=open]:ring-1 data-[state=open]:ring-zinc-700 transition-all">
                                                <AccordionTrigger className="hover:no-underline py-4 text-zinc-200 hover:text-white">
                                                    <div className="flex items-center gap-4 text-left">
                                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-800 text-zinc-300 font-bold text-sm shrink-0 border border-zinc-700">
                                                            {day.day}
                                                        </div>
                                                        <span className="font-semibold text-lg">{day.focus}</span>
                                                    </div>
                                                </AccordionTrigger>
                                                <AccordionContent className="pt-2 pb-6 space-y-4 border-t border-zinc-800 mt-2">
                                                    {day.morning && (
                                                        <div className="flex gap-4 items-start group">
                                                            <div className="mt-1 bg-orange-500/10 p-2 rounded-lg shrink-0 border border-orange-500/20">
                                                                <CloudSun className="w-4 h-4 text-orange-400" />
                                                            </div>
                                                            <div className="flex-1">
                                                                <span className="text-xs font-bold text-orange-400 uppercase tracking-wider block mb-1">Morning</span>
                                                                <p className="text-zinc-400 leading-relaxed text-sm">{day.morning}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {day.afternoon && (
                                                        <div className="flex gap-4 items-start group">
                                                            <div className="mt-1 bg-blue-500/10 p-2 rounded-lg shrink-0 border border-blue-500/20">
                                                                <MapPin className="w-4 h-4 text-blue-400" />
                                                            </div>
                                                            <div className="flex-1">
                                                                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block mb-1">Afternoon</span>
                                                                <p className="text-zinc-400 leading-relaxed text-sm">{day.afternoon}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {day.evening && (
                                                        <div className="flex gap-4 items-start group">
                                                            <div className="mt-1 bg-indigo-500/10 p-2 rounded-lg shrink-0 border border-indigo-500/20">
                                                                <Sparkles className="w-4 h-4 text-indigo-400" />
                                                            </div>
                                                            <div className="flex-1">
                                                                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block mb-1">Evening</span>
                                                                <p className="text-zinc-400 leading-relaxed text-sm">{day.evening}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                ) : (
                                    <div className="text-center py-12 text-zinc-600">
                                        <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        <p>No detailed itinerary available for this recommendation.</p>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="accommodation" className="mt-0">
                                <div className="grid gap-4">
                                    {recommendation.accommodation_options?.map((option, idx) => (
                                        <div key={idx} className="flex items-start gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 transition-colors">
                                            <div className="p-2 bg-zinc-800 rounded-lg shadow-sm text-blue-400">
                                                <Hotel className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-zinc-200">{option}</h4>
                                                <p className="text-sm text-zinc-500 mt-1">Recommended accommodation option</p>
                                            </div>
                                        </div>
                                    ))}
                                    {(!recommendation.accommodation_options || recommendation.accommodation_options.length === 0) && (
                                        <div className="text-center py-12 text-zinc-600">
                                            <Hotel className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                            <p>No specific accommodation options listed.</p>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="dining" className="mt-0">
                                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                                    {dining.map((place: any, idx: number) => (
                                        <div key={idx} className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 transition-all group">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-bold text-zinc-200 group-hover:text-white transition-colors">{place.name}</h4>
                                                <Badge variant="outline" className="border-zinc-700 text-zinc-400">{place.price_range}</Badge>
                                            </div>
                                            <div className="text-sm text-zinc-500 mb-2 flex items-center gap-2">
                                                <Utensils className="w-3 h-3" />
                                                {place.cuisine}
                                            </div>
                                            <p className="text-sm text-zinc-400 leading-relaxed">{place.description}</p>
                                        </div>
                                    ))}
                                    {dining.length === 0 && (
                                        <div className="col-span-full text-center py-12 text-zinc-600">
                                            <Utensils className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                            <p>No specific dining recommendations available.</p>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    )
}
