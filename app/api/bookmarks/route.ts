import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import User from '@/lib/models/user'
import Article from '@/lib/models/article'
import { getCurrentUserPayload } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const userPayload = await getCurrentUserPayload()

    if (!userPayload) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { articleId, action = 'save' } = body // action: 'save' or 'remove'

    if (!articleId) {
      return NextResponse.json(
        { error: 'Article ID is required' },
        { status: 400 }
      )
    }

    await connectToDatabase()

    // Verify article exists
    const article = await Article.findById(articleId)
    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    const updateQuery = action === 'remove'
      ? { $pull: { savedArticles: articleId } }
      : { $addToSet: { savedArticles: articleId } }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = await User.findByIdAndUpdate(
      userPayload.userId,
      updateQuery as any,
      { new: true }
    )

    return NextResponse.json({
      message: `Article ${action === 'remove' ? 'removed from' : 'saved to'} bookmarks`,
      savedArticles: user?.savedArticles,
    })

  } catch (error) {
    console.error('Bookmark error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
