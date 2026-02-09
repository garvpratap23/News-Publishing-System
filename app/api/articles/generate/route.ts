import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { type, content, tone } = await request.json()

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'AI configuration missing' },
        { status: 500 }
      )
    }

    let systemPrompt = 'You are a professional assistant for a news publishing platform.'
    let userPrompt = ''

    switch (type) {
      case 'summary':
        systemPrompt += ' You are an expert at summarizing news articles. Create a concise, engaging summary (excerpt) of the text provided. Keep it under 300 characters.'
        userPrompt = `Summarize this content:\n\n${content}`
        break
      case 'headline':
        systemPrompt += ' You are a creative headline writer. Generate 5 catchy, SEO-friendly headlines for the text provided. Return them as a numbered list.'
        userPrompt = `Generate headlines for this content:\n\n${content}`
        break
      case 'rewrite':
        systemPrompt += ` You are an expert editor. Rewrite the text provided to match a "${tone || 'professional'}" tone. Preserve the meaning but improve flow and engagement.`
        userPrompt = `Rewrite this text:\n\n${content}`
        break
      default:
        return NextResponse.json({ error: 'Invalid generation type' }, { status: 400 })
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: type === 'rewrite' ? 2000 : 500,
      }),
    })

    if (!response.ok) {
        throw new Error(`Groq API error: ${response.statusText}`)
    }

    const data = await response.json()
    const result = data.choices?.[0]?.message?.content

    return NextResponse.json({ result })
  } catch (error: any) {
    console.error('AI Generation error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
