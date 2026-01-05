const fs = require('fs');
const path = require('path');
const OpenAI = require('openai').default;
const Anthropic = require('@anthropic-ai/sdk').default;
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

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

const modelToCountry = {
  'GPT-4o (OpenAI)': 'Austria-Hungary',
  'Gemini 2.5 Flash (Google)': 'England',
  'Claude Sonnet 4 (Anthropic)': 'Italy',
  'Llama 3.3 70B Instruct (Meta)': 'Turkey',
  'Grok 3 (xAI)': 'Germany',
  'Kimi K2 Thinking (Moonshot AI)': 'Russia',
  'DeepSeek V3.1 (Fireworks AI)': 'France',
};

async function queryLLM(model, prompt) {
  try {
    if (model.includes('Claude Sonnet 4 Alt')) {
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
      });
      return message.content[0].text;
    } else if (model.includes('Claude Sonnet 4')) {
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
      });
      return message.content[0].text;
    } else if (model.includes('GPT-4o')) {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
      });
      return completion.choices[0].message.content;
    } else if (model.includes('Gemini')) {
      const geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
      const result = await geminiModel.generateContent(prompt);
      return result.response.text();
    } else if (model.includes('Grok')) {
      const completion = await xai.chat.completions.create({
        model: 'grok-2-1212',
        messages: [{ role: 'user', content: prompt }],
      });
      return completion.choices[0].message.content;
    } else if (model.includes('Llama')) {
      const completion = await fireworks.chat.completions.create({
        model: 'accounts/fireworks/models/llama-v3p3-70b-instruct',
        messages: [{ role: 'user', content: prompt }],
      });
      return completion.choices[0].message.content;
    } else if (model.includes('DeepSeek')) {
      const completion = await fireworks.chat.completions.create({
        model: 'accounts/fireworks/models/deepseek-v3p1',
        messages: [{ role: 'user', content: prompt }],
      });
      return completion.choices[0].message.content;
    } else if (model.includes('Kimi')) {
      // Kimi API - using OpenAI-compatible endpoint
      const kimiClient = new OpenAI({
        apiKey: process.env.KIMI_API_KEY,
        baseURL: 'https://api.moonshot.cn/v1',
      });
      const completion = await kimiClient.chat.completions.create({
        model: 'moonshot-v1-128k',
        messages: [{ role: 'user', content: prompt }],
      });
      return completion.choices[0].message.content;
    }
  } catch (error) {
    console.error(`Error querying ${model}:`, error.message);
    return `ERROR: ${error.message}`;
  }
}

async function main() {
  const gameDir = 'diplomacy-games/game-2025-12-20T04-57-53-169Z/fall-1910';
  const outputDir = 'diplomacy-games/game-2025-12-20T04-57-53-169Z/spring-1911';
  const countries = ['England', 'Italy', 'Turkey', 'Austria-Hungary', 'Germany', 'Russia', 'France'];

  console.log('\n=== Asking AIs: Who Deserves to Win? ===\n');

  const results = [];

  for (const country of countries) {
    const contextPath = path.join(gameDir, country, 'context.md');

    if (!fs.existsSync(contextPath)) {
      console.log(`⚠️  ${country}: No context file found\n`);
      continue;
    }

    const context = fs.readFileSync(contextPath, 'utf-8');

    // Get model name from our mapping (not from context file, as those may be outdated)
    const model = Object.keys(modelToCountry).find(key => modelToCountry[key] === country);
    if (!model) {
      console.log(`⚠️  ${country}: No model mapping found\n`);
      continue;
    }

    const prompt = `You are ${country} in a game of Diplomacy.

Here is your complete game history and context as of Fall 1910:

${context}

Current standings after Fall 1910:
- England: 10 supply centers (needs 18 to win)
- Italy: 10 supply centers
- Turkey: 9 supply centers
- Germany: 3 supply centers
- Austria-Hungary: 2 supply centers

The two leading powers are England and Italy, tied at 10 supply centers each.

Question: Between England and Italy, which power do you believe deserves to win this game of Diplomacy, and why?

Write a single dramatic paragraph (200-300 words) analyzing both powers' performances.

IMPORTANT REQUIREMENTS:
1. Discuss the merits of BOTH England AND Italy
2. Reference SPECIFIC events, battles, alliances, or betrayals that occurred during the game
3. Analyze their strategic decisions, diplomatic relationships, and military execution
4. DO NOT reveal your choice until the FINAL SENTENCE of your paragraph
5. Build dramatic tension throughout, weighing both sides fairly
6. End with a clear statement: "Therefore, I believe [England/Italy] deserves to win."

Be honest and analytical in your assessment. Reference concrete moments from the game to support your analysis.`;

    console.log(`Querying ${country} (${model})...`);
    const response = await queryLLM(model, prompt);

    results.push({
      country,
      model,
      response
    });

    console.log(`✓ ${country} responded\n`);
  }

  // Write results to file
  let output = '# AI Opinions: Who Deserves to Win?\n\n';
  output += 'Asked after Fall 1910 with England at 10 SCs and Italy at 10 SCs (tied for the lead).\n\n';
  output += '---\n\n';

  for (const result of results) {
    output += `## ${result.country}\n`;
    output += `**Model:** ${result.model}\n\n`;
    output += `${result.response}\n\n`;
    output += '---\n\n';
  }

  const outputPath = path.join(outputDir, 'winner-opinions.md');
  fs.writeFileSync(outputPath, output);

  console.log(`\n✅ Results saved to: ${outputPath}\n`);

  // Also print to console
  console.log('\n' + output);
}

main().catch(console.error);
