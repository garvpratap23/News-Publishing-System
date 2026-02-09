// Test Perplexity API Key
const apiKey = process.env.PERPLEXITY_API_KEY;

async function testPerplexityAPI() {
  console.log('Testing Perplexity API Key...\n');

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
            content: 'You are a news aggregator. Return the top 2 most recent news stories about technology.',
          },
          {
            role: 'user',
            content: 'Get the latest 2 technology news stories.',
          },
        ],
        temperature: 0.2,
        max_tokens: 500,
      }),
    });

    console.log('Response Status:', response.status);
    console.log('Response Status Text:', response.statusText);

    const data = await response.text();
    console.log('\nResponse Body:');
    console.log(data);

    if (response.ok) {
      console.log('\n✅ API Key is WORKING!');
      try {
        const jsonData = JSON.parse(data);
        console.log('\nParsed Response:');
        console.log(JSON.stringify(jsonData, null, 2));
      } catch (e) {
        console.log('Could not parse as JSON');
      }
    } else {
      console.log('\n❌ API Key is NOT working!');
      console.log('Error details:', data);
    }
  } catch (error) {
    console.log('\n❌ Request failed!');
    console.log('Error:', error.message);
  }
}

testPerplexityAPI();
