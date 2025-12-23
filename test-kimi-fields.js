const OpenAI = require('openai').default;
require('dotenv').config();

const fireworks = new OpenAI({
  apiKey: process.env.FIREWORKS_API_KEY,
  baseURL: 'https://api.fireworks.ai/inference/v1'
});

async function testKimiFields() {
  console.log('Testing Kimi K2 response fields...\n');

  const completion = await fireworks.chat.completions.create({
    model: 'accounts/fireworks/models/kimi-k2-thinking',
    messages: [{ role: 'user', content: 'Say "Hello, I am Russia" and nothing else.' }],
    max_tokens: 100
  });

  const message = completion.choices[0]?.message;

  console.log('Message object keys:', Object.keys(message));
  console.log('\n--- Content field ---');
  console.log(message.content);
  console.log('\n--- Reasoning_content field ---');
  console.log(message.reasoning_content);
  console.log('\n--- Full message object ---');
  console.log(JSON.stringify(message, null, 2));
}

testKimiFields().catch(console.error);
