import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Article from '@/lib/models/article'
import User from '@/lib/models/user'
import { getCurrentUserPayload } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const userPayload = await getCurrentUserPayload()
    if (!userPayload) {
      return NextResponse.json({ articles: [] })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '6')

    await connectToDatabase()

    const user = await User.findById(userPayload.userId).lean()
    if (!user) {
      return NextResponse.json({ articles: [] })
    }

    const { preferences = [], location = '', readingHistory = [] } = user

    // Aggregation pipeline for personalization
    const pipeline: any[] = [
      {
        $match: {
          status: 'published',
          _id: { $nin: readingHistory }, // Exclude read articles
        },
      },
      {
        $addFields: {
          isPreferredCategory: { $in: ['$category', preferences] },
          // Check if location matches any tag (case-insensitive would be better but complex in agg)
          // We'll trust exact match for now or handle case in frontend/input
          isLocationMatch: location
            ? { $in: [location, '$tags'] }
            : false,
        },
      },
      {
        $addFields: {
          score: {
            $add: [
              { $cond: ['$isPreferredCategory', 10, 0] },
              { $cond: ['$isLocationMatch', 5, 0] },
            ],
          },
        },
      },
      {
        $sort: {
          score: -1,        // High score first
          publishedAt: -1,  // Then newest
        },
      },
      { $limit: limit },
      {
        $project: {
          title: 1,
          slug: 1,
          excerpt: 1,
          bannerImage: 1,
          category: 1,
          tags: 1,
          publishedAt: 1,
          author: 1,
          views: 1,
          likes: 1,
          score: 1, // Debugging
        },
      },
    ]

    const articles = await Article.aggregate(pipeline)

    // Populate author since aggregate doesn't do it automatically like mongoose find
    await Article.populate(articles, { path: 'author', select: 'name avatar' })

    return NextResponse.json({ articles })
  } catch (error) {
    console.error('Personalized feed error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
