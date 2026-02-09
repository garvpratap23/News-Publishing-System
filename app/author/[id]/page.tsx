"use client"

import { useState, useEffect, use } from "react"
import Image from "next/image"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ArticleCard } from "@/components/article-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Calendar,
  FileText,
  Eye,
  Mail,
  Globe,
  Twitter,
  Loader2,
} from "lucide-react"

interface Author {
  _id: string
  firstName: string
  lastName: string
  email: string
  avatar?: string
  bio?: string
  role: string
  createdAt: string
  socialLinks?: {
    website?: string
    twitter?: string
  }
}

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

interface Stats {
  totalArticles: number
  totalViews: number
  categories: string[]
}

export default function AuthorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [author, setAuthor] = useState<Author | null>(null)
  const [articles, setArticles] = useState<Article[]>([])
  const [stats, setStats] = useState<Stats>({
    totalArticles: 0,
    totalViews: 0,
    categories: [],
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("articles")

  useEffect(() => {
    fetchAuthorData()
  }, [id])

  const fetchAuthorData = async () => {
    try {
      setLoading(true)

      // Fetch author info
      const authorRes = await fetch(`/api/users/${id}`)
      if (authorRes.ok) {
        const authorData = await authorRes.json()
        setAuthor(authorData.user)
      }

      // Fetch author's articles
      const articlesRes = await fetch(
        `/api/articles?author=${id}&status=published&limit=20`
      )
      if (articlesRes.ok) {
        const articlesData = await articlesRes.json()
        setArticles(articlesData.articles)

        // Calculate stats
        const totalViews = articlesData.articles.reduce(
          (sum: number, a: Article) => sum + (a.viewCount || 0),
          0
        )
        const categories = [
          ...new Set(articlesData.articles.map((a: Article) => a.category)),
        ] as string[]

        setStats({
          totalArticles: articlesData.articles.length,
          totalViews,
          categories,
        })
      }
    } catch (error) {
      console.error("Error fetching author data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!author) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Author Not Found
          </h1>
          <p className="text-muted-foreground mb-6">
            The author you&apos;re looking for doesn&apos;t exist.
          </p>
          <Button asChild>
            <Link href="/">Back to Home</Link>
          </Button>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Author Header */}
        <div className="bg-card border-b">
          <div className="container mx-auto px-4 py-12">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              <div className="relative w-32 h-32 rounded-full overflow-hidden bg-muted flex-shrink-0">
                {author.avatar ? (
                  <Image
                    src={author.avatar || "/placeholder.svg"}
                    alt={`${author.firstName} ${author.lastName}`}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary text-primary-foreground text-4xl font-bold">
                    {author.firstName[0]}
                    {author.lastName[0]}
                  </div>
                )}
              </div>

              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-3 mb-4">
                  <h1 className="text-3xl font-serif font-bold text-foreground">
                    {author.firstName} {author.lastName}
                  </h1>
                  <Badge variant="secondary" className="capitalize">
                    {author.role}
                  </Badge>
                </div>

                {author.bio && (
                  <p className="text-muted-foreground mb-4 max-w-2xl">
                    {author.bio}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Joined {new Date(author.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    {stats.totalArticles} articles
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {stats.totalViews.toLocaleString()} views
                  </div>
                </div>

                {/* Social Links */}
                <div className="flex items-center justify-center md:justify-start gap-2 mt-4">
                  {author.socialLinks?.website && (
                    <Button variant="outline" size="icon" asChild>
                      <a
                        href={author.socialLinks.website}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Globe className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  {author.socialLinks?.twitter && (
                    <Button variant="outline" size="icon" asChild>
                      <a
                        href={`https://twitter.com/${author.socialLinks.twitter}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Twitter className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  <Button variant="outline" size="icon" asChild>
                    <a href={`mailto:${author.email}`}>
                      <Mail className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Author Content */}
        <div className="container mx-auto px-4 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="articles">
                Articles ({stats.totalArticles})
              </TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
            </TabsList>

            <TabsContent value="articles">
              {articles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {articles.map((article) => (
                    <ArticleCard key={article._id} article={article} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No articles published yet
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="categories">
              {stats.categories.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {stats.categories.map((category) => (
                    <Link key={category} href={`/category/${category}`}>
                      <Badge
                        variant="outline"
                        className="text-base py-2 px-4 hover:bg-accent cursor-pointer"
                      >
                        {category}
                      </Badge>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No categories yet</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  )
}
