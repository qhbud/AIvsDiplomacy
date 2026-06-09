// Strategic reflections from each AI about their game

const OpenAI = require('openai').default;
const Anthropic = require('@anthropic-ai/sdk').default;
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
const xai = new OpenAI({ apiKey: process.env.XAI_API_KEY, baseURL: 'https://api.x.ai/v1' });
const fireworks = new OpenAI({ apiKey: process.env.FIREWORKS_API_KEY, baseURL: 'https://api.fireworks.ai/inference/v1' });
const deepseek = new OpenAI({ apiKey: process.env.DEEPSEEK_API_KEY, baseURL: 'https://api.deepseek.com' });

const modelToCountry = {
  'GPT-4o-mini (OpenAI)': 'Austria-Hungary',
  'Gemini 2.5 Flash (Google)': 'England',
  'Claude Sonnet 4 (Anthropic)': 'Italy',
  'Llama 3.3 70B Instruct (Meta)': 'Turkey',
  'Grok 3 (xAI)': 'Germany',
  'Kimi K2 Thinking (Moonshot AI)': 'Russia',
  'DeepSeek V3.1 (Fireworks AI)': 'France',
};

const gameDir = 'diplomacy-games/game-2025-12-20T04-57-53-169Z/fall-1903';

async function getReflection(model, country) {
  const contextPath = path.join(gameDir, country, 'context.md');
  const thoughtsPath = path.join(gameDir, country, 'thoughts.md');

  const context = fs.readFileSync(contextPath, 'utf-8');
  const thoughts = fs.existsSync(thoughtsPath) ? fs.readFileSync(thoughtsPath, 'utf-8') : 'No previous thoughts recorded.';

  const prompt = `${context}

## YOUR PREVIOUS STRATEGIC THOUGHTS

Here are your strategic reflections from throughout the game:

${thoughts}

---

## STRATEGIC REFLECTION REQUEST

You have been playing Diplomacy as ${country}. The game is now at Fall 1903.

Please write 2-3 paragraphs analyzing your position and strategy:

1. **Performance Analysis**: How has the game gone for you? What has gone right and what has gone wrong? What major mistakes have you made?

2. **Current Position**: Where do you stand now? What are your strengths and weaknesses? Who are your biggest threats and opportunities?

3. **Path to Victory**: What do you need to do to advance your position and ultimately win? What alliances/supports do you need? What specific moves or strategies must succeed?

Be honest, strategic, and specific. Write in paragraph format as if reflecting on your campaign.`;

  try {
    let response;

    if (model.includes('GPT-4o-mini')) {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1000
      });
      response = completion.choices[0].message.content;
    } else if (model.includes('Claude')) {
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      });
      response = message.content[0].text;
    } else if (model.includes('Gemini')) {
      const genModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
      const result = await genModel.generateContent(prompt);
      response = result.response.text();
    } else if (model.includes('Grok')) {
      const completion = await xai.chat.completions.create({
        model: 'grok-3',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1000
      });
      response = completion.choices[0].message.content;
    } else if (model.includes('DeepSeek')) {
      const completion = await deepseek.chat.completions.create({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1000
      });
      response = completion.choices[0].message.content;
    } else if (model.includes('Kimi')) {
      const completion = await fireworks.chat.completions.create({
        model: 'accounts/fireworks/models/kimi-k2-thinking',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1000
      });
      const message = completion.choices[0]?.message;
      response = message?.reasoning_content || message?.content || 'No response';
    } else if (model.includes('Llama')) {
      const completion = await fireworks.chat.completions.create({
        model: 'accounts/fireworks/models/llama-v3p3-70b-instruct',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1000
      });
      response = completion.choices[0].message.content;
    }

    return { model, country, reflection: response };
  } catch (error) {
    console.error(`Error getting reflection from ${model}:`, error.message);
    return { model, country, reflection: `ERROR: ${error.message}` };
  }
}

async function main() {
  console.log('=== GATHERING STRATEGIC REFLECTIONS FROM ALL POWERS ===\n');

  const reflections = await Promise.all(
    Object.entries(modelToCountry).map(([model, country]) =>
      getReflection(model, country)
    )
  );

  // Sort by supply centers (current standings)
  const standings = [
    { country: 'Russia', scs: 7 },
    { country: 'England', scs: 5 },
    { country: 'France', scs: 5 },
    { country: 'Germany', scs: 4 },
    { country: 'Italy', scs: 4 },
    { country: 'Turkey', scs: 4 },
    { country: 'Austria-Hungary', scs: 3 }
  ];

  console.log('\n=== CURRENT STANDINGS (Fall 1903) ===\n');
  standings.forEach((s, i) => {
    const reflection = reflections.find(r => r.country === s.country);
    const model = Object.keys(modelToCountry).find(k => modelToCountry[k] === s.country);
    console.log(`${i + 1}. ${s.country} - ${s.scs} Supply Centers [${model}]`);
  });
  console.log('\n');

  // Output reflections in order of standings
  for (const standing of standings) {
    const reflection = reflections.find(r => r.country === standing.country);
    const model = Object.keys(modelToCountry).find(k => modelToCountry[k] === standing.country);

    console.log('='.repeat(80));
    console.log(`${standing.country} (${standing.scs} SCs) - ${model}`);
    console.log('='.repeat(80));
    console.log();
    console.log(reflection.reflection);
    console.log();
  }

  // Save to file
  const output = standings.map(s => {
    const reflection = reflections.find(r => r.country === s.country);
    const model = Object.keys(modelToCountry).find(k => modelToCountry[k] === s.country);
    return `${'='.repeat(80)}\n${s.country} (${s.scs} SCs) - ${model}\n${'='.repeat(80)}\n\n${reflection.reflection}\n`;
  }).join('\n');

  fs.writeFileSync('strategic-reflections-fall1903.md', output);
  console.log('\nReflections saved to strategic-reflections-fall1903.md');
}

main().catch(console.error);
