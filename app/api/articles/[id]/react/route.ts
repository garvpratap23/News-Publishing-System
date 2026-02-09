import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Article from '@/lib/models/article'
import { getCurrentUserPayload } from '@/lib/auth'

// POST - Like or dislike an article
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserPayload()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { action } = body // 'like' or 'dislike'

    if (!['like', 'dislike'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Use "like" or "dislike"' },
        { status: 400 }
      )
    }

    await connectToDatabase()

    const article = await Article.findById(id)

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    if (article.status !== 'published') {
      return NextResponse.json(
        { error: 'Cannot react to unpublished article' },
        { status: 400 }
      )
    }

    const userId = user.userId
    const hasLiked = article.likes.some((id: { toString: () => string }) => id.toString() === userId)
    const hasDisliked = article.dislikes.some((id: { toString: () => string }) => id.toString() === userId)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateOps: any = {}

    if (action === 'like') {
      if (hasLiked) {
        // Remove like (toggle off)
        updateOps.$pull = { likes: userId }
      } else {
        // Add like
        updateOps.$addToSet = { likes: userId }
        // Remove dislike if exists
        if (hasDisliked) {
          updateOps.$pull = { dislikes: userId }
        }
      }
    } else {
      if (hasDisliked) {
        // Remove dislike (toggle off)
        updateOps.$pull = { dislikes: userId }
      } else {
        // Add dislike
        updateOps.$addToSet = { dislikes: userId }
        // Remove like if exists
        if (hasLiked) {
          updateOps.$pull = { likes: userId }
        }
      }
    }

    // Handle conflicting $pull and $addToSet operations
    if (updateOps.$pull && updateOps.$addToSet) {
      // Need to run in sequence
      await Article.findByIdAndUpdate(id, { $pull: updateOps.$pull })
      const updated = await Article.findByIdAndUpdate(
        id,
        { $addToSet: updateOps.$addToSet },
        { new: true }
      )
      return NextResponse.json({
        message: 'Reaction updated',
        likes: updated?.likes.length || 0,
        dislikes: updated?.dislikes.length || 0,
      })
    }

    const updatedArticle = await Article.findByIdAndUpdate(id, updateOps, {
      new: true,
    })

    return NextResponse.json({
      message: 'Reaction updated',
      likes: updatedArticle?.likes.length || 0,
      dislikes: updatedArticle?.dislikes.length || 0,
    })
  } catch (error) {
    console.error('React to article error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
