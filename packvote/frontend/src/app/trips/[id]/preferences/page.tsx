'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Heart,
  MapPin,
  Calendar,
  DollarSign,
  Activity,
  Users,
  Save,
  ChevronRight,
  Star,
  Timer
} from 'lucide-react'
import { tripsAPI } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Navigation } from '@/components/layout/navigation'
import toast from 'react-hot-toast'

interface TripData {
  id: string
  title: string
  destination?: string
  start_date?: string
  end_date?: string
  budget_min?: number
  budget_max?: number
  participant_count: number
}

interface PreferenceData {
  accommodation_type: string
  transportation_preference: string
  activity_level: string
  budget_sensitivity: string
  accommodation_amenities: string[]
  must_have_activities: string[]
  avoid_activities: string[]
  dietary_restrictions: string[]
  group_size_preference: string
}

export default function PreferencesPage() {
  const router = useRouter()
  const { id: tripId } = useParams()
  const [user, setUser] = useState<any>(null)
  const [trip, setTrip] = useState<TripData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  const [preferences, setPreferences] = useState<PreferenceData>({
    accommodation_type: '',
    transportation_preference: '',
    activity_level: '',
    budget_sensitivity: '',
    accommodation_amenities: [],
    must_have_activities: [],
    avoid_activities: [],
    dietary_restrictions: [],
    group_size_preference: ''
  })

  const steps = [
    { title: 'Accommodation', icon: Heart },
    { title: 'Transportation', icon: MapPin },
    { title: 'Activities', icon: Activity },
    { title: 'Budget', icon: DollarSign },
    { title: 'Dietary', icon: Users },
    { title: 'Group Size', icon: Users }
  ]

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    } else {
      router.push('/auth/login')
      return
    }

    fetchTripData()
  }, [router, tripId])

  const fetchTripData = async () => {
    try {
      const response = await tripsAPI.getTrip(tripId as string)
      setTrip(response)
    } catch (error) {
      toast.error('Failed to fetch trip data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof PreferenceData, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleCheckboxChange = (field: keyof PreferenceData, value: string) => {
    setPreferences(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).includes(value)
        ? (prev[field] as string[]).filter(item => item !== value)
        : [...(prev[field] as string[]), value]
    }))
  }

  const handleSubmit = async () => {
    setIsSaving(true)
    try {
      await tripsAPI.createPreference(tripId as string, {
        preference_type: 'detailed',
        preference_data: preferences
      })
      toast.success('Preferences saved successfully')
      router.push(`/trips/${tripId}`)
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to save preferences')
    } finally {
      setIsSaving(false)
    }
  }

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Trip not found</h2>
          <Button onClick={() => router.push('/trips')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Trips
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} currentPage="trips" />

      <div className="lg:ml-64">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/trips/${tripId}`)}
                  className="mr-4"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Trip Preferences</h1>
                  <p className="text-sm text-gray-500">{trip.title}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="bg-white border-b">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between max-w-4xl mx-auto">
              {steps.map((step, index) => {
                const Icon = step.icon
                const isActive = index === currentStep
                const isCompleted = index < currentStep

                return (
                  <div
                    key={index}
                    className="flex items-center"
                  >
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                      isActive
                        ? 'border-primary bg-primary text-white'
                        : isCompleted
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-gray-300 text-gray-400'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="ml-3">
                      <p className={`text-sm font-medium ${
                        isActive ? 'text-primary' : isCompleted ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {step.title}
                      </p>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`mx-8 h-0.5 w-16 transition-colors ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-300'
                      }`}></div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-2xl mx-auto">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    {(() => {
                      const Icon = steps[currentStep].icon
                      return <Icon className="w-5 h-5 mr-2" />
                    })()}
                    {steps[currentStep].title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Step 0: Accommodation */}
                  {currentStep === 0 && (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          What type of accommodation do you prefer?
                        </label>
                        <div className="space-y-3">
                          {[
                            { value: 'hotel', label: 'Hotel', desc: 'Traditional hotel with full services' },
                            { value: 'hostel', label: 'Hostel', desc: 'Budget-friendly shared accommodation' },
                            { value: 'airbnb', label: 'Airbnb', desc: 'Private rental properties' },
                            { value: 'resort', label: 'Resort', desc: 'All-inclusive luxury experience' }
                          ].map(option => (
                            <label key={option.value} className="flex items-start p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                              <input
                                type="radio"
                                name="accommodation_type"
                                value={option.value}
                                checked={preferences.accommodation_type === option.value}
                                onChange={(e) => handleInputChange('accommodation_type', e.target.value)}
                                className="mt-1 mr-3"
                              />
                              <div>
                                <p className="font-medium text-gray-900">{option.label}</p>
                                <p className="text-sm text-gray-500">{option.desc}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          What amenities are important to you?
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { value: 'wifi', label: 'WiFi' },
                            { value: 'parking', label: 'Parking' },
                            { value: 'breakfast', label: 'Breakfast' },
                            { value: 'pool', label: 'Pool' },
                            { value: 'gym', label: 'Gym' },
                            { value: 'spa', label: 'Spa' }
                          ].map(amenity => (
                            <label key={amenity.value} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                              <input
                                type="checkbox"
                                checked={preferences.accommodation_amenities.includes(amenity.value)}
                                onChange={() => handleCheckboxChange('accommodation_amenities', amenity.value)}
                                className="mr-2"
                              />
                              <span className="text-sm">{amenity.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 1: Transportation */}
                  {currentStep === 1 && (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          How do you prefer to travel?
                        </label>
                        <div className="space-y-3">
                          {[
                            { value: 'flight', label: 'Flight', desc: 'Fastest option for long distances' },
                            { value: 'train', label: 'Train', desc: 'Scenic and comfortable journey' },
                            { value: 'car', label: 'Car', desc: 'Flexibility and freedom to explore' },
                            { value: 'bus', label: 'Bus', desc: 'Budget-friendly option' }
                          ].map(option => (
                            <label key={option.value} className="flex items-start p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                              <input
                                type="radio"
                                name="transportation_preference"
                                value={option.value}
                                checked={preferences.transportation_preference === option.value}
                                onChange={(e) => handleInputChange('transportation_preference', e.target.value)}
                                className="mt-1 mr-3"
                              />
                              <div>
                                <p className="font-medium text-gray-900">{option.label}</p>
                                <p className="text-sm text-gray-500">{option.desc}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Activities */}
                  {currentStep === 2 && (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          What's your preferred activity level?
                        </label>
                        <div className="space-y-3">
                          {[
                            { value: 'relaxed', label: 'Relaxed', desc: 'Mostly leisure activities and sightseeing' },
                            { value: 'moderate', label: 'Moderate', desc: 'Mix of activities and free time' },
                            { value: 'active', label: 'Active', desc: 'Lots of physical activities and adventure' },
                            { value: 'extreme', label: 'Extreme', desc: 'Adrenaline-filled activities' }
                          ].map(option => (
                            <label key={option.value} className="flex items-start p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                              <input
                                type="radio"
                                name="activity_level"
                                value={option.value}
                                checked={preferences.activity_level === option.value}
                                onChange={(e) => handleInputChange('activity_level', e.target.value)}
                                className="mt-1 mr-3"
                              />
                              <div>
                                <p className="font-medium text-gray-900">{option.label}</p>
                                <p className="text-sm text-gray-500">{option.desc}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Must-have activities
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { value: 'beach', label: 'Beach activities' },
                            { value: 'hiking', label: 'Hiking' },
                            { value: 'museums', label: 'Museums' },
                            { value: 'nightlife', label: 'Nightlife' },
                            { value: 'shopping', label: 'Shopping' },
                            { value: 'local_culture', label: 'Local culture' },
                            { value: 'food_tours', label: 'Food tours' },
                            { value: 'adventure', label: 'Adventure sports' }
                          ].map(activity => (
                            <label key={activity.value} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                              <input
                                type="checkbox"
                                checked={preferences.must_have_activities.includes(activity.value)}
                                onChange={() => handleCheckboxChange('must_have_activities', activity.value)}
                                className="mr-2"
                              />
                              <span className="text-sm">{activity.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Budget */}
                  {currentStep === 3 && (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          How budget-conscious are you?
                        </label>
                        <div className="space-y-3">
                          {[
                            { value: 'very_conservative', label: 'Very Conservative', desc: 'Always choose the cheapest options' },
                            { value: 'conservative', label: 'Conservative', desc: 'Prefer budget-friendly choices' },
                            { value: 'moderate', label: 'Moderate', desc: 'Balance between cost and quality' },
                            { value: 'flexible', label: 'Flexible', desc: 'Willing to splurge on experiences' }
                          ].map(option => (
                            <label key={option.value} className="flex items-start p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                              <input
                                type="radio"
                                name="budget_sensitivity"
                                value={option.value}
                                checked={preferences.budget_sensitivity === option.value}
                                onChange={(e) => handleInputChange('budget_sensitivity', e.target.value)}
                                className="mt-1 mr-3"
                              />
                              <div>
                                <p className="font-medium text-gray-900">{option.label}</p>
                                <p className="text-sm text-gray-500">{option.desc}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>

                      {trip.budget_min && trip.budget_max && (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <span className="font-medium">Trip Budget:</span> {' '}
                            ${trip.budget_min.toLocaleString()} - ${trip.budget_max.toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 4: Dietary */}
                  {currentStep === 4 && (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Do you have any dietary restrictions?
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { value: 'vegetarian', label: 'Vegetarian' },
                            { value: 'vegan', label: 'Vegan' },
                            { value: 'gluten_free', label: 'Gluten-free' },
                            { value: 'halal', label: 'Halal' },
                            { value: 'kosher', label: 'Kosher' },
                            { value: 'dairy_free', label: 'Dairy-free' },
                            { value: 'nut_allergy', label: 'Nut allergies' },
                            { value: 'seafood_allergy', label: 'Seafood allergies' }
                          ].map(restriction => (
                            <label key={restriction.value} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                              <input
                                type="checkbox"
                                checked={preferences.dietary_restrictions.includes(restriction.value)}
                                onChange={() => handleCheckboxChange('dietary_restrictions', restriction.value)}
                                className="mr-2"
                              />
                              <span className="text-sm">{restriction.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 5: Group Size */}
                  {currentStep === 5 && (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          What's your preferred group size for activities?
                        </label>
                        <div className="space-y-3">
                          {[
                            { value: 'solo', label: 'Solo', desc: 'Prefer exploring alone' },
                            { value: 'small', label: 'Small Group (2-4)', desc: 'Intimate group experience' },
                            { value: 'medium', label: 'Medium Group (5-8)', desc: 'Good balance of social and manageable' },
                            { value: 'large', label: 'Large Group (9+)', desc: 'The more the merrier!' }
                          ].map(option => (
                            <label key={option.value} className="flex items-start p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                              <input
                                type="radio"
                                name="group_size_preference"
                                value={option.value}
                                checked={preferences.group_size_preference === option.value}
                                onChange={(e) => handleInputChange('group_size_preference', e.target.value)}
                                className="mt-1 mr-3"
                              />
                              <div>
                                <p className="font-medium text-gray-900">{option.label}</p>
                                <p className="text-sm text-gray-500">{option.desc}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Navigation Buttons */}
            <div className="mt-8 flex justify-between">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
              >
                Previous
              </Button>

              {currentStep < steps.length - 1 ? (
                <Button onClick={nextStep}>
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Preferences
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}