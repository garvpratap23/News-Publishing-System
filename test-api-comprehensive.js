// Comprehensive API Test
const apiKey = process.env.PERPLEXITY_API_KEY;

async function testPerplexityAPIComprehensive() {
  console.log('=== COMPREHENSIVE PERPLEXITY API TEST ===\n');

  try {
    console.log('Step 1: Preparing request...');
    const requestBody = {
      model: 'sonar',
      messages: [
        {
          role: 'system',
          content: 'You are a news aggregator. Return the top 2 most recent news stories about technology. Format each news item as a JSON object with: title, excerpt, category, source, url, and publishedAt. Return ONLY a JSON array of news items, no additional text.',
        },
        {
          role: 'user',
          content: 'Get the latest 2 technology news stories. Return them as a JSON array.',
        },
      ],
      temperature: 0.2,
      max_tokens: 2000,
    };

    console.log('Request body prepared:', JSON.stringify(requestBody, null, 2));

    console.log('\nStep 2: Sending request to Perplexity API...');
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('\nStep 3: Response received');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('Headers:', JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));

    const responseText = await response.text();
    console.log('\nStep 4: Response body (raw):');
    console.log(responseText);

    if (response.ok) {
      console.log('\n✅ ✅ ✅ API KEY IS WORKING! ✅ ✅ ✅');
      try {
        const jsonData = JSON.parse(responseText);
        const content = jsonData.choices?.[0]?.message?.content;
        console.log('\nExtracted content:');
        console.log(content);

        // Try to parse the news array
        const jsonMatch = content.match(/\[[\s\S]*\]/)?.[0];
        if (jsonMatch) {
          const newsItems = JSON.parse(jsonMatch);
          console.log('\nParsed news items:');
          console.log(JSON.stringify(newsItems, null, 2));
        }
      } catch (e) {
        console.log('Could not parse response:', e.message);
      }
    } else {
      console.log('\n❌ ❌ ❌ API KEY IS NOT WORKING! ❌ ❌ ❌');
      console.log('Error response:', responseText);
    }
  } catch (error) {
    console.log('\n❌ ❌ ❌ REQUEST FAILED! ❌ ❌ ❌');
    console.log('Error type:', error.constructor.name);
    console.log('Error message:', error.message);
    console.log('Error stack:', error.stack);
  }
}

testPerplexityAPIComprehensive();
