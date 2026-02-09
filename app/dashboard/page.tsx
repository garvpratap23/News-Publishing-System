'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { useAuth } from '@/contexts/auth-context'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Users,
  FileText,
  MessageSquare,
  Eye,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  BarChart3,
} from 'lucide-react'
import { toast } from 'sonner'

interface Stats {
  totalUsers: number
  totalArticles: number
  publishedArticles: number
  pendingArticles: number
  totalComments: number
  totalViews: number
}

interface Article {
  _id: string
  title: string
  status: string
  views?: number
  likes?: string[]
  author: { name: string }
  createdAt: string
}

interface CategoryData {
  category: string
  count: number
}

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  published: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  archived: 'bg-gray-100 text-gray-800',
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentArticles, setRecentArticles] = useState<Article[]>([])
  const [topArticles, setTopArticles] = useState<Article[]>([])
  const [pendingArticles, setPendingArticles] = useState<Article[]>([])
  const [categoryData, setCategoryData] = useState<CategoryData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isApproving, setIsApproving] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && (!user || !['admin', 'editor'].includes(user.role))) {
      router.push('/')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user && ['admin', 'editor'].includes(user.role)) {
      fetchData()
    }
  }, [user])

  async function fetchData() {
    try {
      const [statsRes, pendingRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/articles?status=pending&limit=10'),
      ])

      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data.stats)
        setRecentArticles(data.recentArticles)
        setTopArticles(data.topArticles)
        setCategoryData(data.articlesByCategory)
      }

      if (pendingRes.ok) {
        const data = await pendingRes.json()
        setPendingArticles(data.articles)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleArticleAction = async (articleId: string, status: 'approved' | 'rejected' | 'published', feedback?: string) => {
    setIsApproving(articleId)
    try {
      const body: Record<string, string> = { status }
      if (feedback) body.editorFeedback = feedback

      const res = await fetch(`/api/articles/${articleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        setPendingArticles(pendingArticles.filter((a) => a._id !== articleId))
        toast.success(`Article ${status}`)
        fetchData()
      }
    } catch {
      toast.error('Failed to update article')
    } finally {
      setIsApproving(null)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user || !['admin', 'editor'].includes(user.role)) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-serif font-bold text-foreground">
              {user.role === 'admin' ? 'Admin Dashboard' : 'Editor Dashboard'}
            </h1>
            <p className="text-muted-foreground mt-1">
              Overview of your news platform
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {isLoading ? (
              [...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-16" />
                  </CardHeader>
                </Card>
              ))
            ) : stats ? (
              <>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Users
                    </CardDescription>
                    <CardTitle className="text-2xl">{stats.totalUsers}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Articles
                    </CardDescription>
                    <CardTitle className="text-2xl">{stats.totalArticles}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Published
                    </CardDescription>
                    <CardTitle className="text-2xl text-green-600">
                      {stats.publishedArticles}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-600" />
                      Pending
                    </CardDescription>
                    <CardTitle className="text-2xl text-yellow-600">
                      {stats.pendingArticles}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Comments
                    </CardDescription>
                    <CardTitle className="text-2xl">{stats.totalComments}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Total Views
                    </CardDescription>
                    <CardTitle className="text-2xl">
                      {stats.totalViews.toLocaleString()}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </>
            ) : null}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Pending Articles */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-yellow-600" />
                    Pending Review
                  </CardTitle>
                  <CardDescription>
                    Articles waiting for editorial approval
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-16" />
                      ))}
                    </div>
                  ) : pendingArticles.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No articles pending review
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Author</TableHead>
                          <TableHead>Submitted</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingArticles.map((article) => (
                          <TableRow key={article._id}>
                            <TableCell>
                              <Link
                                href={`/write/${article._id}`}
                                className="font-medium hover:underline line-clamp-1"
                              >
                                {article.title}
                              </Link>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {article.author.name}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {formatDistanceToNow(new Date(article.createdAt), {
                                addSuffix: true,
                              })}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleArticleAction(article._id, 'published')
                                  }
                                  disabled={isApproving === article._id}
                                >
                                  {isApproving === article._id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <CheckCircle className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-destructive bg-transparent"
                                  onClick={() =>
                                    handleArticleAction(
                                      article._id,
                                      'rejected',
                                      'Please revise and resubmit.'
                                    )
                                  }
                                  disabled={isApproving === article._id}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="recent">
                    <TabsList>
                      <TabsTrigger value="recent">Recent Articles</TabsTrigger>
                      <TabsTrigger value="top">Top Performing</TabsTrigger>
                    </TabsList>
                    <TabsContent value="recent" className="mt-4">
                      {isLoading ? (
                        <div className="space-y-4">
                          {[...Array(5)].map((_, i) => (
                            <Skeleton key={i} className="h-12" />
                          ))}
                        </div>
                      ) : (
                        <Table>
                          <TableBody>
                            {recentArticles.map((article) => (
                              <TableRow key={article._id}>
                                <TableCell>
                                  <Link
                                    href={`/write/${article._id}`}
                                    className="font-medium hover:underline line-clamp-1"
                                  >
                                    {article.title}
                                  </Link>
                                  <p className="text-sm text-muted-foreground">
                                    by {article.author.name}
                                  </p>
                                </TableCell>
                                <TableCell>
                                  <Badge className={statusColors[article.status]}>
                                    {article.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground text-right">
                                  {formatDistanceToNow(new Date(article.createdAt), {
                                    addSuffix: true,
                                  })}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </TabsContent>
                    <TabsContent value="top" className="mt-4">
                      {isLoading ? (
                        <div className="space-y-4">
                          {[...Array(5)].map((_, i) => (
                            <Skeleton key={i} className="h-12" />
                          ))}
                        </div>
                      ) : (
                        <Table>
                          <TableBody>
                            {topArticles.map((article) => (
                              <TableRow key={article._id}>
                                <TableCell>
                                  <Link
                                    href={`/article/${article._id}`}
                                    className="font-medium hover:underline line-clamp-1"
                                  >
                                    {article.title}
                                  </Link>
                                  <p className="text-sm text-muted-foreground">
                                    by {article.author.name}
                                  </p>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  <Eye className="h-4 w-4 inline mr-1" />
                                  {article.views?.toLocaleString()}
                                </TableCell>
                                <TableCell className="text-muted-foreground text-right">
                                  <TrendingUp className="h-4 w-4 inline mr-1" />
                                  {article.likes?.length || 0} likes
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Category Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Content by Category
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-3">
                      {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-6" />
                      ))}
                    </div>
                  ) : categoryData.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No data available
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {categoryData.map((cat) => {
                        const maxCount = Math.max(...categoryData.map((c) => c.count))
                        const percentage = (cat.count / maxCount) * 100
                        return (
                          <div key={cat.category}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-foreground">{cat.category}</span>
                              <span className="text-muted-foreground">{cat.count}</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button asChild className="w-full justify-start bg-transparent" variant="outline">
                    <Link href="/write">
                      <FileText className="h-4 w-4 mr-2" />
                      Write New Article
                    </Link>
                  </Button>
                  {user.role === 'admin' && (
                    <Button asChild className="w-full justify-start bg-transparent" variant="outline">
                      <Link href="/admin">
                        <Users className="h-4 w-4 mr-2" />
                        Manage Users
                      </Link>
                    </Button>
                  )}
                  <Button asChild className="w-full justify-start bg-transparent" variant="outline">
                    <Link href="/articles">
                      <Eye className="h-4 w-4 mr-2" />
                      View All Articles
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
