'use client'

import { useAuth } from '@/contexts/auth-context'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Eye,
  ThumbsUp,
  MessageSquare,
  PenSquare,
  TrendingUp,
  Calendar,
  BarChart3,
  Edit,
  Trash2,
  Clock,
} from 'lucide-react'

interface Stats {
  totalArticles: number
  totalViews: number
  totalLikes: number
  totalComments: number
  recentArticles: any[]
  drafts: any[]
}

export default function AuthorDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/author/stats')
        if (res.ok) {
          const data = await res.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchStats()
    }
  }, [user])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl space-y-8">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-muted-foreground mt-2">
            Here's what's happening with your articles today.
          </p>
        </div>
        <Link href="/author/write">
          <Button size="lg" className="gap-2 shadow-lg">
            <PenSquare className="h-5 w-5" />
            Write New Article
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Articles
            </CardTitle>
            <FileText className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalArticles || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Published articles
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Views
            </CardTitle>
            <Eye className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalViews || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Article impressions
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Likes
            </CardTitle>
            <ThumbsUp className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalLikes || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Appreciation received
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Comments
            </CardTitle>
            <MessageSquare className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalComments || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Engagement received
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/author/write">
          <Card className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 bg-primary/10 rounded-lg">
                <PenSquare className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Create Article</h3>
                <p className="text-sm text-muted-foreground">Write something new</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/author/articles">
          <Card className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <FileText className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h3 className="font-semibold">My Articles</h3>
                <p className="text-sm text-muted-foreground">Manage your content</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/author/analytics">
          <Card className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <BarChart3 className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <h3 className="font-semibold">Analytics</h3>
                <p className="text-sm text-muted-foreground">View performance</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Articles & Drafts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Articles */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Recent Articles
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.recentArticles && stats.recentArticles.length > 0 ? (
              <div className="space-y-4">
                {stats.recentArticles.map((article: any) => (
                  <div
                    key={article._id}
                    className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/article/${article.slug}`}
                        className="font-medium text-foreground hover:text-primary line-clamp-2 block"
                      >
                        {article.title}
                      </Link>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {article.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="h-4 w-4" />
                          {article.likes?.length || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(article.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Link href={`/author/edit/${article._id}`}>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No articles yet</p>
                <Link href="/author/write">
                  <Button className="mt-4" variant="outline">
                    Create your first article
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Drafts */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              Drafts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.drafts && stats.drafts.length > 0 ? (
              <div className="space-y-4">
                {stats.drafts.map((article: any) => (
                  <div
                    key={article._id}
                    className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/author/edit/${article._id}`}
                        className="font-medium text-foreground hover:text-primary line-clamp-2 block"
                      >
                        {article.title || 'Untitled Draft'}
                      </Link>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          Draft
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Last edited: {new Date(article.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Link href={`/author/edit/${article._id}`}>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No drafts</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Your saved drafts will appear here
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
