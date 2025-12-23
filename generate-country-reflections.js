// Generate strategic reflections and save to country folders
// Usage: node generate-country-reflections.js [game-folder-path]
// Example: node generate-country-reflections.js diplomacy-games/game-2025-12-20T04-57-53-169Z/fall-1903

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

// Get game directory from command line or use default
const gameDir = process.argv[2] || 'diplomacy-games/game-2025-12-20T04-57-53-169Z/fall-1903';

// Extract turn info from directory name
function getTurnInfo(dirPath) {
  const dirname = path.basename(dirPath);

  // Parse patterns like "fall-1903", "spring-1902", "winter-1901"
  const match = dirname.match(/^(spring|fall|winter)-(\d{4})(-retreats)?$/i);

  if (match) {
    const season = match[1].charAt(0).toUpperCase() + match[1].slice(1);
    const year = match[2];
    const isRetreats = !!match[3];

    return {
      season,
      year,
      isRetreats,
      displayName: isRetreats ? `${season} ${year} Retreats` : `${season} ${year}`
    };
  }

  // Fallback: just use the directory name
  return {
    season: 'Unknown',
    year: 'Unknown',
    isRetreats: false,
    displayName: dirname
  };
}

const turnInfo = getTurnInfo(gameDir);
console.log(`Turn: ${turnInfo.displayName}\n`);

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

You have been playing Diplomacy as ${country}. The game is now at ${turnInfo.displayName}.

Please write 3-4 paragraphs analyzing your position and strategy:

1. **Performance Analysis**: How has the game gone for you so far? What has gone right and what has gone wrong? What major mistakes have you made?

2. **Current Position**: Where do you stand now? What are your strengths and weaknesses? Who are your biggest threats and opportunities?

3. **Path to Victory**: What do you need to do to advance your position and ultimately win (reach 18 supply centers)? What alliances/supports do you need? What specific moves or strategies must succeed?

4. **Next Turn Plans**: What specific moves do you need to make happen in the upcoming turn${turnInfo.isRetreats ? '' : ' (Winter ' + turnInfo.year + ' builds/disbands, then Spring ' + (parseInt(turnInfo.year) + 1) + ')'} to achieve your goals? Be concrete about unit positions and targets.

Be honest, strategic, and specific. Write in paragraph format as if reflecting on your campaign.`;

  try {
    let response;

    if (model.includes('GPT-4o-mini')) {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1200
      });
      response = completion.choices[0].message.content;
    } else if (model.includes('Claude')) {
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1200,
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
        max_tokens: 1200
      });
      response = completion.choices[0].message.content;
    } else if (model.includes('DeepSeek')) {
      const completion = await deepseek.chat.completions.create({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1200
      });
      response = completion.choices[0].message.content;
    } else if (model.includes('Kimi')) {
      const completion = await fireworks.chat.completions.create({
        model: 'accounts/fireworks/models/kimi-k2-thinking',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1200
      });
      const message = completion.choices[0]?.message;
      // For Kimi, prefer actual content over reasoning_content for final output
      response = message?.content || message?.reasoning_content || 'No response';
    } else if (model.includes('Llama')) {
      const completion = await fireworks.chat.completions.create({
        model: 'accounts/fireworks/models/llama-v3p3-70b-instruct',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1200
      });
      response = completion.choices[0].message.content;
    }

    // Save to country folder
    const outputPath = path.join(gameDir, country, 'strategic-reflection.md');
    const fileContent = `# Strategic Reflection - ${country} (${turnInfo.displayName})

**Model:** ${model}

---

${response}
`;

    fs.writeFileSync(outputPath, fileContent);
    const fileSizeKB = (fs.statSync(outputPath).size / 1024).toFixed(1);
    console.log(`✓ ${country}: Saved (${fileSizeKB} KB)`);

    return { model, country, success: true };
  } catch (error) {
    console.error(`✗ ${country}: ERROR - ${error.message}`);
    return { model, country, success: false, error: error.message };
  }
}

async function main() {
  console.log('=== GENERATING STRATEGIC REFLECTIONS ===\n');

  const results = [];
  for (const [model, country] of Object.entries(modelToCountry)) {
    const result = await getReflection(model, country);
    results.push(result);
  }

  console.log('\n=== SUMMARY ===\n');
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`✓ Success: ${successful.length}/7`);
  successful.forEach(r => console.log(`  - ${r.country}`));

  if (failed.length > 0) {
    console.log(`\n✗ Failed: ${failed.length}/7`);
    failed.forEach(r => console.log(`  - ${r.country}: ${r.error}`));
  }
}

main().catch(console.error);
