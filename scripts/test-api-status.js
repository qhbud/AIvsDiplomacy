// Test API availability for each country/model

const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk').default;
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

const xai = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: 'https://api.x.ai/v1',
});

const fireworks = new OpenAI({
  apiKey: process.env.FIREWORKS_API_KEY,
  baseURL: 'https://api.fireworks.ai/inference/v1',
});

const countries = [
  { country: 'Austria-Hungary', model: 'Claude Sonnet 4 Alt (Anthropic)', func: testClaude },
  { country: 'England', model: 'Gemini 2.5 Flash (Google)', func: testGemini },
  { country: 'Italy', model: 'Claude Sonnet 4 (Anthropic)', func: testClaude },
  { country: 'Turkey', model: 'Llama 3.3 70B Instruct (Meta)', func: testLlama },
  { country: 'Germany', model: 'Grok 3 (xAI)', func: testGrok },
  { country: 'Russia', model: 'Kimi K2 Thinking (Moonshot AI)', func: testKimi },
  { country: 'France', model: 'DeepSeek V3.1 (Fireworks AI)', func: testDeepSeek },
];

async function testOpenAI() {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: 'Say "OK" if you can respond.' }],
    max_tokens: 10,
  });
  return completion.choices[0]?.message?.content || 'No response';
}

async function testClaude() {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 10,
    messages: [{ role: 'user', content: 'Say "OK" if you can respond.' }],
  });
  return message.content[0]?.type === 'text' ? message.content[0].text : 'No response';
}

async function testGemini() {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  const result = await model.generateContent('Say "OK" if you can respond.');
  return result.response.text() || 'No response';
}

async function testGrok() {
  const completion = await xai.chat.completions.create({
    model: 'grok-3',
    messages: [{ role: 'user', content: 'Say "OK" if you can respond.' }],
    max_tokens: 10,
  });
  return completion.choices[0]?.message?.content || 'No response';
}

async function testDeepSeek() {
  const completion = await fireworks.chat.completions.create({
    model: 'accounts/fireworks/models/deepseek-v3p1',
    messages: [{ role: 'user', content: 'Say "OK" if you can respond.' }],
    max_tokens: 10,
  });
  return completion.choices[0]?.message?.content || 'No response';
}

async function testLlama() {
  const completion = await fireworks.chat.completions.create({
    model: 'accounts/fireworks/models/llama-v3p3-70b-instruct',
    messages: [{ role: 'user', content: 'Say "OK" if you can respond.' }],
    max_tokens: 10,
  });
  return completion.choices[0]?.message?.content || 'No response';
}

async function testKimi() {
  const completion = await fireworks.chat.completions.create({
    model: 'accounts/fireworks/models/kimi-k2-thinking',
    messages: [{ role: 'user', content: 'Say "OK" if you can respond.' }],
    max_tokens: 10,
  });
  const message = completion.choices[0]?.message;
  // Check both content and reasoning_content for Kimi K2
  return message?.reasoning_content || message?.content || 'No response';
}

async function main() {
  console.log('Testing API availability for each country...\n');
  console.log('='.repeat(80));

  const results = [];

  for (const { country, model, func } of countries) {
    process.stdout.write(`\nTesting ${country} (${model})... `);
    const startTime = Date.now();

    try {
      const response = await func();
      const timeMs = Date.now() - startTime;

      if (response && response !== 'No response') {
        console.log(`✓ SUCCESS (${timeMs}ms)`);
        console.log(`  Response: "${response.substring(0, 50)}${response.length > 50 ? '...' : ''}"`);
        results.push({ country, model, status: 'SUCCESS', timeMs, error: null });
      } else {
        console.log(`✗ FAILED - Empty response (${timeMs}ms)`);
        results.push({ country, model, status: 'FAILED', timeMs, error: 'Empty response' });
      }
    } catch (error) {
      const timeMs = Date.now() - startTime;
      console.log(`✗ ERROR (${timeMs}ms)`);
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.log(`  Error: ${errorMsg.substring(0, 100)}${errorMsg.length > 100 ? '...' : ''}`);
      results.push({ country, model, status: 'ERROR', timeMs, error: errorMsg });
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('\nSummary:\n');

  const working = results.filter(r => r.status === 'SUCCESS');
  const failed = results.filter(r => r.status !== 'SUCCESS');

  console.log(`✓ Working APIs: ${working.length}/${countries.length}`);
  working.forEach(r => console.log(`  - ${r.country}: ${r.model}`));

  if (failed.length > 0) {
    console.log(`\n✗ Failed APIs: ${failed.length}/${countries.length}`);
    failed.forEach(r => {
      console.log(`  - ${r.country}: ${r.model}`);
      console.log(`    Error: ${r.error?.substring(0, 80)}${r.error && r.error.length > 80 ? '...' : ''}`);
    });
  }

  console.log(`\n${working.length === countries.length ? '✓ ALL APIS WORKING' : '⚠ SOME APIS FAILED'}`);
}

main().catch(console.error);
