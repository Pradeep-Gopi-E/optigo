'use client'

import Link from 'next/link'
import { Plus, Bell, Search, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface HeaderProps {
  title: string
  subtitle?: string
  action?: {
    label: string
    href: string
    icon?: React.ReactNode
  }
  showSearch?: boolean
  notifications?: number
}

export function Header({ title, subtitle, action, showSearch = false, notifications = 0 }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Title and subtitle */}
          <div className="flex-1">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center lg:hidden">
                  <Users className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="ml-4 lg:ml-0">
                <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
                {subtitle && (
                  <p className="text-sm text-gray-500">{subtitle}</p>
                )}
              </div>
            </div>
          </div>

          {/* Right side - Actions and search */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            {showSearch && (
              <div className="hidden md:block">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="search"
                    placeholder="Search trips..."
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            )}

            {/* Notifications */}
            <div className="relative">
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
                {notifications > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {notifications > 99 ? '99+' : notifications}
                  </Badge>
                )}
              </Button>
            </div>

            {/* Action button */}
            {action && (
              <Link href={action.href}>
                <Button>
                  {action.icon}
                  {action.label}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header