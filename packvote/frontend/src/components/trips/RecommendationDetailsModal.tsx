import { useState, useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Recommendation, recommendationsAPI } from '@/lib/api'
import { formatCurrency, convertCurrency } from '@/lib/utils'
import { DollarSign, Sparkles, CloudSun, X, Clock, MapPin, Calendar, Utensils, Hotel, Edit2, Save, Check, User } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/lib/store'

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

                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full"
                        onClick={onClose}
                    >
                        <X className="h-6 w-6" />
                    </Button>

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
                                    <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                                        {itinerary.map((day: any, idx: number) => (
                                            <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-300 group-[.is-active]:bg-purple-500 text-slate-500 group-[.is-active]:text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                                    <span className="font-bold text-sm">{day.day}</span>
                                                </div>
                                                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                                    <div className="flex items-center justify-between space-x-2 mb-1">
                                                        <div className="font-bold text-slate-900">{day.focus}</div>
                                                    </div>
                                                    <div className="text-slate-500 text-sm space-y-2">
                                                        {day.morning && <div className="flex gap-2"><span className="font-medium text-xs uppercase tracking-wider text-orange-500 w-16">Morning</span> {day.morning}</div>}
                                                        {day.afternoon && <div className="flex gap-2"><span className="font-medium text-xs uppercase tracking-wider text-blue-500 w-16">Afternoon</span> {day.afternoon}</div>}
                                                        {day.evening && <div className="flex gap-2"><span className="font-medium text-xs uppercase tracking-wider text-indigo-500 w-16">Evening</span> {day.evening}</div>}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
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
