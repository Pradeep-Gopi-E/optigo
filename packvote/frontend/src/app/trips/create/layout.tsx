import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
    title: 'Create New Trip',
}

export const viewport: Viewport = {
    themeColor: '#ffffff',
}

export default function CreateTripLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
