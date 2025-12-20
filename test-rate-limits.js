const OpenAI = require('openai').default;
require('dotenv').config();

const fireworks = new OpenAI({
  apiKey: process.env.FIREWORKS_API_KEY,
  baseURL: 'https://api.fireworks.ai/inference/v1'
});

async function testKimi() {
  console.log('Testing Kimi K2...');
  try {
    const start = Date.now();
    const completion = await fireworks.chat.completions.create({
      model: 'accounts/fireworks/models/kimi-k2-thinking',
      messages: [{ role: 'user', content: 'Say hello' }],
      max_tokens: 10
    });
    console.log(`✓ Kimi K2 OK (${Date.now() - start}ms): ${completion.choices[0]?.message?.content || 'OK'}`);
    return true;
  } catch (error) {
    console.log(`✗ Kimi K2 FAILED: ${error.message}`);
    return false;
  }
}

async function testLlama() {
  console.log('Testing Llama 3.3...');
  try {
    const start = Date.now();
    const completion = await fireworks.chat.completions.create({
      model: 'accounts/fireworks/models/llama-v3p3-70b-instruct',
      messages: [{ role: 'user', content: 'Say hello' }],
      max_tokens: 10
    });
    console.log(`✓ Llama OK (${Date.now() - start}ms): ${completion.choices[0]?.message?.content || 'OK'}`);
    return true;
  } catch (error) {
    console.log(`✗ Llama FAILED: ${error.message}`);
    return false;
  }
}

async function testDeepSeek() {
  console.log('Testing DeepSeek V3.1...');
  try {
    const start = Date.now();
    const completion = await fireworks.chat.completions.create({
      model: 'accounts/fireworks/models/deepseek-v3p1',
      messages: [{ role: 'user', content: 'Say hello' }],
      max_tokens: 10
    });
    console.log(`✓ DeepSeek OK (${Date.now() - start}ms): ${completion.choices[0]?.message?.content || 'OK'}`);
    return true;
  } catch (error) {
    console.log(`✗ DeepSeek FAILED: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('Testing Fireworks API rate limits...\n');

  const [kimiOk, llamaOk, deepseekOk] = await Promise.all([
    testKimi(),
    testLlama(),
    testDeepSeek()
  ]);

  console.log('\n--- Summary ---');
  console.log(`Kimi K2: ${kimiOk ? '✓ Available' : '✗ Rate limited'}`);
  console.log(`Llama 3.3: ${llamaOk ? '✓ Available' : '✗ Rate limited'}`);
  console.log(`DeepSeek V3.1: ${deepseekOk ? '✓ Available' : '✗ Rate limited'}`);

  if (kimiOk && llamaOk && deepseekOk) {
    console.log('\n✓ All APIs ready!');
  } else {
    console.log('\n⚠ Some APIs still rate limited. Wait a few minutes.');
  }
}

main().catch(console.error);
