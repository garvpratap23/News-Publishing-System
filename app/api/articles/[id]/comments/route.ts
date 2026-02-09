import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Comment from '@/lib/models/comment'
import Article from '@/lib/models/article'
import { getCurrentUserPayload, hasRole } from '@/lib/auth'

// GET - Get comments for an article
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    await connectToDatabase()

    // Verify article exists
    const article = await Article.findById(id)
    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    const skip = (page - 1) * limit

    // Get top-level comments (not replies)
    const [comments, total] = await Promise.all([
      Comment.find({ article: id, parent: null, isHidden: false })
        .populate('user', 'name avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Comment.countDocuments({ article: id, parent: null, isHidden: false }),
    ])

    // Get replies for each comment
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await Comment.find({
          parent: comment._id,
          isHidden: false,
        })
          .populate('user', 'name avatar')
          .sort({ createdAt: 1 })
          .lean()

        return { ...comment, replies }
      })
    )

    return NextResponse.json({
      comments: commentsWithReplies,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get comments error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create a comment
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
    const { text, parentId } = body

    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: 'Comment text is required' },
        { status: 400 }
      )
    }

    if (text.length > 2000) {
      return NextResponse.json(
        { error: 'Comment cannot exceed 2000 characters' },
        { status: 400 }
      )
    }

    await connectToDatabase()

    // Verify article exists and is published
    const article = await Article.findById(id)
    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    if (article.status !== 'published') {
      return NextResponse.json(
        { error: 'Cannot comment on unpublished article' },
        { status: 400 }
      )
    }

    // If replying, verify parent comment exists
    if (parentId) {
      const parentComment = await Comment.findById(parentId)
      if (!parentComment || parentComment.article.toString() !== id) {
        return NextResponse.json(
          { error: 'Parent comment not found' },
          { status: 404 }
        )
      }
    }

    const comment = await Comment.create({
      article: id,
      user: user.userId,
      parent: parentId || null,
      text: text.trim(),
    })

    const populatedComment = await Comment.findById(comment._id)
      .populate('user', 'name avatar')
      .lean()

    return NextResponse.json(
      {
        message: 'Comment created successfully',
        comment: populatedComment,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create comment error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a comment (admin/editor only, or own comment)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserPayload()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const commentId = searchParams.get('commentId')

    if (!commentId) {
      return NextResponse.json(
        { error: 'Comment ID is required' },
        { status: 400 }
      )
    }

    await connectToDatabase()

    const comment = await Comment.findById(commentId)

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    const isOwner = comment.user.toString() === user.userId
    const isAdminOrEditor = hasRole(user.role, ['admin', 'editor'])

    if (!isOwner && !isAdminOrEditor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Soft delete by hiding
    await Comment.findByIdAndUpdate(commentId, { isHidden: true })

    return NextResponse.json({ message: 'Comment deleted successfully' })
  } catch (error) {
    console.error('Delete comment error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
