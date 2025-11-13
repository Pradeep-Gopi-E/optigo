'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, Mail, Lock, ArrowRight, Users, User } from 'lucide-react'
import { authAPI } from '@/lib/api'
import { RegisterData } from '@/types/auth' // Make sure this type is defined!
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterData>()

  /**
   * Handles form submission.
   * 1. Calls the register API.
   * 2. On success, stores the token/user (auto-login).
   * 3. Redirects to the dashboard.
   */
  const onSubmit = async (data: RegisterData) => {
    setIsLoading(true)
    try {
      // 1. Call the register API
      const response = await authAPI.register(data.name, data.email, data.password)

      // 2. Store auth data (just like the login page)
      localStorage.setItem('access_token', response.access_token)
      localStorage.setItem('user', JSON.stringify(response.user))

      // 3. Show success and redirect to the main app
      toast.success(`Welcome, ${response.user.name}!`)
      router.push('/dashboard') // Redirect to the main app
      
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  // --- THIS IS THE ONLY PART THAT CHANGES ---
  // We return the <motion.div> directly.
  // The outer wrapper is now handled by app/auth/layout.tsx
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md"
    >
      {/* Logo and Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center items-center mb-4">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
            <Users className="w-7 h-7 text-white" />
          </div>
          <span className="ml-3 text-2xl font-bold text-gray-900">PackVote</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Create an Account</h1>
        <p className="text-gray-600 mt-2">Sign up to start planning your trips</p>
      </div>

      {/* Register Form */}
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Name Field */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                {...register('name', {
                  required: 'Name is required',
                })}
                type="text"
                id="name"
                className="input pl-10 w-full"
                placeholder="John Doe"
              />
            </div>
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>
          
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
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
                className="input pl-10 w-full"
                placeholder="you@example.com"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6, // Or match your backend's minimum length
                    message: 'Password must be at least 6 characters',
                  },
                })}
                type={showPassword ? 'text' : 'password'}
                id="password"
                className="input pl-10 pr-10 w-full"
                placeholder="••••••••"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary w-full btn-lg flex items-center justify-center disabled:opacity-50"
          >
            {isLoading ? (
              <span className="inline-flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing up...
              </span>
            ) : (
              <span className="flex items-center">
                Sign up
                <ArrowRight className="ml-2 h-4 w-4" />
              </span>
            )}
          </button>
        </form>

        {/* Sign In Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              href="/auth/login"
              className="font-medium text-primary hover:text-primary/600 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Features */}
      <div className="mt-8 grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-xs text-gray-600">Group Planning</p>
        </div>
        <div className="text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <Lock className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-xs text-gray-600">Fair Voting</p>
        </div>
        <div className="text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <ArrowRight className="w-6 h-6 text-purple-600" />
          </div>
          <p className="text-xs text-gray-600">AI Powered</p>
        </div>
      </div>
    </motion.div>
  )
}