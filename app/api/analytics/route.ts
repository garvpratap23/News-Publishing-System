import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Article from '@/lib/models/article'
import { getCurrentUserPayload, hasRole } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const userPayload = await getCurrentUserPayload()

    if (!userPayload) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    await connectToDatabase()

    // If admin, return system-wide analytics
    // If author, return their articles' analytics
    // If reader, return their reading stats

    const isAdmin = hasRole(userPayload.role, ['admin'])
    const isAuthor = hasRole(userPayload.role, ['author', 'editor'])

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stats: any = {}

    if (isAdmin) {
      const [totalArticles, totalViews, publishedCount, pendingCount] = await Promise.all([
        Article.countDocuments(),
        Article.aggregate([{ $group: { _id: null, total: { $sum: '$views' } } }]),
        Article.countDocuments({ status: 'published' }),
        Article.countDocuments({ status: 'pending' }),
      ])

      stats.system = {
        totalArticles,
        totalViews: totalViews[0]?.total || 0,
        publishedCount,
        pendingCount,
      }
    }

    if (isAuthor) {
      const authorArticles = await Article.find({ author: userPayload.userId })
      const views = authorArticles.reduce((acc, curr) => acc + (curr.views || 0), 0)
      const likes = authorArticles.reduce((acc, curr) => acc + (curr.likes?.length || 0), 0)

      stats.author = {
        totalArticles: authorArticles.length,
        totalViews: views,
        totalLikes: likes,
        publishedCount: authorArticles.filter(a => a.status === 'published').length,
      }
    }

    // Reader stats (simplified for now, could aggregate readingHistory from User model)
    stats.user = {
      role: userPayload.role,
      // Add more specific user stats here if needed
    }

    return NextResponse.json({ analytics: stats })

  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
