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
}

export default function RecommendationDetailsModal({
    isOpen,
    onClose,
    recommendation,
    userCurrency
}: RecommendationDetailsModalProps) {
    const [isPersonalizing, setIsPersonalizing] = useState(false)
    const [personalization, setPersonalization] = useState<any>(null)

    useEffect(() => {
        if (recommendation) {
            setPersonalization(recommendation.personalization)
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

                <div className="max-h-[60vh] overflow-y-auto">
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
                                    {!personalization && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="mt-3 text-purple-600 border-purple-200 hover:bg-purple-50"
                                            onClick={handlePersonalize}
                                            disabled={isPersonalizing}
                                        >
                                            {isPersonalizing ? (
                                                <>
                                                    <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                                                    Personalizing...
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="w-4 h-4 mr-2" />
                                                    Personalize for me
                                                </>
                                            )}
                                        </Button>
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
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
