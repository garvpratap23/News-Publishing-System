import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import User from "@/lib/models/user"
import Article from "@/lib/models/article"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    await connectToDatabase()

    const user = await User.findById(payload.userId).select("bookmarks")
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const articles = await Article.find({
      _id: { $in: user.bookmarks },
      status: "published",
    })
      .populate("author", "firstName lastName avatar")
      .sort({ createdAt: -1 })

    return NextResponse.json({ articles })
  } catch (error) {
    console.error("Get bookmarks error:", error)
    return NextResponse.json(
      { error: "Failed to fetch bookmarks" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { articleId } = await request.json()

    if (!articleId) {
      return NextResponse.json(
        { error: "Article ID is required" },
        { status: 400 }
      )
    }

    await connectToDatabase()

    const user = await User.findById(payload.userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const isBookmarked = user.bookmarks.includes(articleId)

    if (isBookmarked) {
      user.bookmarks = user.bookmarks.filter(
        (id: string) => id.toString() !== articleId
      )
    } else {
      user.bookmarks.push(articleId)
    }

    await user.save()

    return NextResponse.json({
      bookmarked: !isBookmarked,
      message: isBookmarked ? "Bookmark removed" : "Article bookmarked",
    })
  } catch (error) {
    console.error("Toggle bookmark error:", error)
    return NextResponse.json(
      { error: "Failed to update bookmark" },
      { status: 500 }
    )
  }
}
