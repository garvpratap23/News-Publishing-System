'use client'

import { useAuth } from '@/contexts/auth-context'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import {
  LayoutDashboard,
  PenSquare,
  FileText,
  User,
  Settings,
  LogOut,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AuthorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    } else if (!loading && user && !['author', 'editor', 'admin'].includes(user.role)) {
      // Redirect non-authors to home
      router.push('/')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user || !['author', 'editor', 'admin'].includes(user.role)) {
    return null
  }

  const navigation = [
    { name: 'Dashboard', href: '/author/dashboard', icon: LayoutDashboard },
    { name: 'Write Article', href: '/author/write', icon: PenSquare },
    { name: 'My Articles', href: '/author/articles', icon: FileText },
    { name: 'Profile', href: '/author/profile', icon: User },
    { name: 'Settings', href: '/author/settings', icon: Settings },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <div className="flex-1 flex">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-50 border-r border-gray-200 p-6">
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900">Author Portal</h2>
            <p className="text-sm text-gray-600 mt-1">{user.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user.role}</p>
          </div>

          <nav className="space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                      ? 'bg-primary text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              )
            })}
          </nav>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-700 hover:text-red-600 hover:bg-red-50"
              onClick={() => {
                logout()
                router.push('/')
              }}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Logout
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 bg-white">
          {children}
        </main>
      </div>

      <Footer />
    </div>
  )
}
