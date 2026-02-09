import mongoose from 'mongoose'
import Article from '../lib/models/article'
import User from '../lib/models/user'

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Garv_news:Vragps2334@cluster0.vetvb19.mongodb.net/?appName=Cluster0'

// Indian author names
const indianAuthorNames = [
  'Rajesh Kumar', 'Priya Sharma', 'Amit Patel', 'Sneha Reddy', 'Vikram Singh',
  'Ananya Iyer', 'Rohan Gupta', 'Kavya Nair', 'Arjun Mehta', 'Divya Desai',
  'Karthik Rao', 'Meera Joshi', 'Sanjay Verma', 'Pooja Kapoor', 'Aditya Malhotra',
  'Riya Chopra', 'Nikhil Agarwal', 'Shreya Banerjee', 'Varun Pillai', 'Anjali Menon',
  'Rahul Shetty', 'Neha Kulkarni', 'Siddharth Bose', 'Tanvi Shah', 'Akash Pandey',
  'Ishita Saxena', 'Manish Tiwari', 'Sakshi Mishra', 'Gaurav Jain', 'Aditi Rane'
]

// International author names
const internationalAuthorNames = [
  'James Anderson', 'Emily Chen', 'Michael Rodriguez', 'Sarah Johnson', 'David Kim',
  'Jessica Martinez', 'Robert Taylor', 'Amanda White', 'Christopher Lee', 'Jennifer Brown',
  'Daniel Wilson', 'Laura Garcia', 'Matthew Davis', 'Rachel Thompson', 'Andrew Miller',
  'Sophia Martinez', 'William Jones', 'Olivia Williams', 'Benjamin Moore', 'Emma Jackson',
  'Alexander Harris', 'Isabella Clark', 'Nicholas Lewis', 'Mia Robinson', 'Ethan Walker',
  'Ava Hall', 'Ryan Allen', 'Charlotte Young', 'Jacob King', 'Amelia Wright'
]

// Categories with their query templates
const categories = [
  {
    name: 'Politics',
    queries: [
      'latest political news and developments worldwide',
      'recent political events and government policies'
    ]
  },
  {
    name: 'Business',
    queries: [
      'latest business news, market updates, and economic developments',
      'recent corporate news and financial market trends'
    ]
  },
  {
    name: 'Technology',
    queries: [
      'latest technology news, innovations, and tech industry updates',
      'recent tech breakthroughs and digital transformation news'
    ]
  },
  {
    name: 'Sports',
    queries: [
      'latest sports news, scores, and athletic achievements',
      'recent sports events and tournament updates'
    ]
  },
  {
    name: 'Entertainment',
    queries: [
      'latest entertainment news, movies, music, and celebrity updates',
      'recent film releases and entertainment industry news'
    ]
  },
  {
    name: 'Science',
    queries: [
      'latest scientific discoveries, research breakthroughs, and innovations',
      'recent science news and technological advancements'
    ]
  },
  {
    name: 'Health',
    queries: [
      'latest health news, medical breakthroughs, and wellness updates',
      'recent healthcare developments and medical research'
    ]
  },
  {
    name: 'World',
    queries: [
      'latest world news and international developments',
      'recent global events and international affairs'
    ]
  },
  {
    name: 'India',
    queries: [
      'latest news from India, Indian politics, business, and culture',
      'recent developments in India across all sectors'
    ]
  },
  {
    name: 'Global',
    queries: [
      'latest global news from around the world',
      'recent international news and worldwide developments'
    ]
  }
]

// Helper function to get random author name
function getRandomAuthor(isIndiaCategory: boolean): { name: string; email: string } {
  const names = isIndiaCategory ? indianAuthorNames : internationalAuthorNames
  const name = names[Math.floor(Math.random() * names.length)]
  const email = name.toLowerCase().replace(/\s+/g, '.') + '@newshub.com'
  return { name, email }
}

// Helper function to generate slug
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 100) + '-' + Date.now()
}

// Helper function to fetch news from Perplexity API
async function fetchNewsFromAPI(category: string, query: string, limit: number): Promise<any[]> {
  const apiKey = process.env.PERPLEXITY_API_KEY

  if (!apiKey) {
    console.log('⚠️  No Perplexity API key found, using fallback data')
    return []
  }

  try {
    console.log(`  📡 Fetching from Perplexity API...`)
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: `You are a news aggregator. Return the top ${limit} most recent and important news stories about: ${query}. Format each news item as a JSON object with: title (headline), excerpt (2-3 sentence summary), category, source, and publishedAt (date). Return ONLY a JSON array of news items, no additional text.`,
          },
          {
            role: 'user',
            content: `Get the latest ${limit} news stories about ${query}. Return them as a JSON array.`,
          },
        ],
        temperature: 0.2,
        max_tokens: 3000,
      }),
    })

    if (!response.ok) {
      console.log(`  ❌ API error: ${response.status}`)
      return []
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      console.log('  ❌ No content in API response')
      return []
    }

    // Parse the JSON response
    const jsonMatch = content.match(/\[[\s\S]*\]/)?.[0]
    if (jsonMatch) {
      const newsItems = JSON.parse(jsonMatch)
      console.log(`  ✅ Fetched ${newsItems.length} articles`)
      return newsItems
    }

    return []
  } catch (error: any) {
    console.log(`  ❌ Error fetching from API: ${error.message}`)
    return []
  }
}

