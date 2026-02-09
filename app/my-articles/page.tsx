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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  PenSquare,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Send,
  Loader2,
  FileText,
} from 'lucide-react'
import { toast } from 'sonner'

interface Article {
  _id: string
  title: string
  slug: string
  category: string
  status: string
  views: number
  likes: string[]
  editorFeedback?: string
  publishedAt?: string
  createdAt: string
  updatedAt: string
}

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  published: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  archived: 'bg-gray-100 text-gray-800',
}

export default function MyArticlesPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [articles, setArticles] = useState<Article[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && (!user || !['admin', 'editor', 'author'].includes(user.role))) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      fetchArticles()
    }
  }, [user])

  async function fetchArticles() {
    try {
      const res = await fetch(`/api/articles?author=${user?.id}&limit=100`)
      if (res.ok) {
        const data = await res.json()
        setArticles(data.articles)
      }
    } catch (error) {
      console.error('Error fetching articles:', error)
      toast.error('Failed to load articles')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return

    setDeletingId(id)
    try {
      const res = await fetch(`/api/articles/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setArticles(articles.filter((a) => a._id !== id))
        toast.success('Article deleted')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to delete article')
      }
    } catch {
      toast.error('Failed to delete article')
    } finally {
      setDeletingId(null)
    }
  }

  const handleSubmitForReview = async (id: string) => {
    try {
      const res = await fetch(`/api/articles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'pending' }),
      })
      if (res.ok) {
        setArticles(
          articles.map((a) => (a._id === id ? { ...a, status: 'pending' } : a))
        )
        toast.success('Article submitted for review')
      }
    } catch {
      toast.error('Failed to submit article')
    }
  }

  const filteredArticles = articles.filter((article) => {
    if (activeTab === 'all') return true
    return article.status === activeTab
  })

  const stats = {
    total: articles.length,
    published: articles.filter((a) => a.status === 'published').length,
    draft: articles.filter((a) => a.status === 'draft').length,
    pending: articles.filter((a) => a.status === 'pending').length,
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user || !['admin', 'editor', 'author'].includes(user.role)) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-serif font-bold text-foreground">
                My Articles
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage your published and draft articles
              </p>
            </div>
            <Button asChild>
              <Link href="/write">
                <PenSquare className="h-4 w-4 mr-2" />
                Write New Article
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Articles</CardDescription>
                <CardTitle className="text-3xl">{stats.total}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Published</CardDescription>
                <CardTitle className="text-3xl text-green-600">
                  {stats.published}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Drafts</CardDescription>
                <CardTitle className="text-3xl text-muted-foreground">
                  {stats.draft}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Pending Review</CardDescription>
                <CardTitle className="text-3xl text-yellow-600">
                  {stats.pending}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Articles Table */}
          <Card>
            <CardContent className="p-0">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="border-b border-border px-4">
                  <TabsList className="bg-transparent">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="published">Published</TabsTrigger>
                    <TabsTrigger value="draft">Drafts</TabsTrigger>
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="rejected">Rejected</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value={activeTab} className="m-0">
                  {isLoading ? (
                    <div className="p-8 space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : filteredArticles.length === 0 ? (
                    <div className="p-12 text-center">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">
                        No articles found
                      </p>
                      <Button asChild>
                        <Link href="/write">Write your first article</Link>
                      </Button>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Views</TableHead>
                          <TableHead className="text-right">Likes</TableHead>
                          <TableHead>Updated</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredArticles.map((article) => (
                          <TableRow key={article._id}>
                            <TableCell>
                              <div className="max-w-[300px]">
                                <Link
                                  href={
                                    article.status === 'published'
                                      ? `/article/${article.slug}`
                                      : `/write/${article._id}`
                                  }
                                  className="font-medium text-foreground hover:underline line-clamp-1"
                                >
                                  {article.title}
                                </Link>
                                {article.editorFeedback && article.status === 'rejected' && (
                                  <p className="text-xs text-destructive mt-1 line-clamp-1">
                                    Feedback: {article.editorFeedback}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{article.category}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={statusColors[article.status]}>
                                {article.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {article.views}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {article.likes.length}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {formatDistanceToNow(new Date(article.updatedAt), {
                                addSuffix: true,
                              })}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Actions</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {article.status === 'published' && (
                                    <DropdownMenuItem asChild>
                                      <Link href={`/article/${article.slug}`}>
                                        <Eye className="h-4 w-4 mr-2" />
                                        View
                                      </Link>
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem asChild>
                                    <Link href={`/write/${article._id}`}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit
                                    </Link>
                                  </DropdownMenuItem>
                                  {article.status === 'draft' && (
                                    <DropdownMenuItem
                                      onClick={() => handleSubmitForReview(article._id)}
                                    >
                                      <Send className="h-4 w-4 mr-2" />
                                      Submit for Review
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDelete(article._id)}
                                    className="text-destructive"
                                    disabled={deletingId === article._id}
                                  >
                                    {deletingId === article._id ? (
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-4 w-4 mr-2" />
                                    )}
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
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
      </main>

      <Footer />
    </div>
  )
}
