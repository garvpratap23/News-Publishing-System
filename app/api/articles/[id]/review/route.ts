import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Article from '@/lib/models/article'
import { getCurrentUserPayload, hasRole } from '@/lib/auth'

// PUT - Review article (Approve/Reject)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserPayload()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Only editors and admins can review
    if (!hasRole(user.role, ['admin', 'editor'])) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { status, feedback } = body

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be "approved" or "rejected"' },
        { status: 400 }
      )
    }

    await connectToDatabase()

    const article = await Article.findById(id)

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    const updateData: any = {
      status: status === 'approved' ? 'pending' : 'rejected', // Approved moves to pending publication or keep as approved?
      // Usually: Draft -> Pending Review -> Approved -> Published.
      // Or: Draft -> (Submit) -> Pending -> (Review) -> Approved -> (Publish) -> Published.
      // Let's assume 'approved' is a valid status before 'published'.
      // If rejected, status becomes 'rejected' or back to 'draft' with feedback.
      editorFeedback: feedback
    }

    // If status passed is approved, we set DB status to 'approved'
    if (status === 'approved') {
        updateData.status = 'approved'
    } else {
        updateData.status = 'rejected'
    }

    const updatedArticle = await Article.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    ).populate('author', 'name avatar')

    return NextResponse.json({
      message: `Article ${status} successfully`,
      article: updatedArticle,
    })
  } catch (error) {
    console.error('Review article error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
