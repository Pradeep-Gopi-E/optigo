import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return 'N/A'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export const formatDate = (dateString: string | Date | null | undefined): string => {
  if (!dateString) return 'N/A'
  try {
    return format(new Date(dateString), 'MMM dd, yyyy')
  } catch (error) {
    return 'Invalid date'
  }
}

export const generateInitials = (name: string | null | undefined): string => {
  if (!name) return '??'

  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return '??'
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()

  const first = parts[0].charAt(0)
  const second = parts[1].charAt(0)
  return `${first}${second}`.toUpperCase()
}

export const getStatusColor = (status: string | null | undefined): string => {
  if (!status) return 'bg-gray-100 text-gray-800'

  switch (status.toLowerCase()) {
    case 'confirmed':
    case 'approved':
    case 'completed':
      return 'bg-green-100 text-green-800'
    case 'voting':
      return 'bg-orange-100 text-orange-800'
    case 'planning':
    case 'pending':
    case 'invited':
      return 'bg-blue-100 text-blue-800'
    case 'cancelled':
    case 'rejected':
    case 'declined':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}
