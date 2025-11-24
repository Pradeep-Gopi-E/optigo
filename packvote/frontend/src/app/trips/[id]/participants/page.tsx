'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Mail, UserPlus, Trash2, Shield, Check, X } from 'lucide-react'
import { tripsAPI, TripDetail, Participant } from '@/lib/api'
import { generateInitials } from '@/lib/utils'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function ParticipantsPage() {
    const params = useParams()
    const router = useRouter()
    const tripId = params.id as string

    const [trip, setTrip] = useState<TripDetail | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isInviting, setIsInviting] = useState(false)
    const [inviteEmail, setInviteEmail] = useState('')

    useEffect(() => {
        if (tripId) {
            fetchTripDetails()
        }
    }, [tripId])

    const fetchTripDetails = async () => {
        try {
            const response = await tripsAPI.getTrip(tripId)
            setTrip(response)
        } catch (error: any) {
            toast.error('Failed to load participants')
            router.push('/dashboard')
        } finally {
            setIsLoading(false)
        }
    }

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!inviteEmail) return

        try {
            await tripsAPI.inviteParticipants(tripId, { emails: [inviteEmail] })
            toast.success('Invitation sent successfully')
            setInviteEmail('')
            setIsInviting(false)
            fetchTripDetails()
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to send invitation')
        }
    }

    const removeParticipant = async (participantId: string) => {
        if (!confirm('Are you sure you want to remove this participant?')) return

        try {
            await tripsAPI.removeParticipant(tripId, participantId)
            toast.success('Participant removed')
            fetchTripDetails()
        } catch (error: any) {
            toast.error('Failed to remove participant')
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

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center">
                            <Link href={`/trips/${tripId}`} className="mr-4">
                                <ArrowLeft className="w-5 h-5 text-gray-600 hover:text-gray-900" />
                            </Link>
                            <div>
                                <h1 className="text-xl font-semibold text-gray-900">Participants</h1>
                                <p className="text-sm text-gray-600">{trip.title}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsInviting(true)}
                            className="btn btn-primary flex items-center"
                        >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Invite People
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {isInviting && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-primary/20"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-gray-900">Invite New Participant</h3>
                            <button onClick={() => setIsInviting(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleInvite} className="flex gap-4">
                            <div className="flex-1">
                                <input
                                    type="email"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    placeholder="Enter email address"
                                    className="input w-full"
                                    required
                                />
                            </div>
                            <button type="submit" className="btn btn-primary">
                                Send Invitation
                            </button>
                        </form>
                    </motion.div>
                )}

                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        User
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Role
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {trip.participants.map((participant) => (
                                    <tr key={participant.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                                                    {generateInitials(participant.user_name)}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {participant.user_name}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {(participant as any).user_email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                {participant.role === 'owner' ? (
                                                    <Shield className="w-4 h-4 text-purple-500 mr-2" />
                                                ) : (
                                                    <div className="w-4 h-4 mr-2" />
                                                )}
                                                <span className={`text-sm capitalize ${participant.role === 'owner' ? 'font-medium text-purple-700' : 'text-gray-600'
                                                    }`}>
                                                    {participant.role}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${participant.status === 'joined'
                                                ? 'bg-green-100 text-green-800'
                                                : participant.status === 'invited'
                                                    ? 'bg-blue-100 text-blue-800'
                                                    : 'bg-red-100 text-red-800'
                                                }`}>
                                                {participant.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {participant.role !== 'owner' && (
                                                <button
                                                    onClick={() => removeParticipant(participant.id)}
                                                    className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-full transition-colors"
                                                    title="Remove participant"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    )
}
