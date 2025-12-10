'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { User, MessageCircle, ChevronRight, Check, ArrowLeft, LogOut, Banknote } from 'lucide-react'
import { authAPI } from '@/lib/api'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Logo } from '@/components/ui/logo'
import toast from 'react-hot-toast'
import { countries } from '@/lib/countries'
import { generateInitials } from '@/lib/utils'

interface UserSettings {
  name: string
  email: string
  telegram_id?: string
  location?: string
  preferred_currency?: string
}

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [formData, setFormData] = useState<UserSettings>({
    name: '',
    email: '',
    telegram_id: '',
    location: '',
    preferred_currency: 'USD'
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      setFormData({
        name: parsedUser.name || '',
        email: parsedUser.email || '',
        telegram_id: parsedUser.telegram_id || '',
        location: parsedUser.location || '',
        preferred_currency: parsedUser.preferred_currency || 'USD'
      })
    } else {
      router.push('/auth/login')
      return
    }

    setIsLoading(false)
  }, [router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('Name is required')
      return
    }

    setIsSaving(true)
    try {
      const updatedUser = await authAPI.updateProfile({
        name: formData.name.trim(),
        telegram_id: formData.telegram_id?.trim() || undefined,
        location: formData.location || undefined,
        preferred_currency: formData.preferred_currency
      })

      localStorage.setItem('user', JSON.stringify({
        ...user,
        ...updatedUser
      }))

      setUser((prev: any) => ({ ...prev, ...updatedUser }))
      toast.success('Profile updated successfully')
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    router.push('/auth/login')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-px w-24 bg-zinc-800 overflow-hidden">
            <div className="h-full w-1/2 bg-zinc-200 animate-shimmer-line" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-200 font-body selection:bg-zinc-800 selection:text-zinc-100">

      {/* 1. MATCHING TOP NAVIGATION */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-6 bg-[#09090b]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="group">
            <Logo />
          </Link>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-8 text-sm font-medium tracking-wide text-zinc-500">
              <Link href="/dashboard" className="hover:text-zinc-300 transition-colors">Dashboard</Link>
              <Link href="/trips" className="hover:text-zinc-300 transition-colors">Journeys</Link>
              <Link href="/settings" className="text-zinc-100 transition-colors">Settings</Link>
            </div>
            <div className="h-4 w-px bg-zinc-800 hidden md:block" />
            <button
              onClick={handleLogout}
              className="text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors uppercase tracking-wider"
            >
              Log Out
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-32 pb-20 px-6 relative">
        {/* Ambient Glow */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-white/[0.02] blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-2xl mx-auto relative z-10">

          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center text-center mb-16"
          >
            <div className="relative mb-6 group">
              <div className="w-24 h-24 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-3xl font-heading text-white shadow-[0_0_40px_-10px_rgba(255,255,255,0.2)] transition-all duration-500">
                {generateInitials(user?.name || 'User')}
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-heading text-zinc-100 mb-2">
              Settings
            </h1>
            <p className="text-zinc-500 text-sm tracking-widest uppercase font-medium">
              Manage your personal preferences
            </p>
          </motion.div>

          {/* Form */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            onSubmit={handleSubmit}
            className="space-y-12"
          >
            {/* Identity Section */}
            <div className="space-y-8">
              <div className="grid grid-cols-1 gap-8">
                <div className="group">
                  <label className="block text-[10px] uppercase tracking-widest font-medium text-zinc-500 mb-2 group-focus-within:text-white transition-colors">
                    Full Name
                  </label>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full bg-transparent border-b border-white/10 px-0 py-4 text-xl text-white placeholder:text-zinc-800 focus:outline-none focus:border-white transition-colors rounded-none font-light"
                    placeholder="Enter your name"
                  />
                </div>

                <div className="group opacity-60">
                  <label className="block text-[10px] uppercase tracking-widest font-medium text-zinc-500 mb-2">
                    Email Address
                  </label>
                  <input
                    value={formData.email}
                    disabled
                    className="w-full bg-transparent border-b border-white/10 px-0 py-4 text-xl text-zinc-500 cursor-not-allowed rounded-none font-light"
                  />
                </div>

                <div className="group">
                  <label className="block text-[10px] uppercase tracking-widest font-medium text-zinc-500 mb-2 group-focus-within:text-white transition-colors">
                    Home Base
                  </label>
                  <div className="relative">
                    <select
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="w-full bg-transparent border-b border-white/10 px-0 py-4 text-xl text-white focus:outline-none focus:border-white transition-colors rounded-none appearance-none font-light cursor-pointer"
                    >
                      <option value="" className="bg-zinc-900 text-zinc-500">Select Country</option>
                      {countries.map(c => (
                        <option key={c} value={c} className="bg-zinc-900 text-white">{c}</option>
                      ))}
                    </select>
                    <ChevronRight className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 pointer-events-none rotate-90" />
                  </div>
                </div>
              </div>
            </div>

            {/* Currency Section - REFINED GLASS TILE */}
            <div className="space-y-4 pt-4 border-t border-white/5">
              <label className="block text-[10px] uppercase tracking-widest font-medium text-zinc-500">
                Global Preferences
              </label>

              <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 flex items-center justify-between hover:border-white/10 transition-colors group">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 group-hover:scale-105 transition-transform">
                    <Banknote className="w-6 h-6" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white mb-1">Primary Currency</h3>
                    <p className="text-sm text-zinc-500">Used for all AI cost estimations</p>
                  </div>
                </div>

                <div className="relative">
                  <select
                    name="preferred_currency"
                    value={formData.preferred_currency}
                    onChange={handleInputChange}
                    className="appearance-none bg-zinc-950 border border-white/10 text-white pl-4 pr-10 py-2.5 rounded-lg focus:outline-none focus:border-white/30 transition-colors cursor-pointer text-sm font-medium tracking-wide hover:bg-zinc-900"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="JPY">JPY (¥)</option>
                    <option value="AUD">AUD (A$)</option>
                    <option value="CAD">CAD (C$)</option>
                    <option value="CHF">CHF (Fr)</option>
                    <option value="CNY">CNY (¥)</option>
                    <option value="INR">INR (₹)</option>
                  </select>
                  <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none rotate-90" />
                </div>
              </div>
            </div>

            {/* Integrations */}
            <div className="space-y-4">
              <label className="block text-[10px] uppercase tracking-widest font-medium text-zinc-500">
                Integrations
              </label>

              <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:border-white/10 transition-colors group">
                <div className="flex items-center gap-5 mb-4 sm:mb-0">
                  <div className="w-12 h-12 rounded-full bg-[#0088cc]/10 flex items-center justify-center text-[#0088cc] border border-[#0088cc]/20 group-hover:scale-105 transition-transform">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white mb-1">Telegram</h3>
                    <p className="text-sm text-zinc-500">Get trip updates via bot</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="relative w-full sm:w-auto">
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">@</span>
                    <input
                      name="telegram_id"
                      value={formData.telegram_id?.replace('@', '')}
                      onChange={(e) => setFormData(prev => ({ ...prev, telegram_id: e.target.value }))}
                      placeholder="username"
                      className="bg-transparent border-b border-white/10 w-full sm:w-32 py-1 pl-4 text-white text-sm focus:outline-none focus:border-[#0088cc] transition-colors placeholder:text-zinc-700"
                    />
                  </div>
                  {formData.telegram_id && (
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-8 flex flex-col items-center gap-6">
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-zinc-100 text-zinc-950 hover:bg-white text-base font-medium px-10 h-14 rounded-full transition-all shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
              >
                {isSaving ? 'Saving Changes...' : 'Save Profile'}
              </Button>
            </div>

          </motion.form>

          <div className="mt-20 border-t border-white/5 pt-8 text-center">
            <button onClick={handleLogout} className="text-zinc-600 hover:text-red-400 text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2 mx-auto">
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}