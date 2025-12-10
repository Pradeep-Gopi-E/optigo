'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import { authAPI } from '@/lib/api'
import { LoginData } from '@/types/auth'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginData>()

  const onSubmit = async (data: LoginData) => {
    setIsLoading(true)
    try {
      const response = await authAPI.login({ email: data.email, password: data.password })
      localStorage.setItem('access_token', response.access_token)
      localStorage.setItem('user', JSON.stringify(response.user))
      toast.success(`Welcome back, ${response.user.name}!`)
      router.push('/dashboard')
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Login failed')
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
        <h1 className="text-5xl font-heading text-zinc-100 mb-4 tracking-tight">Welcome back</h1>
        <p className="text-zinc-500 font-body font-light text-lg">Enter your details to access your account.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
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
            <span className="text-sm">Signing in...</span>
          ) : (
            <>
              <span className="text-sm tracking-wide">Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <div className="text-center mt-8">
          <p className="text-sm text-zinc-500 font-body font-light">
            Don't have an account?{' '}
            <Link
              href="/auth/register"
              className="text-zinc-300 hover:text-white transition-colors border-b border-zinc-800 hover:border-white pb-0.5"
            >
              Sign up for free
            </Link>
          </p>
        </div>
      </form>
    </motion.div>
  )
}