// Generate fallback articles if API fails
function generateFallbackArticles(category: string, count: number, isIndiaCategory: boolean): any[] {
  const articles = []
  const templates = [
    { title: 'Breaking News Update', excerpt: 'Latest developments in the ongoing story continue to unfold with new information emerging.' },
    { title: 'Major Announcement Made', excerpt: 'Significant announcement made today that will impact the industry and stakeholders.' },
    { title: 'New Initiative Launched', excerpt: 'Innovative initiative launched to address key challenges and create positive change.' },
    { title: 'Expert Analysis Released', excerpt: 'Comprehensive analysis by leading experts provides insights into current trends.' },
    { title: 'Important Development Reported', excerpt: 'Critical development reported that signals potential shifts in the landscape.' },
  ]

  for (let i = 0; i < count; i++) {
    const template = templates[i % templates.length]
    articles.push({
      title: `${category}: ${template.title} ${i + 1}`,
      excerpt: template.excerpt,
      category: category,
      source: isIndiaCategory ? 'India News Network' : 'Global News Network',
      publishedAt: new Date(Date.now() - i * 3600000).toISOString(),
    })
  }

  return articles
}

// Main seeding function
async function seedArticles() {
  try {
    console.log('🚀 Starting article seeding process...\n')

    // Connect to MongoDB
    console.log('📦 Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB\n')

    // Create or get system users for each author
    const authorCache = new Map<string, any>()

    async function getOrCreateAuthor(name: string, email: string) {
      if (authorCache.has(email)) {
        return authorCache.get(email)
      }

      let user = await User.findOne({ email })

      if (!user) {
        user = await User.create({
          name,
          email,
          password: 'hashed_password_placeholder', // This won't be used for login
          role: 'author',
          bio: `Professional journalist and news contributor at NewsHub`,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
        })
        console.log(`  👤 Created author: ${name}`)
      }

      authorCache.set(email, user)
      return user
    }

    let totalArticlesCreated = 0

    // Process each category
    for (const category of categories) {
      console.log(`\n📰 Processing category: ${category.name}`)
      console.log(`${'='.repeat(50)}`)

      const isIndiaCategory = category.name === 'India'
      const articlesPerQuery = Math.ceil(20 / category.queries.length)
      let categoryArticles: any[] = []

      // Fetch articles for each query in the category
      for (const query of category.queries) {
        const fetchedArticles = await fetchNewsFromAPI(category.name, query, articlesPerQuery)
        categoryArticles = categoryArticles.concat(fetchedArticles)
      }

      // If we don't have enough articles from API, generate fallback
      if (categoryArticles.length < 20) {
        console.log(`  ⚠️  Only got ${categoryArticles.length} articles, generating fallback for remaining`)
        const fallbackCount = 20 - categoryArticles.length
        const fallbackArticles = generateFallbackArticles(category.name, fallbackCount, isIndiaCategory)
        categoryArticles = categoryArticles.concat(fallbackArticles)
      }

      // Limit to exactly 20 articles
      categoryArticles = categoryArticles.slice(0, 20)

      console.log(`\n  💾 Creating ${categoryArticles.length} articles in database...`)

      // Create articles in database
      for (let i = 0; i < categoryArticles.length; i++) {
        const articleData = categoryArticles[i]
        const authorInfo = getRandomAuthor(isIndiaCategory)
        const author = await getOrCreateAuthor(authorInfo.name, authorInfo.email)

        // Generate elaborate journalism-style article content
        const leadParagraph = `${articleData.excerpt || 'In a significant development that has captured widespread attention,'} this ${category.name.toLowerCase()} story has emerged as a focal point of discussion among experts, policymakers, and stakeholders. The developments, which unfolded over the past several days, have raised important questions about the future direction of the sector and its broader implications for society.`

        const contextParagraphs = [
          `According to sources familiar with the matter, the situation has been developing over an extended period, with multiple factors contributing to the current state of affairs. Industry insiders suggest that the convergence of technological advancement, regulatory changes, and shifting public sentiment has created a unique set of circumstances that demand careful consideration and strategic planning.`,

          `The background to these developments can be traced to earlier policy decisions and market dynamics that have shaped the ${category.name.toLowerCase()} landscape. Experts point out that similar situations in other regions have demonstrated both the challenges and opportunities that arise from such transformative periods, offering valuable lessons for stakeholders navigating the current environment.`,

          `"This represents a watershed moment for the ${category.name.toLowerCase()} sector," said a senior analyst who has been closely monitoring the situation. "The decisions made in the coming weeks and months will have far-reaching consequences that extend well beyond immediate stakeholders, potentially reshaping the entire ecosystem for years to come."`
        ]

        const analysisParagraphs = [
          `A detailed examination of the situation reveals several key factors at play. First, the rapid pace of change has created both opportunities and challenges for established players and new entrants alike. Second, regulatory frameworks are struggling to keep pace with innovation, creating uncertainty that affects investment decisions and strategic planning. Third, public awareness and engagement have reached unprecedented levels, adding a new dimension to traditional decision-making processes.`,

          `Industry leaders have responded to these developments with a mix of cautious optimism and strategic repositioning. Several major organizations have announced initiatives aimed at addressing the evolving landscape, while others are taking a wait-and-see approach, preferring to assess the situation more fully before committing to significant changes in their operations or strategies.`,

          `"We are witnessing a fundamental shift in how the ${category.name.toLowerCase()} sector operates," noted another expert with decades of experience in the field. "The traditional models are being challenged, and those who can adapt quickly while maintaining their core values will be best positioned for success in this new environment."`
        ]

        const implicationsParagraphs = [
          `The implications of these developments extend across multiple dimensions. Economically, the changes could affect employment patterns, investment flows, and competitive dynamics in ways that are still being fully understood. Socially, there are questions about equity, access, and the distribution of benefits and burdens among different groups. Politically, the situation has sparked debates about the appropriate role of government oversight and the balance between innovation and regulation.`,

          `Looking ahead, stakeholders are focusing on several key areas that will likely determine the trajectory of future developments. These include the evolution of technological capabilities, the adaptation of regulatory frameworks, the response of market participants, and the engagement of civil society in shaping outcomes that reflect broader public interests and values.`
        ]

        const conclusionParagraph = `As the situation continues to evolve, observers emphasize the importance of maintaining open dialogue among all stakeholders, ensuring that decisions are informed by comprehensive analysis and diverse perspectives. While uncertainty remains about specific outcomes, there is broad consensus that the current period represents a critical juncture that will shape the ${category.name.toLowerCase()} landscape for the foreseeable future. The coming weeks and months will be crucial in determining whether the challenges can be transformed into opportunities for positive change and sustainable progress.`

        // Generate content with embedded images
        const contentWithImages = `
          <p class="lead">${contentParagraphs[0]}</p>

          <figure class="my-6">
            <img src="https://picsum.photos/seed/${category.name.toLowerCase()}-${i}-main/1200/600" alt="${articleData.title || category.name + ' News'}" class="w-full rounded-lg" />
            <figcaption class="text-sm text-gray-600 mt-2 text-center">Related to ${category.name} - ${articleData.source || 'News Network'}</figcaption>
          </figure>

          <p>${contentParagraphs[1]}</p>

          <p>${contentParagraphs[2]}</p>

          <figure class="my-6">
            <img src="https://picsum.photos/seed/${category.name.toLowerCase()}-${i}-detail/1200/600" alt="Additional context for ${category.name}" class="w-full rounded-lg" />
            <figcaption class="text-sm text-gray-600 mt-2 text-center">Detailed view of ${category.name.toLowerCase()} developments</figcaption>
          </figure>

          <p>${contentParagraphs[3]}</p>

          <blockquote class="border-l-4 border-primary pl-4 my-6 italic text-lg">
            "This represents a pivotal moment in ${category.name.toLowerCase()} that will have lasting implications for all involved parties."
          </blockquote>

          <p>${contentParagraphs[4]}</p>

          <figure class="my-6">
            <img src="https://picsum.photos/seed/${category.name.toLowerCase()}-${i}-analysis/1200/600" alt="Analysis of ${category.name} situation" class="w-full rounded-lg" />
            <figcaption class="text-sm text-gray-600 mt-2 text-center">Expert analysis and future outlook</figcaption>
          </figure>
        `

        const article = await Article.create({
          title: articleData.title || `${category.name} News Update ${i + 1}`,
          slug: generateSlug(articleData.title || `${category.name} News Update ${i + 1}`),
          content: contentWithImages,
          excerpt: articleData.excerpt || 'Breaking news update from our correspondents.',
          bannerImage: `https://picsum.photos/seed/${category.name.toLowerCase()}-${i}-banner/800/600`,
          author: author._id,
          category: category.name,
          tags: [category.name.toLowerCase(), 'news', 'breaking'],
          status: 'published',
          publishedAt: new Date(articleData.publishedAt || Date.now() - i * 3600000),
          views: Math.floor(Math.random() * 1000) + 100,
        })

        totalArticlesCreated++

        if ((i + 1) % 5 === 0) {
          console.log(`  ✓ Created ${i + 1}/${categoryArticles.length} articles`)
        }
      }

      console.log(`  ✅ Completed ${category.name}: ${categoryArticles.length} articles created`)
    }

    console.log(`\n${'='.repeat(50)}`)
    console.log(`🎉 Seeding completed successfully!`)
    console.log(`📊 Total articles created: ${totalArticlesCreated}`)
    console.log(`👥 Total authors created: ${authorCache.size}`)
    console.log(`${'='.repeat(50)}\n`)

  } catch (error) {
    console.error('❌ Error seeding articles:', error)
    throw error
  } finally {
    await mongoose.connection.close()
    console.log('👋 Database connection closed')
  }
}

// Run the seeding script
seedArticles()
  .then(() => {
    console.log('✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
