'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { tripsAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export default function JoinTripPage({ params }: { params: { inviteCode: string } }) {
    const router = useRouter();
    const [status, setStatus] = useState<'joining' | 'success' | 'error'>('joining');
    const [message, setMessage] = useState('Joining trip...');

    useEffect(() => {
        const joinTrip = async () => {
            try {
                const response = await tripsAPI.joinTrip(params.inviteCode);
                setStatus('success');
                setMessage(response.message || 'Successfully joined trip!');
                toast.success('Successfully joined trip!');
                // Redirect to the trip page
                setTimeout(() => {
                    router.push(`/trips/${response.trip_id}`);
                }, 1500);
            } catch (error: any) {
                setStatus('error');
                const errorMsg = error.response?.data?.detail || 'Failed to join trip';
                setMessage(errorMsg);
                toast.error(errorMsg);
                // Redirect to dashboard after delay
                setTimeout(() => {
                    router.push('/dashboard');
                }, 3000);
            }
        };

        joinTrip();
    }, [params.inviteCode, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg text-center">
                {status === 'joining' && (
                    <>
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Joining Trip...</h2>
                        <p className="text-gray-600">Please wait while we verify your invite.</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="h-12 w-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Success!</h2>
                        <p className="text-gray-600">{message}</p>
                        <p className="text-sm text-gray-500 mt-4">Redirecting to trip...</p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="h-12 w-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
                        <p className="text-red-600">{message}</p>
                        <p className="text-sm text-gray-500 mt-4">Redirecting to dashboard...</p>
                    </>
                )}
            </div>
        </div>
    );
}
