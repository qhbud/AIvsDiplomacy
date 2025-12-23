require('dotenv').config();
const OpenAI = require('openai').default;

const fireworks = new OpenAI({
  apiKey: process.env.FIREWORKS_API_KEY,
  baseURL: 'https://api.fireworks.ai/inference/v1',
});

async function main() {
  console.log('Testing Kimi with a simple prompt...\n');

  try {
    const completion = await fireworks.chat.completions.create({
      model: 'accounts/fireworks/models/kimi-k2-thinking',
      messages: [{ role: 'user', content: 'Write a short paragraph about why Italy or England might deserve to win a game of Diplomacy.' }],
      max_tokens: 500,
    });

    console.log('Full response object:');
    console.log(JSON.stringify(completion, null, 2));
    console.log('\n\nMessage content:');
    console.log(completion.choices[0].message.content);
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Full error:', error);
  }
}

main();
