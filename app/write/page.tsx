'use client'

import React from "react"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertCircle,
  Loader2,
  ImageIcon,
  X,
  Save,
  Send,
  Eye,
  Wand2,
  RefreshCcw,
  Sparkles,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Switch } from '@/components/ui/switch'
import { CalendarIcon, Share2, Download, Zap } from 'lucide-react'
import { toast } from 'sonner'

const categories = [
  'Politics',
  'Business',
  'Technology',
  'Sports',
  'Entertainment',
  'Science',
  'Health',
  'World',
  'Opinion',
  'Lifestyle',
]

export default function WriteArticlePage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [category, setCategory] = useState('')
  const [bannerImage, setBannerImage] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  // AI State
  const [isGenerating, setIsGenerating] = useState<string | null>(null) // 'title', 'excerpt', 'rewrite'
  const [generatedHeadlines, setGeneratedHeadlines] = useState<string[]>([])
  const [showHeadlineDialog, setShowHeadlineDialog] = useState(false)

  // Scheduling & Breaking State
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined)
  const [isBreaking, setIsBreaking] = useState(false)

  // Export State
  const [showExport, setShowExport] = useState(false)

  // Check authorization - Allow all logged-in users to write articles
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const newTag = tagInput.trim().toLowerCase()
      if (newTag && !tags.includes(newTag) && tags.length < 5) {
        setTags([...tags, newTag])
        setTagInput('')
      }
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove))
  }

  const generateAIContent = async (type: 'summary' | 'headline' | 'rewrite', tone?: string) => {
    if (!content.trim() && type !== 'headline') {
      toast.error('Please write some content first')
      return
    }

    // For headlines, we can use content OR title if content is empty (though prompt uses content, let's allow title fallback if content empty)
    const contextText = content.trim() || title.trim()
    if (!contextText && type === 'headline') {
      toast.error('Please write some content or a working title first')
      return
    }

    setIsGenerating(type === 'rewrite' ? 'rewrite' : type === 'summary' ? 'excerpt' : 'title')

    try {
      const res = await fetch('/api/articles/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          content: contextText,
          tone,
        }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      if (type === 'summary') {
        setExcerpt(data.result.replace(/^"|"$/g, '')) // Remove quotes if present
        toast.success('Excerpt generated!')
      } else if (type === 'headline') {
        // Parse numbered list
        const headlines = data.result
          .split('\n')
          .filter((line: string) => line.trim().match(/^\d+\./))
          .map((line: string) => line.replace(/^\d+\.\s*/, '').replace(/^"|"$/g, ''))

        setGeneratedHeadlines(headlines)
        setShowHeadlineDialog(true)
      } else if (type === 'rewrite') {
        setContent(data.result)
        toast.success('Content rewritten!')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate content')
    } finally {
      setIsGenerating(null)
    }
  }

  const handleSubmit = async (status: 'draft' | 'pending') => {
    setError('')

    // Validation
    if (!title.trim()) {
      setError('Title is required')
      return
    }
    if (!content.trim()) {
      setError('Content is required')
      return
    }
    if (!category) {
      setError('Category is required')
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          excerpt: excerpt || content.substring(0, 200),
          category,
          bannerImage,
          tags,
          status: status === 'pending' && scheduledDate ? 'approved' : status, // For demo, if scheduled, approve it (in real app, pending)
          scheduledAt: scheduledDate,
          isBreaking,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success(
          status === 'draft'
            ? 'Article saved as draft'
            : 'Article submitted for review'
        )
        router.push('/my-articles')
      } else {
        setError(data.error || 'Failed to create article')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user || !['admin', 'editor', 'author'].includes(user.role)) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-serif font-bold text-foreground">
                Write Article
              </h1>
              <p className="text-muted-foreground mt-1">
                Create and publish your story
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setShowExport(true)}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSubmit('draft')}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Draft
              </Button>
              <Button
                onClick={() => handleSubmit('pending')}
                disabled={isSubmitting}
                className={isBreaking ? "bg-red-600 hover:bg-red-700" : ""}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : isBreaking ? (
                  <Zap className="h-4 w-4 mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                {isBreaking ? 'Publish Breaking' : scheduledDate ? 'Schedule' : 'Submit for Review'}
              </Button>
            </div>
          </div>

          <Dialog open={showExport} onOpenChange={setShowExport}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Export Content</DialogTitle>
                <DialogDescription>
                  Generate snippets for social media or newsletters.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    const text = `📰 BREAKING: ${title}\n\n${excerpt}\n\nRead more at NewsHub! #News #${category}`
                    navigator.clipboard.writeText(text)
                    setShowExport(false)
                  }}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Copy for Social Media (X/LinkedIn)
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="title">Title</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-6 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                        onClick={() => generateAIContent('headline')}
                        disabled={!!isGenerating}
                      >
                        {isGenerating === 'title' ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          <Sparkles className="h-3 w-3 mr-1" />
                        )}
                        Generate Ideas
                      </Button>
                    </div>
                    <Input
                      id="title"
                      placeholder="Enter a compelling headline..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="text-lg font-medium"
                    />

                    {/* Headline Selection Dialog */}
                    <Dialog open={showHeadlineDialog} onOpenChange={setShowHeadlineDialog}>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Choose a Headline</DialogTitle>
                          <DialogDescription>
                            Select one of the AI-generated headlines below.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-2 mt-2">
                          {generatedHeadlines.map((headline, i) => (
                            <Button
                              key={i}
                              variant="outline"
                              className="w-full justify-start text-left h-auto py-2 whitespace-normal"
                              onClick={() => {
                                setTitle(headline)
                                setShowHeadlineDialog(false)
                              }}
                            >
                              {headline}
                            </Button>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {/* Excerpt */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="excerpt">
                        Excerpt <span className="text-muted-foreground">(optional)</span>
                      </Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-6 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => generateAIContent('summary')}
                        disabled={!!isGenerating}
                      >
                        {isGenerating === 'excerpt' ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          <Wand2 className="h-3 w-3 mr-1" />
                        )}
                        Auto-Summarize
                      </Button>
                    </div>
                    <Textarea
                      id="excerpt"
                      placeholder="A brief summary that appears in article previews..."
                      value={excerpt}
                      onChange={(e) => setExcerpt(e.target.value)}
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                      {excerpt.length}/500 characters
                    </p>
                  </div>

                  <Separator />

                  {/* Content */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="content">Content</Label>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-6"
                            disabled={!!isGenerating}
                          >
                            {isGenerating === 'rewrite' ? (
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : (
                              <RefreshCcw className="h-3 w-3 mr-1" />
                            )}
                            AI Rewrite
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => generateAIContent('rewrite', 'professional')}>
                            Professional Intent
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => generateAIContent('rewrite', 'casual')}>
                            Casual Tone
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => generateAIContent('rewrite', 'witty')}>
                            Witty & Fun
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => generateAIContent('rewrite', 'dramatic')}>
                            Dramatic Flair
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <Textarea
                      id="content"
                      placeholder="Write your article here... You can use basic HTML for formatting."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={20}
                      className="font-mono text-sm"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Publishing Options */}
              <Card>
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="breaking-mode" className="flex flex-col space-y-1">
                      <span>Breaking News</span>
                      <span className="font-normal text-xs text-muted-foreground">
                        Fast-track publishing & high priority
                      </span>
                    </Label>
                    <Switch
                      id="breaking-mode"
                      checked={isBreaking}
                      onCheckedChange={setIsBreaking}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Schedule Publish</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !scheduledDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {scheduledDate ? format(scheduledDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={scheduledDate}
                          onSelect={setScheduledDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </CardContent>
              </Card>

              {/* Category */}
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Tags */}
                  <div className="space-y-2">
                    <Label>Tags</Label>
                    <Input
                      placeholder="Add tag and press Enter"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                    />
                    <div className="flex flex-wrap gap-2 mt-2">
                      {tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="pl-2 pr-1">
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {tags.length}/5 tags
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Banner Image */}
              <Card>
                <CardContent className="p-6 space-y-4">
                  <Label>Banner Image</Label>
                  <div className="space-y-2">
                    <Input
                      placeholder="Image URL"
                      value={bannerImage}
                      onChange={(e) => setBannerImage(e.target.value)}
                    />
                    {bannerImage ? (
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                        <img
                          src={bannerImage || "/placeholder.svg"}
                          alt="Banner preview"
                          className="object-cover w-full h-full"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8"
                          onClick={() => setBannerImage('')}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="aspect-video rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted/30">
                        <div className="text-center">
                          <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Add an image URL above
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Preview Link */}
              <Card>
                <CardContent className="p-6">
                  <Button variant="outline" className="w-full bg-transparent" asChild>
                    <Link href="/articles/preview" target="_blank">
                      <Eye className="h-4 w-4 mr-2" />
                      Preview Article
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main >
    </div >
  )
}
