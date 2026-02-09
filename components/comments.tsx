'use client'

import React from "react"

import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Loader2,
  Send,
  Flag,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface User {
  _id: string
  name: string
  avatar?: string
}

interface Reply {
  _id: string
  user: User
  text: string
  likes: string[]
  dislikes: string[]
  createdAt: string
}

interface Comment {
  _id: string
  user: User
  text: string
  likes: string[]
  dislikes: string[]
  createdAt: string
  replies: Reply[]
}

interface CommentsProps {
  articleId: string
}

export function Comments({ articleId }: CommentsProps) {
  const { user } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchComments()
  }, [articleId])

  async function fetchComments() {
    try {
      const res = await fetch(`/api/articles/${articleId}/comments`)
      if (res.ok) {
        const data = await res.json()
        setComments(data.comments)
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !newComment.trim()) return

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/articles/${articleId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newComment }),
      })

      if (res.ok) {
        const data = await res.json()
        setComments([{ ...data.comment, replies: [] }, ...comments])
        setNewComment('')
        toast.success('Comment posted')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to post comment')
      }
    } catch {
      toast.error('Failed to post comment')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitReply = async (parentId: string) => {
    if (!user || !replyText.trim()) return

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/articles/${articleId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: replyText, parentId }),
      })

      if (res.ok) {
        const data = await res.json()
        setComments(
          comments.map((comment) =>
            comment._id === parentId
              ? { ...comment, replies: [...comment.replies, data.comment] }
              : comment
          )
        )
        setReplyText('')
        setReplyingTo(null)
        setExpandedReplies(new Set([...expandedReplies, parentId]))
        toast.success('Reply posted')
      }
    } catch {
      toast.error('Failed to post reply')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReaction = async (
    commentId: string,
    action: 'like' | 'dislike',
    isReply: boolean = false,
    parentId?: string
  ) => {
    if (!user) {
      toast.error('Please sign in to react')
      return
    }

    try {
      const res = await fetch(`/api/comments/${commentId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      if (res.ok) {
        const data = await res.json()
        if (isReply && parentId) {
          setComments(
            comments.map((comment) =>
              comment._id === parentId
                ? {
                    ...comment,
                    replies: comment.replies.map((reply) =>
                      reply._id === commentId
                        ? {
                            ...reply,
                            likes: Array(data.likes).fill(user.id),
                            dislikes: Array(data.dislikes).fill(user.id),
                          }
                        : reply
                    ),
                  }
                : comment
            )
          )
        } else {
          setComments(
            comments.map((comment) =>
              comment._id === commentId
                ? {
                    ...comment,
                    likes: Array(data.likes).fill(user.id),
                    dislikes: Array(data.dislikes).fill(user.id),
                  }
                : comment
            )
          )
        }
      }
    } catch {
      toast.error('Failed to update reaction')
    }
  }

  const toggleReplies = (commentId: string) => {
    const newExpanded = new Set(expandedReplies)
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId)
    } else {
      newExpanded.add(commentId)
    }
    setExpandedReplies(newExpanded)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Comment Form */}
      {user ? (
        <form onSubmit={handleSubmitComment} className="space-y-4">
          <div className="flex gap-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatar || "/placeholder.svg"} />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || !newComment.trim()}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Post Comment
            </Button>
          </div>
        </form>
      ) : (
        <div className="bg-muted/50 rounded-lg p-6 text-center">
          <p className="text-muted-foreground mb-4">
            Sign in to join the conversation
          </p>
          <Button asChild>
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-6">
        {comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No comments yet. Be the first to share your thoughts!
            </p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment._id} className="space-y-4">
              <CommentItem
                comment={comment}
                user={user}
                onReact={(action) => handleReaction(comment._id, action)}
                onReply={() => setReplyingTo(comment._id)}
              />

              {/* Replies Toggle */}
              {comment.replies.length > 0 && (
                <button
                  onClick={() => toggleReplies(comment._id)}
                  className="ml-14 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  {expandedReplies.has(comment._id) ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                </button>
              )}

              {/* Replies */}
              {expandedReplies.has(comment._id) && (
                <div className="ml-14 space-y-4 border-l-2 border-border pl-4">
                  {comment.replies.map((reply) => (
                    <CommentItem
                      key={reply._id}
                      comment={reply}
                      user={user}
                      onReact={(action) =>
                        handleReaction(reply._id, action, true, comment._id)
                      }
                      isReply
                    />
                  ))}
                </div>
              )}

              {/* Reply Form */}
              {replyingTo === comment._id && user && (
                <div className="ml-14 space-y-2">
                  <Textarea
                    placeholder="Write a reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={2}
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setReplyingTo(null)
                        setReplyText('')
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      disabled={isSubmitting || !replyText.trim()}
                      onClick={() => handleSubmitReply(comment._id)}
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Reply'
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

interface CommentItemProps {
  comment: Comment | Reply
  user: { id: string; name: string; avatar?: string; role: string } | null
  onReact: (action: 'like' | 'dislike') => void
  onReply?: () => void
  isReply?: boolean
}

function CommentItem({ comment, user, onReact, onReply, isReply }: CommentItemProps) {
  const hasLiked = user && comment.likes.includes(user.id)
  const hasDisliked = user && comment.dislikes.includes(user.id)

  return (
    <div className="flex gap-4">
      <Avatar className={isReply ? 'h-8 w-8' : 'h-10 w-10'}>
        <AvatarImage src={comment.user.avatar || "/placeholder.svg"} />
        <AvatarFallback>{comment.user.name.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-foreground">{comment.user.name}</span>
          <span className="text-sm text-muted-foreground">
            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
          </span>
        </div>
        <p className="text-foreground/90 whitespace-pre-wrap">{comment.text}</p>
        <div className="flex items-center gap-4 mt-2">
          <button
            onClick={() => onReact('like')}
            className={`flex items-center gap-1 text-sm ${
              hasLiked ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ThumbsUp className="h-4 w-4" />
            {comment.likes.length > 0 && comment.likes.length}
          </button>
          <button
            onClick={() => onReact('dislike')}
            className={`flex items-center gap-1 text-sm ${
              hasDisliked ? 'text-destructive' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ThumbsDown className="h-4 w-4" />
            {comment.dislikes.length > 0 && comment.dislikes.length}
          </button>
          {!isReply && onReply && (
            <button
              onClick={onReply}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <MessageSquare className="h-4 w-4" />
              Reply
            </button>
          )}
          <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <Flag className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
