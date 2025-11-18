import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return '$0.00'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(dateString))
}

export const generateInitials = (name: string | null | undefined): string => {
  if (!name) return '??'

  const parts = name.split(' ')
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()

  const first = parts[0].charAt(0)
  const last = parts[parts.length - 1].charAt(0)
  return `${first}${last}`.toUpperCase()
}

export const getStatusColor = (status: string | null | undefined): string => {
  if (!status) return 'text-gray-500'

  switch (status.toLowerCase()) {
    case 'confirmed':
    case 'approved':
      return 'text-green-600'
    case 'pending':
      return 'text-yellow-600'
    case 'cancelled':
    case 'rejected':
      return 'text-red-600'
    default:
      return 'text-gray-500'
  }
}
