'use client'

import React from "react"

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { ArticleCard } from '@/components/article-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, ChevronLeft, ChevronRight, X } from 'lucide-react'

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

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

const categories = [
  'All',
  'Politics',
  'Business',
  'Technology',
  'Sports',
  'Entertainment',
  'Science',
  'Health',
  'World',
]

export default function ArticlesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [articles, setArticles] = useState<Article[]>([])
  const [globalNews, setGlobalNews] = useState<Article[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showGlobalNews, setShowGlobalNews] = useState(true)

  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All')
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest')
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'))

  useEffect(() => {
    async function fetchArticles() {
      setIsLoading(true)
      try {
        // Fetch local articles
        const params = new URLSearchParams()
        params.set('page', page.toString())
        params.set('limit', '12')
        params.set('sort', sort)

        if (selectedCategory !== 'All') {
          params.set('category', selectedCategory)
        }
        if (searchQuery.trim()) {
          params.set('search', searchQuery.trim())
        }

        const [articlesRes, newsRes] = await Promise.all([
          fetch(`/api/articles?${params.toString()}`),
          showGlobalNews && page === 1 && !searchQuery.trim()
            ? fetch(`/api/news/fetch?category=${selectedCategory === 'All' ? 'general' : selectedCategory}&limit=6`)
            : Promise.resolve(null),
        ])

        if (articlesRes.ok) {
          const data = await articlesRes.json()
          setArticles(data.articles)
          setPagination(data.pagination)
        }

        if (newsRes?.ok) {
          const newsData = await newsRes.json()
          setGlobalNews(newsData.news || [])
        } else {
          setGlobalNews([])
        }
      } catch (error) {
        console.error('Error fetching articles:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchArticles()

    // Update URL
    const params = new URLSearchParams()
    if (page > 1) params.set('page', page.toString())
    if (sort !== 'newest') params.set('sort', sort)
    if (selectedCategory !== 'All') params.set('category', selectedCategory)
    if (searchQuery.trim()) params.set('search', searchQuery.trim())

    const queryString = params.toString()
    router.replace(`/articles${queryString ? `?${queryString}` : ''}`, { scroll: false })
  }, [page, sort, selectedCategory, searchQuery, router])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCategory('All')
    setSort('newest')
    setPage(1)
  }

  const hasFilters = searchQuery || selectedCategory !== 'All' || sort !== 'newest'

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
              All Articles
            </h1>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <form onSubmit={handleSearch} className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </form>

              <div className="flex gap-2">
                <Select value={selectedCategory} onValueChange={(value) => { setSelectedCategory(value); setPage(1); }}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sort} onValueChange={(value) => { setSort(value); setPage(1); }}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="oldest">Oldest</SelectItem>
                    <SelectItem value="views">Most Viewed</SelectItem>
                    <SelectItem value="trending">Trending</SelectItem>
                  </SelectContent>
                </Select>

                {hasFilters && (
                  <Button variant="ghost" size="icon" onClick={clearFilters}>
                    <X className="h-4 w-4" />
                    <span className="sr-only">Clear filters</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Active Filters */}
            {hasFilters && (
              <div className="flex items-center gap-2 mt-4">
                <span className="text-sm text-muted-foreground">Filters:</span>
                {searchQuery && (
                  <Badge variant="secondary">
                    Search: {searchQuery}
                    <button onClick={() => setSearchQuery('')} className="ml-1">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {selectedCategory !== 'All' && (
                  <Badge variant="secondary">
                    {selectedCategory}
                    <button onClick={() => setSelectedCategory('All')} className="ml-1">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Results Count */}
          {pagination && !isLoading && (
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-muted-foreground">
                Showing {articles.length} local articles {globalNews.length > 0 && `+ ${globalNews.length} global news stories`}
                {pagination.total > 0 && ` of ${pagination.total} total`}
              </p>
              {page === 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowGlobalNews(!showGlobalNews)}
                >
                  {showGlobalNews ? 'Hide' : 'Show'} Global News
                </Button>
              )}
            </div>
          )}

          {/* Global News Section (only on first page) */}
          {showGlobalNews && globalNews.length > 0 && page === 1 && !searchQuery.trim() && (
            <div className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-serif font-bold text-foreground">
                  🌍 Latest Global News
                </h2>
                <Badge variant="secondary">Powered by Perplexity AI</Badge>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {globalNews.map((news) => (
                  <ArticleCard key={news._id} article={news} />
                ))}
              </div>
              <div className="border-t border-border mt-12 mb-8" />
            </div>
          )}

          {/* Local Articles Section */}
          {!isLoading && articles.length > 0 && (
            <div className="mb-8">
              {globalNews.length > 0 && page === 1 && !searchQuery.trim() && (
                <h2 className="text-2xl font-serif font-bold text-foreground mb-6">
                  📰 Local Articles
                </h2>
              )}
            </div>
          )}

          {/* Articles Grid */}
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="aspect-[16/10] rounded-lg" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          ) : articles.length === 0 && globalNews.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold text-foreground mb-2">
                No articles found
              </h2>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search or filters.
              </p>
              {hasFilters && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear all filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {articles.map((article) => (
                  <ArticleCard key={article._id} article={article} />
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>

                  <div className="flex items-center gap-1">
                    {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
                      let pageNum: number
                      if (pagination.pages <= 5) {
                        pageNum = i + 1
                      } else if (page <= 3) {
                        pageNum = i + 1
                      } else if (page >= pagination.pages - 2) {
                        pageNum = pagination.pages - 4 + i
                      } else {
                        pageNum = page - 2 + i
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={page === pageNum ? 'default' : 'outline'}
                          size="sm"
                          className="w-9"
                          onClick={() => setPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === pagination.pages}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
