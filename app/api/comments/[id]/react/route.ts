import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Comment from '@/lib/models/comment'
import { getCurrentUserPayload } from '@/lib/auth'

// POST - Like or dislike a comment
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
    const { action } = body

    if (!['like', 'dislike'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Use "like" or "dislike"' },
        { status: 400 }
      )
    }

    await connectToDatabase()

    const comment = await Comment.findById(id)

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    const userId = user.userId
    const hasLiked = comment.likes.some((id: { toString: () => string }) => id.toString() === userId)
    const hasDisliked = comment.dislikes.some((id: { toString: () => string }) => id.toString() === userId)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateOps: any = {}

    if (action === 'like') {
      if (hasLiked) {
        updateOps.$pull = { likes: userId }
      } else {
        updateOps.$addToSet = { likes: userId }
        if (hasDisliked) {
          updateOps.$pull = { dislikes: userId }
        }
      }
    } else {
      if (hasDisliked) {
        updateOps.$pull = { dislikes: userId }
      } else {
        updateOps.$addToSet = { dislikes: userId }
        if (hasLiked) {
          updateOps.$pull = { likes: userId }
        }
      }
    }

    // Handle conflicting operations
    if (updateOps.$pull && updateOps.$addToSet) {
      await Comment.findByIdAndUpdate(id, { $pull: updateOps.$pull })
      const updated = await Comment.findByIdAndUpdate(
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

    const updatedComment = await Comment.findByIdAndUpdate(id, updateOps, {
      new: true,
    })

    return NextResponse.json({
      message: 'Reaction updated',
      likes: updatedComment?.likes.length || 0,
      dislikes: updatedComment?.dislikes.length || 0,
    })
  } catch (error) {
    console.error('React to comment error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
