'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
    MapPin,
    Users,
    Vote,
    Brain,
    ArrowRight,
    CheckCircle2,
    Sparkles
} from 'lucide-react'

export default function DemoPage() {
    const features = [
        {
            icon: <Brain className="w-6 h-6 text-purple-600" />,
            title: 'AI Recommendations',
            description: 'Get personalized destination suggestions based on your group\'s preferences and budget.'
        },
        {
            icon: <Vote className="w-6 h-6 text-blue-600" />,
            title: 'Ranked Choice Voting',
            description: 'Fair voting system where everyone ranks their favorites to find the best compromise.'
        },
        {
            icon: <Users className="w-6 h-6 text-green-600" />,
            title: 'Group Coordination',
            description: 'Manage participants, track status, and communicate updates in one place.'
        }
    ]

    return (
        <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
            {/* Hero Section */}
            <div className="relative overflow-hidden pt-16 pb-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center max-w-3xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 mb-6">
                                <Sparkles className="w-4 h-4 mr-2" />
                                Interactive Demo
                            </span>
                            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 tracking-tight mb-6">
                                Plan Group Trips <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
                                    Without the Chaos
                                </span>
                            </h1>
                            <p className="text-xl text-gray-600 mb-10">
                                Experience how PackVote uses AI and ranked-choice voting to help your group agree on the perfect destination in minutes.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Link
                                    href="/dashboard"
                                    className="btn btn-primary btn-lg w-full sm:w-auto flex items-center justify-center"
                                >
                                    Start Live Demo
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </Link>
                                <Link
                                    href="/auth/register"
                                    className="btn btn-outline btn-lg w-full sm:w-auto"
                                >
                                    Create Account
                                </Link>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Background decoration */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
                    <div className="absolute top-20 right-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
                </div>
            </div>

            {/* Features Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 bg-white rounded-3xl shadow-sm border border-gray-100 mb-24">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.2 }}
                            className="text-center"
                        >
                            <div className="w-16 h-16 mx-auto bg-gray-50 rounded-2xl flex items-center justify-center mb-6">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                            <p className="text-gray-600">{feature.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* How it Works */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                    <div className="space-y-8">
                        {[
                            { title: 'Create a Trip', desc: 'Set dates, budget, and invite friends.' },
                            { title: 'Collect Preferences', desc: 'Everyone shares what they want from the trip.' },
                            { title: 'Get AI Suggestions', desc: 'Our AI finds destinations that match everyone\'s needs.' },
                            { title: 'Vote & Decide', desc: 'Rank the options and let the algorithm pick the winner.' }
                        ].map((step, index) => (
                            <div key={index} className="flex items-start">
                                <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold mr-4">
                                    {index + 1}
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900">{step.title}</h3>
                                    <p className="text-gray-600">{step.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="bg-gray-100 rounded-2xl p-8 aspect-square flex items-center justify-center">
                        <div className="text-center text-gray-400">
                            <Sparkles className="w-16 h-16 mx-auto mb-4" />
                            <p>Interactive Preview Placeholder</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
