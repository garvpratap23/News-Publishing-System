import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import User from '@/lib/models/user'
import { getCurrentUserPayload } from '@/lib/auth'

export async function GET() {
  try {
    const userPayload = await getCurrentUserPayload()

    if (!userPayload) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    await connectToDatabase()

    const user = await User.findById(userPayload.userId).lean()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        location: user.location,
        preferences: user.preferences,
        savedArticles: user.savedArticles,
        createdAt: user.createdAt,
      },
    })
  } catch (error) {
    console.error('Get profile error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUserPayload()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { name, bio, avatar, preferences, location } = body

    await connectToDatabase()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {}

    if (name && name.trim()) {
      if (name.length > 100) {
        return NextResponse.json(
          { error: 'Name cannot exceed 100 characters' },
          { status: 400 }
        )
      }
      updateData.name = name.trim()
    }

    if (location !== undefined) {
      updateData.location = location
    }

    if (bio !== undefined) {
      if (bio.length > 500) {
        return NextResponse.json(
          { error: 'Bio cannot exceed 500 characters' },
          { status: 400 }
        )
      }
      updateData.bio = bio
    }

    if (avatar !== undefined) {
      updateData.avatar = avatar
    }

    if (preferences !== undefined && Array.isArray(preferences)) {
      updateData.preferences = preferences
    }

    const updatedUser = await User.findByIdAndUpdate(
      user.userId,
      { $set: updateData },
      { new: true }
    )

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        avatar: updatedUser.avatar,
        bio: updatedUser.bio,
        preferences: updatedUser.preferences,
      },
    })
  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
