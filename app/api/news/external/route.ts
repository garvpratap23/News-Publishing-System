import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || 'general'
    const limit = parseInt(searchParams.get('limit') || '10')

    const apiKey = process.env.PERPLEXITY_API_KEY

    // Should we reuse the logic from existing fetch? Yes, it seems robust.
    // Ideally user might want to consolidate, but for now we implement the new endpoint.

    console.log('[EXTERNAL NEWS] API Key present:', !!apiKey)

    if (!apiKey) {
      console.log('[EXTERNAL NEWS] No API key, using fallback')
      return NextResponse.json({
        news: generateFallbackNews(category, limit),
        source: 'fallback',
        total: limit,
      })
    }

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

    try {
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
          temperature: 0.2, // Low temperature for factual news
          max_tokens: 2000,
        }),
      })

      if (!response.ok) {
        console.error('[EXTERNAL NEWS] API error:', response.status)
        return NextResponse.json({
          news: generateFallbackNews(category, limit),
          source: 'fallback',
          total: limit,
        })
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content

      if (!content) {
        return NextResponse.json({
          news: generateFallbackNews(category, limit),
          source: 'fallback',
          total: limit,
        })
      }

      let newsItems
      try {
        const jsonMatch = content.match(/\[[\s\S]*\]/)?.[0]
        newsItems = jsonMatch ? JSON.parse(jsonMatch) : JSON.parse(content)
      } catch (e) {
        console.error('[EXTERNAL NEWS] Parse error:', e)
        return NextResponse.json({
          news: generateFallbackNews(category, limit),
          source: 'fallback',
          total: limit,
        })
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const formattedNews = (Array.isArray(newsItems) ? newsItems : [newsItems])
        .slice(0, limit)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((item: any, index: number) => {
          const timestamp = Date.now()
          const slug = (item.title || 'news')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')

          return {
            _id: `ext-${timestamp}-${index}`,
            title: item.title || 'News Update',
            slug: `external-${slug}-${timestamp}`,
            excerpt: item.excerpt || item.summary || '',
            category: item.category || category,
            source: item.source || 'Global News',
            url: item.url || '#',
            bannerImage: `https://source.unsplash.com/featured/800x600/?${encodeURIComponent(category)},news,${index}`,
            publishedAt: item.publishedAt || new Date().toISOString(),
            author: { // Adapt to article schema if needed
              name: item.source || 'Global News',
              avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(item.source || 'GN')}`,
            },
            tags: [category],
            isExternal: true,
          }
        })

      return NextResponse.json({
        news: formattedNews,
        source: 'perplexity',
        total: formattedNews.length,
      })

    } catch (error) {
      console.error('[EXTERNAL NEWS] Fetch error:', error)
      return NextResponse.json({
        news: generateFallbackNews(category, limit),
        source: 'fallback',
        total: limit,
      })
    }

  } catch (error) {
    console.error('External news error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateFallbackNews(category: string, limit: number) {
  return Array.from({ length: limit }).map((_, i) => ({
    _id: `fallback-${Date.now()}-${i}`,
    title: `Sample News about ${category} ${i + 1}`,
    slug: `sample-news-${category}-${i}`,
    excerpt: 'This is a fallback news item because real-time news could not be fetched.',
    category: category,
    source: 'NewsHub Fallback',
    url: '#',
    bannerImage: `https://source.unsplash.com/800x600/?${category},news,${i}`,
    publishedAt: new Date().toISOString(),
    author: { name: 'NewsHub', avatar: '' },
    isExternal: true,
  }))
}
