'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Trash2, AlertTriangle, Save } from 'lucide-react'
import { tripsAPI, authAPI } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Navigation } from '@/components/layout/navigation'
import toast from 'react-hot-toast'

export default function TripSettingsPage() {
    const router = useRouter()
    const { id: tripId } = useParams()
    const [user, setUser] = useState<any>(null)
    const [trip, setTrip] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isDeleting, setIsDeleting] = useState(false)

    useEffect(() => {
        const userData = localStorage.getItem('user')
        if (userData) {
            setUser(JSON.parse(userData))
        } else {
            router.push('/auth/login')
            return
        }

        if (tripId) {
            fetchData()
        }
    }, [router, tripId])

    const fetchData = async () => {
        try {
            const [tripResponse] = await Promise.all([
                tripsAPI.getTrip(tripId as string)
            ])
            setTrip(tripResponse)
        } catch (error: any) {
            console.error('Error fetching data:', error)
            toast.error('Failed to fetch trip details')
            router.push('/dashboard')
        } finally {
            setIsLoading(false)
        }
    }

    const handleDeleteTrip = async () => {
        if (!confirm('Are you sure you want to delete this trip? This action cannot be undone and all data (votes, recommendations, etc.) will be lost.')) return

        setIsDeleting(true)
        try {
            await tripsAPI.deleteTrip(tripId as string)
            toast.success('Trip deleted successfully')
            router.push('/dashboard')
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to delete trip')
            setIsDeleting(false)
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        )
    }

    if (!trip) return null

    const isOwner = trip.created_by === user?.id

    if (!isOwner) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-red-600">Access Denied</h2>
                    <p className="text-gray-600 mt-2">Only the trip owner can access settings.</p>
                    <Button className="mt-4" onClick={() => router.push(`/trips/${tripId}`)}>
                        Go Back
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
                                    <h1 className="text-xl font-semibold text-gray-900">Trip Settings</h1>
                                    <p className="text-sm text-gray-500">
                                        Manage your trip configuration
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-4 sm:px-6 lg:px-8 py-8">
                    <div className="max-w-3xl mx-auto space-y-8">

                        {/* Danger Zone */}
                        <Card className="border-red-200 bg-red-50">
                            <CardHeader>
                                <div className="flex items-center space-x-2 text-red-700">
                                    <AlertTriangle className="w-5 h-5" />
                                    <CardTitle className="text-red-700">Danger Zone</CardTitle>
                                </div>
                                <CardDescription className="text-red-600">
                                    Irreversible actions for this trip
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-red-100">
                                    <div>
                                        <h4 className="font-medium text-gray-900">Delete Trip</h4>
                                        <p className="text-sm text-gray-500">Permanently delete this trip and all its data</p>
                                    </div>
                                    <Button
                                        variant="destructive"
                                        onClick={handleDeleteTrip}
                                        disabled={isDeleting}
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        {isDeleting ? 'Deleting...' : 'Delete Trip'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                    </div>
                </div>
            </div>
        </div>
    )
}
