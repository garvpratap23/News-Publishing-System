import mongoose from 'mongoose'
import User from '../lib/models/user'

// Using global fetch (Node 18+)

const BASE_URL = 'http://localhost:3000'
const TIMESTAMP = Date.now()
const TEST_USER = {
  name: `Test Admin ${TIMESTAMP}`,
  email: `admin${TIMESTAMP}@test.com`,
  password: 'password123',
  role: 'reader'
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Garv_news:Vragps2334@cluster0.vetvb19.mongodb.net/?appName=Cluster0'

let authCookie = ''
let articleId = ''

async function upgradeToAdmin(email: string) {
  try {
    process.stdout.write('   Upgrading user to admin... ')
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_URI)
    }
    await User.findOneAndUpdate({ email: email.toLowerCase() }, { role: 'admin' })
    console.log('Done.')
  } catch (err) {
    console.error('Failed to upgrade user:', err)
  }
}

async function runTest(name: string, fn: () => Promise<any>) {
  try {
    process.stdout.write(`Testing ${name}... `)
    const result = await fn()
    console.log('✅ PASS')
    return result
  } catch (error: any) {
    console.log('❌ FAIL')
    console.error('   Error:', error.message)
    throw error
  }
}

async function api(method: string, path: string, body?: any) {
  const headers: any = { 'Content-Type': 'application/json' }
  if (authCookie) headers['Cookie'] = authCookie

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  })

  // Clone response to read text in case of JSON parse error
  const clone = response.clone()
  let data
  try {
    data = await response.json()
  } catch {
    const text = await clone.text()
    data = { error: 'Invalid JSON', content: text.substring(0, 100) }
  }

  if (!response.ok) {
    throw new Error(`${response.status} ${JSON.stringify(data)}`)
  }

  const setCookie = response.headers.get('set-cookie')
  if (setCookie) {
    authCookie = setCookie.split(';')[0]
  }

  return data
}

async function main() {
  console.log('🚀 Starting API Verification for 15 Endpoints...\n')

  try {
    // 1. Register
    await runTest('1. Register (POST /api/auth/register)', async () => {
      return api('POST', '/api/auth/register', TEST_USER)
    })

    // Upgrade to admin immediately to test everything
    await upgradeToAdmin(TEST_USER.email)

    // 2. Login
    await runTest('2. Login (POST /api/auth/login)', async () => {
      return api('POST', '/api/auth/login', { email: TEST_USER.email, password: TEST_USER.password })
    })

    // 3. User Profile GET
    await runTest('3. Get Profile (GET /api/users/profile)', async () => {
      return api('GET', '/api/users/profile')
    })

    // 4. User Profile PUT
    await runTest('4. Update Profile (PUT /api/users/profile)', async () => {
      return api('PUT', '/api/users/profile', { bio: 'Automated test user' })
    })

    // 5. Create Article
    await runTest('5. Create Article (POST /api/articles)', async () => {
      const res = await api('POST', '/api/articles', {
        title: `Test Article ${TIMESTAMP}`,
        content: 'This is a test article content for automated verification.',
        category: 'technology',
        tags: ['test', 'automation']
      })
      articleId = res.article._id
      return res
    })

    if (!articleId) {
      throw new Error('Article ID not returned')
    }

    // 6. Get Article
    await runTest('6. Get Article (GET /api/articles/:id)', async () => {
      return api('GET', `/api/articles/${articleId}`)
    })

    // 7. Update Article
    await runTest('7. Update Article (PUT /api/articles/:id)', async () => {
      return api('PUT', `/api/articles/${articleId}`, { title: `Updated Title ${TIMESTAMP}` })
    })

    // 9. Review Article
    await runTest('9. Review Article (PUT /api/articles/:id/review)', async () => {
      return api('PUT', `/api/articles/${articleId}/review`, { status: 'approved', feedback: 'Auto approved' })
    })

    // 10. Publish Article
    await runTest('10. Publish Article (PUT /api/articles/:id/publish)', async () => {
      return api('PUT', `/api/articles/${articleId}/publish`)
    })

    // 8. List Articles (Now that we have one published)
    await runTest('8. List Articles (GET /api/articles)', async () => {
      return api('GET', '/api/articles')
    })

    // 11. Recommendations
    await runTest('11. Recommendations (GET /api/recommendations)', async () => {
      return api('GET', '/api/recommendations')
    })

    // 12. External News
    await runTest('12. External News (GET /api/news/external)', async () => {
      return api('GET', '/api/news/external')
    })

    // 13. TTS
    await runTest('13. TTS (POST /api/tts)', async () => {
      return api('POST', '/api/tts', { text: 'Hello world' })
    })

    // 14. Bookmarks
    await runTest('14. Bookmarks (POST /api/bookmarks)', async () => {
      return api('POST', '/api/bookmarks', { articleId, action: 'save' })
    })

    // 15. Analytics
    await runTest('15. Analytics (GET /api/analytics)', async () => {
      return api('GET', '/api/analytics')
    })

    console.log('\n✨ Verification Complete!')
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Verification Failed!')
    process.exit(1)
  }
}

main()
