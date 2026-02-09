'use client'

import { useAuth } from '@/contexts/auth-context'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  BarChart3,
  TrendingUp,
  Eye,
  ThumbsUp,
  MessageSquare,
  Calendar,
  ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'

interface AnalyticsData {
  totalArticles: number
  totalViews: number
  totalLikes: number
  totalComments: number
  topArticles: Array<{
    _id: string
    title: string
    slug: string
    views: number
    likes: number
    comments: number
    createdAt: string
  }>
  viewsOverTime: Array<{
    date: string
    views: number
  }>
}

export default function AnalyticsPage() {
  const { user } = useAuth()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch('/api/author/analytics')
        if (res.ok) {
          const data = await res.json()
          setAnalytics(data)
        }
      } catch (error) {
        console.error('Error fetching analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchAnalytics()
    }
  }, [user])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const engagementRate = analytics?.totalViews
    ? (((analytics.totalLikes + analytics.totalComments) / analytics.totalViews) * 100).toFixed(2)
    : '0'

  return (
    <div className="max-w-7xl space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/author/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Track your content performance and engagement
          </p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Views
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics?.totalViews || 0}</div>
            <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
              <TrendingUp className="h-4 w-4" />
              <span>All time</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Likes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics?.totalLikes || 0}</div>
            <div className="flex items-center gap-1 mt-2 text-sm text-purple-600">
              <ThumbsUp className="h-4 w-4" />
              <span>Appreciation</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Comments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics?.totalComments || 0}</div>
            <div className="flex items-center gap-1 mt-2 text-sm text-orange-600">
              <MessageSquare className="h-4 w-4" />
              <span>Engagement</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Engagement Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{engagementRate}%</div>
            <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
              <BarChart3 className="h-4 w-4" />
              <span>Performance</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Articles */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Top Performing Articles
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analytics?.topArticles && analytics.topArticles.length > 0 ? (
            <div className="space-y-4">
              {analytics.topArticles.map((article, index) => (
                <div
                  key={article._id}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold">
                    #{index + 1}
                  </div>
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
                        {article.views} views
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="h-4 w-4" />
                        {article.likes} likes
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        {article.comments} comments
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(article.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No analytics data available yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Publish articles to see performance metrics
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Quick Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <span className="text-sm font-medium">Average views per article</span>
              <span className="text-lg font-bold text-blue-600">
                {analytics?.totalArticles
                  ? Math.round(analytics.totalViews / analytics.totalArticles)
                  : 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
              <span className="text-sm font-medium">Average likes per article</span>
              <span className="text-lg font-bold text-purple-600">
                {analytics?.totalArticles
                  ? Math.round(analytics.totalLikes / analytics.totalArticles)
                  : 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
              <span className="text-sm font-medium">Average comments per article</span>
              <span className="text-lg font-bold text-orange-600">
                {analytics?.totalArticles
                  ? Math.round(analytics.totalComments / analytics.totalArticles)
                  : 0}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Content Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <span className="text-sm font-medium">Total articles published</span>
              <span className="text-lg font-bold text-green-600">
                {analytics?.totalArticles || 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg">
              <span className="text-sm font-medium">Engagement rate</span>
              <span className="text-lg font-bold text-indigo-600">{engagementRate}%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-pink-50 dark:bg-pink-950/20 rounded-lg">
              <span className="text-sm font-medium">Total interactions</span>
              <span className="text-lg font-bold text-pink-600">
                {(analytics?.totalLikes || 0) + (analytics?.totalComments || 0)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
