require('dotenv').config();
const OpenAI = require('openai').default;
const fireworks = new OpenAI({
  apiKey: process.env.FIREWORKS_API_KEY,
  baseURL: 'https://api.fireworks.ai/inference/v1',
});

async function main() {
  console.log('Testing DeepSeek...');
  try {
    const completion = await fireworks.chat.completions.create({
      model: 'accounts/fireworks/models/deepseek-v3p1',
      messages: [{ role: 'user', content: 'Say hello' }],
    });
    console.log('DeepSeek response:', completion.choices[0].message.content);
  } catch (error) {
    console.error('DeepSeek error:', error.message);
  }

  console.log('\nTesting Kimi...');
  try {
    const kimiClient = new OpenAI({
      apiKey: process.env.KIMI_API_KEY,
      baseURL: 'https://api.moonshot.cn/v1',
    });
    const completion = await kimiClient.chat.completions.create({
      model: 'moonshot-v1-128k',
      messages: [{ role: 'user', content: 'Say hello' }],
    });
    console.log('Kimi response:', completion.choices[0].message.content);
  } catch (error) {
    console.error('Kimi error:', error.message);
  }
}

main();
