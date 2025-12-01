import { useState, useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Recommendation, recommendationsAPI } from '@/lib/api'
import { formatCurrency, convertCurrency } from '@/lib/utils'
import { DollarSign, Sparkles, CloudSun, X, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

interface RecommendationDetailsModalProps {
    isOpen: boolean
    onClose: () => void
    recommendation: Recommendation | null
    userCurrency: string
    userRole?: string
    allowMemberEdits?: boolean
    tripId?: string
    onUpdate?: () => void
}

export default function RecommendationDetailsModal({
    isOpen,
    onClose,
    recommendation,
    userCurrency,
    userRole,
    allowMemberEdits,
    tripId,
    onUpdate
}: RecommendationDetailsModalProps) {
    const [isPersonalizing, setIsPersonalizing] = useState(false)
    const [personalization, setPersonalization] = useState<any>(null)
    const [isEditing, setIsEditing] = useState(false)
    const [editData, setEditData] = useState<any>(null)
    const [isSaving, setIsSaving] = useState(false)

    const [displayItinerary, setDisplayItinerary] = useState<any[]>([])

    useEffect(() => {
        if (recommendation) {
            console.log("Recommendation Data:", recommendation)
            setPersonalization(recommendation.personalization)
            const itinerary = recommendation.meta?.itinerary || []
            setEditData({ itinerary })
            setDisplayItinerary(itinerary)
        }
    }, [recommendation])

    if (!recommendation) return null

    // Use currency from AI recommendation if available, otherwise default to USD
    const baseCurrency = recommendation.meta?.currency || 'USD'

    const convertedCost = recommendation.estimated_cost
        ? convertCurrency(recommendation.estimated_cost, baseCurrency, userCurrency)
        : null

    const handlePersonalize = async () => {
        if (!recommendation) return
        setIsPersonalizing(true)
        try {
            const updatedRec = await recommendationsAPI.personalizeRecommendation(recommendation.trip_id, recommendation.id)
            setPersonalization(updatedRec.personalization)
            toast.success("Recommendation personalized for you!")
        } catch (error) {
            console.error("Personalization error:", error)
            toast.error("Failed to personalize. Make sure your location is set in your profile.")
        } finally {
            setIsPersonalizing(false)
        }
    }

    const handleSave = async () => {
        if (!recommendation || !tripId) return
        setIsSaving(true)
        try {
            const updateData = {
                meta: {
                    ...recommendation.meta,
                    itinerary: editData.itinerary
                }
            }
            await recommendationsAPI.updateRecommendation(tripId, recommendation.id, updateData)

            // Optimistically update local state
            setDisplayItinerary(editData.itinerary)

            toast.success("Itinerary updated successfully")
            setIsEditing(false)
            if (onUpdate) onUpdate()
        } catch (error) {
            console.error("Update error:", error)
            toast.error("Failed to update itinerary")
        } finally {
            setIsSaving(false)
        }
    }

    const handleItineraryChange = (index: number, field: string, value: string) => {
        const newItinerary = [...editData.itinerary]
        newItinerary[index] = { ...newItinerary[index], [field]: value }
        setEditData({ ...editData, itinerary: newItinerary })
    }

    const canEdit = userRole === 'owner' || userRole === 'admin' || (userRole === 'member' && allowMemberEdits)

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden bg-white/90 backdrop-blur-xl border-white/20 shadow-2xl">
                <div className="relative h-64 w-full">
                    <img
                        src={recommendation.image_url || `https://source.unsplash.com/1200x800/?${recommendation.destination_name},travel`}
                        alt={recommendation.destination_name}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full"
                        onClick={onClose}
                    >
                        <X className="h-6 w-6" />
                    </Button>

                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                        <div className="flex items-center gap-2 mb-2">
                            {recommendation.ai_generated && (
                                <Badge className="bg-purple-500/90 backdrop-blur-md border-none text-white">
                                    <Sparkles className="w-3 h-3 mr-1" /> AI Recommended
                                </Badge>
                            )}
                            <Badge variant="secondary" className="bg-white/20 backdrop-blur-md text-white border-none hover:bg-white/30">
                                {Array.isArray(recommendation.activities) ? recommendation.activities.length : 0} Activities
                            </Badge>
                        </div>
                        <h2 className="text-3xl font-bold">{recommendation.destination_name}</h2>
                    </div>
                </div>

                <div className="max-h-[calc(85vh-256px)] overflow-y-auto">
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold mb-2 flex items-center text-gray-900">
                                        About this destination
                                    </h3>
                                    <p className="text-gray-600 leading-relaxed">
                                        {personalization?.personalized_description || recommendation.description || "No description available."}
                                    </p>

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
                            </div>

                            <div className="space-y-6">
                                <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                                    <h4 className="font-medium text-green-900 mb-2 flex items-center">
                                        <DollarSign className="w-4 h-4 mr-2" />
                                        Estimated Cost
                                    </h4>

                                    {personalization ? (
                                        <div className="space-y-2">
                                            <div className="text-sm text-green-800 font-medium">
                                                From your location:
                                            </div>
                                            <p className="text-green-700 text-sm font-bold">
                                                {personalization.currency} {personalization.estimated_cost_from_origin}
                                            </p>
                                            {personalization.travel_time && (
                                                <div className="flex items-center text-xs text-green-600 mt-1">
                                                    <Clock className="w-3 h-3 mr-1" />
                                                    {personalization.travel_time}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-2xl font-bold text-green-700">
                                                    {formatCurrency(convertedCost, userCurrency)}
                                                </span>
                                                {userCurrency !== baseCurrency && (
                                                    <span className="text-sm text-green-600 opacity-75">
                                                        (approx. {formatCurrency(recommendation.estimated_cost, baseCurrency)})
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-green-600 mt-1">
                                                Per person for the entire trip duration
                                            </p>
                                        </>
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

                                {((displayItinerary && displayItinerary.length > 0) || isEditing) && (
                                    <div>
                                        <div className="flex justify-between items-center mb-3">
                                            <h3 className="font-semibold text-gray-900">Suggested Itinerary</h3>
                                            {canEdit && !isEditing && (
                                                <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="h-8 text-primary">
                                                    <Sparkles className="w-3 h-3 mr-1" /> Edit
                                                </Button>
                                            )}
                                            {isEditing && (
                                                <div className="flex gap-2">
                                                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} disabled={isSaving}>
                                                        Cancel
                                                    </Button>
                                                    <Button size="sm" onClick={handleSave} disabled={isSaving}>
                                                        {isSaving ? 'Saving...' : 'Save'}
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-4">
                                            {(isEditing ? editData.itinerary : displayItinerary).map((day: any, i: number) => (
                                                <div key={i} className="border-l-2 border-purple-200 pl-4 pb-2">
                                                    {isEditing ? (
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-medium text-purple-900 w-16">Day {day.day}:</span>
                                                                <input
                                                                    className="flex-1 text-sm border rounded px-2 py-1"
                                                                    value={day.focus}
                                                                    onChange={(e) => handleItineraryChange(i, 'focus', e.target.value)}
                                                                    placeholder="Focus of the day"
                                                                />
                                                            </div>
                                                            <div className="grid gap-2 pl-2">
                                                                <div>
                                                                    <label className="text-xs font-semibold text-gray-500">Morning</label>
                                                                    <textarea
                                                                        className="w-full text-xs border rounded px-2 py-1"
                                                                        value={day.morning}
                                                                        onChange={(e) => handleItineraryChange(i, 'morning', e.target.value)}
                                                                        rows={2}
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="text-xs font-semibold text-gray-500">Afternoon</label>
                                                                    <textarea
                                                                        className="w-full text-xs border rounded px-2 py-1"
                                                                        value={day.afternoon}
                                                                        onChange={(e) => handleItineraryChange(i, 'afternoon', e.target.value)}
                                                                        rows={2}
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="text-xs font-semibold text-gray-500">Evening</label>
                                                                    <textarea
                                                                        className="w-full text-xs border rounded px-2 py-1"
                                                                        value={day.evening}
                                                                        onChange={(e) => handleItineraryChange(i, 'evening', e.target.value)}
                                                                        rows={2}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <h4 className="font-medium text-sm text-purple-900 mb-1">Day {day.day}: {day.focus}</h4>
                                                            <div className="text-xs text-gray-600 space-y-1">
                                                                <p><span className="font-semibold">Morning:</span> {day.morning}</p>
                                                                <p><span className="font-semibold">Afternoon:</span> {day.afternoon}</p>
                                                                <p><span className="font-semibold">Evening:</span> {day.evening}</p>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {recommendation.meta?.dining_recommendations && recommendation.meta.dining_recommendations.length > 0 && (
                                    <div>
                                        <h3 className="font-semibold mb-3 text-gray-900">Dining Recommendations</h3>
                                        <div className="space-y-3">
                                            {recommendation.meta.dining_recommendations.map((spot: any, i: number) => (
                                                <div key={i} className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <h4 className="font-medium text-sm text-orange-900">{spot.name}</h4>
                                                        <span className="text-xs font-bold text-orange-700">{spot.price_range}</span>
                                                    </div>
                                                    <p className="text-xs text-orange-800 mb-1 italic">{spot.cuisine}</p>
                                                    <p className="text-xs text-gray-600">{spot.description}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
