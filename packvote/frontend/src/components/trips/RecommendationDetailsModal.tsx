import { useState, useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Recommendation, recommendationsAPI } from '@/lib/api'
import { formatCurrency, convertCurrency } from '@/lib/utils'
import { DollarSign, Sparkles, CloudSun, X, Clock, MapPin, Calendar, Utensils, Hotel, Edit2, Save, Check, User } from 'lucide-react'
import toast from 'react-hot-toast'


interface RecommendationDetailsModalProps {
    isOpen: boolean
    onClose: () => void
    recommendation: Recommendation | null
    userCurrency: string
    tripId: string
    isOwnerOrAdmin: boolean
    onUpdate?: () => void
}

export default function RecommendationDetailsModal({
    isOpen,
    onClose,
    recommendation,
    userCurrency,
    tripId,
    isOwnerOrAdmin,
    onUpdate
}: RecommendationDetailsModalProps) {
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
            <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden bg-white/95 backdrop-blur-xl border-white/20 shadow-2xl h-[85vh] flex flex-col">
                {/* Header Image Area */}
                <div className="relative h-48 w-full shrink-0">
                    <img
                        src={recommendation.image_url || `https://source.unsplash.com/1200x800/?${recommendation.destination_name},travel`}
                        alt={recommendation.destination_name}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />



                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white flex justify-between items-end">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                {recommendation.ai_generated && (
                                    <Badge className="bg-purple-500/90 backdrop-blur-md border-none text-white">
                                        <Sparkles className="w-3 h-3 mr-1" /> AI Recommended
                                    </Badge>
                                )}
                                <Badge variant="secondary" className="bg-white/20 backdrop-blur-md text-white border-none hover:bg-white/30">
                                    {recommendation.meta?.experience_type || 'Travel'}
                                </Badge>
                            </div>
                            {isEditing ? (
                                <Input
                                    value={editForm.destination_name}
                                    onChange={(e) => setEditForm({ ...editForm, destination_name: e.target.value })}
                                    className="text-2xl font-bold text-black bg-white/90"
                                />
                            ) : (
                                <h2 className="text-3xl font-bold">{recommendation.destination_name}</h2>
                            )}
                        </div>

                        {isOwnerOrAdmin && !isEditing && (
                            <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)} className="bg-white/20 hover:bg-white/30 text-white border-none">
                                <Edit2 className="w-4 h-4 mr-2" /> Edit
                            </Button>
                        )}
                        {isEditing && (
                            <div className="flex gap-2">
                                <Button variant="destructive" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
                                <Button size="sm" onClick={handleSave} disabled={isSaving}>
                                    {isSaving ? <Sparkles className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                    Save
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content Tabs */}
                <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                        <div className="px-6 pt-4 border-b border-gray-100 shrink-0">
                            <TabsList className="grid w-full grid-cols-4 bg-gray-100/50">
                                <TabsTrigger value="overview">Overview</TabsTrigger>
                                <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
                                <TabsTrigger value="accommodation">Stays</TabsTrigger>
                                <TabsTrigger value="dining">Dining</TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 min-h-0">
                            <TabsContent value="overview" className="mt-0 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-lg font-semibold mb-2 flex items-center text-gray-900">
                                                About this destination
                                            </h3>
                                            {isEditing ? (
                                                <Textarea
                                                    value={editForm.description}
                                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                                    className="min-h-[100px]"
                                                />
                                            ) : (
                                                <p className="text-gray-600 leading-relaxed">
                                                    {recommendation.description || "No description available."}
                                                </p>
                                            )}
                                        </div>

                                        {recommendation.weather_info && (
                                            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                                                <h4 className="font-medium text-blue-900 mb-1 flex items-center">
                                                    <CloudSun className="w-4 h-4 mr-2" />
                                                    Weather Info
                                                </h4>
                                                <p className="text-sm text-blue-700">
                                                    {recommendation.weather_info}
                                                </p>
                                            </div>
                                        )}

                                        {recommendation.meta?.match_reason && (
                                            <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                                                <h4 className="font-medium text-purple-900 mb-1 flex items-center">
                                                    <Sparkles className="w-4 h-4 mr-2" />
                                                    Why this fits
                                                </h4>
                                                <p className="text-sm text-purple-700">
                                                    {recommendation.meta.match_reason}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-6">
                                        <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                                            <h4 className="font-medium text-green-900 mb-2 flex items-center">
                                                <DollarSign className="w-4 h-4 mr-2" />
                                                Estimated Cost
                                            </h4>

                                            <div className="flex items-baseline gap-2">
                                                {isEditing ? (
                                                    <Input
                                                        type="number"
                                                        value={editForm.estimated_cost}
                                                        onChange={(e) => setEditForm({ ...editForm, estimated_cost: parseFloat(e.target.value) })}
                                                        className="w-32 bg-white"
                                                    />
                                                ) : (
                                                    <span className="text-2xl font-bold text-green-700">
                                                        {formatCurrency(convertedMainCost, userCurrency)}
                                                    </span>
                                                )}

                                                {userCurrency !== baseCurrency && !isEditing && (
                                                    <span className="text-sm text-green-600 opacity-75">
                                                        (approx. {formatCurrency(recommendation.estimated_cost, baseCurrency)})
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-green-600 mt-1">
                                                Per person (avg)
                                            </p>

                                            {/* Cost Breakdown */}
                                            {Object.keys(costBreakdown).length > 0 && (
                                                <div className="mt-4 pt-4 border-t border-green-200">
                                                    <h5 className="text-xs font-semibold text-green-800 mb-2 uppercase tracking-wider">Group Estimates</h5>
                                                    <div className="space-y-1">
                                                        {Object.entries(costBreakdown).map(([userLoc, cost], idx) => {
                                                            const convertedBreakdownCost = getConvertedCost(cost as string);
                                                            return (
                                                                <div key={idx} className="flex justify-between text-xs text-green-700 gap-2">
                                                                    <span className="truncate" title={userLoc}>{userLoc}</span>
                                                                    <span className="font-medium whitespace-nowrap">
                                                                        {convertedBreakdownCost !== null
                                                                            ? formatCurrency(convertedBreakdownCost, userCurrency)
                                                                            : String(cost)
                                                                        }
                                                                    </span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <h3 className="font-semibold mb-3 text-gray-900">Suggested Activities</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {(Array.isArray(recommendation.activities) ? recommendation.activities : []).map((activity, i) => (
                                                    <Badge
                                                        key={i}
                                                        variant="outline"
                                                        className="py-1.5 px-3 border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
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
                                            <AccordionItem key={idx} value={`day-${day.day}`} className="border rounded-xl px-4 bg-white shadow-sm data-[state=open]:ring-2 data-[state=open]:ring-purple-100 transition-all">
                                                <AccordionTrigger className="hover:no-underline py-4">
                                                    <div className="flex items-center gap-4 text-left">
                                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold text-sm shrink-0">
                                                            {day.day}
                                                        </div>
                                                        <span className="font-semibold text-gray-900 text-lg">{day.focus}</span>
                                                    </div>
                                                </AccordionTrigger>
                                                <AccordionContent className="pt-2 pb-6 space-y-4 border-t border-gray-50 mt-2">
                                                    {day.morning && (
                                                        <div className="flex gap-4 items-start group">
                                                            <div className="mt-1 bg-orange-50 p-2 rounded-lg shrink-0 group-hover:bg-orange-100 transition-colors">
                                                                <CloudSun className="w-5 h-5 text-orange-500" />
                                                            </div>
                                                            <div className="flex-1">
                                                                <span className="text-xs font-bold text-orange-500 uppercase tracking-wider block mb-1">Morning</span>
                                                                <p className="text-gray-700 leading-relaxed">{day.morning}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {day.afternoon && (
                                                        <div className="flex gap-4 items-start group">
                                                            <div className="mt-1 bg-blue-50 p-2 rounded-lg shrink-0 group-hover:bg-blue-100 transition-colors">
                                                                <MapPin className="w-5 h-5 text-blue-500" />
                                                            </div>
                                                            <div className="flex-1">
                                                                <span className="text-xs font-bold text-blue-500 uppercase tracking-wider block mb-1">Afternoon</span>
                                                                <p className="text-gray-700 leading-relaxed">{day.afternoon}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {day.evening && (
                                                        <div className="flex gap-4 items-start group">
                                                            <div className="mt-1 bg-indigo-50 p-2 rounded-lg shrink-0 group-hover:bg-indigo-100 transition-colors">
                                                                <Sparkles className="w-5 h-5 text-indigo-500" />
                                                            </div>
                                                            <div className="flex-1">
                                                                <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider block mb-1">Evening</span>
                                                                <p className="text-gray-700 leading-relaxed">{day.evening}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                ) : (
                                    <div className="text-center py-12 text-gray-500">
                                        <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        <p>No detailed itinerary available for this recommendation.</p>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="accommodation" className="mt-0">
                                <div className="grid gap-4">
                                    {recommendation.accommodation_options?.map((option, idx) => (
                                        <div key={idx} className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                                <Hotel className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-gray-900">{option}</h4>
                                                <p className="text-sm text-gray-500 mt-1">Recommended accommodation option</p>
                                            </div>
                                        </div>
                                    ))}
                                    {(!recommendation.accommodation_options || recommendation.accommodation_options.length === 0) && (
                                        <div className="text-center py-12 text-gray-500">
                                            <Hotel className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                            <p>No specific accommodation options listed.</p>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="dining" className="mt-0">
                                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                                    {dining.map((place: any, idx: number) => (
                                        <div key={idx} className="p-4 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-bold text-gray-900">{place.name}</h4>
                                                <Badge variant="outline">{place.price_range}</Badge>
                                            </div>
                                            <div className="text-sm text-gray-500 mb-2">{place.cuisine}</div>
                                            <p className="text-sm text-gray-600">{place.description}</p>
                                        </div>
                                    ))}
                                    {dining.length === 0 && (
                                        <div className="col-span-full text-center py-12 text-gray-500">
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
