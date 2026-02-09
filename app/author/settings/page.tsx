'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { toast } from 'sonner'

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    commentNotifications: true,
    likeNotifications: false,
    weeklyDigest: true,
  })

  const handleSave = () => {
    // In a real app, this would save to the backend
    toast.success('Settings saved successfully!')
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Manage your account preferences</p>
      </div>

      <div className="space-y-6">
        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>
              Choose what notifications you want to receive
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <p className="text-sm text-gray-500">
                  Receive email updates about your articles
                </p>
              </div>
              <Switch
                id="email-notifications"
                checked={settings.emailNotifications}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, emailNotifications: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="comment-notifications">Comment Notifications</Label>
                <p className="text-sm text-gray-500">
                  Get notified when someone comments on your articles
                </p>
              </div>
              <Switch
                id="comment-notifications"
                checked={settings.commentNotifications}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, commentNotifications: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="like-notifications">Like Notifications</Label>
                <p className="text-sm text-gray-500">
                  Get notified when someone likes your articles
                </p>
              </div>
              <Switch
                id="like-notifications"
                checked={settings.likeNotifications}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, likeNotifications: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="weekly-digest">Weekly Digest</Label>
                <p className="text-sm text-gray-500">
                  Receive a weekly summary of your article performance
                </p>
              </div>
              <Switch
                id="weekly-digest"
                checked={settings.weeklyDigest}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, weeklyDigest: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave}>Save Settings</Button>
        </div>
      </div>
    </div>
  )
}
