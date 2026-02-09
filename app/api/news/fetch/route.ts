import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || 'general'
    const limit = parseInt(searchParams.get('limit') || '10')

    const apiKey = process.env.PERPLEXITY_API_KEY

    console.log('[NEWS FETCH] API Key present:', !!apiKey, 'Length:', apiKey?.length)

    if (!apiKey) {
      console.log('[NEWS FETCH] No API key found, using fallback')
      // Return fallback news if API key is not configured
      return NextResponse.json({
        news: generateFallbackNews(category, limit),
        source: 'fallback',
        total: limit,
      })
    }

    console.log('[NEWS FETCH] Calling Perplexity API for category:', category)

    // Map categories to better search queries
    const categoryQueries: { [key: string]: string } = {
      politics: 'latest political news and developments worldwide',
      business: 'latest business news, market updates, and economic developments',
      technology: 'latest technology news, innovations, and tech industry updates',
      sports: 'latest sports news, scores, and athletic achievements',
      entertainment: 'latest entertainment news, movies, music, and celebrity updates',
      science: 'latest scientific discoveries, research breakthroughs, and innovations',
      health: 'latest health news, medical breakthroughs, and wellness updates',
      world: 'latest world news and international developments',
      general: 'latest breaking news from around the world',
    }

    const query = categoryQueries[category.toLowerCase()] || categoryQueries.general

    // Call Perplexity API
    try {
      console.log('[NEWS FETCH] Making API call to Perplexity...')
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
              content: `You are a news aggregator. Return the top ${limit} most recent and important news stories about: ${query}. Format each news item as a JSON object with: title (headline), excerpt (2-3 sentence summary), category, source, url (if available), and publishedAt (date). Return ONLY a JSON array of news items, no additional text.`,
            },
            {
              role: 'user',
              content: `Get the latest ${limit} news stories about ${query}. Return them as a JSON array.`,
            },
          ],
          temperature: 0.2,
          max_tokens: 2000,
        }),
      })

      console.log('[NEWS FETCH] Response status:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[NEWS FETCH] Perplexity API error - Status:', response.status)
        console.error('[NEWS FETCH] Error details:', errorText)
        // Return fallback news on API error
        return NextResponse.json({
          news: generateFallbackNews(category, limit),
          source: 'fallback',
          total: limit,
        })
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content

      console.log('[NEWS FETCH] API response received, content length:', content?.length || 0)

      if (!content) {
        console.error('[NEWS FETCH] No content in API response:', JSON.stringify(data))
        return NextResponse.json({
          news: generateFallbackNews(category, limit),
          source: 'fallback',
          total: limit,
        })
      }

      // Parse the JSON response
      let newsItems
      try {
        // Try to extract JSON from the response
        const jsonMatch = content.match(/\[[\s\S]*\]/)?.[0]
        if (jsonMatch) {
          newsItems = JSON.parse(jsonMatch)
        } else {
          newsItems = JSON.parse(content)
        }
        console.log('[NEWS FETCH] Successfully parsed', newsItems.length, 'news items')
      } catch (parseError) {
        console.error('[NEWS FETCH] Failed to parse news items:', parseError)
        console.error('[NEWS FETCH] Content was:', content)
        // Return fallback on parse error
        return NextResponse.json({
          news: generateFallbackNews(category, limit),
          source: 'fallback',
          total: limit,
        })
      }

      // Ensure we have an array and limit results
      const formattedNews = (Array.isArray(newsItems) ? newsItems : [newsItems])
        .slice(0, limit)
        .map((item: any, index: number) => {
          const timestamp = Date.now()
          const slug = (item.title || 'news-update')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')

          return {
            _id: `perplexity-${timestamp}-${index}`,
            title: item.title || 'News Update',
            slug: `external-${slug}-${timestamp}`,
            excerpt: item.excerpt || item.summary || item.description || '',
            category: item.category || category,
            source: item.source || 'Global News',
            url: item.url || item.link || '#',
            bannerImage: `https://source.unsplash.com/featured/800x600/?${encodeURIComponent(category)},news,${timestamp + index}`,
            publishedAt: item.publishedAt || item.date || new Date().toISOString(),
            author: {
              _id: 'perplexity-ai',
              name: item.source || 'Global News Network',
              avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(item.source || 'Global News')}&background=4F46E5&color=fff`,
            },
            tags: item.tags || [category],
            views: 0,
            likes: [],
            isExternal: true,
          }
        })

      console.log('[NEWS FETCH] Returning', formattedNews.length, 'formatted news items from Perplexity')
      return NextResponse.json(
        {
          news: formattedNews,
          source: 'perplexity',
          total: formattedNews.length,
        },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        }
      )
    } catch (fetchError: any) {
      console.error('[NEWS FETCH] Fetch error:', fetchError.message)
      console.error('[NEWS FETCH] Error stack:', fetchError.stack)
      // Return fallback on network error
      return NextResponse.json({
        news: generateFallbackNews(category, limit),
        source: 'fallback',
        total: limit,
      })
    }
  } catch (error) {
    console.error('Fetch news error:', error)
    const { searchParams } = new URL(request.url)
    return NextResponse.json({
      news: generateFallbackNews(searchParams.get('category') || 'general', parseInt(searchParams.get('limit') || '10')),
      source: 'fallback',
      total: parseInt(searchParams.get('limit') || '10'),
    })
  }
}

// Fallback news generator
function generateFallbackNews(category: string, limit: number) {
  const newsTemplates: { [key: string]: any[] } = {
    general: [
      { title: 'Global Markets Show Strong Performance', excerpt: 'Major stock indexes reached new heights today as investors responded positively to economic indicators.' },
      { title: 'Technology Sector Continues Innovation Wave', excerpt: 'Leading tech companies unveil groundbreaking solutions that promise to transform industries.' },
      { title: 'International Climate Summit Concludes', excerpt: 'World leaders commit to ambitious environmental targets in landmark agreement.' },
      { title: 'Healthcare Advances Bring Hope', excerpt: 'Researchers announce promising developments in medical treatment approaches.' },
      { title: 'Education Systems Adapt to Modern Needs', excerpt: 'Schools worldwide implement innovative learning methodologies for better outcomes.' },
      { title: 'Space Exploration Reaches New Milestones', excerpt: 'Space agencies announce successful missions expanding human knowledge of the cosmos.' },
    ],
    technology: [
      { title: 'AI Breakthrough Transforms Industry', excerpt: 'New artificial intelligence capabilities demonstrate unprecedented problem-solving potential.' },
      { title: 'Quantum Computing Makes Strides', excerpt: 'Researchers achieve significant progress in quantum computer development and applications.' },
      { title: 'Cybersecurity Measures Strengthened', excerpt: 'Organizations deploy advanced security protocols to protect against emerging threats.' },
      { title: 'Green Technology Revolution Accelerates', excerpt: 'Sustainable tech solutions gain momentum in the fight against climate change.' },
    ],
    business: [
      { title: 'Economic Growth Exceeds Expectations', excerpt: 'Latest GDP figures show robust expansion across multiple sectors and regions.' },
      { title: 'Startups Attract Record Investment', excerpt: 'Venture capital firms commit unprecedented funding to innovative new companies.' },
      { title: 'Global Trade Relations Strengthen', excerpt: 'International partnerships foster increased cooperation and economic opportunity.' },
      { title: 'Corporate Sustainability Initiatives Expand', excerpt: 'Major corporations announce comprehensive environmental and social programs.' },
    ],
    politics: [
      { title: 'Diplomatic Talks Yield Progress', excerpt: 'International negotiations result in agreements advancing global cooperation.' },
      { title: 'Policy Reforms Address Key Issues', excerpt: 'Legislative bodies introduce measures tackling pressing societal challenges.' },
      { title: 'Election Results Shape Future Direction', excerpt: 'Voters express their vision for governance in decisive electoral outcomes.' },
      { title: 'International Relations Evolve', excerpt: 'Nations navigate complex geopolitical landscape with strategic diplomacy.' },
    ],
    sports: [
      { title: 'Championship Victory Thrills Fans', excerpt: 'Dramatic competition concludes with spectacular performance by winning team.' },
      { title: 'Athletes Set New Records', excerpt: 'Outstanding achievements push boundaries of human athletic capability.' },
      { title: 'Sports Season Kicks Off', excerpt: 'Anticipation builds as teams begin quest for championship glory.' },
      { title: 'Olympic Preparations Advance', excerpt: 'Host city finalizes arrangements for upcoming international sporting event.' },
    ],
    entertainment: [
      { title: 'Box Office Success for Latest Release', excerpt: 'New film captivates audiences worldwide with compelling storytelling.' },
      { title: 'Music Festival Draws Record Attendance', excerpt: 'Celebrated artists deliver unforgettable performances to enthusiastic crowds.' },
      { title: 'Award Season Recognizes Excellence', excerpt: 'Industry honors outstanding achievements in film, television, and music.' },
      { title: 'Streaming Platform Announces Original Content', excerpt: 'Major service unveils lineup of highly anticipated new series and films.' },
    ],
    science: [
      { title: 'Scientific Discovery Opens New Possibilities', excerpt: 'Researchers uncover fundamental insights advancing human understanding.' },
      { title: 'Medical Research Shows Promise', excerpt: 'Clinical trials demonstrate effectiveness of novel treatment approaches.' },
      { title: 'Environmental Study Reveals Important Findings', excerpt: 'Scientists document critical data on ecosystem health and biodiversity.' },
      { title: 'Physics Experiment Yields Insights', excerpt: 'Laboratory results contribute to evolving theories about natural phenomena.' },
    ],
  }

  const templates = newsTemplates[category.toLowerCase()] || newsTemplates.general
  const selectedTemplates = templates.slice(0, limit)

  return selectedTemplates.map((template, index) => ({
    _id: `fallback-${category}-${Date.now()}-${index}`,
    title: template.title,
    slug: template.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    excerpt: template.excerpt,
    category: category.charAt(0).toUpperCase() + category.slice(1),
    source: 'NewsHub Global',
    url: '#',
    bannerImage: `https://source.unsplash.com/800x600/?${category},news,${index}`,
    publishedAt: new Date(Date.now() - index * 3600000).toISOString(), // Stagger times by 1 hour
    author: {
      _id: 'global-news',
      name: 'NewsHub Global Network',
      avatar: `https://ui-avatars.com/api/?name=NewsHub&background=4F46E5&color=fff`,
    },
    tags: [category],
    views: Math.floor(Math.random() * 1000) + 500,
    likes: [],
    isExternal: true,
  }))
}
