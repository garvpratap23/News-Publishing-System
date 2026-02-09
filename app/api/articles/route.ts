import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Article from '@/lib/models/article'
import { getCurrentUserPayload, hasRole } from '@/lib/auth'

// GET - List articles with filtering, sorting, pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const author = searchParams.get('author')
    const search = searchParams.get('search')
    const sort = searchParams.get('sort') || 'newest'
    const tag = searchParams.get('tag')

    await connectToDatabase()

    // Build query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {}

    // Get current user for authorization
    const user = await getCurrentUserPayload()

    // Filter by status based on user role
    if (status) {
      // Only allow non-readers to see non-published articles
      if (status !== 'published' && (!user || !hasRole(user.role, ['admin', 'editor', 'author']))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
      query.status = status
    } else {
      // Default: readers only see published articles
      if (!user || user.role === 'reader') {
        query.status = 'published'
      }
    }

    if (category) {
      query.category = category
    }

    if (author) {
      query.author = author
    }

    if (tag) {
      query.tags = { $in: [tag] }
    }

    if (search) {
      query.$text = { $search: search }
    }

    // Build sort
    let sortQuery = {}
    switch (sort) {
      case 'oldest':
        sortQuery = { publishedAt: 1 }
        break
      case 'views':
        sortQuery = { views: -1 }
        break
      case 'trending':
        sortQuery = { likes: -1, views: -1 }
        break
      case 'newest':
      default:
        sortQuery = { publishedAt: -1 }
    }

    const skip = (page - 1) * limit

    const [articles, total] = await Promise.all([
      Article.find(query)
        .populate('author', 'name avatar')
        .sort(sortQuery)
        .skip(skip)
        .limit(limit)
        .lean(),
      Article.countDocuments(query),
    ])

    return NextResponse.json({
      articles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get articles error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new article
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserPayload()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Only authors, editors, and admins can create articles
    if (!hasRole(user.role, ['admin', 'editor', 'author'])) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const { title, content, excerpt, bannerImage, category, tags, status, scheduledAt, isBreaking } = body

    // Validation
    if (!title || !content || !category) {
      return NextResponse.json(
        { error: 'Title, content, and category are required' },
        { status: 400 }
      )
    }

    await connectToDatabase()

    // Generate slug from title
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '-')
    const slug = `${baseSlug}-${Date.now()}`

    // Determine initial status
    let articleStatus = status || 'draft'

    // Authors can only create drafts or submit for review
    if (user.role === 'author' && !['draft', 'pending'].includes(articleStatus)) {
      articleStatus = 'draft'
    }

    // If scheduled, set status to pending or approved based on role (or maybe just keep it as is and uses scheduledAt)
    // Basic logic: if scheduledAt is present, we might want to ensure status is not immediately 'published' unless cron handles it
    // For now, we save it as is.

    const article = await Article.create({
      title,
      slug,
      content,
      excerpt: excerpt || content.substring(0, 200),
      bannerImage: bannerImage || '',
      author: user.userId,
      category,
      tags: tags || [],
      status: articleStatus,
      publishedAt: articleStatus === 'published' ? new Date() : undefined,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      isBreaking: isBreaking || false,
    })

    return NextResponse.json(
      { message: 'Article created successfully', article },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create article error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
