// This line is essential. It tells Next.js this is a Client Component.
'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { useRouter } from 'next/navigation' // For redirecting after success

// --- This is the function that calls your backend ---
// We match the data shape from your backend's UserCreate schema
const registerUser = async (userData: {
  name: string
  email: string
  password: string
}) => {
  // CRITICAL: Check this URL.
  // This must be the full URL of your *backend* server.
  // It is probably running on port 8000.
  const API_URL = 'http://localhost:8000/api/auth/register'

  // This is the actual API call
  const { data } = await axios.post(API_URL, userData)
  return data
}
// ---------------------------------------------------

// ***************************************************************
// THIS IS THE LINE THAT FIXES YOUR ERROR
// Without "export default", Next.js cannot find the component.
// ***************************************************************
export default function RegisterPage() {
  const router = useRouter() // Get the router to redirect
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // This is the React Query "mutation" hook.
  // It handles all the loading, error, and success states for you.
  const mutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (data) => {
      // This runs if the API call is successful (e.g., status 201)
      toast.success('Registration successful!')
      console.log('Server response:', data)
      // Optional: Store the token (data.access_token)
      // Optional: Redirect to the login page
      router.push('/auth/login')
    },
    onError: (error) => {
      // This runs if the API call fails
      console.error('API Error:', error)
      // Check if it's an Axios error with a response
      if (axios.isAxiosError(error) && error.response) {
        // Now you can see the real backend error (404, 500, etc.)
        toast.error(`Error: ${error.response.data.detail || 'Registration failed'}`)
      } else {
        toast.error('An unknown error occurred.')
      }
    },
  })

  // This function runs when the form is submitted
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault() // Stop the page from reloading
    console.log('Form submitted. Calling the API...')
    
    // This triggers the 'mutationFn' (registerUser)
    mutation.mutate({ name, email, password })
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-gray-900">
          Create an Account
        </h1>
        
        {/* The form itself */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              Name
            </label>
            <input
              id="name"
              type="text"
              required
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={mutation.isPending} // Use isPending for v5
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={mutation.isPending} // Use isPending for v5
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label> {/* <--- TYPO IS FIXED HERE */}
            <input
              id="password"
              type="password"
              required
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={mutation.isPending} // Use isPending for v5
            />
          </div>

          <div>
            <button
              type="submit"
              className="w-full px-4 py-2 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              disabled={mutation.isPending} // Use isPending for v5
            >
              {mutation.isPending ? 'Registering...' : 'Register'}
            </button>
          </div>
        </form>
        
        <p className="text-sm text-center text-gray-600">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-medium text-blue-600 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}