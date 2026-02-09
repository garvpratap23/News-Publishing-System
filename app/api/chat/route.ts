import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { messages, articleContext } = await request.json()

    console.log('Chat API called with:', {
      messageCount: messages?.length,
      hasArticleContext: !!articleContext,
    })

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      )
    }

    const apiKey = process.env.GROQ_API_KEY

    console.log('API Key check:', {
      hasKey: !!apiKey,
      keyPrefix: apiKey?.substring(0, 10),
    })

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Groq API key not configured' },
        { status: 500 }
      )
    }

    // Build system message with article context if provided
    let systemMessage = `You are a helpful AI assistant for NewsHub, a news publishing platform. You help users by:
1. Answering questions about articles they're reading
2. Fact-checking claims in articles
3. Providing additional context and information
4. Explaining complex topics mentioned in articles

Be concise, accurate, and helpful. If you're not sure about something, say so.`

    if (articleContext) {
      systemMessage += `\n\nThe user is currently reading an article with the following details:
Title: ${articleContext.title}
Category: ${articleContext.category}
Content: ${articleContext.content}

When answering questions, you can reference this article directly. If the user asks about fact-checking or verification, analyze the article content and provide accurate information.`
    }

    console.log('Calling Groq API...')

    // Call Groq API (OpenAI-compatible)
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile', // Fast and powerful Llama model
        messages: [
          { role: 'system', content: systemMessage },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    })

    console.log('Groq response status:', response.status)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      console.error('Groq API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      })
      return NextResponse.json(
        {
          error: 'Failed to get AI response',
          details: errorData.error?.message || JSON.stringify(errorData) || 'Unknown error',
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('Groq response received:', {
      hasChoices: !!data.choices,
      choicesLength: data.choices?.length,
    })

    const assistantMessage = data.choices?.[0]?.message?.content

    if (!assistantMessage) {
      console.error('No message content in response:', data)
      return NextResponse.json(
        { error: 'No response from AI' },
        { status: 500 }
      )
    }

    console.log('Success! Returning message')
    return NextResponse.json({
      message: assistantMessage,
      usage: data.usage,
    })
  } catch (error: any) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
