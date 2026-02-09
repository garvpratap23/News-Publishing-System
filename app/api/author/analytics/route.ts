import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Article from '@/lib/models/article'
import { verifyAuth } from '@/lib/auth'

export async function GET() {
  try {
    const authResult = await verifyAuth()
    if (!authResult.isAuthenticated || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = authResult.user.userId

    await connectToDatabase()

    // Get all articles by the author
    const articles = await Article.find({ author: userId })

    // Calculate analytics
    const totalArticles = articles.filter(a => a.status === 'published').length
    const totalViews = articles.reduce((sum, article) => sum + (article.views || 0), 0)
    const totalLikes = articles.reduce((sum, article) => sum + (article.likes?.length || 0), 0)
    const totalComments = articles.reduce((sum, article) => sum + (article.comments?.length || 0), 0)

    // Get top performing articles
    const topArticles = articles
      .filter(a => a.status === 'published')
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 5)
      .map(article => ({
        _id: article._id,
        title: article.title,
        slug: article.slug,
        views: article.views || 0,
        likes: article.likes?.length || 0,
        comments: article.comments?.length || 0,
        createdAt: article.createdAt,
      }))

    return NextResponse.json({
      totalArticles,
      totalViews,
      totalLikes,
      totalComments,
      topArticles,
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
