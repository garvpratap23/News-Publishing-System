import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Article from '@/lib/models/article'
import User from '@/lib/models/user'
import Comment from '@/lib/models/comment'
import { getCurrentUserPayload, hasRole } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUserPayload()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    if (!hasRole(user.role, ['admin', 'editor'])) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    await connectToDatabase()

    // Get stats
    const [
      totalUsers,
      totalArticles,
      publishedArticles,
      pendingArticles,
      totalComments,
      totalViews,
      usersByRole,
      articlesByCategory,
      recentArticles,
      topArticles,
    ] = await Promise.all([
      User.countDocuments(),
      Article.countDocuments(),
      Article.countDocuments({ status: 'published' }),
      Article.countDocuments({ status: 'pending' }),
      Comment.countDocuments(),
      Article.aggregate([
        { $group: { _id: null, totalViews: { $sum: '$views' } } },
      ]).then((res) => res[0]?.totalViews || 0),
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
      Article.aggregate([
        { $match: { status: 'published' } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Article.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('author', 'name')
        .select('title status createdAt author')
        .lean(),
      Article.find({ status: 'published' })
        .sort({ views: -1 })
        .limit(5)
        .populate('author', 'name')
        .select('title views likes author')
        .lean(),
    ])

    // Format usersByRole
    const rolesMap: Record<string, number> = {}
    usersByRole.forEach((r: { _id: string; count: number }) => {
      rolesMap[r._id] = r.count
    })

    // Format articlesByCategory for chart
    const categoryData = articlesByCategory.map((c: { _id: string; count: number }) => ({
      category: c._id,
      count: c.count,
    }))

    return NextResponse.json({
      stats: {
        totalUsers,
        totalArticles,
        publishedArticles,
        pendingArticles,
        totalComments,
        totalViews,
      },
      usersByRole: rolesMap,
      articlesByCategory: categoryData,
      recentArticles,
      topArticles,
    })
  } catch (error) {
    console.error('Get admin stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
