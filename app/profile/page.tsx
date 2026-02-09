'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, User, Mail, Calendar, Shield, AlertCircle, Check, Camera } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

export default function ProfilePage() {
  const router = useRouter()
  const { user, isLoading: authLoading, refreshUser } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [avatar, setAvatar] = useState('')
  const [location, setLocation] = useState('')
  const [preferences, setPreferences] = useState<string[]>([])

  const categories = [
    'Politics',
    'Business',
    'Technology',
    'Sports',
    'Entertainment',
    'Science',
    'Health',
    'World',
    'India',
    'Global',
  ]

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
    if (user) {
      setName(user.name)
      setBio(user.bio || '')
      setAvatar(user.avatar || '')
      setLocation(user.location || '')
      setPreferences(user.preferences || [])
    }
  }, [user, authLoading, router])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size should be less than 2MB')
      return
    }

    setIsUploading(true)

    // Convert to base64
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatar(reader.result as string)
      setIsUploading(false)
      toast.success('Image uploaded! Click Save Changes to update')
    }
    reader.onerror = () => {
      toast.error('Failed to read image')
      setIsUploading(false)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    setError('')
    setIsSaving(true)

    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, bio, avatar, location, preferences }),
      })

      if (res.ok) {
        await refreshUser()
        setIsEditing(false)
        toast.success('Profile updated successfully')
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to update profile')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    if (user) {
      setName(user.name)
      setBio(user.bio || '')
      setAvatar(user.avatar || '')
      setLocation(user.location || '')
      setPreferences(user.preferences || [])
    }
    setIsEditing(false)
    setError('')
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <h1 className="text-3xl font-serif font-bold text-foreground mb-8">
            Your Profile
          </h1>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={avatar || user.avatar} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                      {name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-2xl">{user.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Shield className="h-4 w-4" />
                      <span className="capitalize">{user.role}</span>
                    </CardDescription>
                  </div>
                </div>
                {!isEditing && (
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    Edit Profile
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {isEditing ? (
                <div className="space-y-4">
                  {/* Avatar Upload */}
                  <div className="flex flex-col items-center gap-4 pb-4">
                    <div className="relative">
                      <Avatar className="h-32 w-32">
                        <AvatarImage src={avatar || user.avatar || '/placeholder.svg'} alt={name} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-4xl">
                          {name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <Button
                        type="button"
                        size="icon"
                        variant="secondary"
                        className="absolute bottom-0 right-0 rounded-full shadow-lg"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading || isSaving}
                      >
                        {isUploading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Camera className="h-4 w-4" />
                        )}
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground text-center">
                      Click the camera icon to upload a profile picture (max 2MB)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell us about yourself..."
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground">
                      {bio.length}/500 characters
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location (City, Country)</Label>
                    <Input
                      id="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Mumbai, India"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Interests</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 border rounded-md p-4">
                      {categories.map((category) => (
                        <div key={category} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`pref-${category}`}
                            checked={preferences.includes(category)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setPreferences([...preferences, category])
                              } else {
                                setPreferences(preferences.filter((p) => p !== category))
                              }
                            }}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <Label htmlFor={`pref-${category}`} className="text-sm cursor-pointer">
                            {category}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={isSaving}>
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4 mr-2" />
                      )}
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {user.bio && (
                    <div>
                      <Label className="text-muted-foreground">Bio</Label>
                      <p className="mt-1 text-foreground">{user.bio}</p>
                    </div>
                  )}
                  {user.location && (
                    <div>
                      <Label className="text-muted-foreground">Location</Label>
                      <p className="mt-1 text-foreground">{user.location}</p>
                    </div>
                  )}
                </div>
              )}

              <Separator />

              {/* Account Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Account Information</h3>

                <div className="grid gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium text-foreground">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                      <Shield className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Role</p>
                      <Badge variant="secondary" className="mt-1 capitalize">
                        {user.role}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Member since</p>
                      <p className="font-medium text-foreground">
                        {/* {format(new Date(user.createdAt), 'MMMM d, yyyy')} */}
                        Member
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Preferences */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Preferences</h3>
                <div className="flex flex-wrap gap-2">
                  {user.preferences && user.preferences.length > 0 ? (
                    user.preferences.map((pref) => (
                      <Badge key={pref} variant="outline">
                        {pref}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No preferences set. Visit categories to personalize your feed.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
