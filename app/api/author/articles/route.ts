import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import Article from '@/lib/models/article'
import { connectToDatabase } from '@/lib/mongodb'

export async function GET(request: NextRequest) {
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

    // Get all articles by this author
    const articles = await Article.find({ author: user.userId })
      .sort({ createdAt: -1 })
      .populate('author', 'name email')
      .lean()

    return NextResponse.json({ articles })
  } catch (error: any) {
    console.error('Error fetching author articles:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
