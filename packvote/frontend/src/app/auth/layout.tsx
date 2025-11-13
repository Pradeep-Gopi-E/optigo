import React from 'react';

/**
 * This is the layout component for the authentication pages.
 * It provides the common background gradient and centering.
 * The `children` prop will be either your LoginPage or RegisterPage.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // This is the common wrapper div from your login and register pages
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      {children}
    </div>
  );
}