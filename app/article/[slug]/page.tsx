'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { formatDistanceToNow, format } from 'date-fns'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { useAuth } from '@/contexts/auth-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  ThumbsUp,
  ThumbsDown,
  Bookmark,
  Share2,
  MessageSquare,
  Eye,
  Calendar,
  ArrowLeft,
} from 'lucide-react'
import { toast } from 'sonner'
import { Comments } from '@/components/comments' // Import the Comments component
import { Chatbot } from '@/components/chatbot'
import { TextToSpeech } from '@/components/text-to-speech'

interface Author {
  _id: string
  name: string
  avatar?: string
  bio?: string
}

interface Article {
  _id: string
  title: string
  slug: string
  content: string
  excerpt: string
  bannerImage?: string
  author: Author
  category: string
  tags: string[]
  status: string
  views: number
  likes: string[]
  dislikes: string[]
  publishedAt: string
  createdAt: string
}

export default function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const router = useRouter()
  const { user } = useAuth()
  const [article, setArticle] = useState<Article | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isReacting, setIsReacting] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)

  useEffect(() => {
    async function fetchArticle() {
      try {
        const res = await fetch(`/api/articles/${slug}`)
        if (res.ok) {
          const data = await res.json()
          setArticle(data.article)
        } else {
          router.push('/404')
        }
      } catch (error) {
        console.error('Error fetching article:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchArticle()
  }, [slug, router])

  const handleReaction = async (action: 'like' | 'dislike') => {
    if (!user) {
      toast.error('Please sign in to react to articles')
      return
    }

    setIsReacting(true)
    try {
      const res = await fetch(`/api/articles/${article?._id}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      if (res.ok) {
        const data = await res.json()
        setArticle((prev) =>
          prev
            ? {
              ...prev,
              likes: Array(data.likes).fill(user.id),
              dislikes: Array(data.dislikes).fill(user.id),
            }
            : null
        )
      }
    } catch (error) {
      console.error('Error reacting to article:', error)
      toast.error('Failed to update reaction')
    } finally {
      setIsReacting(false)
    }
  }

  const handleBookmark = () => {
    if (!user) {
      toast.error('Please sign in to bookmark articles')
      return
    }
    setIsBookmarked(!isBookmarked)
    toast.success(isBookmarked ? 'Removed from bookmarks' : 'Added to bookmarks')
  }

  const handleShare = async () => {
    try {
      await navigator.share({
        title: article?.title,
        url: window.location.href,
      })
    } catch {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied to clipboard')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1">
          <div className="container mx-auto px-4 py-8 max-w-4xl">
            <Skeleton className="h-8 w-32 mb-4" />
            <Skeleton className="h-12 w-full mb-4" />
            <Skeleton className="h-6 w-48 mb-8" />
            <Skeleton className="aspect-[16/9] rounded-lg mb-8" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-foreground mb-2">
              Article not found
            </h1>
            <p className="text-muted-foreground mb-4">
              The article you're looking for doesn't exist or has been removed.
            </p>
            <Button asChild>
              <Link href="/">Go Home</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const publishedDate = article.publishedAt || article.createdAt
  const hasLiked = user && article.likes.includes(user.id)
  const hasDisliked = user && article.dislikes.includes(user.id)

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        <article className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Back button */}
          <Button
            variant="ghost"
            size="sm"
            className="mb-6 text-muted-foreground"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          {/* Category and Tags */}
          <div className="flex items-center gap-2 mb-4">
            <Link href={`/category/${article.category.toLowerCase()}`}>
              <Badge variant="default">{article.category}</Badge>
            </Link>
            {article.tags.slice(0, 3).map((tag) => (
              <Link key={tag} href={`/tag/${tag.toLowerCase()}`}>
                <Badge variant="outline">{tag}</Badge>
              </Link>
            ))}
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-foreground mb-4 text-balance leading-tight">
            {article.title}
          </h1>

          {/* Excerpt */}
          <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
            {article.excerpt}
          </p>

          {/* Author and Meta */}
          <div className="flex flex-wrap items-center gap-4 mb-8">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={article.author.avatar || "/placeholder.svg"} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {article.author.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <Link
                  href={`/author/${article.author._id}`}
                  className="font-medium text-foreground hover:underline"
                >
                  {article.author.name}
                </Link>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {format(new Date(publishedDate), 'MMM d, yyyy')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" />
                    {article.views} views
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Text to Speech */}
          <TextToSpeech
            title={article.title}
            content={article.content}
            className="mb-8"
          />

          {/* Banner Image */}
          {article.bannerImage && (
            <div className="aspect-[16/9] relative rounded-lg overflow-hidden mb-8">
              <Image
                src={article.bannerImage || "/placeholder.svg"}
                alt={article.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          {/* Content */}
          <div
            className="prose prose-lg max-w-none mb-8 text-foreground prose-headings:text-foreground prose-p:text-foreground/90 prose-strong:text-foreground prose-a:text-primary"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          <Separator className="my-8" />

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant={hasLiked ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleReaction('like')}
                disabled={isReacting}
              >
                <ThumbsUp className="h-4 w-4 mr-2" />
                {article.likes.length}
              </Button>
              <Button
                variant={hasDisliked ? 'destructive' : 'outline'}
                size="sm"
                onClick={() => handleReaction('dislike')}
                disabled={isReacting}
              >
                <ThumbsDown className="h-4 w-4 mr-2" />
                {article.dislikes.length}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={isBookmarked ? 'default' : 'outline'}
                size="sm"
                onClick={handleBookmark}
              >
                <Bookmark className="h-4 w-4 mr-2" />
                {isBookmarked ? 'Saved' : 'Save'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href="#comments">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Comments
                </a>
              </Button>
            </div>
          </div>

          <Separator className="my-8" />

          {/* Author Bio */}
          <div className="bg-muted/50 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={article.author.avatar || "/placeholder.svg"} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                  {article.author.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  Written by {article.author.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {article.author.bio || 'Contributing writer at NewsHub'}
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/author/${article.author._id}`}>
                    View Profile
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div id="comments" className="mt-12">
            <h2 className="text-2xl font-serif font-bold text-foreground mb-6">
              Comments
            </h2>
            <Comments articleId={article._id} />
          </div>
        </article>
      </main>

      <Footer />

      {/* AI Chatbot with Article Context */}
      <Chatbot
        articleContext={{
          title: article.title,
          category: article.category,
          content: article.content,
        }}
      />
    </div>
  )
}
