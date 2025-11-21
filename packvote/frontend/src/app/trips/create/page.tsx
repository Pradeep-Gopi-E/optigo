'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { ArrowLeft, Calendar, MapPin, DollarSign, Save, Brain } from 'lucide-react'
import { tripsAPI } from '@/lib/api'
import toast from 'react-hot-toast'

interface TripFormData {
  title: string
  description: string
  destination: string
  start_date: string | null
  end_date: string | null
  budget_min: number | null
  budget_max: number | null
  expected_participants: number | null
}

export default function CreateTripPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<TripFormData>()

  const budgetMin = watch('budget_min')
  const budgetMax = watch('budget_max')

  const onSubmit = async (data: TripFormData) => {
    setIsLoading(true)
    try {
      // Explicitly construct payload to avoid sending "name"
      const tripData = {
        title: data.title,
        description: data.description || null,
        destination: data.destination || null,
        start_date: data.start_date || null,
        end_date: data.end_date || null,
        budget_min: data.budget_min || null,
        budget_max: data.budget_max || null,
        expected_participants: data.expected_participants || null,
      }

      const response = await tripsAPI.createTrip(tripData)
      toast.success('Trip created successfully! Redirecting...')

      setTimeout(() => {
        router.push(`/trips/${response.id}`)
      }, 1500)
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to create trip')
    } finally {
      setIsLoading(false)
    }
  }

  const isEndDateInvalid = () => {
    const startDate = watch('start_date')
    const endDate = watch('end_date')
    if (!startDate || !endDate) return false
    return new Date(endDate) <= new Date(startDate)
  }

  const isBudgetInvalid = () => {
    const min = parseFloat(budgetMin as any)
    const max = parseFloat(budgetMax as any)
    if (!isNaN(min) && !isNaN(max)) {
      return min >= max
    }
    return false
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/trips" className="mr-4">
                <ArrowLeft className="w-5 h-5 text-gray-600 hover:text-gray-900" />
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">Create New Trip</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Form Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-xl shadow-sm p-8"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

            {/* Basic Information */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-primary" />
                Basic Information
              </h2>
              <div className="grid grid-cols-1 gap-6">
                {/* Trip Title */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Trip Title *
                  </label>
                  <input
                    {...register('title', {
                      required: 'Trip title is required',
                      minLength: { value: 3, message: 'Title must be at least 3 characters' },
                    })}
                    type="text"
                    id="title"
                    className="input w-full"
                    placeholder="Summer Vacation 2024"
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    {...register('description')}
                    id="description"
                    rows={4}
                    className="input w-full resize-none"
                    placeholder="Describe your trip..."
                  />
                </div>

                {/* Destination */}
                <div>
                  <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-2">
                    Destination
                  </label>
                  <input
                    {...register('destination')}
                    type="text"
                    id="destination"
                    className="input w-full"
                    placeholder="Paris, France"
                  />
                </div>

                {/* Expected Participants */}
                <div>
                  <label htmlFor="expected_participants" className="block text-sm font-medium text-gray-700 mb-2">
                    Expected Number of Participants
                  </label>
                  <input
                    {...register('expected_participants', {
                      min: { value: 1, message: 'Must have at least 1 participant' },
                      max: { value: 100, message: 'Maximum 100 participants' },
                      valueAsNumber: true,
                    })}
                    type="number"
                    id="expected_participants"
                    className="input w-full"
                    placeholder="5"
                  />
                  {errors.expected_participants && (
                    <p className="mt-1 text-sm text-red-600">{errors.expected_participants.message}</p>
                  )}
                  <p className="mt-1 text-sm text-gray-500">Helps AI generate better recommendations for your group size</p>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-primary" />
                Travel Dates
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    {...register('start_date')}
                    type="date"
                    id="start_date"
                    className="input w-full"
                  />
                </div>
                <div>
                  <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    {...register('end_date')}
                    type="date"
                    id="end_date"
                    className="input w-full"
                  />
                  {isEndDateInvalid() && (
                    <p className="mt-1 text-sm text-red-600">End date must be after start date</p>
                  )}
                </div>
              </div>
            </div>

            {/* Budget */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-primary" />
                Budget (Optional)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="budget_min" className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Budget per Person
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...register('budget_min', {
                        min: { value: 0, message: 'Budget must be positive' },
                        valueAsNumber: true,
                      })}
                      type="number"
                      id="budget_min"
                      className="input pl-10 w-full"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="budget_max" className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Budget per Person
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...register('budget_max', {
                        min: { value: 0, message: 'Budget must be positive' },
                        valueAsNumber: true,
                      })}
                      type="number"
                      id="budget_max"
                      className="input pl-10 w-full"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {isBudgetInvalid() && (
                <p className="mt-1 text-sm text-red-600">Maximum budget must be greater than minimum budget</p>
              )}
            </div>

            {/* AI Helper */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
              <div className="flex items-start">
                <Brain className="w-6 h-6 text-purple-600 mt-1 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">AI-Powered Planning</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    After your trip is created, our AI will generate personalized recommendations based on group preferences!
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Link href="/trips" className="btn btn-outline">
                Cancel
              </Link>

              <button
                type="submit"
                disabled={isLoading || isEndDateInvalid() || isBudgetInvalid()}
                className="btn btn-primary flex items-center disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="inline-flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Trip...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Save className="w-4 h-4 mr-2" />
                    Create Trip
                  </span>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </main>
    </div>
  )
}
