import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import Article from '@/lib/models/article'
import Comment from '@/lib/models/comment'
import { connectToDatabase } from '@/lib/mongodb'

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth()

    if (!authResult.isAuthenticated || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = authResult.user

    if (!['author', 'editor', 'admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectToDatabase()

    // Get all articles by this author
    const articles = await Article.find({ author: user.userId })
      .sort({ createdAt: -1 })
      .lean()

    // Calculate stats
    const totalArticles = articles.filter(a => a.status === 'published').length
    const totalViews = articles.reduce((sum, a) => sum + (a.views || 0), 0)
    const totalLikes = articles.reduce((sum, a) => sum + (a.likes?.length || 0), 0)

    // Get total comments
    const articleIds = articles.map(a => a._id)
    const totalComments = await Comment.countDocuments({ article: { $in: articleIds } })

    // Get recent published articles (last 5)
    const recentArticles = articles
      .filter(a => a.status === 'published')
      .slice(0, 5)
      .map(a => ({
        _id: a._id,
        title: a.title,
        slug: a.slug,
        views: a.views || 0,
        likes: a.likes || [],
        publishedAt: a.publishedAt,
      }))

    // Get drafts
    const drafts = articles
      .filter(a => a.status === 'draft')
      .slice(0, 5)
      .map(a => ({
        _id: a._id,
        title: a.title,
        updatedAt: a.updatedAt,
      }))

    return NextResponse.json({
      totalArticles,
      totalViews,
      totalLikes,
      totalComments,
      recentArticles,
      drafts,
    })
  } catch (error: any) {
    console.error('Error fetching author stats:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
