'use client'

import { useEffect, useState } from 'react'
import { useRef } from 'react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { ArticleCard } from '@/components/article-card'
import { useAuth } from '@/contexts/auth-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowRight, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { Chatbot } from '@/components/chatbot'

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

const categories = [
  'Politics',
  'Business',
  'Technology',
  'Sports',
  'Entertainment',
  'Science',
  'Health',
  'World',
  'India',
  'Global',
]

export default function HomePage() {
  const { user } = useAuth()
  const [articles, setArticles] = useState<Article[]>([])
  const [trendingArticles, setTrendingArticles] = useState<Article[]>([])
  const [globalNews, setGlobalNews] = useState<Article[]>([])
  const [personalizedArticles, setPersonalizedArticles] = useState<Article[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchArticles() {
      try {
        // Add timestamp to prevent caching
        const timestamp = Date.now()
        const [latestRes, trendingRes, newsRes] = await Promise.all([
          fetch(`/api/articles?limit=9&sort=newest&t=${timestamp}`, { cache: 'no-store' }),
          fetch(`/api/articles?limit=5&sort=trending&t=${timestamp}`, { cache: 'no-store' }),
          fetch(`/api/news/fetch?category=general&limit=6&t=${timestamp}`, { cache: 'no-store' }),
        ])

        if (latestRes.ok) {
          const data = await latestRes.json()
          setArticles(data.articles)
        }

        if (trendingRes.ok) {
          const data = await trendingRes.json()
          setTrendingArticles(data.articles)
        }

        if (newsRes.ok) {
          const newsData = await newsRes.json()
          setGlobalNews(newsData.news || [])
        }
      } catch (error) {
        console.error('Error fetching articles:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchArticles()
  }, [])

  useEffect(() => {
    async function fetchPersonalized() {
      if (!user) return

      try {
        const res = await fetch('/api/articles/personalized?limit=6')
        if (res.ok) {
          const data = await res.json()
          setPersonalizedArticles(data.articles)
        }
      } catch (error) {
        console.error('Error fetching personalized articles:', error)
      }
    }

    if (user) {
      fetchPersonalized()
    }
  }, [user])

  const featuredArticle = articles[0]
  const regularArticles = articles.slice(1)

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="border-b border-border">
          <div className="container mx-auto px-4 py-8">
            {isLoading ? (
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Skeleton className="aspect-[16/9] rounded-lg" />
                </div>
                <div className="space-y-4">
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                </div>
              </div>
            ) : featuredArticle ? (
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <ArticleCard article={featuredArticle} variant="featured" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="h-5 w-5 text-accent" />
                    <span className="font-semibold text-foreground">Trending Now</span>
                  </div>
                  {trendingArticles.slice(0, 4).map((article) => (
                    <ArticleCard key={article._id} article={article} variant="compact" />
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <h2 className="text-2xl font-semibold text-foreground mb-2">
                  No articles yet
                </h2>
                <p className="text-muted-foreground mb-4">
                  Be the first to publish an article on NewsHub
                </p>
                <Button asChild>
                  <Link href="/write">Write an Article</Link>
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Categories Bar */}
        <section className="border-b border-border bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-2 py-4 overflow-x-auto scrollbar-hide">
              {categories.map((category) => (
                <Link key={category} href={`/category/${category.toLowerCase()}`}>
                  <Badge
                    variant="secondary"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors whitespace-nowrap"
                  >
                    {category}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        </section>


        {/* Personalized Feed */}
        {user && personalizedArticles.length > 0 && (
          <section className="py-12 bg-muted/30">
            <div className="container mx-auto px-4">
              <div className="flex items-center gap-2 mb-8">
                <TrendingUp className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-serif font-bold text-foreground">
                  Recommended For You
                </h2>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {personalizedArticles.map((article) => (
                  <ArticleCard key={article._id} article={article} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Latest Articles */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-serif font-bold text-foreground">
                Latest Stories
              </h2>
              <Button asChild variant="ghost" className="text-muted-foreground">
                <Link href="/articles">
                  View all
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {isLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="space-y-4">
                    <Skeleton className="aspect-[16/10] rounded-lg" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {regularArticles.map((article) => (
                  <ArticleCard key={article._id} article={article} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Global News Section */}
        {globalNews.length > 0 && (
          <section className="py-12 bg-muted/30">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-serif font-bold text-foreground">
                    🌍 Global News
                  </h2>
                  <Badge variant="secondary" className="text-xs">
                    Live from Perplexity AI
                  </Badge>
                </div>
                <Button asChild variant="ghost" className="text-muted-foreground">
                  <Link href="/articles">
                    View all
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>

              {isLoading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="space-y-4">
                      <Skeleton className="aspect-[16/10] rounded-lg" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {globalNews.map((news) => (
                    <ArticleCard key={news._id} article={news} />
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Newsletter CTA */}
        <section className="bg-primary text-primary-foreground py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-serif font-bold mb-4 text-balance">
              Stay Informed with NewsHub
            </h2>
            <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8">
              Get the latest stories delivered directly to your inbox. Quality journalism,
              no spam.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-md bg-primary-foreground text-primary placeholder:text-primary/60 focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <Button variant="secondary" size="lg">
                Subscribe
              </Button>
            </div>
          </div>
        </section>

        {/* Category Sections */}
        {['Technology', 'Business', 'Sports'].map((category) => {
          const categoryArticles = articles.filter(
            (a) => a.category === category
          )
          if (categoryArticles.length === 0) return null

          return (
            <section key={category} className="py-12 border-t border-border">
              <div className="container mx-auto px-4">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-serif font-bold text-foreground">
                    {category}
                  </h2>
                  <Button asChild variant="ghost" className="text-muted-foreground">
                    <Link href={`/category/${category.toLowerCase()}`}>
                      More {category}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categoryArticles.slice(0, 3).map((article) => (
                    <ArticleCard key={article._id} article={article} />
                  ))}
                </div>
              </div>
            </section>
          )
        })}
      </main>

      <Footer />

      {/* AI Chatbot for General Questions */}
      <Chatbot />
    </div >
  )
}
