import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Article from '@/lib/models/article'
import { getCurrentUserPayload, hasRole } from '@/lib/auth'

// PUT - Publish article
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserPayload()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Only editors and admins can publish
    if (!hasRole(user.role, ['admin', 'editor'])) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await params

    await connectToDatabase()

    const article = await Article.findById(id)

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    // Optional: Check if article is approved before publishing
    // if (article.status !== 'approved') {
    //   return NextResponse.json({ error: 'Article must be approved before publishing' }, { status: 400 })
    // }

    const updatedArticle = await Article.findByIdAndUpdate(
      id,
      {
        $set: {
          status: 'published',
          publishedAt: new Date()
        }
      },
      { new: true }
    ).populate('author', 'name avatar')

    return NextResponse.json({
      message: 'Article published successfully',
      article: updatedArticle,
    })
  } catch (error) {
    console.error('Publish article error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
