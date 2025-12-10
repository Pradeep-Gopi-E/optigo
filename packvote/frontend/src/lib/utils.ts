import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatCurrency = (amount: number | null | undefined, currency: string = 'USD', showSymbol: boolean = true): string => {
  if (amount === null || amount === undefined) return 'N/A'
  try {
    const formatter = new Intl.NumberFormat('en-US', {
      style: showSymbol ? 'currency' : 'decimal',
      currency: currency,
      minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
      maximumFractionDigits: 2,
    })
    return formatter.format(amount)
  } catch (error) {
    // Fallback
    return new Intl.NumberFormat('en-US', {
      style: showSymbol ? 'currency' : 'decimal',
      currency: 'USD',
      minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }
}

export const getCurrencyFromLocale = (): string => {
  if (typeof navigator === 'undefined') return 'USD'

  const locale = navigator.language || 'en-US'
  const region = locale.split('-')[1] || locale.split('-')[0].toUpperCase()

  const currencyMap: Record<string, string> = {
    'US': 'USD', // United States
    'GB': 'GBP', // United Kingdom
    'EU': 'EUR', // Europe (generic)
    'DE': 'EUR', // Germany
    'FR': 'EUR', // France
    'IT': 'EUR', // Italy
    'ES': 'EUR', // Spain
    'NL': 'EUR', // Netherlands
    'IE': 'EUR', // Ireland
    'JP': 'JPY', // Japan
    'CN': 'CNY', // China
    'IN': 'INR', // India
    'CA': 'CAD', // Canada
    'AU': 'AUD', // Australia
    'CH': 'CHF', // Switzerland
    'SE': 'SEK', // Sweden
    'NO': 'NOK', // Norway
    'DK': 'DKK', // Denmark
    'BR': 'BRL', // Brazil
    'MX': 'MXN', // Mexico
    'RU': 'RUB', // Russia
    'KR': 'KRW', // South Korea
    'SG': 'SGD', // Singapore
    'NZ': 'NZD', // New Zealand
    'HK': 'HKD', // Hong Kong
    'ZA': 'ZAR', // South Africa
  }

  // Handle specific locales
  if (locale === 'en-GB') return 'GBP'
  if (locale === 'ja-JP') return 'JPY'

  return currencyMap[region] || 'USD'
}

// Approximate exchange rates relative to USD (Base)
// In a real app, this should come from an API
const exchangeRates: Record<string, number> = {
  'USD': 1,
  'EUR': 0.92,
  'GBP': 0.79,
  'JPY': 151.5,
  'CNY': 7.23,
  'INR': 83.5,
  'CAD': 1.36,
  'AUD': 1.52,
  'CHF': 0.91,
  'SEK': 10.8,
  'NOK': 10.9,
  'DKK': 6.9,
  'BRL': 5.1,
  'MXN': 16.7,
  'RUB': 92.5,
  'KRW': 1375,
  'SGD': 1.35,
  'NZD': 1.67,
  'HKD': 7.83,
  'ZAR': 18.8,
}

export const convertCurrency = (amount: number, fromCurrency: string = 'USD', toCurrency: string = 'USD'): number => {
  if (fromCurrency === toCurrency) return amount

  // Convert to USD first (if not already)
  const amountInUSD = fromCurrency === 'USD' ? amount : amount / (exchangeRates[fromCurrency] || 1)

  // Convert from USD to target currency
  const convertedAmount = amountInUSD * (exchangeRates[toCurrency] || 1)

  return convertedAmount
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
