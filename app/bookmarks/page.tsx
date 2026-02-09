'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { ArticleCard } from '@/components/article-card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Bookmark, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface Author {
  _id: string
  name: string
  avatar?: string
}

interface Article {
  _id: string
  title: string
  slug: string
  excerpt: string
  bannerImage?: string
  author: Author
  category: string
  tags: string[]
  views: number
  likes: string[]
  publishedAt: string
  createdAt: string
}

export default function BookmarksPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [articles, setArticles] = useState<Article[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    // For now, using local storage for bookmarks
    // In production, fetch from user's savedArticles
    if (user) {
      setIsLoading(false)
    }
  }, [user])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
              Your Bookmarks
            </h1>
            <p className="text-muted-foreground mt-1">
              Articles you've saved for later
            </p>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="aspect-[16/10] rounded-lg" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ))}
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-16">
              <Bookmark className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">
                No bookmarks yet
              </h2>
              <p className="text-muted-foreground mb-6">
                Save articles to read later by clicking the bookmark icon.
              </p>
              <Button asChild>
                <Link href="/articles">Browse Articles</Link>
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article) => (
                <ArticleCard key={article._id} article={article} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
