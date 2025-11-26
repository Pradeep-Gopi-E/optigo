'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { ArrowLeft, Calendar, MapPin, DollarSign, Save, Brain, Compass } from 'lucide-react'
import { tripsAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

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
      toast.success('Journey initiated! Redirecting...')

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
    <div className="min-h-screen bg-background relative">
      <div className="noise-overlay" />

      {/* Header */}
      <header className="relative z-10 border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/trips" className="mr-4 p-2 hover:bg-secondary rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </Link>
            <h1 className="text-xl font-heading font-bold text-foreground">New Adventure</h1>
          </div>
        </div>
      </header>

      {/* Form Content */}
      <main className="relative z-10 container mx-auto px-6 py-12 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-border/50 shadow-xl">
            <CardHeader>
              <CardTitle className="text-3xl font-heading">Plan Your Journey</CardTitle>
              <CardDescription className="text-lg">Start by defining the basics of your next group adventure.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

                {/* Basic Information */}
                <div className="space-y-6">
                  <div className="flex items-center text-primary mb-4">
                    <Compass className="w-5 h-5 mr-2" />
                    <h3 className="font-heading font-semibold text-lg">The Essentials</h3>
                  </div>

                  <div className="grid gap-6">
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">
                        Trip Title *
                      </label>
                      <Input
                        {...register('title', {
                          required: 'Trip title is required',
                          minLength: { value: 3, message: 'Title must be at least 3 characters' },
                        })}
                        id="title"
                        placeholder="e.g., Summer in Tuscany"
                        className="text-lg"
                      />
                      {errors.title && (
                        <p className="mt-1 text-sm text-destructive">{errors.title.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
                        Description
                      </label>
                      <textarea
                        {...register('description')}
                        id="description"
                        rows={3}
                        className="input w-full resize-none min-h-[100px]"
                        placeholder="What's the vibe? Relaxing, adventurous, or a mix?"
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="destination" className="block text-sm font-medium text-foreground mb-2">
                          Destination (Optional)
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                          <Input
                            {...register('destination')}
                            id="destination"
                            className="pl-10"
                            placeholder="Paris, France"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="expected_participants" className="block text-sm font-medium text-foreground mb-2">
                          Group Size
                        </label>
                        <Input
                          {...register('expected_participants', {
                            min: { value: 1, message: 'Must have at least 1 participant' },
                            max: { value: 100, message: 'Maximum 100 participants' },
                            valueAsNumber: true,
                          })}
                          type="number"
                          id="expected_participants"
                          placeholder="5"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-border/50" />

                {/* Dates */}
                <div className="space-y-6">
                  <div className="flex items-center text-primary mb-4">
                    <Calendar className="w-5 h-5 mr-2" />
                    <h3 className="font-heading font-semibold text-lg">When</h3>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="start_date" className="block text-sm font-medium text-foreground mb-2">
                        Start Date
                      </label>
                      <Input
                        {...register('start_date')}
                        type="date"
                        id="start_date"
                      />
                    </div>
                    <div>
                      <label htmlFor="end_date" className="block text-sm font-medium text-foreground mb-2">
                        End Date
                      </label>
                      <Input
                        {...register('end_date')}
                        type="date"
                        id="end_date"
                      />
                      {isEndDateInvalid() && (
                        <p className="mt-1 text-sm text-destructive">End date must be after start date</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="h-px bg-border/50" />

                {/* Budget */}
                <div className="space-y-6">
                  <div className="flex items-center text-primary mb-4">
                    <DollarSign className="w-5 h-5 mr-2" />
                    <h3 className="font-heading font-semibold text-lg">Budget Per Person</h3>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="budget_min" className="block text-sm font-medium text-foreground mb-2">
                        Minimum
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        <Input
                          {...register('budget_min', {
                            min: { value: 0, message: 'Budget must be positive' },
                            valueAsNumber: true,
                          })}
                          type="number"
                          id="budget_min"
                          className="pl-10"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="budget_max" className="block text-sm font-medium text-foreground mb-2">
                        Maximum
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        <Input
                          {...register('budget_max', {
                            min: { value: 0, message: 'Budget must be positive' },
                            valueAsNumber: true,
                          })}
                          type="number"
                          id="budget_max"
                          className="pl-10"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                  {isBudgetInvalid() && (
                    <p className="mt-1 text-sm text-destructive">Maximum budget must be greater than minimum budget</p>
                  )}
                </div>

                {/* AI Helper */}
                <div className="bg-secondary/30 rounded-lg p-6 border border-secondary/50 flex items-start space-x-4">
                  <div className="p-2 bg-background rounded-lg shadow-sm">
                    <Brain className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-foreground mb-1">AI Curator Active</h3>
                    <p className="text-sm text-muted-foreground">
                      Our AI will use these details to craft personalized itineraries and find hidden gems that match your group's vibe.
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-4 pt-6">
                  <Link href="/trips">
                    <Button variant="ghost">Cancel</Button>
                  </Link>

                  <Button
                    type="submit"
                    disabled={isLoading || isEndDateInvalid() || isBudgetInvalid()}
                    className="px-8"
                  >
                    {isLoading ? (
                      <>Creating...</>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Create Trip
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  )
}
