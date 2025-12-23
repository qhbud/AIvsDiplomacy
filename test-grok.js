require('dotenv').config();
const OpenAI = require('openai').default;

const xai = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: 'https://api.x.ai/v1',
});

async function main() {
  console.log('Testing Grok 3...\n');

  try {
    const completion = await xai.chat.completions.create({
      model: 'grok-3',
      messages: [{ role: 'user', content: 'Say hello in one sentence.' }],
    });

    console.log('✅ Grok is working!');
    console.log('Response:', completion.choices[0].message.content);
  } catch (error) {
    console.error('❌ Grok failed:', error.message);
    if (error.status) {
      console.error('Status:', error.status);
    }
  }
}

main();
