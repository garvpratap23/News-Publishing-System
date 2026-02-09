// Test function to fetch real news from Perplexity
async function testPerplexityNews() {
  const apiKey = process.env.PERPLEXITY_API_KEY

  if (!apiKey) {
    console.log('No API key found')
    return
  }

  console.log('Testing Perplexity API for real news...\n')

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
            content: 'You are a professional news journalist. Provide accurate, real, current news stories with full details.',
          },
          {
            role: 'user',
            content: `Write 3 real, current news articles about latest technology news. For each article:
1. Use a real headline from recent news
2. Write a 2-sentence summary
3. Write 8-10 detailed paragraphs covering the full story with real facts, quotes, and context
4. Include who, what, when, where, why
5. Use professional journalism style

Format as a JSON array with: title, excerpt, fullContent (plain text paragraphs separated by \\n\\n)`,
          },
        ],
        temperature: 0.3,
        max_tokens: 6000,
      }),
    })

    if (!response.ok) {
      console.log(`API Error: ${response.status}`)
      const errorText = await response.text()
      console.log(errorText)
      return
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    console.log('=== RAW RESPONSE ===')
    console.log(content)
    console.log('\n=== END RESPONSE ===\n')

    // Try to parse JSON
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/)?.[0]
      if (jsonMatch) {
        const articles = JSON.parse(jsonMatch)
        console.log(`\nSuccessfully parsed ${articles.length} articles`)
        console.log('\nFirst article:')
        console.log(JSON.stringify(articles[0], null, 2))
      } else {
        console.log('No JSON array found in response')
      }
    } catch (e) {
      console.log('Could not parse as JSON')
    }

  } catch (error: any) {
    console.log(`Error: ${error.message}`)
  }
}

testPerplexityNews()
