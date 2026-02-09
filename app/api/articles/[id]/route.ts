import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Article from '@/lib/models/article'
import User from '@/lib/models/user'
import { getCurrentUserPayload, hasRole } from '@/lib/auth'

// GET - Get single article by ID or slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await connectToDatabase()

    let article = null

    // Check if id is a valid MongoDB ObjectId (24 hex characters)
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id)

    if (isValidObjectId) {
      // Try to find by ID first
      article = await Article.findById(id)
        .populate('author', 'name avatar bio')
        .lean()
    }

    // If not found by ID or ID was not valid, try to find by slug
    if (!article) {
      article = await Article.findOne({ slug: id })
        .populate('author', 'name avatar bio')
        .lean()
    }

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    // Check access based on status
    if (article.status !== 'published') {
      const user = await getCurrentUserPayload()
      if (!user) {
        return NextResponse.json({ error: 'Article not found' }, { status: 404 })
      }
      // Only author, editors, or admins can view non-published articles
      const isAuthor = user.userId === article.author._id.toString()
      if (!isAuthor && !hasRole(user.role, ['admin', 'editor'])) {
        return NextResponse.json({ error: 'Article not found' }, { status: 404 })
      }
    } else {
      // Increment views for published articles
      await Article.findByIdAndUpdate(article._id, { $inc: { views: 1 } })

      // Track reading history if user is logged in
      const user = await getCurrentUserPayload()
      if (user) {
        await User.findByIdAndUpdate(user.userId, {
          $addToSet: { readingHistory: article._id }
        })
      }
    }

    return NextResponse.json({ article })
  } catch (error) {
    console.error('Get article error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update article
export async function PUT(
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

    await connectToDatabase()

    const article = await Article.findById(id)

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    // Check permissions
    const isAuthor = user.userId === article.author.toString()
    const isEditorOrAdmin = hasRole(user.role, ['admin', 'editor'])

    if (!isAuthor && !isEditorOrAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Allowed updates based on role
    const { title, content, excerpt, bannerImage, category, tags, status, editorFeedback, scheduledAt } = body

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {}

    // Authors can update content
    if (title) updateData.title = title
    if (content) updateData.content = content
    if (excerpt !== undefined) updateData.excerpt = excerpt
    if (bannerImage !== undefined) updateData.bannerImage = bannerImage
    if (category) updateData.category = category
    if (tags) updateData.tags = tags

    // Status changes based on role
    if (status) {
      if (isAuthor && !isEditorOrAdmin) {
        // Authors can only set draft or pending
        if (['draft', 'pending'].includes(status)) {
          updateData.status = status
        }
      } else if (isEditorOrAdmin) {
        // Editors/Admins can set any status
        updateData.status = status
        if (status === 'published') {
          updateData.publishedAt = new Date()
        }
      }
    }

    // Only editors/admins can add feedback
    if (editorFeedback !== undefined && isEditorOrAdmin) {
      updateData.editorFeedback = editorFeedback
    }

    // Schedule publication
    if (scheduledAt && isEditorOrAdmin) {
      updateData.scheduledAt = new Date(scheduledAt)
    }

    const updatedArticle = await Article.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('author', 'name avatar')

    return NextResponse.json({
      message: 'Article updated successfully',
      article: updatedArticle,
    })
  } catch (error) {
    console.error('Update article error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete article
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserPayload()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { id } = await params

    await connectToDatabase()

    const article = await Article.findById(id)

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    // Check permissions
    const isAuthor = user.userId === article.author.toString()
    const isAdmin = user.role === 'admin'

    // Authors can only delete drafts, admins can delete any
    if (isAuthor && article.status !== 'draft' && !isAdmin) {
      return NextResponse.json(
        { error: 'Can only delete draft articles' },
        { status: 403 }
      )
    }

    if (!isAuthor && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    await Article.findByIdAndDelete(id)

    return NextResponse.json({ message: 'Article deleted successfully' })
  } catch (error) {
    console.error('Delete article error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
