'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { TripDetail } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { ArrowRight, Calendar } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface VotingResultsProps {
    trip: TripDetail
    onViewItinerary: () => void
}

export const VotingResults = ({ trip, onViewItinerary }: VotingResultsProps) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [images, setImages] = useState<string[]>([])

    // Initialize images
    useEffect(() => {
        const loadImages = () => {
            if (trip.destination_images && trip.destination_images.length > 0) {
                setImages(trip.destination_images)
            } else {
                // Fallback: Generate 4 Unsplash URLs with cache busters
                const dest = encodeURIComponent(trip.destination || 'travel')
                const fallbackImages = Array.from({ length: 4 }).map((_, i) => (
                    `https://source.unsplash.com/1600x900/?${dest},travel&sig=${i}`
                ))

                // If we have a main image, put it first
                if (trip.image_url) {
                    fallbackImages[0] = trip.image_url
                }
                setImages(fallbackImages)
            }
        }
        loadImages()
    }, [trip])

    // Ken Burns Effect: Cycle images
    useEffect(() => {
        if (images.length <= 1) return

        const interval = setInterval(() => {
            setCurrentImageIndex(prev => (prev + 1) % images.length)
        }, 6000) // Change image every 6 seconds

        return () => clearInterval(interval)
    }, [images])

    // Confetti on mount
    useEffect(() => {
        // Fire Confetti (Bulletproof Version)
        const end = Date.now() + 3 * 1000; // 3 seconds duration
        const colors = ["#a786ff", "#fd8bbc", "#eca184", "#f8deb1"];

        console.log("🎉 Triggering Cinematic Confetti");

        const frame = () => {
            if (Date.now() > end) return;

            // Left Cannon
            confetti({
                particleCount: 2,
                angle: 60,
                spread: 55,
                origin: { x: 0, y: 0.8 }, // Start lower to look like it's from the stage
                colors: colors,
                zIndex: 100, // CRITICAL: Must be higher than your background image
                disableForReducedMotion: true
            });

            // Right Cannon
            confetti({
                particleCount: 2,
                angle: 120,
                spread: 55,
                origin: { x: 1, y: 0.8 },
                colors: colors,
                zIndex: 100, // CRITICAL
                disableForReducedMotion: true
            });

            requestAnimationFrame(frame);
        };

        frame();

    }, [])

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black overflow-hidden">
            {/* Background Slideshow with Ken Burns */}
            <div className="absolute inset-0 z-0">
                <AnimatePresence mode="popLayout">
                    {images.length > 0 && (
                        <motion.img
                            key={currentImageIndex}
                            src={images[currentImageIndex]}
                            alt="Destination"
                            initial={{ opacity: 0, scale: 1 }}
                            animate={{ opacity: 1, scale: 1.1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 10, ease: "linear" }}
                            className="absolute inset-0 w-full h-full object-cover opacity-60"
                        />
                    )}
                </AnimatePresence>
                <div className="absolute inset-0 bg-black/40" /> {/* Overlay for readability */}
            </div>

            {/* Content Overlay */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center p-8 max-w-4xl w-full">

                {/* Intro Text */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 1 }}
                    className="text-zinc-300 text-sm md:text-base uppercase tracking-[0.3em] mb-6 font-medium drop-shadow-md"
                >
                    The Tribe Has Spoken
                </motion.p>

                {/* Destination Reveal */}
                <motion.h1
                    initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    transition={{ delay: 1.5, duration: 0.8, type: "spring" }}
                    className="text-5xl md:text-8xl font-heading font-bold text-white mb-8 drop-shadow-2xl"
                >
                    WE ARE GOING TO<br />
                    <span className="text-emerald-400">{trip.destination?.toUpperCase()}</span>
                </motion.h1>

                {/* Dates */}
                {(trip.start_date && trip.end_date) && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 2.2, duration: 0.8 }}
                        className="flex items-center gap-3 text-xl md:text-2xl text-zinc-200 font-light mb-12 bg-white/10 px-6 py-3 rounded-full border border-white/20 backdrop-blur-md shadow-lg"
                    >
                        <Calendar className="w-5 h-5 text-emerald-400" />
                        <span>
                            {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                        </span>
                    </motion.div>
                )}

                {/* Action Button */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 3, duration: 0.8 }}
                >
                    <Button
                        size="lg"
                        onClick={onViewItinerary}
                        className="bg-white text-black hover:bg-zinc-200 text-lg px-10 py-6 rounded-full shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all hover:scale-105"
                    >
                        View Itinerary
                        <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                </motion.div>
            </div>
        </div>
    )
}
