'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import { authAPI } from '@/lib/api'
import { RegisterData } from '@/types/auth'
import toast from 'react-hot-toast'
import { countries } from '@/lib/countries'

export default function RegisterPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterData>()

  const onSubmit = async (data: RegisterData) => {
    setIsLoading(true)
    try {
      const response = await authAPI.register({
        name: data.name,
        email: data.email,
        password: data.password,
        location: data.location
      })
      localStorage.setItem('access_token', response.access_token)
      localStorage.setItem('user', JSON.stringify(response.user))
      toast.success(`Welcome, ${response.user.name}!`)
      router.push('/dashboard')
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="mb-12">
        <h1 className="text-5xl font-heading text-zinc-100 mb-4 tracking-tight">Create Account</h1>
        <p className="text-zinc-500 font-body font-light text-lg">Begin your journey with us today.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Name Field */}
        <div className="space-y-2">
          <label htmlFor="name" className="text-xs font-medium text-zinc-500 uppercase tracking-widest font-body">
            Full Name
          </label>
          <input
            {...register('name', { required: 'Name is required' })}
            type="text"
            id="name"
            className="w-full bg-transparent border-b border-zinc-800 py-3 text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-zinc-100 transition-colors font-body font-light text-lg"
            placeholder="John Doe"
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-400 font-body">{errors.name.message}</p>
          )}
        </div>

        {/* Email Field */}
        <div className="space-y-2">
          <label htmlFor="email" className="text-xs font-medium text-zinc-500 uppercase tracking-widest font-body">
            Email address
          </label>
          <input
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address',
              },
            })}
            type="email"
            id="email"
            className="w-full bg-transparent border-b border-zinc-800 py-3 text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-zinc-100 transition-colors font-body font-light text-lg"
            placeholder="name@example.com"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-400 font-body">{errors.email.message}</p>
          )}
        </div>

        {/* Location Field */}
        <div className="space-y-2">
          <label htmlFor="location" className="text-xs font-medium text-zinc-500 uppercase tracking-widest font-body">
            Country
          </label>
          <select
            {...register('location', { required: 'Country is required' })}
            id="location"
            className="w-full bg-transparent border-b border-zinc-800 py-3 text-zinc-100 focus:outline-none focus:border-zinc-100 transition-colors font-body font-light text-lg appearance-none"
          >
            <option value="" className="bg-zinc-900 text-zinc-500">Select your country</option>
            {countries.map((country) => (
              <option key={country} value={country} className="bg-zinc-900 text-zinc-100">
                {country}
              </option>
            ))}
          </select>
          {errors.location && (
            <p className="mt-1 text-xs text-red-400 font-body">{errors.location.message}</p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <label htmlFor="password" className="text-xs font-medium text-zinc-500 uppercase tracking-widest font-body">
            Password
          </label>
          <div className="relative">
            <input
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters',
                },
              })}
              type={showPassword ? 'text' : 'password'}
              id="password"
              className="w-full bg-transparent border-b border-zinc-800 py-3 text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-zinc-100 transition-colors font-body font-light text-lg pr-10"
              placeholder="••••••••"
            />
            <button
              type="button"
              className="absolute right-0 top-3 text-zinc-600 hover:text-zinc-400 transition-colors"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="w-5 h-5" strokeWidth={1.5} /> : <Eye className="w-5 h-5" strokeWidth={1.5} />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-red-400 font-body">{errors.password.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 bg-zinc-100 text-zinc-950 rounded-full font-body font-medium hover:bg-white transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2 mt-8 shadow-lg shadow-zinc-900/20"
        >
          {isLoading ? (
            <span className="text-sm">Creating account...</span>
          ) : (
            <>
              <span className="text-sm tracking-wide">Create Account</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <div className="text-center mt-8">
          <p className="text-sm text-zinc-500 font-body font-light">
            Already have an account?{' '}
            <Link
              href="/auth/register"
              className="text-zinc-300 hover:text-white transition-colors border-b border-zinc-800 hover:border-white pb-0.5"
            >
              Log in
            </Link>
          </p>
        </div>
      </form>
    </motion.div>
  )
}