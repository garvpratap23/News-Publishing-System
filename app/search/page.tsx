"use client"

import React from "react"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ArticleCard } from "@/components/article-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, Loader2, X } from "lucide-react"

const CATEGORIES = [
  "Technology",
  "Politics",
  "Business",
  "Sports",
  "Entertainment",
  "Science",
  "Health",
  "World",
]

interface Article {
  _id: string
  title: string
  slug: string
  excerpt: string
  featuredImage?: string
  category: string
  author: {
    firstName: string
    lastName: string
    avatar?: string
  }
  createdAt: string
  viewCount: number
  readTime: number
}

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [query, setQuery] = useState(searchParams.get("q") || "")
  const [category, setCategory] = useState(searchParams.get("category") || "")
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
  })

  useEffect(() => {
    const q = searchParams.get("q") || ""
    const cat = searchParams.get("category") || ""
    setQuery(q)
    setCategory(cat)
    
    if (q || cat) {
      performSearch(q, cat, 1)
    }
  }, [searchParams])

  const performSearch = async (
    searchQuery: string,
    searchCategory: string,
    page: number
  ) => {
    if (!searchQuery && !searchCategory) return

    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set("q", searchQuery)
      if (searchCategory) params.set("category", searchCategory)
      params.set("page", page.toString())
      params.set("limit", "12")

      const response = await fetch(`/api/search?${params}`)
      if (response.ok) {
        const data = await response.json()
        setArticles(data.articles)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query) params.set("q", query)
    if (category) params.set("category", category)
    router.push(`/search?${params}`)
  }

  const handleCategoryChange = (value: string) => {
    setCategory(value === "all" ? "" : value)
    const params = new URLSearchParams()
    if (query) params.set("q", query)
    if (value !== "all") params.set("category", value)
    router.push(`/search?${params}`)
  }

  const clearFilters = () => {
    setQuery("")
    setCategory("")
    router.push("/search")
    setArticles([])
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-foreground mb-2">
            Search Articles
          </h1>
          <p className="text-muted-foreground">
            Find articles by keyword, topic, or category
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search articles..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={category || "all"} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit">Search</Button>
          </div>
        </form>

        {/* Active Filters */}
        {(query || category) && (
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="text-sm text-muted-foreground">Filters:</span>
            {query && (
              <Badge variant="secondary" className="gap-1">
                &quot;{query}&quot;
                <button
                  onClick={() => {
                    setQuery("")
                    const params = new URLSearchParams()
                    if (category) params.set("category", category)
                    router.push(`/search?${params}`)
                  }}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {category && (
              <Badge variant="secondary" className="gap-1">
                {category}
                <button
                  onClick={() => {
                    setCategory("")
                    const params = new URLSearchParams()
                    if (query) params.set("q", query)
                    router.push(`/search?${params}`)
                  }}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground"
            >
              Clear all
            </Button>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : articles.length > 0 ? (
          <>
            <p className="text-sm text-muted-foreground mb-6">
              Found {pagination.total} article{pagination.total !== 1 ? "s" : ""}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article) => (
                <ArticleCard key={article._id} article={article} />
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  disabled={pagination.page <= 1}
                  onClick={() => performSearch(query, category, pagination.page - 1)}
                >
                  Previous
                </Button>
                <span className="flex items-center px-4 text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => performSearch(query, category, pagination.page + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : query || category ? (
          <div className="text-center py-12">
            <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No articles found matching your search criteria
            </p>
          </div>
        ) : (
          <div className="text-center py-12">
            <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Enter a search term or select a category to find articles
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}
