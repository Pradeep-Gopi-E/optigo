import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { recommendationsAPI } from '@/lib/api'

interface CustomRecommendationModalProps {
    isOpen: boolean
    onClose: () => void
    tripId: string
    onSuccess: () => void
}

export default function CustomRecommendationModal({
    isOpen,
    onClose,
    tripId,
    onSuccess
}: CustomRecommendationModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        destination_name: '',
        description: '',
        estimated_cost: '',
        activities: '',
        accommodation_options: '',
        transportation_options: ''
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const payload = {
                destination_name: formData.destination_name,
                description: formData.description,
                estimated_cost: formData.estimated_cost ? parseFloat(formData.estimated_cost) : undefined,
                activities: formData.activities.split(',').map(s => s.trim()).filter(Boolean),
                accommodation_options: formData.accommodation_options.split(',').map(s => s.trim()).filter(Boolean),
                transportation_options: formData.transportation_options.split(',').map(s => s.trim()).filter(Boolean),
                ai_generated: false
            }

            await recommendationsAPI.createRecommendation(tripId, payload)
            toast.success('Recommendation added successfully')
            onSuccess()
            onClose()
            setFormData({
                destination_name: '',
                description: '',
                estimated_cost: '',
                activities: '',
                accommodation_options: '',
                transportation_options: ''
            })
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to add recommendation')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Add Custom Recommendation</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="destination_name">Destination Name *</Label>
                        <Input
                            id="destination_name"
                            required
                            value={formData.destination_name}
                            onChange={(e) => setFormData({ ...formData, destination_name: e.target.value })}
                            placeholder="e.g., Paris, France"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Why should we go here?"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="estimated_cost">Estimated Cost per Person</Label>
                        <Input
                            id="estimated_cost"
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.estimated_cost}
                            onChange={(e) => setFormData({ ...formData, estimated_cost: e.target.value })}
                            placeholder="0.00"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="activities">Activities (comma separated)</Label>
                        <Input
                            id="activities"
                            value={formData.activities}
                            onChange={(e) => setFormData({ ...formData, activities: e.target.value })}
                            placeholder="e.g., Sightseeing, Hiking, Food Tour"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="accommodation_options">Accommodation (comma separated)</Label>
                        <Input
                            id="accommodation_options"
                            value={formData.accommodation_options}
                            onChange={(e) => setFormData({ ...formData, accommodation_options: e.target.value })}
                            placeholder="e.g., Hotel, Airbnb, Hostel"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="transportation_options">Transportation (comma separated)</Label>
                        <Input
                            id="transportation_options"
                            value={formData.transportation_options}
                            onChange={(e) => setFormData({ ...formData, transportation_options: e.target.value })}
                            placeholder="e.g., Flight, Train, Car Rental"
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Add Recommendation
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
