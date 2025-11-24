import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { recommendationsAPI, Recommendation } from '@/lib/api'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'

interface EditRecommendationModalProps {
    isOpen: boolean
    onClose: () => void
    recommendation: Recommendation | null
    tripId: string
    onSuccess: () => void
}

export default function EditRecommendationModal({
    isOpen,
    onClose,
    recommendation,
    tripId,
    onSuccess
}: EditRecommendationModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        destination_name: '',
        description: '',
        estimated_cost: '',
        activities: ''
    })

    useEffect(() => {
        if (recommendation) {
            setFormData({
                destination_name: recommendation.destination_name,
                description: recommendation.description || '',
                estimated_cost: recommendation.estimated_cost?.toString() || '',
                activities: recommendation.activities.join(', ')
            })
        }
    }, [recommendation])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!recommendation) return

        setIsLoading(true)
        try {
            await recommendationsAPI.updateRecommendation(tripId, recommendation.id, {
                destination_name: formData.destination_name,
                description: formData.description,
                estimated_cost: formData.estimated_cost ? parseFloat(formData.estimated_cost) : null,
                activities: formData.activities.split(',').map(s => s.trim()).filter(Boolean)
            })

            toast.success('Recommendation updated successfully')
            onSuccess()
            onClose()
        } catch (error) {
            console.error(error)
            toast.error('Failed to update recommendation')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Edit Recommendation</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="destination_name">Destination Name</Label>
                        <Input
                            id="destination_name"
                            value={formData.destination_name}
                            onChange={(e) => setFormData({ ...formData, destination_name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="estimated_cost">Estimated Cost</Label>
                        <Input
                            id="estimated_cost"
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.estimated_cost}
                            onChange={(e) => setFormData({ ...formData, estimated_cost: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="activities">Activities (comma separated)</Label>
                        <Textarea
                            id="activities"
                            value={formData.activities}
                            onChange={(e) => setFormData({ ...formData, activities: e.target.value })}
                            placeholder="Hiking, Sightseeing, Food Tour"
                            rows={2}
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
