import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import Article from '@/lib/models/article'
import { connectToDatabase } from '@/lib/mongodb'

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth()

    if (!authResult.isAuthenticated || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = authResult.user

    if (!['author', 'editor', 'admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectToDatabase()

    const body = await request.json()
    const { title, excerpt, content, category, tags, bannerImage, status } = body

    // Validate required fields
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    // Generate slug from title
    const slug =
      title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 100) +
      '-' +
      Date.now()

    // Create article
    const article = await Article.create({
      title,
      slug,
      excerpt: excerpt || title.substring(0, 200),
      content,
      author: user.userId,
      category: category || 'General',
      tags: tags || [],
      bannerImage: bannerImage || `https://picsum.photos/seed/${slug}/1200/600`,
      status: status || 'draft',
      publishedAt: status === 'published' ? new Date() : null,
    })

    return NextResponse.json({
      success: true,
      article: {
        _id: article._id,
        title: article.title,
        slug: article.slug,
        status: article.status,
      },
    })
  } catch (error: any) {
    console.error('Error creating article:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
