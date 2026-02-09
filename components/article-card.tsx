'use client'

import Link from 'next/link'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Eye, ThumbsUp } from 'lucide-react'

interface Author {
  _id: string
  name: string
  avatar?: string
}

interface Article {
  _id: string
  title: string
  slug: string
  excerpt: string
  bannerImage?: string
  author: Author
  category: string
  tags: string[]
  views: number
  likes: string[]
  publishedAt: string
  createdAt: string
  isExternal?: boolean
  url?: string
}

interface ArticleCardProps {
  article: Article
  variant?: 'default' | 'featured' | 'compact'
}

export function ArticleCard({ article, variant = 'default' }: ArticleCardProps) {
  const publishedDate = article.publishedAt || article.createdAt

  // Validate date before formatting
  let timeAgo = 'Recently'
  try {
    const date = new Date(publishedDate)
    if (!isNaN(date.getTime())) {
      timeAgo = formatDistanceToNow(date, { addSuffix: true })
    }
  } catch (error) {
    console.error('Invalid date:', publishedDate)
  }

  // For external articles, open in new tab
  const isExternalLink = article.isExternal && article.url && article.url !== '#'
  const articleLink = isExternalLink ? article.url : `/article/${article.slug}`

  if (variant === 'featured') {
    const content = (
      <article className="relative overflow-hidden rounded-lg bg-card border border-border">
        <div className="aspect-[16/9] relative">
          {article.bannerImage ? (
            <Image
              src={article.bannerImage || "/placeholder.svg"}
              alt={article.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 bg-muted flex items-center justify-center">
              <span className="text-4xl font-serif text-muted-foreground">
                {article.title.charAt(0)}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <Badge variant="secondary" className="mb-3">
              {article.category}
            </Badge>
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-white mb-2 line-clamp-2 text-balance">
              {article.title}
            </h2>
            <p className="text-white/80 text-sm line-clamp-2 mb-4 max-w-2xl">
              {article.excerpt}
            </p>
            <div className="flex items-center gap-4 text-white/70 text-sm">
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={article.author.avatar || "/placeholder.svg"} />
                  <AvatarFallback className="text-xs bg-white/20 text-white">
                    {article.author.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span>{article.author.name}</span>
              </div>
              <span>{timeAgo}</span>
            </div>
          </div>
        </div>
      </article>
    )

    return isExternalLink ? (
      <a href={articleLink} target="_blank" rel="noopener noreferrer" className="group block">
        {content}
      </a>
    ) : (
      <Link href={articleLink} className="group block">
        {content}
      </Link>
    )
  }

  if (variant === 'compact') {
    const content = (
      <article className="flex gap-4 py-4 border-b border-border last:border-0">
        {article.bannerImage && (
          <div className="w-24 h-24 relative flex-shrink-0 rounded-md overflow-hidden">
            <Image
              src={article.bannerImage || "/placeholder.svg"}
              alt={article.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <Badge variant="outline" className="mb-2 text-xs">
            {article.category}
          </Badge>
          <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors mb-1">
            {article.title}
          </h3>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{article.author.name}</span>
            <span>{timeAgo}</span>
          </div>
        </div>
      </article>
    )

    return isExternalLink ? (
      <a href={articleLink} target="_blank" rel="noopener noreferrer" className="group block">
        {content}
      </a>
    ) : (
      <Link href={articleLink} className="group block">
        {content}
      </Link>
    )
  }

  const content = (
    <article className="overflow-hidden rounded-lg bg-card border border-border transition-shadow hover:shadow-md">
      <div className="aspect-[16/10] relative">
        {article.bannerImage ? (
          <Image
            src={article.bannerImage || "/placeholder.svg"}
            alt={article.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-muted flex items-center justify-center">
            <span className="text-4xl font-serif text-muted-foreground">
              {article.title.charAt(0)}
            </span>
          </div>
        )}
      </div>
      <div className="p-4">
        <Badge variant="outline" className="mb-3">
          {article.category}
        </Badge>
        <h3 className="font-serif text-lg font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors mb-2 text-balance">
          {article.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {article.excerpt}
        </p>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={article.author.avatar || "/placeholder.svg"} />
              <AvatarFallback className="text-xs">
                {article.author.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span>{article.author.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {article.views}
            </span>
            <span className="flex items-center gap-1">
              <ThumbsUp className="h-3.5 w-3.5" />
              {article.likes.length}
            </span>
          </div>
        </div>
      </div>
    </article>
  )

  return isExternalLink ? (
    <a href={articleLink} target="_blank" rel="noopener noreferrer" className="group block">
      {content}
    </a>
  ) : (
    <Link href={articleLink} className="group block">
      {content}
    </Link>
  )
}
