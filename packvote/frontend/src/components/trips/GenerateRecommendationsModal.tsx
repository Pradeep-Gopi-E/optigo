'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import { recommendationsAPI } from '@/lib/api'

interface GenerateRecommendationsModalProps {
    isOpen: boolean
    onClose: () => void
    tripId: string
    onSuccess: () => void
}

export default function GenerateRecommendationsModal({
    isOpen,
    onClose,
    tripId,
    onSuccess
}: GenerateRecommendationsModalProps) {
    const [isLoading, setIsLoading] = useState(false)

    const handleGenerate = async () => {
        setIsLoading(true)
        try {
            await recommendationsAPI.generateRecommendations(tripId, true)
            toast.success('Recommendations generated successfully!')
            onSuccess()
            onClose()
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to generate recommendations')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] bg-zinc-950 border-zinc-800 text-zinc-50">
                <DialogHeader>
                    <DialogTitle className="text-xl font-heading flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-yellow-500" />
                        Generate AI Recommendations
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        This will use AI to find the best destinations based on your trip preferences.
                        Existing recommendations will be cleared.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6 flex justify-center">
                    <div className="w-24 h-24 rounded-full bg-zinc-900 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 animate-spin-slow" />
                        <Sparkles className="w-10 h-10 text-indigo-400" />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={onClose} className="text-zinc-400 hover:text-white hover:bg-zinc-900">
                        Cancel
                    </Button>
                    <Button onClick={handleGenerate} disabled={isLoading} className="bg-white text-black hover:bg-zinc-200">
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Generate Now
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
