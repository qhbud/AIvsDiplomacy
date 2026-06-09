import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const fireworks = new OpenAI({ 
  apiKey: process.env.FIREWORKS_API_KEY, 
  baseURL: 'https://api.fireworks.ai/inference/v1' 
});
const xai = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: 'https://api.x.ai/v1'
});

async function testAPI(name, testFn) {
  process.stdout.write(`Testing ${name}... `);
  const start = Date.now();
  try {
    await testFn();
    const time = Date.now() - start;
    console.log(`✅ OK (${time}ms)`);
    return true;
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('=== Testing All Diplomacy Game APIs ===\n');
  
  const results = [];
  
  // Test OpenAI (Austria-Hungary)
  results.push(await testAPI('OpenAI GPT-4o-mini (Austria-Hungary)', async () => {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Say "OK"' }],
      max_tokens: 5
    });
    if (!response.choices[0]?.message?.content) throw new Error('No response');
  }));
  
  // Test Anthropic (Italy)
  results.push(await testAPI('Anthropic Claude Sonnet 4 (Italy)', async () => {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 5,
      messages: [{ role: 'user', content: 'Say "OK"' }]
    });
    if (!response.content[0]?.text) throw new Error('No response');
  }));
  
  // Test Google (England)
  results.push(await testAPI('Google Gemini 2.0 Flash (England)', async () => {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent('Say "OK"');
    const text = result.response.text();
    if (!text) throw new Error('No response');
  }));
  
  // Test xAI (Germany)
  results.push(await testAPI('xAI Grok 2 (Germany)', async () => {
    const response = await xai.chat.completions.create({
      model: 'grok-2-1212',
      messages: [{ role: 'user', content: 'Say "OK"' }],
      max_tokens: 5
    });
    if (!response.choices[0]?.message?.content) throw new Error('No response');
  }));
  
  // Test Fireworks DeepSeek (France)
  results.push(await testAPI('Fireworks DeepSeek V3.1 (France)', async () => {
    const response = await fireworks.chat.completions.create({
      model: 'accounts/fireworks/models/deepseek-v3',
      messages: [{ role: 'user', content: 'Say "OK"' }],
      max_tokens: 5
    });
    if (!response.choices[0]?.message?.content) throw new Error('No response');
  }));
  
  // Test Fireworks Kimi (Russia)
  results.push(await testAPI('Fireworks Kimi K2 Thinking (Russia)', async () => {
    const response = await fireworks.chat.completions.create({
      model: 'accounts/fireworks/models/kimi-k2-thinking',
      messages: [{ role: 'user', content: 'Say "OK"' }],
      max_tokens: 5
    });
    const content = response.choices[0]?.message?.content || response.choices[0]?.message?.reasoning_content;
    if (!content) throw new Error('No response');
  }));
  
  // Test Fireworks Llama (Turkey)
  results.push(await testAPI('Fireworks Llama 3.3 70B (Turkey)', async () => {
    const response = await fireworks.chat.completions.create({
      model: 'accounts/fireworks/models/llama-v3p3-70b-instruct',
      messages: [{ role: 'user', content: 'Say "OK"' }],
      max_tokens: 5
    });
    if (!response.choices[0]?.message?.content) throw new Error('No response');
  }));
  
  console.log('\n=== Summary ===');
  const successful = results.filter(r => r).length;
  const total = results.length;
  console.log(`✅ ${successful}/${total} APIs working`);
  
  if (successful < total) {
    console.log('❌ Some APIs failed - check your API keys in .env file');
    process.exit(1);
  } else {
    console.log('🎉 All APIs are operational!');
  }
}

main().catch(console.error);
