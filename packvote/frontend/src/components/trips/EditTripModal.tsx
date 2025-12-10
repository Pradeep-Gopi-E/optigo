'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { Button } from '../ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar-1'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Loader2, Trash2, X, Calendar as CalendarIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { tripsAPI, TripDetail } from '@/lib/api'
import { generateInitials, cn } from '@/lib/utils'
import { format } from 'date-fns'
import { DateRange } from 'react-day-picker'

interface EditTripModalProps {
    isOpen: boolean
    onClose: () => void
    trip: TripDetail
    onSuccess: () => void
    currentUserId?: string
    onRoleChange?: (participantId: string, newRole: string) => Promise<void>
    onDeleteTrip?: () => Promise<void>
}

const TABS = [
    { id: 'details', label: 'Details' },
    { id: 'participants', label: 'Participants' },
    { id: 'settings', label: 'Settings' }
]

export default function EditTripModal({
    isOpen,
    onClose,
    trip,
    onSuccess,
    currentUserId,
    onRoleChange,
    onDeleteTrip
}: EditTripModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [activeTab, setActiveTab] = useState('details')
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        destination: '',
        start_date: '',
        end_date: ''
    })
    const [dateRange, setDateRange] = useState<DateRange | undefined>()

    useEffect(() => {
        if (trip) {
            setFormData({
                title: trip.title || '',
                description: trip.description || '',
                destination: trip.destination || '',
                start_date: trip.start_date ? trip.start_date.split('T')[0] : '',
                end_date: trip.end_date ? trip.end_date.split('T')[0] : ''
            })
            if (trip.start_date && trip.end_date) {
                setDateRange({
                    from: new Date(trip.start_date),
                    to: new Date(trip.end_date)
                })
            }
        }
    }, [trip, isOpen])

    const handleDateSelect = (range: DateRange | undefined) => {
        setDateRange(range)
        if (range?.from) {
            setFormData(prev => ({
                ...prev,
                start_date: range.from ? format(range.from, 'yyyy-MM-dd') : '',
                end_date: range.to ? format(range.to, 'yyyy-MM-dd') : ''
            }))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            await tripsAPI.updateTrip(trip.id, formData)
            toast.success('Trip updated successfully')
            onSuccess()
            onClose()
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to update trip')
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!onDeleteTrip) return
        if (confirm('Are you sure you want to delete this trip? This action cannot be undone.')) {
            await onDeleteTrip()
        }
    }

    const tabVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as any } },
        exit: { opacity: 0, y: -10, transition: { duration: 0.2, ease: "easeIn" as any } }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] bg-[#09090b] border-zinc-800 text-zinc-50 p-0 overflow-hidden gap-0 duration-300 ease-out">
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-zinc-900/50 backdrop-blur-xl">
                    <DialogTitle className="text-2xl font-heading tracking-tight">Manage Trip</DialogTitle>
                    {/* Removed manual DialogClose to fix double close button bug */}
                </div>

                <div className="flex flex-col h-[80vh] sm:h-[600px]">
                    {/* Tabs Navigation */}
                    <div className="px-6 pt-6 pb-2">
                        <div className="flex p-1 bg-zinc-900/80 rounded-full border border-white/5 relative">
                            {TABS.map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "flex-1 relative py-2 text-xs sm:text-sm font-sans font-medium rounded-full transition-all duration-300 z-10 capitalize",
                                        activeTab === tab.id ? "text-black" : "text-zinc-500 hover:text-zinc-300"
                                    )}
                                >
                                    {tab.label}
                                    {activeTab === tab.id && (
                                        <motion.div
                                            layoutId="activeTabPill"
                                            className="absolute inset-0 bg-white rounded-full -z-10 shadow-lg"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
                        <AnimatePresence mode="wait">
                            {activeTab === 'details' && (
                                <motion.div
                                    key="details"
                                    variants={tabVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                >
                                    <form onSubmit={handleSubmit} className="space-y-5">
                                        <div className="space-y-2">
                                            <Label htmlFor="title" className="text-zinc-400 font-sans text-xs uppercase tracking-wider">Trip Title</Label>
                                            <Input
                                                id="title"
                                                value={formData.title}
                                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                className="bg-zinc-900/50 border-white/5 text-zinc-200 focus:ring-zinc-700 focus:border-white/10"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="destination" className="text-zinc-400 font-sans text-xs uppercase tracking-wider">Destination</Label>
                                            <Input
                                                id="destination"
                                                value={formData.destination}
                                                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                                                className="bg-zinc-900/50 border-white/5 text-zinc-200 focus:ring-zinc-700 focus:border-white/10"
                                            />
                                        </div>

                                        <div className="space-y-3">
                                            <Label className="text-xs uppercase tracking-widest text-zinc-500 font-sans">Trip Dates</Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        id="date"
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full justify-start text-left font-normal bg-zinc-900/50 border-white/5 hover:bg-zinc-900 text-zinc-300 h-12 transition-all",
                                                            !dateRange && "text-muted-foreground"
                                                        )}
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                                                        {dateRange?.from ? (
                                                            dateRange.to ? (
                                                                <>
                                                                    {format(dateRange.from, "LLL dd, y")} -{" "}
                                                                    {format(dateRange.to, "LLL dd, y")}
                                                                </>
                                                            ) : (
                                                                format(dateRange.from, "LLL dd, y")
                                                            )
                                                        ) : (
                                                            <span>Pick your dates</span>
                                                        )}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0 border-white/10 bg-[#09090b]" align="start">
                                                    <Calendar
                                                        mode="range"
                                                        defaultMonth={dateRange?.from}
                                                        selected={dateRange}
                                                        onSelect={handleDateSelect}
                                                        numberOfMonths={2}
                                                        className="max-w-fit"
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="description" className="text-zinc-400 font-sans text-xs uppercase tracking-wider">Description</Label>
                                            <Textarea
                                                id="description"
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                className="bg-zinc-900/50 border-white/5 text-zinc-200 focus:ring-zinc-700 focus:border-white/10 min-h-[100px]"
                                            />
                                        </div>

                                        <div className="pt-4 flex justify-end gap-3">
                                            <Button type="button" variant="ghost" onClick={onClose} className="text-zinc-400 hover:text-white hover:bg-white/5">
                                                Cancel
                                            </Button>
                                            <Button type="submit" disabled={isLoading} className="bg-white text-black hover:bg-zinc-200">
                                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
                                            </Button>
                                        </div>
                                    </form>
                                </motion.div>
                            )}

                            {activeTab === 'participants' && (
                                <motion.div
                                    key="participants"
                                    variants={tabVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    className="space-y-4"
                                >
                                    <div className="space-y-4">
                                        {trip.participants?.map((participant) => (
                                            <div key={participant.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/30 border border-white/5">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-medium text-zinc-400 border border-white/5">
                                                        {generateInitials(participant.user_name)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-zinc-200">{participant.user_name}</p>
                                                        <p className="text-xs text-zinc-500 capitalize">{participant.role}</p>
                                                    </div>
                                                </div>

                                                {currentUserId && trip.created_by === currentUserId && participant.id !== currentUserId && (
                                                    <Select
                                                        defaultValue={participant.role}
                                                        onValueChange={(value) => onRoleChange?.(participant.id, value)}
                                                    >
                                                        <SelectTrigger className="h-8 w-[100px] text-xs bg-zinc-900 border-white/10">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="viewer">Viewer</SelectItem>
                                                            <SelectItem value="editor">Editor</SelectItem>
                                                            <SelectItem value="admin">Admin</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                )}

                                                {participant.role === 'owner' && (
                                                    <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border-amber-500/20">Owner</Badge>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'settings' && (
                                <motion.div
                                    key="settings"
                                    variants={tabVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    className="space-y-6"
                                >
                                    <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 space-y-4">
                                        <div>
                                            <h4 className="text-sm font-medium text-red-400">Danger Zone</h4>
                                            <p className="text-xs text-red-400/60 mt-1">Irreversible actions for this trip</p>
                                        </div>

                                        <Button
                                            variant="destructive"
                                            onClick={handleDelete}
                                            className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20"
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete Trip
                                        </Button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
