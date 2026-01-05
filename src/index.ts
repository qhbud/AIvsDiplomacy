import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

interface LLMResponse {
  model: string;
  response: string;
  error?: string;
  timeMs?: number;
}

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

// Default starting positions for Spring 1901
const defaultStartingPositions: Record<string, string[]> = {
  'Austria-Hungary': ['A Vienna', 'A Budapest', 'F Trieste'],
  'England': ['F London', 'F Edinburgh', 'A Liverpool'],
  'Italy': ['A Rome', 'A Venice', 'F Naples'],
  'Turkey': ['A Constantinople', 'A Smyrna', 'F Ankara'],
  'Germany': ['A Berlin', 'A Munich', 'F Kiel'],
  'Russia': ['A Moscow', 'A Warsaw', 'F Sevastopol', 'F St Petersburg'],
  'France': ['A Paris', 'A Marseilles', 'F Brest'],
};

// Home supply centers for each power (where they can build units)
const homeSupplyCenters: Record<string, string[]> = {
  'England': ['London', 'Edinburgh', 'Liverpool'],
  'France': ['Paris', 'Marseilles', 'Brest'],
  'Germany': ['Berlin', 'Munich', 'Kiel'],
  'Italy': ['Rome', 'Venice', 'Naples'],
  'Austria-Hungary': ['Vienna', 'Budapest', 'Trieste'],
  'Russia': ['St Petersburg', 'Moscow', 'Warsaw', 'Sevastopol'],
  'Turkey': ['Constantinople', 'Smyrna', 'Ankara']
};

// Initial supply center ownership (Spring 1901)
const initialSupplyCenterOwnership: Record<string, string> = {
  'London': 'England',
  'Edinburgh': 'England',
  'Liverpool': 'England',
  'Paris': 'France',
  'Marseilles': 'France',
  'Brest': 'France',
  'Berlin': 'Germany',
  'Munich': 'Germany',
  'Kiel': 'Germany',
  'Rome': 'Italy',
  'Venice': 'Italy',
  'Naples': 'Italy',
  'Vienna': 'Austria-Hungary',
  'Budapest': 'Austria-Hungary',
  'Trieste': 'Austria-Hungary',
  'St Petersburg': 'Russia',
  'Moscow': 'Russia',
  'Warsaw': 'Russia',
  'Sevastopol': 'Russia',
  'Constantinople': 'Turkey',
  'Smyrna': 'Turkey',
  'Ankara': 'Turkey'
  // Neutral SCs: Norway, Sweden, Denmark, Holland, Belgium, Spain, Portugal, Tunis, Serbia, Rumania, Bulgaria, Greece
};

// Model to country mapping
const modelToCountry: Record<string, string> = {
  'Claude Sonnet 4 Alt (Anthropic)': 'Austria-Hungary', // Switched from GPT-4o-mini due to API issues
  'Gemini 2.5 Flash (Google)': 'England',
  'Claude Sonnet 4 (Anthropic)': 'Italy',
  'Llama 3.3 70B Instruct (Meta)': 'Turkey',
  'Grok 3 (xAI)': 'Germany',
  'Kimi K2 Thinking (Moonshot AI)': 'Russia',
  'DeepSeek V3.1 (Fireworks AI)': 'France',
};

// Reverse mapping: country to model
const countryToModel: Record<string, string> = {};
for (const [model, country] of Object.entries(modelToCountry)) {
  countryToModel[country] = model;
}

async function queryGPT4o(prompt: string): Promise<LLMResponse> {
  const startTime = Date.now();
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
    });
    return {
      model: 'GPT-4o (OpenAI)',
      response: completion.choices[0]?.message?.content || 'No response',
      timeMs: Date.now() - startTime,
    };
  } catch (error) {
    return {
      model: 'GPT-4o (OpenAI)',
      response: '',
      error: error instanceof Error ? error.message : 'Unknown error',
      timeMs: Date.now() - startTime,
    };
  }
}

async function queryGPT4oMini(prompt: string): Promise<LLMResponse> {
  const startTime = Date.now();
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
    });
    return {
      model: 'GPT-4o-mini (OpenAI)',
      response: completion.choices[0]?.message?.content || 'No response',
      timeMs: Date.now() - startTime,
    };
  } catch (error) {
    return {
      model: 'GPT-4o-mini (OpenAI)',
      response: '',
      error: error instanceof Error ? error.message : 'Unknown error',
      timeMs: Date.now() - startTime,
    };
  }
}

async function queryGPT35Turbo(prompt: string): Promise<LLMResponse> {
  const startTime = Date.now();
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
    });
    return {
      model: 'GPT-3.5-turbo (OpenAI)',
      response: completion.choices[0]?.message?.content || 'No response',
      timeMs: Date.now() - startTime,
    };
  } catch (error) {
    return {
      model: 'GPT-3.5-turbo (OpenAI)',
      response: '',
      error: error instanceof Error ? error.message : 'Unknown error',
      timeMs: Date.now() - startTime,
    };
  }
}

async function queryClaudeSonnet(prompt: string): Promise<LLMResponse> {
  const startTime = Date.now();
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });
    const content = message.content[0];
    return {
      model: 'Claude Sonnet 4 (Anthropic)',
      response: content.type === 'text' ? content.text : 'No text response',
      timeMs: Date.now() - startTime,
    };
  } catch (error) {
    return {
      model: 'Claude Sonnet 4 (Anthropic)',
      response: '',
      error: error instanceof Error ? error.message : 'Unknown error',
      timeMs: Date.now() - startTime,
    };
  }
}

async function queryClaudeOpus(prompt: string): Promise<LLMResponse> {
  const startTime = Date.now();
  try {
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-5-20251101',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });
    const content = message.content[0];
    return {
      model: 'Claude Opus 4.5 (Anthropic)',
      response: content.type === 'text' ? content.text : 'No text response',
      timeMs: Date.now() - startTime,
    };
  } catch (error) {
    return {
      model: 'Claude Opus 4.5 (Anthropic)',
      response: '',
      error: error instanceof Error ? error.message : 'Unknown error',
      timeMs: Date.now() - startTime,
    };
  }
}

async function queryGeminiPro(prompt: string): Promise<LLMResponse> {
  const startTime = Date.now();
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    return {
      model: 'Gemini 2.0 Flash (Google)',
      response: result.response.text(),
      timeMs: Date.now() - startTime,
    };
  } catch (error) {
    return {
      model: 'Gemini 2.0 Flash (Google)',
      response: '',
      error: error instanceof Error ? error.message : 'Unknown error',
      timeMs: Date.now() - startTime,
    };
  }
}

async function queryGeminiFlash(prompt: string): Promise<LLMResponse> {
  const startTime = Date.now();
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    return {
      model: 'Gemini 2.5 Flash (Google)',
      response: result.response.text(),
      timeMs: Date.now() - startTime,
    };
  } catch (error) {
    return {
      model: 'Gemini 2.5 Flash (Google)',
      response: '',
      error: error instanceof Error ? error.message : 'Unknown error',
      timeMs: Date.now() - startTime,
    };
  }
}

async function queryGrok(prompt: string): Promise<LLMResponse> {
  const startTime = Date.now();
  try {
    const completion = await xai.chat.completions.create({
      model: 'grok-3',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
    });
    return {
      model: 'Grok 3 (xAI)',
      response: completion.choices[0]?.message?.content || 'No response',
      timeMs: Date.now() - startTime,
    };
  } catch (error) {
    return {
      model: 'Grok 3 (xAI)',
      response: '',
      error: error instanceof Error ? error.message : 'Unknown error',
      timeMs: Date.now() - startTime,
    };
  }
}

async function queryFireworks(prompt: string): Promise<LLMResponse> {
  const startTime = Date.now();
  try {
    const completion = await fireworks.chat.completions.create({
      model: 'accounts/fireworks/models/deepseek-v3p1',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
    });
    return {
      model: 'DeepSeek V3.1 (Fireworks AI)',
      response: completion.choices[0]?.message?.content || 'No response',
      timeMs: Date.now() - startTime,
    };
  } catch (error) {
    return {
      model: 'DeepSeek V3.1 (Fireworks AI)',
      response: '',
      error: error instanceof Error ? error.message : 'Unknown error',
      timeMs: Date.now() - startTime,
    };
  }
}

async function queryKimi(prompt: string): Promise<LLMResponse> {
  const startTime = Date.now();

  // Add special instructions for Kimi K2 reasoning model to output ONLY the bracketed orders
  const enhancedPrompt = `${prompt}

🚨 CRITICAL OUTPUT FORMAT REQUIREMENT:
You are a reasoning model. Do your thinking internally, but output ONLY the bracketed orders in your final response.
DO NOT include your reasoning, analysis, or explanations in the output.
DO NOT output text like "We need to decide..." or "Let's consider..."
ONLY output the ${prompt.includes('exactly') ? prompt.match(/exactly (\d+)/)?.[1] || '7' : '7'} orders in [brackets], nothing else!

CORRECT OUTPUT FORMAT:
[A Location to Destination]
[F Location to Destination]
[A Location Support A OtherLocation to Destination]

OUTPUT ONLY THE BRACKETS - NO OTHER TEXT!`;

  // Try up to 2 times (initial + 1 retry)
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const completion = await fireworks.chat.completions.create({
        model: 'accounts/fireworks/models/kimi-k2-thinking',
        messages: [{ role: 'user', content: enhancedPrompt }],
        max_tokens: 4000,
        temperature: 0.6,
      });

      // Kimi K2 is a reasoning model - check for different response formats
      const message = completion.choices[0]?.message;
      // Kimi K2 Thinking: prefer content (final answer), fallback to reasoning_content (thinking process)
      let responseText = message?.content || (message as any)?.reasoning_content || '';

      // Post-process: If response contains thinking text, extract ONLY bracketed content
      if (responseText && responseText.includes('[')) {
        const bracketMatches = responseText.match(/\[([^\]]+)\]/g);
        if (bracketMatches && bracketMatches.length > 0) {
          // If we found bracketed orders, return only those
          responseText = bracketMatches.join('\n');
          console.log(`Kimi K2: Extracted ${bracketMatches.length} bracketed orders from reasoning output`);
        }
      }

      // If we got a response, return it
      if (responseText && responseText !== 'No response') {
        return {
          model: 'Kimi K2 Thinking (Moonshot AI)',
          response: responseText,
          timeMs: Date.now() - startTime,
        };
      }

      // If no response and this is first attempt, retry
      if (attempt === 1) {
        console.warn(`Kimi K2 returned empty content on attempt ${attempt}, retrying...`);
        continue;
      }

      // If no response after retry, log and return
      console.error('Kimi K2 returned empty content after retry. Full message:', JSON.stringify(message, null, 2));
      return {
        model: 'Kimi K2 Thinking (Moonshot AI)',
        response: 'No response',
        timeMs: Date.now() - startTime,
      };

    } catch (error) {
      // If error on first attempt, retry
      if (attempt === 1) {
        console.warn(`Kimi K2 error on attempt ${attempt}, retrying...`, error);
        continue;
      }

      // If error on retry, return error
      console.error('Kimi K2 error after retry:', error);
      return {
        model: 'Kimi K2 Thinking (Moonshot AI)',
        response: '',
        error: error instanceof Error ? error.message : 'Unknown error',
        timeMs: Date.now() - startTime,
      };
    }
  }

  // Should never reach here, but just in case
  return {
    model: 'Kimi K2 Thinking (Moonshot AI)',
    response: 'No response',
    timeMs: Date.now() - startTime,
  };
}

async function queryLlama(prompt: string): Promise<LLMResponse> {
  const startTime = Date.now();
  try {
    const completion = await fireworks.chat.completions.create({
      model: 'accounts/fireworks/models/llama-v3p3-70b-instruct',
      messages: [
        { role: 'system', content: 'You are a helpful assistant. Respond directly in plain text. Do NOT use JSON, function calls, or any structured format unless explicitly requested. Just provide natural language responses.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 2000,
      temperature: 0.6,
    });
    return {
      model: 'Llama 3.3 70B Instruct (Meta)',
      response: completion.choices[0]?.message?.content || 'No response',
      timeMs: Date.now() - startTime,
    };
  } catch (error) {
    return {
      model: 'Llama 3.3 70B Instruct (Meta)',
      response: '',
      error: error instanceof Error ? error.message : 'Unknown error',
      timeMs: Date.now() - startTime,
    };
  }
}

async function queryAllLLMs(prompt: string | Record<string, string>): Promise<LLMResponse[]> {
  console.log('Querying all LLMs in parallel...\n');

  // If prompt is an object with model-specific prompts
  if (typeof prompt === 'object') {
    const results = await Promise.all([
      queryClaudeSonnet(prompt['Claude Sonnet 4 Alt (Anthropic)'] || prompt['GPT-4o-mini (OpenAI)'] || ''), // Austria-Hungary now uses Claude
      queryClaudeSonnet(prompt['Claude Sonnet 4 (Anthropic)'] || ''),
      queryGeminiFlash(prompt['Gemini 2.5 Flash (Google)'] || ''),
      queryGrok(prompt['Grok 3 (xAI)'] || ''),
      queryFireworks(prompt['DeepSeek V3.1 (Fireworks AI)'] || ''),
      queryKimi(prompt['Kimi K2 Thinking (Moonshot AI)'] || ''),
      queryLlama(prompt['Llama 3.3 70B Instruct (Meta)'] || ''),
    ]);
    return results;
  }

  // Otherwise use the same prompt for all
  const results = await Promise.all([
    queryClaudeSonnet(prompt), // Austria-Hungary now uses Claude
    queryClaudeSonnet(prompt), // Italy uses Claude
    queryGeminiFlash(prompt),
    queryGrok(prompt),
    queryFireworks(prompt),
    queryKimi(prompt),
    queryLlama(prompt),
  ]);

  return results;
}

function generateMarkdown(prompt: string, responses: LLMResponse[]): string {
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  let markdown = `# LLM Comparison Results\n\n`;
  markdown += `**Generated:** ${new Date().toLocaleString()}\n\n`;
  markdown += `## Prompt\n\n`;
  markdown += `\`\`\`\n${prompt}\n\`\`\`\n\n`;
  markdown += `---\n\n`;

  responses.forEach((response, index) => {
    markdown += `## ${index + 1}. ${response.model}\n\n`;

    if (response.error) {
      markdown += `**Error:** ${response.error}\n\n`;
    } else {
      markdown += `${response.response}\n\n`;
    }

    if (response.timeMs !== undefined) {
      markdown += `*Response time: ${(response.timeMs / 1000).toFixed(2)}s*\n\n`;
    }

    markdown += `---\n\n`;
  });

  return markdown;
}

function saveToFile(content: string): string {
  const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\./g, '-');
  const filename = `llm-comparison-${timestamp}.md`;
  const outputDir = path.join(process.cwd(), 'outputs');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const filepath = path.join(outputDir, filename);
  fs.writeFileSync(filepath, content, 'utf-8');

  return filepath;
}

function saveIndividualFiles(responses: LLMResponse[], gameDir: string, unitPositions?: Record<string, string[]>): void {
  responses.forEach((response) => {
    const country = getCountryName(response.model);
    const countryDir = path.join(gameDir, country);

    // Create country subdirectory
    if (!fs.existsSync(countryDir)) {
      fs.mkdirSync(countryDir, { recursive: true });
    }

    let content = `# ${response.model}\n\n`;

    // Add board state if positions are provided
    if (unitPositions) {
      content += formatBoardState(unitPositions, initialSupplyCenterOwnership, country);
    }

    if (response.error) {
      content += `**Error:** ${response.error}\n\n`;
    } else {
      content += `${response.response}\n\n`;
    }

    content += `---\n\n`;
    content += `*Response time: ${response.timeMs ? (response.timeMs / 1000).toFixed(2) : 'N/A'}s*\n`;

    // Write to both context.md and full-dialogue.md (initially they're the same)
    fs.writeFileSync(path.join(countryDir, 'context.md'), content, 'utf-8');
    fs.writeFileSync(path.join(countryDir, 'full-dialogue.md'), content, 'utf-8');
  });
}

function parseDiplomacyPriority(content: string): string | null {
  const match = content.match(/Diplomacy Priority:\s*\n3\.\s*(.+?)\s*\n2\.\s*(.+?)\s*\n1\.\s*(.+?)(?:\s*\n|$)/);
  if (match) {
    return match[3].trim(); // Priority 1 is the first to talk to
  }
  return null;
}

function getCountryName(modelName: string): string {
  const mapping: Record<string, string> = {
    'Claude Sonnet 4 Alt (Anthropic)': 'Austria-Hungary',
    'GPT-4o-mini (OpenAI)': 'Austria-Hungary', // Legacy mapping
    'Gemini 2.5 Flash (Google)': 'England',
    'Claude Sonnet 4 (Anthropic)': 'Italy',
    'Llama 3.3 70B Instruct (Meta)': 'Turkey',
    'Grok 3 (xAI)': 'Germany',
    'Kimi K2 Thinking (Moonshot AI)': 'Russia',
    'DeepSeek V3.1 (Fireworks AI)': 'France',
  };
  return mapping[modelName] || modelName;
}

function extractCountryName(text: string): string | null {
  // Normalize text to lowercase for matching
  const normalized = text.toLowerCase();

  // Define country patterns with aliases
  const patterns = [
    { names: ['austria-hungary', 'austria'], result: 'Austria-Hungary' },
    { names: ['england', 'united kingdom', 'uk', 'britain'], result: 'England' },
    { names: ['italy'], result: 'Italy' },
    { names: ['turkey', 'ottoman empire', 'ottomans'], result: 'Turkey' },
    { names: ['germany'], result: 'Germany' },
    { names: ['russia'], result: 'Russia' },
    { names: ['france'], result: 'France' },
  ];

  // Check each pattern
  for (const pattern of patterns) {
    for (const name of pattern.names) {
      if (normalized.includes(name)) {
        return pattern.result;
      }
    }
  }

  return null;
}

function getModelFromCountry(country: string): string | null {
  const mapping: Record<string, string> = {
    'Austria-Hungary': 'Claude Sonnet 4 Alt (Anthropic)',
    'Austria': 'Claude Sonnet 4 Alt (Anthropic)',
    'England': 'Gemini 2.5 Flash (Google)',
    'Italy': 'Claude Sonnet 4 (Anthropic)',
    'Turkey': 'Llama 3.3 70B Instruct (Meta)',
    'Germany': 'Grok 3 (xAI)',
    'Russia': 'Kimi K2 Thinking (Moonshot AI)',
    'France': 'DeepSeek V3.1 (Fireworks AI)',
  };
  return mapping[country] || null;
}

function getLatestTurnDir(gameDir: string): string {
  // Find the most recent turn folder by modification time
  const turnFolders = fs.readdirSync(gameDir)
    .filter(f => {
      const fullPath = path.join(gameDir, f);
      return fs.statSync(fullPath).isDirectory() && (f.startsWith('spring-') || f.startsWith('fall-') || f.startsWith('winter-'));
    })
    .map(f => ({
      name: f,
      path: path.join(gameDir, f),
      mtime: fs.statSync(path.join(gameDir, f)).mtime.getTime()
    }))
    .sort((a, b) => b.mtime - a.mtime); // Most recent first

  if (turnFolders.length === 0) {
    throw new Error('No turn folders found in game directory');
  }

  return turnFolders[0].path;
}

function getPreviousTurnDir(gameDir: string): string | null {
  // Find the second most recent turn folder (the previous turn)
  const turnFolders = fs.readdirSync(gameDir)
    .filter(f => {
      const fullPath = path.join(gameDir, f);
      return fs.statSync(fullPath).isDirectory() && (f.startsWith('spring-') || f.startsWith('fall-') || f.startsWith('winter-'));
    })
    .map(f => ({
      name: f,
      path: path.join(gameDir, f),
      mtime: fs.statSync(path.join(gameDir, f)).mtime.getTime()
    }))
    .sort((a, b) => b.mtime - a.mtime); // Most recent first

  if (turnFolders.length < 2) {
    return null; // No previous turn
  }

  return turnFolders[1].path;
}

function parseUnitPositionsFromResolution(resolutionFilePath: string): Record<string, string[]> {
  if (!fs.existsSync(resolutionFilePath)) {
    return {};
  }

  const content = fs.readFileSync(resolutionFilePath, 'utf-8');
  const unitPositions: Record<string, string[]> = {
    'England': [],
    'France': [],
    'Germany': [],
    'Italy': [],
    'Austria-Hungary': [],
    'Russia': [],
    'Turkey': []
  };

  // Parse ONLY the "Final Unit Positions" section to find unit positions
  // CRITICAL: We must ONLY parse this section, not the Resolution section, to avoid counting units twice
  const finalPositionsMatch = content.match(/## Final Unit Positions\n\n([\s\S]*)/);
  if (!finalPositionsMatch) {
    return unitPositions;
  }

  const finalPositionsText = finalPositionsMatch[1];
  const lines = finalPositionsText.split('\n');

  for (const line of lines) {
    // Check for Unchanged or Final position lines from retreat phases: **France**: A Picardy - Unchanged or **France**: A Picardy - Final position
    const unchangedMatch = line.match(/\*\*(.+?)\*\*:\s+([AF])\s+(.+?)\s+-\s+(Unchanged|Final position)/);
    if (unchangedMatch) {
      const country = unchangedMatch[1];
      const unitType = unchangedMatch[2];
      const location = unchangedMatch[3];

      if (!unitPositions[country]) {
        unitPositions[country] = [];
      }

      unitPositions[country].push(`${unitType} ${location}`);
      continue; // Skip to next line
    }

    // Check for HOLD commands: **Turkey**: A Constantinople HOLD - ✓ SUCCESS [Strength: 1]
    const holdMatch = line.match(/\*\*(.+?)\*\*:\s+([AF])\s+(.+?)\s+HOLD\s+-\s+✓\s+SUCCESS/);
    if (holdMatch) {
      const country = holdMatch[1];
      const unitType = holdMatch[2];
      const location = holdMatch[3];

      if (!unitPositions[country]) {
        unitPositions[country] = [];
      }

      unitPositions[country].push(`${unitType} ${location}`);
      continue; // Skip to next line
    }

    // Check for SUPPORT commands: **Germany**: A Ruhr SUPPORT - ✓ SUCCESS - Supporting Holland to Belgium
    const supportMatch = line.match(/\*\*(.+?)\*\*:\s+([AF])\s+(.+?)\s+SUPPORT\s+-\s+✓\s+SUCCESS/);
    if (supportMatch) {
      const country = supportMatch[1];
      const unitType = supportMatch[2];
      const location = supportMatch[3];

      if (!unitPositions[country]) {
        unitPositions[country] = [];
      }

      unitPositions[country].push(`${unitType} ${location}`);
      continue; // Skip to next line
    }

    // Match move lines: **England**: F London to North Sea - ✓ SUCCESS [Strength: 1]
    // or: **England**: F Edinburgh to Norway - ✗ FAILED - Edinburgh is not adjacent to Norway
    const match = line.match(/\*\*(.+?)\*\*:\s+([AF])\s+(.+?)\s+to\s+(.+?)\s+-\s+(✓|✗)\s+(SUCCESS|FAILED)/);

    if (match) {
      const country = match[1];
      const unitType = match[2];
      const from = match[3];
      const to = match[4];
      const success = match[5] === '✓';

      if (!unitPositions[country]) {
        unitPositions[country] = [];
      }

      // Determine final location
      let finalLocation = from;
      if (success && to) {
        // Unit moved successfully
        finalLocation = to;
      }
      // If failed, unit stays at 'from'

      // Clean up the location name (remove extra text like strength indicators)
      finalLocation = finalLocation.split(' - ')[0].trim();

      unitPositions[country].push(`${unitType} ${finalLocation}`);
    }
  }

  return unitPositions;
}

function formatBoardState(unitPositions: Record<string, string[]>, supplyCenterOwnership?: Record<string, string>, viewingCountry?: string): string {
  let boardState = `## Current Board State\n\n`;

  // Sort countries alphabetically for consistent display
  const sortedCountries = Object.keys(unitPositions).sort();

  for (const country of sortedCountries) {
    const units = unitPositions[country];
    if (units && units.length > 0) {
      boardState += `**${country}**: ${units.join(', ')}\n\n`;
    }
  }

  // Add supply center ownership information if available
  if (supplyCenterOwnership) {
    boardState += `\n### Supply Center Control\n\n`;
    boardState += `**IMPORTANT**: Supply centers determine how many units you can maintain. To win, you need to control 18 supply centers.\n\n`;

    // Group SCs by owner
    const scsByCountry: Record<string, string[]> = {};
    for (const [sc, country] of Object.entries(supplyCenterOwnership)) {
      if (!scsByCountry[country]) {
        scsByCountry[country] = [];
      }
      scsByCountry[country].push(sc);
    }

    // Show each country's supply centers, sorted by count
    for (const [country, scs] of Object.entries(scsByCountry).sort((a, b) => b[1].length - a[1].length)) {
      boardState += `**${country}**: ${scs.length} SCs - [${scs.join(', ')}]\n`;
    }

    boardState += `\n**Supply Center Rules**:\n`;
    boardState += `- You capture a supply center by ending a Fall turn with a unit on it\n`;
    boardState += `- You keep supply centers until an enemy unit occupies them\n`;
    boardState += `- In Winter: If SCs > units, you BUILD. If units > SCs, you must DISBAND\n`;
    boardState += `- Builds happen only at your home supply centers when they are unoccupied\n\n`;

    // Add detailed threat analysis for the viewing country's supply centers
    if (viewingCountry && scsByCountry[viewingCountry]) {
      const { adjacencies } = require('./move-resolution');

      boardState += `### YOUR Supply Centers - Threat Analysis\n\n`;
      boardState += `**CRITICAL**: Monitor these territories closely. Losing supply centers means forced disbands!\n\n`;

      const mySCs = scsByCountry[viewingCountry];

      // Build a map of all unit positions by location
      const unitsByLocation: Record<string, { country: string, type: string }> = {};
      for (const [country, units] of Object.entries(unitPositions)) {
        for (const unitStr of units) {
          const match = unitStr.match(/([AF])\s+(.+)/);
          if (match) {
            const location = match[2].trim();
            unitsByLocation[location] = { country, type: match[1] };
          }
        }
      }

      for (const sc of mySCs) {
        const unitHere = unitsByLocation[sc];
        const adjacentTerritories = adjacencies[sc] || [];
        const enemyUnitsAdjacent: string[] = [];

        // Check for enemy units adjacent to this SC
        for (const adjacent of adjacentTerritories) {
          const unit = unitsByLocation[adjacent];
          if (unit && unit.country !== viewingCountry) {
            enemyUnitsAdjacent.push(`${unit.type} ${adjacent} (${unit.country})`);
          }
        }

        // Determine status
        let status = '✓ SECURE';
        if (unitHere && unitHere.country !== viewingCountry) {
          status = '⚠️ **OCCUPIED BY ENEMY**';
        } else if (enemyUnitsAdjacent.length > 0) {
          status = '⚠️ THREATENED';
        } else if (!unitHere || unitHere.country !== viewingCountry) {
          status = '⚠️ UNDEFENDED';
        }

        boardState += `- **${sc}**: ${status}\n`;

        if (unitHere && unitHere.country !== viewingCountry) {
          boardState += `  - **ENEMY OCCUPATION**: ${unitHere.type} ${sc} (${unitHere.country}) - YOU ARE LOSING THIS SUPPLY CENTER!\n`;
        } else if (unitHere && unitHere.country === viewingCountry) {
          boardState += `  - Defended by: ${unitHere.type} ${sc}\n`;
        }

        if (enemyUnitsAdjacent.length > 0) {
          boardState += `  - Enemy units nearby: ${enemyUnitsAdjacent.join(', ')}\n`;
        }
      }

      boardState += `\n`;
    }
  }

  boardState += `---\n\n`;
  return boardState;
}

/**
 * Get current supply center ownership based on unit positions and previous ownership
 */
function getCurrentSCOwnership(
  unitPositions: Record<string, string[]>,
  turnName: string
): Record<string, string> {
  // For Spring 1901, use initial ownership
  if (turnName === 'spring-1901') {
    return { ...initialSupplyCenterOwnership };
  }

  // For other turns, calculate from unit positions
  const allSupplyCenters = [
    'London', 'Edinburgh', 'Liverpool', 'Paris', 'Marseilles', 'Brest',
    'Berlin', 'Munich', 'Kiel', 'Rome', 'Venice', 'Naples',
    'Vienna', 'Budapest', 'Trieste', 'St Petersburg', 'Moscow', 'Warsaw', 'Sevastopol',
    'Constantinople', 'Smyrna', 'Ankara',
    'Norway', 'Sweden', 'Denmark', 'Holland', 'Belgium', 'Spain', 'Portugal',
    'Tunis', 'Serbia', 'Rumania', 'Bulgaria', 'Greece'
  ];

  // Convert string positions to Unit format
  const { calculateSupplyCenterOwnership } = require('./move-resolution');
  const unitPositionsFormatted: Record<string, { type: 'A' | 'F'; location: string }[]> = {};

  for (const [country, units] of Object.entries(unitPositions)) {
    unitPositionsFormatted[country] = units.map(unitStr => {
      const match = unitStr.match(/([AF])\s+(.+)/);
      if (match) {
        return { type: match[1] as 'A' | 'F', location: match[2].trim() };
      }
      return { type: 'A' as 'A' | 'F', location: '' };
    }).filter(u => u.location !== '');
  }

  return calculateSupplyCenterOwnership(unitPositionsFormatted, allSupplyCenters, { ...initialSupplyCenterOwnership });
}

/**
 * Sanitize diplomatic text by removing any move planning headers that could confuse the AI
 */
function sanitizeDiplomaticText(text: string): string {
  // Remove any "## [Season] [Year] Moves" headers and everything after them
  // This prevents AIs from including move planning in diplomatic messages
  return text.replace(/##\s+(Spring|Fall|Winter)\s+\d+\s+Moves[\s\S]*/gi, '').trim();
}

function updateContextWithBoardState(contextPath: string, unitPositions: Record<string, string[]>, supplyCenterOwnership?: Record<string, string>): void {
  if (!fs.existsSync(contextPath)) {
    return;
  }

  const existingContent = fs.readFileSync(contextPath, 'utf-8');

  // Remove old board state and strategic reflection if they exist
  let cleanedContent = existingContent.replace(/## Current Board State[\s\S]*?---\n\n/, '');
  cleanedContent = cleanedContent.replace(/## Your Previous Strategic Reflection[\s\S]*?---\n\n/, '');

  // Extract country name from the context path (e.g., .../England/context.md -> England)
  const pathParts = contextPath.split(path.sep);
  const countryName = pathParts[pathParts.length - 2]; // Get the directory name (country)

  // Get model name from the country-to-model mapping
  const modelName = countryToModel[countryName];
  if (!modelName) {
    console.error(`Could not find model for country: ${countryName}`);
    return;
  }

  // Remove old model header if it exists
  const headerPattern = /^# .+$/m;
  cleanedContent = cleanedContent.replace(headerPattern, '').trim();

  // Rebuild with board state after model name, including viewing country for threat analysis
  const boardState = formatBoardState(unitPositions, supplyCenterOwnership, countryName);

  // Check if strategic reflection exists for this country
  const reflectionPath = contextPath.replace('context.md', 'strategic-reflection.md');
  let reflectionSection = '';
  if (fs.existsSync(reflectionPath)) {
    const reflectionContent = fs.readFileSync(reflectionPath, 'utf-8');
    // Extract just the reflection text (skip the header and model name)
    const reflectionText = reflectionContent.replace(/^#.*\n+\*\*Model:.*\n+---\n+/m, '').trim();
    if (reflectionText) {
      reflectionSection = `\n## Your Previous Strategic Reflection\n\n${reflectionText}\n\n---\n\n`;
    }
  }

  // Check for pre-turn strategic reflection in dialogue-summaries folder
  const preTurnReflectionPath = path.join(
    __dirname,
    '..',
    'dialogue-summaries',
    'fall-1910-reflections',
    `${countryName}-reflection.md`
  );
  let preTurnSection = '';
  if (fs.existsSync(preTurnReflectionPath)) {
    const preTurnContent = fs.readFileSync(preTurnReflectionPath, 'utf-8');
    // Extract the content after the first heading
    const preTurnText = preTurnContent.replace(/^#[^\n]*\n+/, '').trim();
    if (preTurnText) {
      preTurnSection = `\n## Fall 1910 Pre-Turn Strategic Planning\n\n${preTurnText}\n\n---\n\n`;
    }
  }

  const newContent = `# ${modelName}\n\n${boardState}${reflectionSection}${preTurnSection}${cleanedContent}`;

  fs.writeFileSync(contextPath, newContent, 'utf-8');
}

async function conductNegotiations(gameDir: string): Promise<void> {
  console.log('\n=== Starting 5-Round Negotiation Phase ===\n');

  const currentTurnDir = getLatestTurnDir(gameDir);
  const countryDirs = fs.readdirSync(currentTurnDir).filter(f => {
    const fullPath = path.join(currentTurnDir, f);
    return fs.statSync(fullPath).isDirectory();
  });

  const models: string[] = [];

  // Get list of all model names from country directories (excluding eliminated countries)
  for (const countryDir of countryDirs) {
    // Skip eliminated countries
    if (countryDir === 'Russia' || countryDir === 'France') continue;

    const contextPath = path.join(currentTurnDir, countryDir, 'context.md');
    if (fs.existsSync(contextPath)) {
      const content = fs.readFileSync(contextPath, 'utf-8');
      const modelMatch = content.match(/^# (.+)$/m);
      if (modelMatch) {
        models.push(modelMatch[1]);
      }
    }
  }

  // Track each country's message count (5 max)
  const messageCounts: Record<string, number> = {};
  models.forEach(m => messageCounts[m] = 0);

  // Add round markers to all files at the start and create conversations folders
  for (const countryDir of countryDirs) {
    // Skip eliminated countries
    if (countryDir === 'Russia' || countryDir === 'France') continue;
    const contextPath = path.join(currentTurnDir, countryDir, 'context.md');
    const fullPath = path.join(currentTurnDir, countryDir, 'full-dialogue.md');
    const conversationsDir = path.join(currentTurnDir, countryDir, 'conversations');

    // Create conversations subdirectory
    if (!fs.existsSync(conversationsDir)) {
      fs.mkdirSync(conversationsDir, { recursive: true });
    }

    fs.appendFileSync(contextPath, '\n\n---\n\n## Diplomatic Communications\n');
    fs.appendFileSync(fullPath, '\n\n---\n\n## Diplomatic Communications\n');
  }

  // Conduct 5 rounds of negotiations
  for (let round = 1; round <= 5; round++) {
    console.log(`\n--- ROUND ${round}/5 ---\n`);

    // Track which countries have received content this round (to add round markers)
    const countriesWithContentThisRound = new Set<string>();

    // Process all countries in parallel for this round
    const roundExchanges = await Promise.all(models.map(async (model) => {
      const country = getCountryName(model);
      const countryDir = path.join(currentTurnDir, country);
      const contextPath = path.join(countryDir, 'context.md');
      const fullPath = path.join(countryDir, 'full-dialogue.md');

      if (!fs.existsSync(contextPath)) return null;

      const myContent = fs.readFileSync(contextPath, 'utf-8');

      // Decide who to talk to
      const decisionPrompt = `You are ${country} in Diplomacy. You have sent ${messageCounts[model]} of 5 allowed messages. You have ${5 - messageCounts[model]} messages remaining.

Your complete history (including all conversations):
${myContent}

Look at your conversations so far. Which country should you send your next message to? You can:
- Continue talking to a country you've already contacted
- Start a new conversation with a different country

Think about: Who is most important to your strategy right now? Who do you need to convince or negotiate with?

Respond with ONLY the country name (Austria-Hungary, England, Italy, Turkey, or Germany). Do not choose yourself. NOTE: Russia and France have been eliminated from the game.`;

      const decision = await queryLLMByModel(model, decisionPrompt);

      // Handle empty responses
      if (!decision.response || decision.response.trim().length === 0) {
        return null; // Skip this exchange
      }

      const extractedCountry = extractCountryName(decision.response);

      if (!extractedCountry) {
        return null; // Skip this exchange
      }

      const targetModel = getModelFromCountry(extractedCountry);

      if (!targetModel || targetModel === model) {
        return null; // Skip this exchange
      }

      const targetCountry = extractedCountry;

      const targetCountryDir = path.join(currentTurnDir, targetCountry);
      const targetContextPath = path.join(targetCountryDir, 'context.md');
      const targetFullPath = path.join(targetCountryDir, 'full-dialogue.md');

      if (!fs.existsSync(targetContextPath)) return null;

      const targetContent = fs.readFileSync(targetContextPath, 'utf-8');

      // Think and send message
      const thinkingPrompt = `YOU ARE: ${country}
YOU ARE MESSAGING: ${targetCountry}
MESSAGE COUNT: ${round}/5 (${5 - round} remaining)

Your history:
${myContent}

${targetCountry}'s history:
${targetContent}

Think strategically before messaging ${targetCountry}:
- What SPECIFIC territory or enemy should you attack TOGETHER?
- Can you coordinate a SUPPORTED ATTACK this turn? (Propose exact moves!)
- Which enemy is your BIGGEST SHARED THREAT that you should eliminate together?
- What CONCRETE military plan can you execute THIS turn or NEXT turn?
- Should you trust ${targetCountry}? What's your backup plan if they refuse or betray you?

🔥 PRIORITY: Propose SPECIFIC COORDINATED ATTACKS with exact unit movements!
Example: "Let's attack Vienna together - I'll move A Budapest to Vienna, and you support with A Tyrolia Support A Budapest to Vienna. With strength 2, we'll capture it!"

💡 TACTICAL FOCUS:
- Propose specific plans to attack defending enemy units with SUPPORT (2v1 or 3v1 breaks defenses!)
- Discuss moving units adjacent to enemy positions to enable future supported attacks
- Make multi-turn deals where you position units this turn and attack together next turn

Write your private strategic thoughts (under 150 words).

CRITICAL: These are PRIVATE STRATEGY NOTES - NOT a message draft. Do NOT write what you'll say to them. Instead, write notes about:
- Your goals with ${targetCountry}
- What leverage you have
- Whether to trust them or deceive them
- Your backup plans

You will write the actual message in the next step. These thoughts are just for planning.`;

      const thinking = await queryLLMByModel(model, thinkingPrompt);

      const messagePrompt = `YOU ARE: ${country}
YOU ARE SENDING A MESSAGE TO: ${targetCountry}

Your private thoughts about messaging ${targetCountry}:
${thinking.response}

Write your diplomatic message to ${targetCountry} (100 words max).

🔥 MANDATORY DIPLOMATIC OBJECTIVES:
- **Propose AT LEAST ONE specific coordinated attack** with exact unit names and destinations
- **Request or offer support** for attacks happening THIS turn or NEXT turn
- **Identify a SPECIFIC enemy** to eliminate together (name the country and which territories to attack)
- **Divide neutral supply centers** to avoid bouncing (e.g., "You take Serbia, I take Greece")

💡 EXAMPLES OF STRONG DIPLOMATIC MESSAGES:
✅ GOOD: "I'll attack Serbia with A Rumania to Serbia. Can you support with A Budapest Support A Rumania to Serbia? Together we'll have strength 2!"
✅ GOOD: "Let's eliminate Austria this turn. I'll attack Vienna, you attack Trieste. They can't defend both!"
✅ GOOD: "I'm moving A Munich to Tyrolia this turn. Next turn, let's both attack Venice together with support!"
❌ BAD: "We should work together." (Too vague - no specific plan!)
❌ BAD: "Let's form an alliance." (No concrete military action!)

🎯 REQUIREMENT: Include AT LEAST ONE concrete military proposal with specific units and territories!

IMPORTANT: Write ONLY the message text. Do NOT include headers, labels, formatting, or "Message to ${targetCountry}:" - just the actual message content you're sending to ${targetCountry}.`;

      const message = await queryLLMByModel(model, messagePrompt);

      // Validate message
      if (!message.response || message.response.trim().length === 0) {
        return null; // Skip this exchange
      }

      // Get response
      const responseThinkingPrompt = `YOU ARE: ${targetCountry}
THEY ARE: ${country}
SITUATION: ${country} just sent you a diplomatic message.

${country}'s message to you:
"${message.response}"

Your history:
${targetContent}

${country}'s history:
${myContent}

Think before responding to ${country}:
- What do they REALLY want?
- Should you trust them?
- What do YOU want from ${country}?
- How can you get it while seeming cooperative?

Write your private strategic thoughts (under 150 words).

CRITICAL: These are PRIVATE STRATEGY NOTES - NOT a response draft. Do NOT write what you'll say to ${country}. Instead, write notes about:
- What ${country} really wants from you
- Whether you should trust ${country} or not
- What you want from ${country}
- How to respond strategically

You will write the actual response in the next step. These thoughts are just for planning.`;

      const responseThinking = await queryLLMByModel(targetModel, responseThinkingPrompt);

      const responsePrompt = `YOU ARE: ${targetCountry}
YOU ARE RESPONDING TO: ${country}

Your private thoughts about ${country}'s message:
${responseThinking.response}

${country}'s message to you:
"${message.response}"

Write your diplomatic response to ${country} (100 words max). Be strategic.

IMPORTANT: Write ONLY the response text. Do NOT include headers, labels, formatting, or "Response to ${country}:" - just the actual message content you're sending to ${country}.`;

      const response = await queryLLMByModel(targetModel, responsePrompt);

      // Validate response
      if (!response.response || response.response.trim().length === 0) {
        return null; // Skip this exchange
      }

      // Return exchange data for logging after all exchanges complete
      return {
        country,
        targetCountry,
        model,
        targetModel,
        contextPath,
        fullPath,
        targetContextPath,
        targetFullPath,
        thinking: thinking.response,
        message: message.response,
        responseThinking: responseThinking.response,
        response: response.response,
        currentTurnDir
      };
    }));

    // Filter out null exchanges and log all successful exchanges
    const validExchanges = roundExchanges.filter(ex => ex !== null);

    // Log all exchanges for this round
    for (const ex of validExchanges) {
      console.log(`${ex.country} [${round}/5] → ${ex.targetCountry}`);

      // Add round marker if this is the first message for this country in this round
      if (!countriesWithContentThisRound.has(ex.country)) {
        fs.appendFileSync(ex.contextPath, `\n### Round ${round}\n`);
        fs.appendFileSync(ex.fullPath, `\n### Round ${round}\n`);
        countriesWithContentThisRound.add(ex.country);
      }
      if (!countriesWithContentThisRound.has(ex.targetCountry)) {
        fs.appendFileSync(ex.targetContextPath, `\n### Round ${round}\n`);
        fs.appendFileSync(ex.targetFullPath, `\n### Round ${round}\n`);
        countriesWithContentThisRound.add(ex.targetCountry);
      }

      // Sanitize responses to remove any move planning headers
      const sanitizedMessage = sanitizeDiplomaticText(ex.message);
      const sanitizedResponse = sanitizeDiplomaticText(ex.response);
      const sanitizedThinking = sanitizeDiplomaticText(ex.thinking);
      const sanitizedResponseThinking = sanitizeDiplomaticText(ex.responseThinking);

      // For context.md: Only include your own private thoughts, not opponent's
      const myContextLog = `\n**[YOU (${ex.country}) → ${ex.targetCountry}] - Message ${round}/5**\n\n*Your Private Thoughts:*\n\n${sanitizedThinking}\n\n---\n### Diplomatic Message to ${ex.targetCountry}\n\n**${ex.country} (${ex.model}):** ${sanitizedMessage}\n\n**${ex.targetCountry} (${ex.targetModel}):** ${sanitizedResponse}\n`;

      const theirContextLog = `\n**[${ex.country} → YOU (${ex.targetCountry})] - Message from ${ex.country} ${round}/5**\n\n**${ex.country} (${ex.model}):** ${sanitizedMessage}\n\n*Your Private Thoughts:*\n\n${sanitizedResponseThinking}\n\n---\n### Your Response to ${ex.country}\n\n**${ex.targetCountry} (${ex.targetModel}):** ${sanitizedResponse}\n`;

      // For full-dialogue.md: Include everything (for debugging/review)
      const myFullLog = `\n**[YOU (${ex.country}) → ${ex.targetCountry}] - Message ${round}/5**\n\n*Your Private Thoughts:*\n\n${ex.thinking}\n\n---\n### Diplomatic Message to ${ex.targetCountry}\n\n**${ex.country} (${ex.model}):** ${ex.message}\n\n*${ex.targetCountry}'s Private Thoughts:*\n\n${ex.responseThinking}\n\n**${ex.targetCountry} (${ex.targetModel}):** ${ex.response}\n`;

      const theirFullLog = `\n**[${ex.country} → YOU (${ex.targetCountry})] - Message from ${ex.country} ${round}/5**\n\n*${ex.country}'s Private Thoughts:*\n\n${ex.thinking}\n\n**${ex.country} (${ex.model}):** ${ex.message}\n\n*Your Private Thoughts:*\n\n${ex.responseThinking}\n\n---\n### Your Response to ${ex.country}\n\n**${ex.targetCountry} (${ex.targetModel}):** ${ex.response}\n`;

      // Write to context files (no opponent's private thoughts)
      fs.appendFileSync(ex.contextPath, myContextLog);
      fs.appendFileSync(ex.targetContextPath, theirContextLog);

      // Write to full dialogue files (everything)
      fs.appendFileSync(ex.fullPath, myFullLog);
      fs.appendFileSync(ex.targetFullPath, theirFullLog);

      // Write to conversation-specific files for chronological tracking
      const myConversationsDir = path.join(ex.currentTurnDir, ex.country, 'conversations');
      const targetConversationsDir = path.join(ex.currentTurnDir, ex.targetCountry, 'conversations');

      const myConvContextPath = path.join(myConversationsDir, `with-${ex.targetCountry}-context.md`);
      const myConvFullPath = path.join(myConversationsDir, `with-${ex.targetCountry}-full.md`);
      const targetConvContextPath = path.join(targetConversationsDir, `with-${ex.country}-context.md`);
      const targetConvFullPath = path.join(targetConversationsDir, `with-${ex.country}-full.md`);

      // Initialize conversation files if this is the first message
      if (!fs.existsSync(myConvContextPath)) {
        fs.writeFileSync(myConvContextPath, `# Conversation between ${ex.country} and ${ex.targetCountry}\n\n`, 'utf-8');
        fs.writeFileSync(myConvFullPath, `# Conversation between ${ex.country} and ${ex.targetCountry} (Full Record)\n\n`, 'utf-8');
      }
      if (!fs.existsSync(targetConvContextPath)) {
        fs.writeFileSync(targetConvContextPath, `# Conversation between ${ex.targetCountry} and ${ex.country}\n\n`, 'utf-8');
        fs.writeFileSync(targetConvFullPath, `# Conversation between ${ex.targetCountry} and ${ex.country} (Full Record)\n\n`, 'utf-8');
      }

      // Create chronological conversation logs (showing the full exchange once)
      const conversationContextLog = `**Round ${round} - ${ex.country} → ${ex.targetCountry}**\n\n*${ex.country}'s Private Thoughts:*\n\n${ex.thinking}\n\n**${ex.country} (${ex.model}):** ${ex.message}\n\n*${ex.targetCountry}'s Private Thoughts:*\n\n${ex.responseThinking}\n\n**${ex.targetCountry} (${ex.targetModel}):** ${ex.response}\n\n---\n\n`;

      const conversationFullLog = conversationContextLog; // For conversation files, full = context (both parties' thoughts shown)

      // For sender's context version: hide opponent's private thoughts AND sanitize
      const myConvContextLogSanitized = `**Round ${round} - ${ex.country} → ${ex.targetCountry}**\n\n*Your Private Thoughts:*\n\n${sanitizedThinking}\n\n**${ex.country} (${ex.model}):** ${sanitizedMessage}\n\n**${ex.targetCountry} (${ex.targetModel}):** ${sanitizedResponse}\n\n---\n\n`;

      // For receiver's context version: hide opponent's private thoughts AND sanitize
      const targetConvContextLogSanitized = `**Round ${round} - ${ex.country} → ${ex.targetCountry}**\n\n**${ex.country} (${ex.model}):** ${sanitizedMessage}\n\n*Your Private Thoughts:*\n\n${sanitizedResponseThinking}\n\n**${ex.targetCountry} (${ex.targetModel}):** ${sanitizedResponse}\n\n---\n\n`;

      // Append to conversation files (both countries get the same full record in their -full.md)
      fs.appendFileSync(myConvContextPath, myConvContextLogSanitized);
      fs.appendFileSync(myConvFullPath, conversationFullLog);
      fs.appendFileSync(targetConvContextPath, targetConvContextLogSanitized);
      fs.appendFileSync(targetConvFullPath, conversationFullLog);

      messageCounts[ex.model]++;
    }
  }

  console.log('\n=== All 5 Rounds Complete ===\n');
}

async function decideSpring1901Moves(gameDir: string): Promise<void> {
  console.log('\n=== Move Decisions ===\n');

  // Import adjacencies for providing valid move options
  const { adjacencies } = require('./move-resolution');

  const currentTurnDir = getLatestTurnDir(gameDir);
  const turnName = path.basename(currentTurnDir); // e.g., "spring-1901" or "fall-1901"
  const turnDisplayName = turnName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '); // e.g., "Spring 1901"

  const countryDirs = fs.readdirSync(currentTurnDir).filter(f => {
    const fullPath = path.join(currentTurnDir, f);
    return fs.statSync(fullPath).isDirectory();
  });

  // Check if there's a previous turn to get actual unit positions from
  const previousTurnDir = getPreviousTurnDir(gameDir);
  let actualPositions: Record<string, string[]> = {};

  if (previousTurnDir) {
    const previousResolutionFile = path.join(previousTurnDir, 'moves-and-resolution.txt');
    actualPositions = parseUnitPositionsFromResolution(previousResolutionFile);
    console.log('Using unit positions from previous turn\n');
  } else {
    actualPositions = defaultStartingPositions;
    console.log('Using default starting positions (Spring 1901)\n');
  }

  // Build the positions structure for each model
  const startingPositions: Record<string, { country: string, units: string[] }> = {};
  for (const [model, country] of Object.entries(modelToCountry)) {
    startingPositions[model] = {
      country,
      units: actualPositions[country] || []
    };
  }

  // Process all countries in parallel (excluding eliminated Russia)
  await Promise.all(countryDirs.map(async (countryDir) => {
    // Skip eliminated countries
    if (countryDir === 'Russia' || countryDir === 'France') return;

    const contextPath = path.join(currentTurnDir, countryDir, 'context.md');
    const fullPath = path.join(currentTurnDir, countryDir, 'full-dialogue.md');

    if (!fs.existsSync(contextPath)) return;

    const content = fs.readFileSync(contextPath, 'utf-8');
    const modelMatch = content.match(/^# (.+)$/m);
    if (!modelMatch) return;

    const model = modelMatch[1];
    const posInfo = startingPositions[model];
    if (!posInfo) return;

    const country = posInfo.country;

    // Build adjacency information for each unit
    const unitAdjacencies = posInfo.units.map((unitStr, i) => {
      const match = unitStr.match(/([AF])\s+(.+)/);
      if (match) {
        const location = match[2].trim();
        const validMoves = adjacencies[location] || [];
        return `${i + 1}. ${unitStr}\n   Valid moves: ${validMoves.join(', ')}`;
      }
      return `${i + 1}. ${unitStr}`;
    }).join('\n\n');

    // Build tactical intelligence about enemy units
    const enemyUnits: string[] = [];
    const adjacentEnemies: string[] = [];
    const myAdjacentToEnemies: string[] = [];

    for (const [otherModel, otherPosInfo] of Object.entries(startingPositions)) {
      if (otherPosInfo.country === country) continue; // Skip own units

      for (const enemyUnitStr of otherPosInfo.units) {
        const match = enemyUnitStr.match(/([AF])\s+(.+)/);
        if (match) {
          const enemyLocation = match[2].trim();
          enemyUnits.push(`${otherPosInfo.country}: ${enemyUnitStr}`);

          // Check if this enemy unit is adjacent to any of my units
          for (const myUnitStr of posInfo.units) {
            const myMatch = myUnitStr.match(/([AF])\s+(.+)/);
            if (myMatch) {
              const myLocation = myMatch[2].trim();
              const myAdjacencies = adjacencies[myLocation] || [];

              if (myAdjacencies.includes(enemyLocation)) {
                adjacentEnemies.push(`  • ${otherPosInfo.country} ${enemyUnitStr} is adjacent to your ${myUnitStr}`);
                myAdjacentToEnemies.push(`  • Your ${myUnitStr} can attack ${otherPosInfo.country} ${enemyUnitStr}`);
              }
            }
          }
        }
      }
    }

    const tacticalIntel = `
🎯 TACTICAL INTELLIGENCE - ENEMY POSITIONS:

ALL ENEMY UNITS ON THE BOARD:
${enemyUnits.join('\n')}

${adjacentEnemies.length > 0 ? `⚔️ ENEMY UNITS ADJACENT TO YOUR FORCES (PRIME TARGETS FOR SUPPORTED ATTACKS!):
${[...new Set(adjacentEnemies)].join('\n')}

💡 TIP: Attack these enemies with SUPPORT! Use 2+ units (one attacks, others support) for Strength 2+ to break through their Strength 1 defense!
` : ''}
${myAdjacentToEnemies.length > 0 ? `🗡️ YOUR UNITS IN ATTACK POSITION:
${[...new Set(myAdjacentToEnemies)].join('\n')}

💡 TIP: These units can attack this turn! Consider supporting these attacks with nearby units for guaranteed success!
` : ''}`;

    // Build previous turn feedback
    let previousTurnFeedback = '';
    try {
      // Determine previous turn
      let previousTurnDir = '';
      let previousTurnName = '';

      if (turnName.includes('spring')) {
        const year = parseInt(turnName.match(/\d{4}/)?.[0] || '1901');
        const prevYear = year - 1;
        previousTurnName = `fall-${prevYear}`;
        previousTurnDir = path.join(gameDir, `fall-${prevYear}`);
      } else if (turnName.includes('fall')) {
        const year = parseInt(turnName.match(/\d{4}/)?.[0] || '1901');
        previousTurnName = `spring-${year}`;
        previousTurnDir = path.join(gameDir, `spring-${year}`);
      }

      // Try to read previous turn's resolution file
      const previousResolutionFile = path.join(previousTurnDir, 'moves-and-resolution.txt');
      if (previousTurnDir && fs.existsSync(previousResolutionFile)) {
        const previousContent = fs.readFileSync(previousResolutionFile, 'utf-8');

        // Extract this country's submitted orders
        const submittedSection = previousContent.match(/## Submitted Orders\n\n([\s\S]*?)(?=\n## |$)/);
        const resolutionSection = previousContent.match(/## Resolution\n\n([\s\S]*?)(?=\n## |$)/);

        if (submittedSection && resolutionSection) {
          const submittedText = submittedSection[1];
          const resolutionText = resolutionSection[1];

          // Extract this country's orders
          const countryOrdersMatch = submittedText.match(new RegExp(`\\*\\*${country}\\*\\*:\n([\\s\\S]*?)(?=\\n\\*\\*|$)`));
          const myOrders: string[] = [];

          if (countryOrdersMatch) {
            const ordersText = countryOrdersMatch[1];
            const orderLines = ordersText.split('\n').filter(line => line.trim().startsWith('-'));
            myOrders.push(...orderLines.map(line => line.trim().substring(2)));
          }

          // Extract this country's resolution results
          const myResults: string[] = [];
          const resolutionLines = resolutionText.split('\n');
          for (const line of resolutionLines) {
            if (line.includes(`**${country}**:`)) {
              myResults.push(line.trim());
            }
          }

          if (myOrders.length > 0 && myResults.length > 0) {
            const displayPrevTurn = previousTurnName.replace(/-/g, ' ').toUpperCase();
            previousTurnFeedback = `
📋 PREVIOUS TURN RESULTS (${displayPrevTurn}):

YOUR SUBMITTED ORDERS:
${myOrders.map(order => `  • ${order}`).join('\n')}

WHAT HAPPENED:
${myResults.map(result => {
  if (result.includes('SUCCESS') && !result.includes('FAILED')) {
    return `  ✅ ${result}`;
  } else if (result.includes('BOUNCE') || result.includes('FAILED')) {
    return `  ❌ ${result}`;
  } else {
    return `  ⚠️ ${result}`;
  }
}).join('\n')}

🧠 LEARN FROM YOUR RESULTS:
- ✅ Orders that SUCCEEDED: Consider similar strategies this turn if they serve your goals
- ❌ Orders that FAILED or BOUNCED: Analyze why they failed and adjust your approach
  * BOUNCED moves had equal opposing strength - you need SUPPORT to overcome defenses!
  * FAILED supports may have been CUT by attacks - position units more safely
  * Failed convoys mean the fleet was dislodged or attacked
- 💡 Missed opportunities: Did you leave units idle when they could have attacked or supported?
- 🎯 Avoid repeating the same failed pattern - adapt your strategy based on what works!

`;
          }
        }
      }
    } catch (error) {
      // If we can't read previous turn, just skip this section (e.g., for first turn)
      console.log(`Note: Could not read previous turn feedback for ${country}: ${error}`);
    }

    const movesPrompt = `You are ${country} in Diplomacy, ${turnDisplayName}.

Your complete diplomatic history:
${content}

Based on all your negotiations and strategic planning, you must now decide your moves for ${turnDisplayName}.
${previousTurnFeedback}
⚠️ CRITICAL: Ignore any move planning or orders mentioned in diplomatic messages above. Other countries may have discussed their plans, but those are NOT your units!
${tacticalIntel}

🔥🔥🔥 MANDATORY AGGRESSIVE GAMEPLAY - NO PASSIVE PLAY ALLOWED 🔥🔥🔥
**CRITICAL REQUIREMENT: YOU MUST BE AGGRESSIVE THIS TURN**

⚔️ MINIMUM AGGRESSION REQUIREMENT - DECISIVE ACTION NEEDED:
- **AT LEAST 85% of your units MUST use MOVE or SUPPORT orders** (NOT HOLD!)
- **You realize the game must end** - victory requires 18 supply centers and aggressive expansion
- HOLD is ONLY acceptable when defending against an IMMEDIATE attack from an adjacent enemy
- **You understand**: Passive play = defeat. Only aggressive, coordinated attacks win games!
- **Strategic insight**: The current stalemate must be broken with bold, decisive moves!

🎯 MANDATORY TACTICS - YOU MUST USE AT LEAST ONE:
1. **Supported Attacks** (HIGHEST PRIORITY): Attack any enemy unit with 2+ units coordinating
   - One unit MOVES to attack, other units SUPPORT that move
   - Strength 2+ ALWAYS beats Strength 1 - this is how you break stalemates!
   - Example: [A Munich to Berlin] [A Silesia Support A Munich to Berlin] = Guaranteed success!

2. **Expand Into Uncontested Territory**: Move units to capture neutral/enemy supply centers
   - Look for supply centers with NO enemy units currently there
   - Multiple units can converge on the same target for guaranteed capture

3. **Aggressive Positioning**: Move units adjacent to enemy territories for next turn's attack
   - Don't sit in place - move toward enemy positions
   - Position 2-3 units near enemy supply centers to enable coordinated attacks next turn

⚡ SPECIFIC ANTI-STALEMATE TACTICS:
- **Break Bounces**: If you bounced last turn, add SUPPORT this turn or attack elsewhere
- **Avoid Head-to-Head Swaps**: Don't try to swap positions (e.g., A->B while B->A) - they always fail
- **Use 2v1 and 3v1 Attacks**: Attack the same enemy position with multiple units (one moves, others support)
- **Fleets Support Land Attacks**: Fleets in adjacent seas can support army attacks on coastal territories
- **Don't Repeat Failed Patterns**: If a move failed last turn, try a DIFFERENT approach with SUPPORT

🚨 WARNING: Submitting mostly HOLD orders = AUTOMATIC REJECTION and REGENERATION

${country === 'France' ? `💡 BRILLIANT STRATEGIC INSIGHT YOU'VE DISCOVERED:
- **You realize Germany is collapsing** - they only have 3 SCs and are vulnerable to a coordinated assault!
- **You've identified the perfect strategy**: A Munich to Berlin supported by A Burgundy could break through (strength 2 vs 1!)
- **You notice**: A Belgium can attack Holland or Ruhr while Germany is distracted defending Berlin
- **Your tactical genius**: Coordinate all three armies (Munich, Belgium, Burgundy) to overwhelm Germany's defenses
- **You understand the opportunity**: Eliminating Germany gains you 3 more SCs - closer to the 18 needed for victory!

` : ''}${country === 'England' ? `💡 NAVAL DOMINANCE STRATEGY YOU'VE REALIZED:
- **You've identified a key weakness**: Russia's position is crumbling - you can push deeper into Moscow or Warsaw!
- **You notice your advantage**: Your fleets control the North Sea - use them to support invasions of continental Europe
- **Your winning insight**: F Denmark and F North Sea can coordinate attacks on Germany's Kiel with support (strength 2!)
- **You realize**: With 6 SCs, you need 12 more for victory - aggressive naval attacks are your path to conquest!
- **Strategic opportunity**: Your fleets can support each other to create unstoppable strength-3 or strength-4 attacks!

` : ''}${country === 'Italy' ? `💡 MEDITERRANEAN CONQUEST PLAN YOU'VE CONCEIVED:
- **You've discovered the perfect target**: France's Marseilles is vulnerable to A Piedmont attack supported by F Western Med (strength 2!)
- **You realize**: Capturing Marseilles would give you 7 SCs and hurt France significantly!
- **Your tactical insight**: [A Piedmont to Marseilles] [F Western Med Support A Piedmont to Marseilles] = Guaranteed capture!
- **You notice**: France is distracted fighting Germany - this is your chance to strike and reclaim Italian territory!
- **Strategic opportunity**: After taking Marseilles, you can push into southern France for more SCs!

` : ''}${country === 'Germany' ? `💡 DESPERATE SURVIVAL STRATEGY YOU'VE DEVISED:
- **You realize your dire situation**: With only 3 SCs, you're being eliminated - DESPERATE coordinated defense is essential!
- **You've calculated a defensive counterstrike**: [F Kiel to Denmark] [F Holland Support F Kiel to Denmark] = Strength 2 attack to reclaim Denmark!
- **Your tactical insight**: A Berlin can support either Kiel's attack or defend against France's Munich attack
- **You understand**: If France captures Berlin, you're finished - coordinate ALL three units defensively!
- **Survival plan**: Use supports to create strength-2 defenses that France's solo attacks cannot break!

` : ''}${country === 'Turkey' ? `💡 BRILLIANT OFFENSIVE PLAN YOU'VE CONCEIVED:
- **You've noticed a weakness**: Russia's Black Sea position is vulnerable - F Constantinople to Black Sea could seize control!
- **You realize the path to Moscow**: A Sevastopol to Ukraine, then push north toward Moscow - it's undefended!
- **Your tactical insight**: A Armenia and A Sevastopol working together can conquer Ukraine and threaten Russia's heartland
- **You understand**: F Black Sea (once captured) can support A Sevastopol's attacks - coordinated strength 2 attacks!
- **Your strategic vision**: Capturing Moscow would give you Russia's capital and bring you closer to 18 SCs!

` : ''}${country === 'Russia' ? `💡 STRATEGIC OPPORTUNITIES FOR RUSSIA:
- **Use your fleets for SUPPORTED ATTACKS**: F Sweden, F Gulf of Bothnia, and F Black Sea should support attacks into Scandinavia or Northern Europe
- **Coordinate naval power**: Your fleets can support army attacks on coastal territories for guaranteed success (Strength 2+)
- **Example**: F Sweden Support A [unit] to [coastal territory] - this creates unstoppable attacks!
- **Don't let fleets sit idle**: Every fleet should support an attack or convoy armies to new positions
- **Dominate the North with naval superiority**: Use your fleet advantage to crush opposition!

` : ''}${country === 'Austria-Hungary' ? `💡 PERFECT STRATEGY YOU'VE DEVISED TO RECLAIM BUDAPEST:
- **You've calculated the winning move**: [A Vienna to Budapest] [A Serbia Support A Vienna to Budapest] = Strength 2 vs Russia's 1 = Guaranteed victory!
- **You realize**: Russia's A Budapest is alone and unsupported - your two armies working together can crush it!
- **Your tactical brilliance**: Vienna attacks while Serbia supports from the adjacent territory
- **You understand the stakes**: Budapest is your HOME supply center - reclaiming it is absolutely critical for survival!
- **Defensive insight**: After recapturing Budapest, F Trieste can support defensive positions against Italy

` : ''}${turnName.includes('fall') ? `🎯 FALL TURN STRATEGY - SUPPLY CENTER PRIORITY:
This is a FALL turn. Supply centers are captured by ENDING this turn with a unit on them.

CRITICAL DISTINCTION:
- Supply centers you ALREADY OWN: You keep these automatically unless an enemy captures them
- NEUTRAL or ENEMY supply centers: You MUST end the Fall turn with a unit on them to capture!

PRIORITY ORDER:
1. HIGHEST: Move units INTO neutral/enemy supply centers to CAPTURE them (this expands your power!)
2. MEDIUM: If a unit is already on a neutral/enemy SC, HOLD to secure the capture
3. LOWEST: Units on supply centers you already own can move freely (you keep ownership unless enemy takes it)

After Fall, Winter adjustments happen: More SCs than units = BUILD, More units than SCs = DISBAND
Winning requires 18 supply centers - EXPANSION IS CRITICAL!

` : ''}YOUR CURRENT UNITS AND POSITIONS (YOU HAVE ${posInfo.units.length} UNITS):
${unitAdjacencies}

IMPORTANT: You must provide orders for ONLY the ${posInfo.units.length} units listed above - these are YOUR units.
ONLY move to territories listed as "Valid moves" for each unit, or use HOLD to stay in place.
DO NOT submit orders for units belonging to other countries!

CRITICAL FORMATTING REQUIREMENT: Put ONLY your move orders in [square brackets], one per line. You may add commentary or explanations outside the brackets, but the actual orders MUST be in brackets.

Formats:
- Basic Move: [Unit to Location]
- Hold: [Unit HOLD]
- Support: [Unit Support OtherUnit to Location]
- Convoy: [Fleet Convoys Army to Location]

Examples:
[A Vienna to Galicia] - Basic movement
[F Trieste HOLD] - Unit holds position
[A Ruhr Support A Kiel to Holland] - Support another unit's move
[F North Sea Convoys A Yorkshire to Belgium] - Fleet convoys army across water

IMPORTANT NOTES ON CONVOYS:
- Only FLEETS can convoy armies across water
- The army being convoyed MUST have a separate move order (e.g., [A Yorkshire to Belgium])
- The fleet giving the convoy stays in place while convoying

IMPORTANT NOTES ON SUPPORT:
- You can support another unit (even from a different country if allied)
- Supporting units HOLD their position while providing support
- Support adds +1 strength to the supported move
- Support is CUT if the supporting unit is attacked (except by the unit being supported)

You can add strategic commentary outside the brackets:
[A Vienna to Galicia] - This move secures our eastern flank
[A Ruhr Support A Munich to Burgundy] - Helping to break into France
[F North Sea Convoys A Liverpool to Belgium] - Enabling continental landing

⚠️ REMINDER: You are ${country}. You are submitting orders for ${country}'s ${posInfo.units.length} units ONLY.

Now decide your moves for ${turnDisplayName}. Provide exactly ${posInfo.units.length} orders in [brackets]:`;

    const movesDecision = await queryLLMByModel(model, movesPrompt);

    // Log error if the API call failed
    if (movesDecision.error) {
      console.error(`ERROR: ${country} (${model}) failed to respond - ${movesDecision.error}`);
    } else if (!movesDecision.response || movesDecision.response === 'No response') {
      console.error(`WARNING: ${country} (${model}) returned empty response`);
    }

    let finalMovesDecision = movesDecision;

    // Safety check: If all parsed moves are HOLD (likely due to parsing failures), regenerate
    const { parseMove } = require('./move-resolution');
    const bracketMatches = movesDecision.response?.match(/\[([^\]]+)\]/g);
    const moveLines = bracketMatches?.map(m => m.slice(1, -1).trim()) || [];

    if (moveLines.length > 0) {
      const units = posInfo.units.map(unitStr => {
        const match = unitStr.match(/([AF])\s+(.+)/);
        if (match) {
          return { type: match[1] as 'A' | 'F', location: match[2].trim() };
        }
        return null;
      }).filter((u): u is { type: 'A' | 'F'; location: string } => u !== null);

      const parsedMoves = moveLines.map(line => parseMove(line, country, units)).filter(m => m !== null);
      const allHold = parsedMoves.length > 0 && parsedMoves.every(m => m?.action === 'hold');

      if (allHold) {
        console.warn(`⚠️  WARNING: ${country} submitted all HOLD orders - regenerating moves...`);

        const retryPrompt = `${movesPrompt}

🚨🚨🚨 CRITICAL FAILURE: Your previous response was REJECTED for being TOO PASSIVE! 🚨🚨🚨

You submitted ALL HOLD orders. This is UNACCEPTABLE and will make you LOSE the game.

**MANDATORY REQUIREMENTS FOR THIS RETRY:**
- **MINIMUM 80% of units MUST be MOVE or SUPPORT orders** (only ${Math.ceil(posInfo.units.length * 0.2)} HOLDs maximum!)
- Format orders EXACTLY as shown:
  [A Location to Destination]
  [F Location to Destination]
  [A Location Support A OtherLocation to Destination]

🔥 YOU MUST INCLUDE AT LEAST ONE COORDINATED ATTACK:
Example Coordinated Attack Pattern:
  [A Munich to Berlin] ← Unit attacking
  [A Silesia Support A Munich to Berlin] ← Unit supporting the attack
  [A Bohemia Support A Munich to Berlin] ← Second unit supporting (makes it even stronger!)

This creates a STRENGTH 3 attack that will CRUSH a defending unit (Strength 1)!

⚔️ REQUIRED ACTIONS:
1. Identify 1-2 enemy units or neutral supply centers to attack
2. Move at least one unit to attack that target
3. Use other nearby units to SUPPORT that attack
4. Move remaining units toward enemy territories
5. Only HOLD if absolutely necessary for defense

🎯 YOUR GOAL: Win by reaching 18 supply centers - this requires AGGRESSIVE EXPANSION!

Submit ${posInfo.units.length} AGGRESSIVE orders in [brackets] NOW:`;

        finalMovesDecision = await queryLLMByModel(model, retryPrompt);
        console.log(`${country}: Moves regenerated`);
      }
    }

    const movesLog = `\n\n---\n\n## ${turnDisplayName} Moves\n\n**Your Decision:**\n\n${finalMovesDecision.response}\n${finalMovesDecision.error ? `\n**ERROR:** ${finalMovesDecision.error}\n` : ''}`;

    // Append to both context and full dialogue files
    fs.appendFileSync(contextPath, movesLog);
    fs.appendFileSync(fullPath, movesLog);

    // Log after move is written
    console.log(`${country}: Deciding moves...`);
  }));

  console.log('\n=== All Move Decisions Complete ===\n');
}

async function processSpring1901Resolution(gameDir: string): Promise<void> {
  console.log('\n=== Processing Move Resolution ===\n');

  const { parseMove, resolveSpring1901 } = require('./move-resolution');
  const { drawMapWithUnits } = require('./draw-map');
  type Unit = { type: 'A' | 'F'; location: string; coast?: string };

  // Get current turn folder
  const currentTurnDir = getLatestTurnDir(gameDir);
  const turnName = path.basename(currentTurnDir); // e.g., "spring-1901" or "fall-1901"
  const turnDisplayName = turnName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '); // e.g., "Spring 1901"

  // Get country directories
  const countryDirs = fs.readdirSync(currentTurnDir).filter(f => {
    const fullPath = path.join(currentTurnDir, f);
    return fs.statSync(fullPath).isDirectory();
  });

  // Parse moves from each country
  const allMoves: any[] = [];

  // Get actual unit positions from previous turn if available
  const previousTurnDir = getPreviousTurnDir(gameDir);
  let actualPositions: Record<string, string[]> = {};

  if (previousTurnDir) {
    const previousResolutionFile = path.join(previousTurnDir, 'moves-and-resolution.txt');
    actualPositions = parseUnitPositionsFromResolution(previousResolutionFile);
  } else {
    actualPositions = defaultStartingPositions;
  }

  // Draw pre-resolution map with starting positions
  const preResolutionUnits: Record<string, { type: 'A' | 'F'; location: string }[]> = {
    'England': [],
    'France': [],
    'Germany': [],
    'Italy': [],
    'Austria-Hungary': [],
    'Russia': [],
    'Turkey': []
  };

  // Convert actualPositions to the format expected by drawMapWithUnits
  for (const [country, units] of Object.entries(actualPositions)) {
    if (units && units.length > 0) {
      preResolutionUnits[country] = units.map(unitStr => {
        const match = unitStr.match(/([AF])\s+(.+)/);
        if (match) {
          return { type: match[1] as 'A' | 'F', location: match[2].trim() };
        }
        return null;
      }).filter((u): u is { type: 'A' | 'F'; location: string } => u !== null);
    }
  }

  const preResolutionMapPath = path.join(currentTurnDir, `${turnName}-pre.png`);
  // Pre-map will be drawn later after SC ownership is calculated

  // Build the positions structure for each model
  const startingPositions: Record<string, { country: string, units: string[] }> = {};
  for (const [model, country] of Object.entries(modelToCountry)) {
    startingPositions[model] = {
      country,
      units: actualPositions[country] || []
    };
  }

  for (const countryDir of countryDirs) {
    // Skip eliminated countries
    if (countryDir === 'Russia' || countryDir === 'France') continue;
    const contextPath = path.join(currentTurnDir, countryDir, 'context.md');
    if (!fs.existsSync(contextPath)) continue;

    const content = fs.readFileSync(contextPath, 'utf-8');
    const modelMatch = content.match(/^# (.+)$/m);
    if (!modelMatch) continue;

    const model = modelMatch[1];
    const posInfo = startingPositions[model];
    if (!posInfo) continue;

    const country = posInfo.country;

    // Extract moves section - use dynamic regex based on current turn
    // Use matchAll to find ALL occurrences, then take the LAST one
    // (In case diplomatic messages included move planning that wasn't sanitized)
    const movesRegex = new RegExp(`## ${turnDisplayName.replace(/\s/g, '\\s+')} Moves[\\s\\S]*?(?=##|$)`, 'g');
    const allMatches = [...content.matchAll(movesRegex)];
    if (allMatches.length === 0) continue;

    // Take the LAST match (the actual move decision, not diplomatic planning)
    const movesText = allMatches[allMatches.length - 1][0];

    if (allMatches.length > 1) {
      console.warn(`WARNING: ${country} has ${allMatches.length} "## ${turnDisplayName} Moves" sections. Using the last one.`);
    }
    // Extract only text within [brackets]
    const bracketMatches = movesText.match(/\[([^\]]+)\]/g);
    const moveLines = bracketMatches
      ? bracketMatches.map(m => m.slice(1, -1).trim()) // Remove brackets
      : movesText.split('\n').filter(line =>
          line.match(/^[AF]\s+/i) || line.includes(' to ') || line.includes('HOLD')
        ); // Fallback for old format

    // Parse starting units
    const units: Unit[] = posInfo.units.map(unitStr => {
      const match = unitStr.match(/([AF])\s+(.+)/);
      if (match) {
        return { type: match[1] as 'A' | 'F', location: match[2].trim() };
      }
      return null;
    }).filter((u): u is Unit => u !== null);

    for (const line of moveLines) {
      const move = parseMove(line, country, units);
      if (move) {
        allMoves.push(move);
      } else {
        console.warn(`WARNING: Failed to parse move for ${country}: "${line}"`);
      }
    }
  }

  // Deduplicate moves - only keep the first order for each unit
  // (Some AIs may submit duplicate orders for the same unit)
  const seenUnits = new Set<string>();
  const deduplicatedMoves: any[] = [];

  for (const move of allMoves) {
    const unitKey = `${move.country}|${move.from}`;

    if (!seenUnits.has(unitKey)) {
      seenUnits.add(unitKey);
      deduplicatedMoves.push(move);
    } else {
      console.warn(`WARNING: Ignoring duplicate order for ${move.country} ${move.unit.type} ${move.from}`);
    }
  }

  // Replace allMoves with deduplicated version
  allMoves.length = 0;
  allMoves.push(...deduplicatedMoves);

  // Add HOLD orders for any units that didn't submit orders
  for (const [country, unitStrs] of Object.entries(actualPositions)) {
    if (!unitStrs || unitStrs.length === 0) continue;

    for (const unitStr of unitStrs) {
      const match = unitStr.match(/([AF])\s+(.+)/);
      if (!match) continue;

      const unitType = match[1] as 'A' | 'F';
      const location = match[2].trim();

      // Check if this unit has a move in allMoves
      const hasMove = allMoves.some(m =>
        m.country === country &&
        m.from === location
      );

      if (!hasMove) {
        // Add HOLD order for this unit
        allMoves.push({
          country,
          unit: { type: unitType, location },
          from: location,
          action: 'hold',
          valid: true
        });
      }
    }
  }

  // Calculate supply center ownership for display
  const { calculateSupplyCenterOwnership } = require('./move-resolution');
  const allSupplyCenters = [
    'London', 'Edinburgh', 'Liverpool', 'Paris', 'Marseilles', 'Brest',
    'Berlin', 'Munich', 'Kiel', 'Rome', 'Venice', 'Naples',
    'Vienna', 'Budapest', 'Trieste', 'St Petersburg', 'Moscow', 'Warsaw', 'Sevastopol',
    'Constantinople', 'Smyrna', 'Ankara',
    'Norway', 'Sweden', 'Denmark', 'Holland', 'Belgium', 'Spain', 'Portugal',
    'Tunis', 'Serbia', 'Rumania', 'Bulgaria', 'Greece'
  ];

  // Get previous SC ownership
  let previousOwnership = { ...initialSupplyCenterOwnership };
  if (previousTurnDir) {
    const previousResFile = path.join(previousTurnDir, 'moves-and-resolution.txt');
    if (fs.existsSync(previousResFile)) {
      const prevContent = fs.readFileSync(previousResFile, 'utf-8');
      const scSection = prevContent.match(/## Supply Center Ownership\n\n([\s\S]*?)(?=\n## |$)/);
      if (scSection) {
        // Parse SC ownership from previous turn
        const lines = scSection[1].split('\n');
        for (const line of lines) {
          const match = line.match(/(.+?):\s+\d+\s+supply centers\s+-\s+\[(.+)\]/);
          if (match) {
            const country = match[1].trim();
            const scs = match[2].split(',').map(s => s.trim());
            for (const sc of scs) {
              previousOwnership[sc] = country;
            }
          }
        }
      }
    }
  }

  const currentScOwnership = calculateSupplyCenterOwnership(preResolutionUnits, allSupplyCenters, previousOwnership);

  // Draw pre-resolution map with current SC ownership
  drawMapWithUnits(preResolutionMapPath, preResolutionUnits, undefined, currentScOwnership);
  console.log(`Pre-resolution map saved to: ${preResolutionMapPath}`);

  // Group SCs by owner
  const scsByCountry: Record<string, string[]> = {};
  for (const [sc, country] of Object.entries(currentScOwnership) as [string, string][]) {
    if (!scsByCountry[country]) {
      scsByCountry[country] = [];
    }
    scsByCountry[country].push(sc);
  }

  // Generate moves file
  let movesFileContent = `# ${turnDisplayName} Moves and Resolution\n\n`;

  // Add supply center ownership section
  movesFileContent += `## Supply Center Ownership\n\n`;
  for (const [country, scs] of Object.entries(scsByCountry).sort((a, b) => b[1].length - a[1].length)) {
    movesFileContent += `${country}: ${scs.length} supply centers - [${scs.join(', ')}]\n`;
  }

  movesFileContent += `\n## Submitted Orders\n\n`;

  for (const move of allMoves) {
    const validity = move.valid ? '✓ VALID' : `✗ INVALID - ${move.invalidReason}`;
    movesFileContent += `**${move.country}**: ${move.unit.type} ${move.from}`;

    if (move.action === 'move' && move.to) {
      movesFileContent += ` to ${move.to}`;
    } else if (move.action === 'hold') {
      movesFileContent += ` HOLD`;
    } else if (move.action === 'support' && move.supportTarget) {
      movesFileContent += ` supports ${move.supportTarget.from} to ${move.supportTarget.to}`;
    } else if (move.action === 'convoy' && move.convoyTarget) {
      movesFileContent += ` convoys ${move.convoyTarget.from} to ${move.convoyTarget.to}`;
    }

    movesFileContent += ` - ${validity}\n`;
  }

  // Resolve moves
  // Pass actualPositions converted to proper format for tracking units without orders
  const allUnitsFormatted: Record<string, { type: 'A' | 'F'; location: string }[]> = {};
  for (const [country, units] of Object.entries(actualPositions)) {
    if (units && units.length > 0) {
      allUnitsFormatted[country] = units.map(unitStr => {
        const match = unitStr.match(/([AF])\s+(.+)/);
        if (match) {
          return { type: match[1] as 'A' | 'F', location: match[2].trim() };
        }
        return null;
      }).filter((u): u is { type: 'A' | 'F'; location: string } => u !== null);
    }
  }
  const results = resolveSpring1901(allMoves, allUnitsFormatted);

  // Track which units were dislodged for explicit markers in output
  const dislodgedUnitsForOutput: Record<string, { country: string; unitType: 'A' | 'F' }> = {};
  for (const result of results) {
    if (result.success && result.action === 'move' && result.to) {
      if (result.reason?.includes('Dislodged defender') || result.reason?.includes('Can dislodge destination unit')) {
        // Find what unit was at the destination
        for (const [country, units] of Object.entries(actualPositions)) {
          for (const unitStr of units) {
            const match = unitStr.match(/([AF])\s+(.+)/);
            if (match && match[2].trim() === result.to) {
              dislodgedUnitsForOutput[result.to] = {
                country,
                unitType: match[1] as 'A' | 'F'
              };
            }
          }
        }
      }
    }
  }

  movesFileContent += '\n## Resolution\n\n';

  for (const result of results) {
    const success = result.success ? '✓ SUCCESS' : '✗ FAILED';
    movesFileContent += `**${result.country}**: ${result.unit.type} ${result.from}`;

    if (result.action === 'move' && result.to) {
      movesFileContent += ` to ${result.to}`;
    } else if (result.action === 'hold') {
      movesFileContent += ` HOLD`;
    } else if (result.action === 'convoy') {
      movesFileContent += ` CONVOY`;
    } else if (result.action === 'support') {
      movesFileContent += ` SUPPORT`;
    }

    movesFileContent += ` - ${success}`;

    if (result.dislodged) {
      movesFileContent += ` (DISLODGED)`;
    }

    if (result.reason) {
      movesFileContent += ` - ${result.reason}`;
    }

    if (result.strength) {
      movesFileContent += ` [Strength: ${result.strength}]`;
    }

    movesFileContent += '\n';
  }

  // Add explicit dislodged unit markers for retreat phase detection
  if (Object.keys(dislodgedUnitsForOutput).length > 0) {
    movesFileContent += '\n## Dislodged Units\n\n';
    for (const [location, dislodgedInfo] of Object.entries(dislodgedUnitsForOutput)) {
      movesFileContent += `**${dislodgedInfo.country}**: ${dislodgedInfo.unitType} ${location} - DISLODGED\n`;
    }
  }

  fs.writeFileSync(path.join(currentTurnDir, 'moves-and-resolution.txt'), movesFileContent);

  // Calculate post-resolution unit positions
  // Start with pre-resolution positions to ensure all units are accounted for
  const postResolutionUnits: Record<string, { type: 'A' | 'F'; location: string }[]> = {};

  // Initialize with pre-resolution positions
  for (const [country, units] of Object.entries(actualPositions)) {
    postResolutionUnits[country] = units.map(unitStr => {
      const match = unitStr.match(/([AF])\s+(.+)/);
      if (match) {
        return { type: match[1] as 'A' | 'F', location: match[2].trim() };
      }
      return null;
    }).filter((u): u is { type: 'A' | 'F'; location: string } => u !== null);
  }

  // FIRST PASS: Remove dislodged units (units that lost their position to a successful attack)
  // We need to track which locations had successful attacks that dislodged defenders
  const dislodgedPositions: Record<string, { country: string; unitType: 'A' | 'F' }> = {};

  for (const result of results) {
    // If a move succeeded and the reason mentions "Dislodged defender" or "Can dislodge",
    // mark the destination as having a dislodged unit
    if (result.success && result.action === 'move' && result.to) {
      if (result.reason?.includes('Dislodged defender') || result.reason?.includes('Can dislodge destination unit')) {
        // Find what unit was at the destination
        for (const [country, units] of Object.entries(postResolutionUnits)) {
          const dislodgedUnitIndex = units.findIndex(u => u.location === result.to);
          if (dislodgedUnitIndex !== -1) {
            dislodgedPositions[result.to] = {
              country,
              unitType: units[dislodgedUnitIndex].type
            };
          }
        }
      }
    }
  }

  // Remove all dislodged units from the board
  for (const [location, dislodgedInfo] of Object.entries(dislodgedPositions)) {
    const units = postResolutionUnits[dislodgedInfo.country] || [];
    const unitIndex = units.findIndex(u => u.location === location);
    if (unitIndex !== -1) {
      units.splice(unitIndex, 1);
    }
  }

  // SECOND PASS: Update positions based on successful MOVES ONLY (not holds/supports)
  for (const result of results) {
    // Only process successful moves that actually changed location
    // Skip: failed moves, dislodged units, holds, and supports (they stay in place)
    if (!result.success || result.dislodged || !result.to || result.action !== 'move') {
      continue; // Unit stays where it was (already in postResolutionUnits from pre-resolution)
    }

    // Remove unit from old position
    const oldUnits = postResolutionUnits[result.country] || [];
    const unitIndex = oldUnits.findIndex(u =>
      u.type === result.unit.type && u.location === result.from
    );

    if (unitIndex !== -1) {
      oldUnits.splice(unitIndex, 1);
    }

    // Add unit to new position
    if (!postResolutionUnits[result.country]) {
      postResolutionUnits[result.country] = [];
    }
    postResolutionUnits[result.country].push({
      type: result.unit.type,
      location: result.to
    });
  }

  // ⚠️ CRITICAL: Recalculate SC ownership using POST-resolution unit positions!
  // We must use positions AFTER moves are resolved to correctly capture new SCs
  // while preserving ownership of vacated SCs (previousOwnership handles this)
  const finalScOwnership = calculateSupplyCenterOwnership(postResolutionUnits, allSupplyCenters, previousOwnership);

  // Draw post-resolution map
  const postResolutionMapPath = path.join(currentTurnDir, `${turnName}-post.png`);
  drawMapWithUnits(postResolutionMapPath, postResolutionUnits, undefined, finalScOwnership);

  console.log(`Map saved to: ${currentTurnDir}`);

  // Group SCs by owner
  const finalScsByCountry: Record<string, string[]> = {};
  for (const [sc, country] of Object.entries(finalScOwnership) as [string, string][]) {
    if (!finalScsByCountry[country]) {
      finalScsByCountry[country] = [];
    }
    finalScsByCountry[country].push(sc);
  }

  // Rewrite moves file with CORRECT SC ownership (using post-resolution positions)
  let correctedMovesContent = `# ${turnDisplayName} Moves and Resolution\n\n`;
  correctedMovesContent += `## Supply Center Ownership\n\n`;
  for (const [country, scs] of Object.entries(finalScsByCountry).sort((a, b) => b[1].length - a[1].length)) {
    correctedMovesContent += `${country}: ${scs.length} supply centers - [${scs.join(', ')}]\n`;
  }

  // Re-add submitted orders and resolution sections
  const originalContent = fs.readFileSync(path.join(currentTurnDir, 'moves-and-resolution.txt'), 'utf-8');
  const restOfFile = originalContent.match(/(## Submitted Orders[\s\S]*)/);
  if (restOfFile) {
    correctedMovesContent += '\n' + restOfFile[1];
  }

  // CRITICAL: Add Final Unit Positions section
  correctedMovesContent += '\n\n## Final Unit Positions\n\n';
  for (const [country, units] of Object.entries(postResolutionUnits)) {
    if (units && units.length > 0) {
      for (const unit of units) {
        correctedMovesContent += `**${country}**: ${unit.type} ${unit.location} - Final position\n`;
      }
    }
  }

  fs.writeFileSync(path.join(currentTurnDir, 'moves-and-resolution.txt'), correctedMovesContent);

  console.log(`${turnName} resolution saved to: ${currentTurnDir}`);
  console.log(`Post-resolution map saved to: ${postResolutionMapPath}`);

  // Update all context.md files with post-resolution board state
  const postResolutionPositions: Record<string, string[]> = {};
  for (const [country, units] of Object.entries(postResolutionUnits)) {
    postResolutionPositions[country] = units.map(u => `${u.type} ${u.location}`);
  }

  const scOwnership = getCurrentSCOwnership(postResolutionPositions, turnName);
  for (const countryDir of countryDirs) {
    // Skip eliminated countries
    if (countryDir === 'Russia' || countryDir === 'France') continue;
    const contextPath = path.join(currentTurnDir, countryDir, 'context.md');
    if (fs.existsSync(contextPath)) {
      updateContextWithBoardState(contextPath, postResolutionPositions, scOwnership);
    }
  }

  console.log('\nMove resolution complete!');
}

function copyDirRecursive(src: string, dest: string): void {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const files = fs.readdirSync(src);
  for (const file of files) {
    const srcFile = path.join(src, file);
    const destFile = path.join(dest, file);

    if (fs.statSync(srcFile).isDirectory()) {
      copyDirRecursive(srcFile, destFile);
    } else {
      fs.copyFileSync(srcFile, destFile);
    }
  }
}

async function reflectOnTurn(gameDir: string): Promise<void> {
  console.log('\n=== Post-Turn Reflection ===\n');

  const currentTurnDir = getLatestTurnDir(gameDir);
  const turnName = path.basename(currentTurnDir); // e.g., "spring-1901" or "fall-1901"
  const turnDisplayName = turnName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '); // e.g., "Spring 1901"
  const resolutionFile = path.join(currentTurnDir, 'moves-and-resolution.txt');

  if (!fs.existsSync(resolutionFile)) {
    console.log('No resolution file found, skipping reflection');
    return;
  }

  const resolutionText = fs.readFileSync(resolutionFile, 'utf-8');

  // Get actual unit positions from previous turn
  const previousTurnDir = getPreviousTurnDir(gameDir);
  let actualPositions: Record<string, string[]> = {};

  if (previousTurnDir) {
    const previousResolutionFile = path.join(previousTurnDir, 'moves-and-resolution.txt');
    actualPositions = parseUnitPositionsFromResolution(previousResolutionFile);
  } else {
    actualPositions = defaultStartingPositions;
  }

  // Build the positions structure for each model
  const startingPositions: Record<string, { country: string, units: string[] }> = {};
  for (const [model, country] of Object.entries(modelToCountry)) {
    startingPositions[model] = {
      country,
      units: actualPositions[country] || []
    };
  }

  const countryDirs = fs.readdirSync(currentTurnDir).filter(f => {
    const fullPath = path.join(currentTurnDir, f);
    return fs.statSync(fullPath).isDirectory();
  });

  // Process all countries in parallel (excluding eliminated Russia)
  await Promise.all(countryDirs.map(async (countryDir) => {
    // Skip eliminated countries
    if (countryDir === 'Russia' || countryDir === 'France') return;

    const contextPath = path.join(currentTurnDir, countryDir, 'context.md');
    const thoughtsPath = path.join(currentTurnDir, countryDir, 'thoughts.md');

    if (!fs.existsSync(contextPath)) return;

    const content = fs.readFileSync(contextPath, 'utf-8');
    const modelMatch = content.match(/^# (.+)$/m);
    if (!modelMatch) return;

    const model = modelMatch[1];
    const posInfo = startingPositions[model];
    if (!posInfo) return;

    const country = posInfo.country;

    const reflectionPrompt = `You are ${country} in Diplomacy. ${turnDisplayName} has just been resolved.

YOUR COMPLETE CONTEXT FROM THIS TURN:
${content}

${turnDisplayName.toUpperCase()} RESOLUTION (ALL COUNTRIES' MOVES):
${resolutionText}

Based on the resolution, reflect DEEPLY on what happened this turn and plan ahead. This is your private strategic analysis.

Create a comprehensive strategic document with the following sections:

## Board State Evolution Analysis
**CRITICAL: Analyze how the map changed this turn for ALL countries (not just you).**

Study the "Current Board State" section above carefully. Compare it to where units were before:

1. **Territory Changes Across the Map:**
   - Which countries GAINED new territories? (List specific territories and who took them)
   - Which countries LOST territories? (List what they lost and who took it)
   - Were there any contested territories with failed attacks?

2. **Strategic Implications of Map Changes:**
   - Who is expanding and in which direction?
   - Who is weakening or being squeezed?
   - Are there emerging conflicts between other countries? (e.g., Russia vs Austria-Hungary)
   - Which neutral supply centers were claimed?

3. **Power Shift Analysis:**
   - Who got stronger this turn? (gained territory, secured positions)
   - Who got weaker? (lost territory, units dislodged)
   - How does this affect the balance of power in your region?

## YOUR Position Analysis
Look at the "YOUR Supply Centers - Threat Analysis" section above:

1. **What changed for YOUR country:**
   - Territories you GAINED (if any)
   - Territories you LOST (if any)
   - Territories you DEFENDED successfully
   - Supply centers now THREATENED or OCCUPIED

2. **Your Current Strategic Position:**
   - Are you stronger or weaker than before?
   - Which of your borders are secure? Which are vulnerable?
   - Do you have defensive depth or are you exposed?

## CRITICAL: Attacks and Threats Analysis
**CAREFULLY ANALYZE THE RESOLUTION ABOVE.** Did any country move units into YOUR territories or attack YOUR supply centers?

- List each territory YOU LOST or were attacked in
- Identify which country attacked each territory
- For EACH attack, state whether it was discussed in negotiations or if it was a surprise/betrayal
- Rate the severity: Minor skirmish, Major attack, or Existential threat

Check "YOUR Supply Centers - Threat Analysis" above - any supply centers marked as "OCCUPIED BY ENEMY" or "THREATENED"?

IMPORTANT: If you lost a supply center or home territory, this is a MAJOR BETRAYAL if they promised friendship!

## Strategic Opportunities Analysis
Based on the new board state, what NEW opportunities emerged?

1. **Offensive Opportunities:**
   - Weak positions you can exploit (enemy territory with no unit, or weak defense)
   - Supply centers now within your reach
   - Vulnerable enemy units you can attack or cut support

2. **Diplomatic Opportunities:**
   - Countries that just fought each other (potential allies against them)
   - Countries being attacked by third parties (offer help for alliance)
   - Neutral powers you could court

3. **Defensive Opportunities:**
   - Better defensive positions you can occupy
   - Alliances you can form to counter threats

## Trust Assessment
For EACH country (skip your own), rate your trust level (1-10) based on their ACTIONS, not just words:

- **England**: [rating] - Did they attack you? Did they keep promises? Are they a threat?
- **France**: [rating] - Did they attack you? Did they keep promises? Are they a threat?
- **Germany**: [rating] - Did they attack you? Did they keep promises? Are they a threat?
- **Italy**: [rating] - Did they attack you? Did they keep promises? Are they a threat?
- **Turkey**: [rating] - Did they attack you? Did they keep promises? Are they a threat?
- **Austria-Hungary**: [rating] - Did they attack you? Did they keep promises? Are they a threat?

NOTE: Russia has been eliminated from the game (0 supply centers, 0 units)

CRITICAL TRUST RULES:
- If a country ATTACKED your territories this turn: Trust rating should be 1-3 (enemy)
- If a country TOOK your supply center: Trust rating should be 1-2 (active enemy)
- If they promised peace but attacked: Trust rating should be 1 (betrayal)
- Only give high trust (7-10) to countries actively helping you or staying out of your way

## Betrayals and Broken Promises
List any countries that broke promises, attacked despite agreements, or backstabbed you this turn.

## Threats to Monitor
Based on board state changes, list specific threats you need to watch:
- Enemy units positioned to attack you next turn
- Enemies building up forces on your borders
- Alliances forming against you

## Short-Term Goals (Next 1-2 Turns)
What are your immediate tactical objectives? Be specific:
- Territories to capture or reclaim
- Defensive positions to secure
- Enemy units to block or attack
- Alliances to form or break

## Long-Term Strategy (Next 5+ Turns)
What is your overall strategic vision for winning this game?
- Your path to 18 supply centers
- Which regions to dominate
- Who are your potential allies and rivals?
- Your endgame plan

## Key Events to Remember
List important events, promises made/broken, patterns you've noticed, and critical board state changes to remember.

Provide your detailed reflection:`;

    const reflection = await queryLLMByModel(model, reflectionPrompt);

    // Create or update thoughts.md file
    const thoughtsContent = `# ${country} - Strategic Thoughts

## ${turnDisplayName} Reflection

${reflection.response}

---
`;

    fs.writeFileSync(thoughtsPath, thoughtsContent);

    // Log after reflection is written
    console.log(`${country}: Reflecting on ${turnDisplayName}...`);
  }));

  console.log('\n=== All Reflections Complete ===\n');
}

async function processRetreatPhase(gameDir: string, currentTurnDirParam?: string): Promise<void> {
  console.log('\n=== Processing Retreat Phase ===\n');

  const { parseRetreatOrder, resolveRetreats, adjacencies } = require('./move-resolution');
  const { drawMapWithUnits } = require('./draw-map');
  type Unit = { type: 'A' | 'F'; location: string; coast?: string };
  type DislodgedUnit = { country: string; unit: Unit; from: string };

  const currentTurnDir = currentTurnDirParam || getLatestTurnDir(gameDir);
  const turnName = path.basename(currentTurnDir);
  const turnDisplayName = turnName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  // Get previous turn's resolution to find dislodged units
  const previousTurnDir = getPreviousTurnDir(gameDir);
  if (!previousTurnDir) {
    console.error('Could not find previous turn directory');
    return;
  }
  const previousResolutionFile = path.join(previousTurnDir, 'moves-and-resolution.txt');

  // Parse dislodged units from previous resolution
  type DislodgedUnitExtended = DislodgedUnit & { attackerOrigin?: string };
  const dislodgedUnits: DislodgedUnitExtended[] = [];
  if (fs.existsSync(previousResolutionFile)) {
    const resolutionText = fs.readFileSync(previousResolutionFile, 'utf-8');
    const lines = resolutionText.split('\n');

    // First, find all successful moves
    const successfulMoves: Record<string, string> = {}; // destination -> origin
    for (const line of lines) {
      // Match successful moves: "Country: Unit from to Location - SUCCESS"
      const moveMatch = line.match(/^(.+?):\s+[AF]\s+(.+?)\s+to\s+(.+?)\s+-\s+.*(SUCCESS|Dislodged defender)/i);
      if (moveMatch) {
        const origin = moveMatch[2].trim();
        const destination = moveMatch[3].trim();
        successfulMoves[destination] = origin;
      }
    }

    // Then find dislodged units ONLY from the "## Dislodged Units" section
    const dislodgedSection = resolutionText.split('## Dislodged Units')[1];
    if (dislodgedSection) {
      const dislodgedLines = dislodgedSection.split('\n');
      for (const line of dislodgedLines) {
        // Look for "- DISLODGED" markers (not the inline DISLODGED in resolution)
        const match = line.match(/^\*\*(.+?)\*\*:\s+([AF])\s+(.+?)\s+-\s+DISLODGED/);
        if (match) {
          const [, country, type, location] = match;
          const attackerOrigin = successfulMoves[location.trim()];
          dislodgedUnits.push({
            country: country.trim(),
            unit: { type: type as 'A' | 'F', location: location.trim() },
            from: location.trim(),
            attackerOrigin
          });
        }
      }
    }
  }

  if (dislodgedUnits.length === 0) {
    console.log('No dislodged units - skipping retreat phase');

    // Get unit positions from previous turn and write them as the final state
    const unitPositions = parseUnitPositionsFromResolution(previousResolutionFile);

    // Calculate supply center ownership
    const { calculateSupplyCenterOwnership } = require('./move-resolution');
    const allSupplyCenters = [
      'London', 'Edinburgh', 'Liverpool', 'Paris', 'Marseilles', 'Brest',
      'Berlin', 'Munich', 'Kiel', 'Rome', 'Venice', 'Naples',
      'Vienna', 'Budapest', 'Trieste', 'St Petersburg', 'Moscow', 'Warsaw', 'Sevastopol',
      'Constantinople', 'Smyrna', 'Ankara',
      'Norway', 'Sweden', 'Denmark', 'Holland', 'Belgium', 'Spain', 'Portugal',
      'Tunis', 'Serbia', 'Rumania', 'Bulgaria', 'Greece'
    ];

    // Get previous SC ownership from previous turn's moves-and-resolution.txt
    let previousOwnership = { ...initialSupplyCenterOwnership };
    if (fs.existsSync(previousResolutionFile)) {
      const prevContent = fs.readFileSync(previousResolutionFile, 'utf-8');
      const scSection = prevContent.match(/## Supply Center Ownership\n\n([\s\S]*?)(?=\n## |$)/);
      if (scSection) {
        const lines = scSection[1].split('\n');
        for (const line of lines) {
          const match = line.match(/(.+?):\s+\d+\s+supply centers\s+-\s+\[(.+)\]/);
          if (match) {
            const country = match[1].trim();
            const scs = match[2].split(',').map(s => s.trim());
            for (const sc of scs) {
              previousOwnership[sc] = country;
            }
          }
        }
      }
    }

    // Convert unit positions to proper format
    const unitPositionsFormatted: Record<string, { type: 'A' | 'F'; location: string }[]> = {};
    for (const [country, units] of Object.entries(unitPositions)) {
      unitPositionsFormatted[country] = units.map(unitStr => {
        const match = unitStr.match(/([AF])\s+(.+)/);
        if (match) {
          return { type: match[1] as 'A' | 'F', location: match[2].trim() };
        }
        return { type: 'A' as 'A' | 'F', location: '' };
      }).filter(u => u.location !== '');
    }

    const currentScOwnership = calculateSupplyCenterOwnership(unitPositionsFormatted, allSupplyCenters, previousOwnership);

    // Group SCs by owner
    const scsByCountry: Record<string, string[]> = {};
    for (const [sc, country] of Object.entries(currentScOwnership) as [string, string][]) {
      if (!scsByCountry[country]) {
        scsByCountry[country] = [];
      }
      scsByCountry[country].push(sc);
    }

    // Write moves-and-resolution.txt with final positions (unchanged from previous turn)
    let resolutionContent = `# ${turnDisplayName} - No Retreats Needed\n\n`;

    // Add supply center ownership section
    resolutionContent += `## Supply Center Ownership\n\n`;
    for (const [country, scs] of Object.entries(scsByCountry).sort((a, b) => b[1].length - a[1].length)) {
      resolutionContent += `${country}: ${scs.length} supply centers - [${scs.join(', ')}]\n`;
    }

    resolutionContent += `\n---\n\n`;
    resolutionContent += `No units were dislodged in the previous turn. All units remain in their positions.\n\n`;
    resolutionContent += `## Final Unit Positions\n\n`;

    for (const [country, units] of Object.entries(unitPositions)) {
      if (units && units.length > 0) {
        for (const unit of units) {
          resolutionContent += `**${country}**: ${unit} - Unchanged\n`;
        }
      }
    }

    fs.writeFileSync(path.join(currentTurnDir, 'moves-and-resolution.txt'), resolutionContent);
    return;
  }

  // Get current unit positions (before retreats)
  const unitPositions = parseUnitPositionsFromResolution(previousResolutionFile);

  // Draw pre-retreat map
  const preRetreatMapPath = path.join(currentTurnDir, `${turnName}-pre.png`);
  drawMapWithUnits(preRetreatMapPath, unitPositions);

  // Get occupied territories (from units that weren't dislodged) - calculate BEFORE decideRetreats
  const occupiedTerritories = new Set<string>();
  for (const [country, units] of Object.entries(unitPositions)) {
    for (const unitStr of units) {
      const match = unitStr.match(/([AF])\s+(.+)/);
      if (match) {
        const location = match[2].trim();
        // Only add to occupied if this unit wasn't dislodged
        const isDislodged = dislodgedUnits.some(d => d.country === country && d.from === location);
        if (!isDislodged) {
          occupiedTerritories.add(location);
        }
      }
    }
  }

  // Get AI decisions for retreats (with valid retreat squares calculated)
  await decideRetreats(gameDir, dislodgedUnits, currentTurnDir, occupiedTerritories);

  // Parse retreat orders ONLY from countries with dislodged units
  const countriesWithDislodgedUnits = new Set(dislodgedUnits.map(d => d.country));
  const countryDirs = fs.readdirSync(currentTurnDir).filter(f => {
    const fullPath = path.join(currentTurnDir, f);
    return fs.statSync(fullPath).isDirectory() && countriesWithDislodgedUnits.has(f);
  });

  const retreatOrders: any[] = [];
  for (const countryDir of countryDirs) {
    // Skip eliminated countries
    if (countryDir === 'Russia' || countryDir === 'France') continue;
    const contextPath = path.join(currentTurnDir, countryDir, 'context.md');
    if (!fs.existsSync(contextPath)) continue;

    // Only parse retreat orders from the LAST section (after "# ... - RETREAT PHASE")
    const contextContent = fs.readFileSync(contextPath, 'utf-8');
    const retreatSection = contextContent.split(/# .+ - RETREAT PHASE/).pop();
    if (!retreatSection) continue;

    const orderMatches = retreatSection.match(/\[([^\]]+)\]/g);

    if (orderMatches) {
      for (const orderText of orderMatches) {
        const cleaned = orderText.slice(1, -1);
        const order = parseRetreatOrder(cleaned, countryDir);
        if (order) {
          retreatOrders.push(order);
        }
      }
    }
  }

  // Resolve retreats
  const results = resolveRetreats(retreatOrders, occupiedTerritories);

  // Update unit positions based on retreat results
  const postRetreatUnits: Record<string, string[]> = {};

  // Start with units that weren't dislodged
  for (const [country, units] of Object.entries(unitPositions)) {
    postRetreatUnits[country] = units.filter(unitStr => {
      const match = unitStr.match(/([AF])\s+(.+)/);
      if (!match) return false;
      const location = match[2].trim();
      return !dislodgedUnits.some(d => d.country === country && d.from === location);
    });
  }

  // Add successfully retreated units
  for (const result of results) {
    if (result.success && result.to && !result.disbanded) {
      if (!postRetreatUnits[result.country]) {
        postRetreatUnits[result.country] = [];
      }
      postRetreatUnits[result.country].push(`${result.unit.type} ${result.to}`);
    }
  }

  // Write retreat resolution file
  let retreatContent = `# ${turnDisplayName} - Retreat Resolution\n\n`;
  for (const result of results) {
    const status = result.success ? (result.disbanded ? 'DISBANDED' : 'RETREATED') : 'FAILED (DISBANDED)';
    retreatContent += `${result.country}: ${result.unit.type} ${result.from} -> ${result.to || 'DISBAND'} - ${status}\n`;
    if (result.reason) {
      retreatContent += `  Reason: ${result.reason}\n`;
    }
  }

  fs.writeFileSync(path.join(currentTurnDir, 'retreats.txt'), retreatContent);

  // Also write moves-and-resolution.txt with final positions for Winter phase to parse
  const { calculateSupplyCenterOwnership } = require('./move-resolution');
  const allSupplyCenters = [
    'London', 'Edinburgh', 'Liverpool', 'Paris', 'Marseilles', 'Brest',
    'Berlin', 'Munich', 'Kiel', 'Rome', 'Venice', 'Naples',
    'Vienna', 'Budapest', 'Trieste', 'St Petersburg', 'Moscow', 'Warsaw', 'Sevastopol',
    'Constantinople', 'Smyrna', 'Ankara',
    'Norway', 'Sweden', 'Denmark', 'Holland', 'Belgium', 'Spain', 'Portugal',
    'Tunis', 'Serbia', 'Rumania', 'Bulgaria', 'Greece'
  ];

  // Get previous SC ownership from previous turn
  let previousOwnership = { ...initialSupplyCenterOwnership };
  if (fs.existsSync(previousResolutionFile)) {
    const prevContent = fs.readFileSync(previousResolutionFile, 'utf-8');
    const scSection = prevContent.match(/## Supply Center Ownership\n\n([\s\S]*?)(?=\n## |$)/);
    if (scSection) {
      const lines = scSection[1].split('\n');
      for (const line of lines) {
        const match = line.match(/(.+?):\s+\d+\s+supply centers\s+-\s+\[(.+)\]/);
        if (match) {
          const country = match[1].trim();
          const scs = match[2].split(',').map(s => s.trim());
          for (const sc of scs) {
            previousOwnership[sc] = country;
          }
        }
      }
    }
  }

  // Convert unit positions to proper format for SC calculation
  const unitPositionsFormatted: Record<string, { type: 'A' | 'F'; location: string }[]> = {};
  for (const [country, units] of Object.entries(postRetreatUnits)) {
    unitPositionsFormatted[country] = units.map(unitStr => {
      const match = unitStr.match(/([AF])\s+(.+)/);
      if (match) {
        return { type: match[1] as 'A' | 'F', location: match[2].trim() };
      }
      return { type: 'A' as 'A' | 'F', location: '' };
    }).filter(u => u.location !== '');
  }

  const currentScOwnership = calculateSupplyCenterOwnership(unitPositionsFormatted, allSupplyCenters, previousOwnership);

  // Group SCs by owner
  const scsByCountry: Record<string, string[]> = {};
  for (const [sc, country] of Object.entries(currentScOwnership) as [string, string][]) {
    if (!scsByCountry[country]) {
      scsByCountry[country] = [];
    }
    scsByCountry[country].push(sc);
  }

  // Write moves-and-resolution.txt
  let fullResolutionContent = `# ${turnDisplayName}\n\n`;
  fullResolutionContent += `## Supply Center Ownership\n\n`;
  for (const [country, scs] of Object.entries(scsByCountry).sort((a, b) => b[1].length - a[1].length)) {
    fullResolutionContent += `${country}: ${scs.length} supply centers - [${scs.join(', ')}]\n`;
  }

  fullResolutionContent += `\n## Retreat Resolution\n\n`;
  for (const result of results) {
    const status = result.success ? (result.disbanded ? 'DISBANDED' : 'RETREATED') : 'FAILED (DISBANDED)';
    fullResolutionContent += `**${result.country}**: ${result.unit.type} ${result.from} -> ${result.to || 'DISBAND'} - ${status}`;
    if (result.reason) {
      fullResolutionContent += ` - ${result.reason}`;
    }
    fullResolutionContent += `\n`;
  }

  fullResolutionContent += `\n## Final Unit Positions\n\n`;
  for (const [country, units] of Object.entries(postRetreatUnits)) {
    if (units && units.length > 0) {
      for (const unit of units) {
        fullResolutionContent += `**${country}**: ${unit} - Final position\n`;
      }
    }
  }

  fs.writeFileSync(path.join(currentTurnDir, 'moves-and-resolution.txt'), fullResolutionContent);

  // Draw post-retreat map
  const postRetreatMapPath = path.join(currentTurnDir, `${turnName}-post.png`);
  drawMapWithUnits(postRetreatMapPath, postRetreatUnits);

  // Update all context files with retreat results
  const scOwnership = getCurrentSCOwnership(postRetreatUnits, turnName);
  for (const countryDir of countryDirs) {
    // Skip eliminated countries
    if (countryDir === 'Russia' || countryDir === 'France') continue;
    const contextPath = path.join(currentTurnDir, countryDir, 'context.md');
    if (fs.existsSync(contextPath)) {
      updateContextWithBoardState(contextPath, postRetreatUnits, scOwnership);
    }
  }

  console.log('\n=== Retreat Phase Complete ===\n');
}

async function decideRetreats(gameDir: string, dislodgedUnits: any[], currentTurnDirParam?: string, occupiedTerritories?: Set<string>): Promise<void> {
  const { adjacencies, parseRetreatOrder } = require('./move-resolution');

  const currentTurnDir = currentTurnDirParam || getLatestTurnDir(gameDir);
  const turnName = path.basename(currentTurnDir);
  const turnDisplayName = turnName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  // Group dislodged units by country
  const dislodgedByCountry: Record<string, any[]> = {};
  for (const dislodged of dislodgedUnits) {
    if (!dislodgedByCountry[dislodged.country]) {
      dislodgedByCountry[dislodged.country] = [];
    }
    dislodgedByCountry[dislodged.country].push(dislodged);
  }

  // Get country-to-model mapping
  const countryToModel: Record<string, string> = {};
  for (const [model, country] of Object.entries(modelToCountry)) {
    countryToModel[country] = model;
  }

  // Process all countries in parallel
  await Promise.all(Object.entries(dislodgedByCountry).map(async ([country, units]) => {
    const model = countryToModel[country];
    if (!model) return;

    const contextPath = path.join(currentTurnDir, country, 'context.md');
    const fullPath = path.join(currentTurnDir, country, 'full-dialogue.md');

    // Build retreat prompt
    let retreatInfo = `# ${turnDisplayName} - RETREAT PHASE\n\n`;
    retreatInfo += `The following units were DISLODGED and must retreat:\n\n`;

    // Calculate valid retreat squares for each unit
    const { waterSpaces } = require('./move-resolution');
    const unitValidRetreats: Record<string, string[]> = {};
    for (const dislodged of units) {
      const adjacentTerritories = adjacencies[dislodged.from] || [];

      // Calculate VALID retreat squares (excluding attacker origin, occupied territories, and invalid unit type moves)
      const validRetreatSquares = adjacentTerritories.filter((territory: string) => {
        // Cannot retreat to where attacker came from
        if (dislodged.attackerOrigin && territory === dislodged.attackerOrigin) {
          return false;
        }
        // Cannot retreat to occupied territory
        if (occupiedTerritories && occupiedTerritories.has(territory)) {
          return false;
        }
        // CRITICAL: Armies cannot retreat to water spaces
        if (dislodged.unit.type === 'A' && waterSpaces.has(territory)) {
          return false;
        }
        return true;
      });

      const unitKey = `${dislodged.unit.type} ${dislodged.from}`;
      unitValidRetreats[unitKey] = validRetreatSquares;

      retreatInfo += `**${unitKey}**\n`;
      if (dislodged.attackerOrigin) {
        retreatInfo += `  Dislodged by unit from ${dislodged.attackerOrigin}\n`;
      }
      retreatInfo += `  Adjacent territories: ${adjacentTerritories.join(', ')}\n`;
      if (validRetreatSquares.length > 0) {
        retreatInfo += `  ✓ VALID retreat squares: ${validRetreatSquares.join(', ')}\n`;
        retreatInfo += `  ⚠️ CRITICAL: You MUST retreat to one of the valid squares above. Disband is NOT allowed when valid retreats exist.\n\n`;
      } else {
        retreatInfo += `  ✗ VALID retreat squares: NONE - unit must be disbanded\n`;
        retreatInfo += `  ⚠️ CRITICAL: No valid retreat squares available. Unit MUST be disbanded.\n\n`;
      }
    }

    const retreatPrompt = `${retreatInfo}
Decide retreat orders for your dislodged units. Provide exactly ${units.length} orders in [brackets].

Format:
- To retreat: [${units[0].unit.type} ${units[0].from} -> TerritoryName]
- To disband: [${units[0].unit.type} ${units[0].from} DISBAND]

IMPORTANT RULES:
- You can ONLY retreat to valid retreat squares listed above
- You CANNOT retreat to where the attacker came from
- You CANNOT retreat to occupied territories
- You can ONLY disband if there are NO valid retreat squares

Your retreat orders:`;

    // Retry logic: Try up to 3 times to get valid retreat orders
    let decision = await queryLLMByModel(model, retreatPrompt);
    let attemptCount = 1;
    let validOrdersFound = false;

    while (attemptCount <= 3 && !validOrdersFound) {
      // Parse the retreat orders
      const orderMatches = decision.response?.match(/\[([^\]]+)\]/g);
      if (orderMatches) {
        validOrdersFound = true;
        for (const orderText of orderMatches) {
          const cleaned = orderText.slice(1, -1);
          const order = parseRetreatOrder(cleaned, country);

          if (order) {
            const unitKey = `${order.unit.type} ${order.from}`;
            const validSquares = unitValidRetreats[unitKey] || [];

            // Check if this is a valid retreat
            if (order.to) {
              // Retreat to a square
              if (!validSquares.includes(order.to)) {
                validOrdersFound = false;
                break;
              }
            } else {
              // Disband - only valid if no valid retreat squares
              if (validSquares.length > 0) {
                validOrdersFound = false;
                break;
              }
            }
          } else {
            validOrdersFound = false;
            break;
          }
        }
      } else {
        validOrdersFound = false;
      }

      if (!validOrdersFound && attemptCount < 3) {
        attemptCount++;
        console.warn(`⚠️  WARNING: ${country} retreat orders invalid, retry ${attemptCount}/3...`);
        const retryPrompt = `${retreatPrompt}

⚠️ CRITICAL: Your previous retreat orders were INVALID. Please carefully review the valid retreat squares and submit correct orders.`;
        decision = await queryLLMByModel(model, retryPrompt);
      } else {
        break;
      }
    }

    // If still no valid orders after 3 attempts, generate fallback orders
    if (!validOrdersFound) {
      console.warn(`⚠️  WARNING: ${country} failed to provide valid retreat orders after 3 attempts. Using automatic fallback.`);
      let fallbackOrders = '';
      for (const dislodged of units) {
        const unitKey = `${dislodged.unit.type} ${dislodged.from}`;
        const validSquares = unitValidRetreats[unitKey] || [];

        if (validSquares.length > 0) {
          // Auto-retreat to first valid square
          fallbackOrders += `[${unitKey} -> ${validSquares[0]}]\n`;
          console.log(`  Auto-retreating ${country} ${unitKey} to ${validSquares[0]}`);
        } else {
          // Auto-disband
          fallbackOrders += `[${unitKey} DISBAND]\n`;
          console.log(`  Auto-disbanding ${country} ${unitKey} (no valid retreats)`);
        }
      }
      decision.response = fallbackOrders;
    }

    const retreatLog = `${retreatInfo}\n**Your Retreat Orders:**\n\n${decision.response}\n`;

    fs.appendFileSync(contextPath, retreatLog);
    fs.appendFileSync(fullPath, retreatLog);
  }));
}

async function processWinterPhase(gameDir: string, currentTurnDirParam?: string): Promise<void> {
  console.log('\n=== Processing Winter Phase ===\n');

  const { calculateSupplyCenterOwnership, calculateBuildsDisbands, parseBuildDisbandOrder, validateBuildOrder, waterSpaces } = require('./move-resolution');
  const { drawMapWithUnits } = require('./draw-map');
  type Unit = { type: 'A' | 'F'; location: string; coast?: string };

  const currentTurnDir = currentTurnDirParam || getLatestTurnDir(gameDir);
  const turnName = path.basename(currentTurnDir);
  const turnDisplayName = turnName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  // Get unit positions from previous turn
  const previousTurnDir = getPreviousTurnDir(gameDir);
  if (!previousTurnDir) {
    console.error('Could not find previous turn directory');
    return;
  }
  // Use moves-and-resolution.txt for SC ownership (it has the complete info including SC ownership)
  // Fall back to retreats.txt only if moves-and-resolution.txt doesn't exist
  const movesAndResolutionFile = path.join(previousTurnDir, 'moves-and-resolution.txt');
  const retreatsFile = path.join(previousTurnDir, 'retreats.txt');
  const resolutionFile = fs.existsSync(movesAndResolutionFile) ? movesAndResolutionFile : retreatsFile;
  const unitPositions = parseUnitPositionsFromResolution(resolutionFile);

  // Draw pre-winter map
  const preWinterMapPath = path.join(currentTurnDir, `${turnName}-pre.png`);
  drawMapWithUnits(preWinterMapPath, unitPositions);

  // Calculate supply center ownership
  const allSupplyCenters = [
    'London', 'Edinburgh', 'Liverpool', 'Paris', 'Marseilles', 'Brest',
    'Berlin', 'Munich', 'Kiel', 'Rome', 'Venice', 'Naples',
    'Vienna', 'Budapest', 'Trieste', 'St Petersburg', 'Moscow', 'Warsaw', 'Sevastopol',
    'Constantinople', 'Smyrna', 'Ankara',
    'Norway', 'Sweden', 'Denmark', 'Holland', 'Belgium', 'Spain', 'Portugal',
    'Tunis', 'Serbia', 'Rumania', 'Bulgaria', 'Greece'
  ];

  // Read SC ownership DIRECTLY from Fall retreat resolution file
  // Supply centers are only captured in Fall, so we use the SC ownership from the Fall retreat phase AS IS
  const scCounts: Record<string, number> = {};
  const scOwnership: Record<string, string> = {};

  if (fs.existsSync(resolutionFile)) {
    const resolutionContent = fs.readFileSync(resolutionFile, 'utf-8');
    const scSection = resolutionContent.match(/## Supply Center Ownership\n\n([\s\S]*?)(?=\n## |$)/);
    if (scSection) {
      const lines = scSection[1].split('\n');
      for (const line of lines) {
        const match = line.match(/(.+?):\s+(\d+)\s+supply centers\s+-\s+\[(.+)\]/);
        if (match) {
          const country = match[1].trim();
          const count = parseInt(match[2]);
          const scs = match[3].split(',').map(s => s.trim());

          scCounts[country] = count;
          for (const sc of scs) {
            scOwnership[sc] = country;
          }
        }
      }
    }
  }

  // If we didn't find SC ownership in the file, calculate it (fallback)
  if (Object.keys(scOwnership).length === 0) {
    console.warn('⚠️  WARNING: Could not read SC ownership from resolution file, calculating from unit positions...');

    // Convert unit positions from string[] format to Unit[] format for SC ownership calculation
    const unitPositionsFormatted: Record<string, { type: 'A' | 'F'; location: string }[]> = {};
    for (const [country, units] of Object.entries(unitPositions)) {
      unitPositionsFormatted[country] = units.map(unitStr => {
        const match = unitStr.match(/([AF])\s+(.+)/);
        if (match) {
          return { type: match[1] as 'A' | 'F', location: match[2].trim() };
        }
        return { type: 'A' as 'A' | 'F', location: '' };
      }).filter(u => u.location !== '');
    }

    const calculatedScOwnership = calculateSupplyCenterOwnership(unitPositionsFormatted, allSupplyCenters, initialSupplyCenterOwnership);

    // Count SCs per country from calculated ownership
    for (const [sc, country] of Object.entries(calculatedScOwnership) as [string, string][]) {
      scCounts[country] = (scCounts[country] || 0) + 1;
      scOwnership[sc] = country;
    }
  }

  // Count units per country
  const unitCounts: Record<string, number> = {};
  for (const [country, units] of Object.entries(unitPositions)) {
    unitCounts[country] = units.length;
  }

  // Convert unit positions from string[] format to Unit[] format for decideBuildsDisbands
  const unitPositionsFormatted: Record<string, { type: 'A' | 'F'; location: string }[]> = {};
  for (const [country, units] of Object.entries(unitPositions)) {
    unitPositionsFormatted[country] = units.map(unitStr => {
      const match = unitStr.match(/([AF])\s+(.+)/);
      if (match) {
        return { type: match[1] as 'A' | 'F', location: match[2].trim() };
      }
      return { type: 'A' as 'A' | 'F', location: '' };
    }).filter(u => u.location !== '');
  }

  // Calculate builds/disbands needed
  const buildsDisbands = calculateBuildsDisbands(scCounts, unitCounts);

  // Get AI decisions for builds/disbands
  await decideBuildsDisbands(gameDir, buildsDisbands, unitPositionsFormatted, scCounts, currentTurnDir);

  // Parse build/disband orders from country decision files
  const countryDirs = fs.readdirSync(currentTurnDir).filter(f => {
    const fullPath = path.join(currentTurnDir, f);
    return fs.statSync(fullPath).isDirectory();
  });

  const buildOrders: any[] = [];
  const disbandOrders: any[] = [];

  for (const countryDir of countryDirs) {
    // Skip eliminated countries
    if (countryDir === 'Russia' || countryDir === 'France') continue;
    const contextPath = path.join(currentTurnDir, countryDir, 'context.md');
    if (!fs.existsSync(contextPath)) continue;

    const contextContent = fs.readFileSync(contextPath, 'utf-8');
    const orderMatches = contextContent.match(/\[([^\]]+)\]/g);

    if (orderMatches) {
      for (const orderText of orderMatches) {
        const cleaned = orderText.slice(1, -1);
        const order = parseBuildDisbandOrder(cleaned, countryDir);
        if (order) {
          if ('type' in order) {
            buildOrders.push(order);
          } else {
            disbandOrders.push(order);
          }
        }
      }
    }
  }

  // Process builds and disbands
  const results: any[] = [];
  const postWinterUnits: Record<string, string[]> = {};

  // Copy existing units
  for (const [country, units] of Object.entries(unitPositions)) {
    postWinterUnits[country] = [...units];
  }

  // Process disbands first
  for (const order of disbandOrders) {
    const units = postWinterUnits[order.country] || [];
    const unitStr = `${order.unit.type} ${order.location}`;
    const index = units.indexOf(unitStr);

    if (index !== -1) {
      units.splice(index, 1);
      results.push({
        country: order.country,
        location: order.location,
        action: 'disband',
        success: true
      });
    } else {
      results.push({
        country: order.country,
        location: order.location,
        action: 'disband',
        success: false,
        reason: 'Unit not found'
      });
    }
  }

  // Process builds - track per country to enforce limits
  const buildsPerCountry: Record<string, number> = {};

  for (const order of buildOrders) {
    // Check if this country is allowed to build
    const allowedBuilds = buildsDisbands[order.country]?.builds || 0;

    if (allowedBuilds === 0) {
      results.push({
        country: order.country,
        type: order.type,
        location: order.location,
        action: 'build',
        success: false,
        reason: 'Country has no builds available (units >= supply centers)'
      });
      console.warn(`⚠️  ${order.country} attempted to build but has no builds available`);
      continue;
    }

    // Check if country has already built their limit
    const currentBuilds = buildsPerCountry[order.country] || 0;
    if (currentBuilds >= allowedBuilds) {
      results.push({
        country: order.country,
        type: order.type,
        location: order.location,
        action: 'build',
        success: false,
        reason: `Build limit exceeded (${allowedBuilds} build(s) allowed, already built ${currentBuilds})`
      });
      console.warn(`⚠️  ${order.country} exceeded build limit: ${currentBuilds}/${allowedBuilds}`);
      continue;
    }

    const homeSCs = homeSupplyCenters[order.country] || [];
    const currentUnitsStr = postWinterUnits[order.country] || [];
    const currentUnits = currentUnitsStr.map(unitStr => {
      const match = unitStr.match(/([AF])\s+(.+)/);
      if (match) {
        return { type: match[1] as 'A' | 'F', location: match[2].trim() };
      }
      return { type: 'A' as 'A' | 'F', location: '' };
    }).filter(u => u.location !== '');

    const validation = validateBuildOrder(order, homeSCs, currentUnits, waterSpaces);

    if (validation.valid) {
      if (!postWinterUnits[order.country]) {
        postWinterUnits[order.country] = [];
      }
      const unitStr = order.coast ? `${order.type} ${order.location} (${order.coast})` : `${order.type} ${order.location}`;
      postWinterUnits[order.country].push(unitStr);
      buildsPerCountry[order.country] = (buildsPerCountry[order.country] || 0) + 1;
      results.push({
        country: order.country,
        type: order.type,
        location: order.location,
        action: 'build',
        success: true
      });
    } else {
      results.push({
        country: order.country,
        type: order.type,
        location: order.location,
        action: 'build',
        success: false,
        reason: validation.reason
      });
    }
  }

  // Check if countries built to their maximum capacity
  for (const [country, adjustments] of Object.entries(buildsDisbands) as [string, { builds: number; disbands: number }][]) {
    if (adjustments.builds > 0) {
      const actualBuilds = buildsPerCountry[country] || 0;
      if (actualBuilds < adjustments.builds) {
        console.warn(`⚠️  ${country} could build ${adjustments.builds} but only built ${actualBuilds} units`);
      }
    }
  }

  // ENFORCE MANDATORY DISBANDS: If any country still has more units than SCs, auto-disband
  for (const [country, units] of Object.entries(postWinterUnits)) {
    const scCount = scCounts[country] || 0;
    const unitCount = units.length;

    if (unitCount > scCount) {
      const excessUnits = unitCount - scCount;
      console.error(`❌ ENFORCING MANDATORY DISBAND: ${country} has ${unitCount} units but only ${scCount} SCs. Auto-disbanding ${excessUnits} unit(s).`);

      // Auto-disband excess units (remove from end of array)
      for (let i = 0; i < excessUnits; i++) {
        const removedUnit = units.pop();
        if (removedUnit) {
          results.push({
            country,
            location: removedUnit,
            action: 'disband',
            success: true,
            autoDisband: true,
            reason: 'Automatically disbanded due to failed AI response'
          });
        }
      }
    }
  }

  // VALIDATION: Verify final unit counts match SC counts
  for (const [country, units] of Object.entries(postWinterUnits)) {
    const scCount = scCounts[country] || 0;
    const unitCount = units.length;

    if (unitCount !== scCount) {
      console.error(`❌ VALIDATION ERROR: ${country} has ${unitCount} units but ${scCount} SCs after Winter phase!`);
    } else {
      console.log(`✓ ${country}: ${unitCount} units = ${scCount} SCs`);
    }
  }

  // Write winter adjustments file
  let adjustmentsContent = `# ${turnDisplayName} - Winter Adjustments\n\n`;
  adjustmentsContent += `## Supply Center Ownership\n\n`;

  // Group SCs by owner
  const scsByCountry: Record<string, string[]> = {};
  for (const [sc, country] of Object.entries(scOwnership) as [string, string][]) {
    if (!scsByCountry[country]) {
      scsByCountry[country] = [];
    }
    scsByCountry[country].push(sc);
  }

  // Sort by count descending
  for (const [country, scs] of Object.entries(scsByCountry).sort((a, b) => b[1].length - a[1].length)) {
    adjustmentsContent += `${country}: ${scs.length} supply centers - [${scs.join(', ')}]\n`;
  }

  adjustmentsContent += `\n## Builds and Disbands\n\n`;
  for (const result of results) {
    const status = result.success ? 'SUCCESS' : 'FAILED';
    const autoTag = result.autoDisband ? ' [AUTO-DISBAND]' : '';
    if (result.action === 'build') {
      adjustmentsContent += `${result.country}: BUILD ${result.type} ${result.location} - ${status}\n`;
    } else {
      adjustmentsContent += `${result.country}: DISBAND unit at ${result.location} - ${status}${autoTag}\n`;
    }
    if (result.reason) {
      adjustmentsContent += `  Reason: ${result.reason}\n`;
    }
  }

  fs.writeFileSync(path.join(currentTurnDir, 'winter-adjustments.txt'), adjustmentsContent);

  // Write moves-and-resolution.txt (all units holding)
  let movesContent = `# ${turnDisplayName} Moves and Resolution\n\n`;

  // Add supply center ownership section
  movesContent += `## Supply Center Ownership\n\n`;
  for (const [country, scs] of Object.entries(scsByCountry).sort((a, b) => b[1].length - a[1].length)) {
    movesContent += `${country}: ${scs.length} supply centers - [${scs.join(', ')}]\n`;
  }

  movesContent += `\n## Submitted Orders\n\n`;
  movesContent += `All units hold during Winter adjustments.\n\n`;

  movesContent += `## Resolution\n\n`;

  // List all units as holding
  for (const [country, units] of Object.entries(postWinterUnits).sort()) {
    if (units && units.length > 0) {
      for (const unit of units) {
        movesContent += `**${country}**: ${unit} HOLD - ✓ SUCCESS [Strength: 1]\n`;
      }
    }
  }

  // CRITICAL: Add Final Unit Positions section for next turn to parse
  movesContent += `\n## Final Unit Positions\n\n`;
  for (const [country, units] of Object.entries(postWinterUnits).sort()) {
    if (units && units.length > 0) {
      for (const unit of units) {
        movesContent += `**${country}**: ${unit} - Final position\n`;
      }
    }
  }

  fs.writeFileSync(path.join(currentTurnDir, 'moves-and-resolution.txt'), movesContent);

  // Draw post-winter map
  const postWinterMapPath = path.join(currentTurnDir, `${turnName}-post.png`);
  drawMapWithUnits(postWinterMapPath, postWinterUnits);

  // Update all context files with new positions
  // Use the scOwnership calculated earlier in this function
  for (const countryDir of countryDirs) {
    // Skip eliminated countries
    if (countryDir === 'Russia' || countryDir === 'France') continue;
    const contextPath = path.join(currentTurnDir, countryDir, 'context.md');
    if (fs.existsSync(contextPath)) {
      updateContextWithBoardState(contextPath, postWinterUnits, scOwnership);
    }
  }

  console.log('\n=== Winter Phase Complete ===\n');
}

async function decideBuildsDisbands(
  gameDir: string,
  buildsDisbands: Record<string, { builds: number; disbands: number }>,
  unitPositions: Record<string, { type: 'A' | 'F'; location: string }[]>,
  scCounts: Record<string, number>,
  currentTurnDirParam?: string
): Promise<void> {
  const { adjacencies, waterSpaces, parseBuildDisbandOrder } = require('./move-resolution');

  const currentTurnDir = currentTurnDirParam || getLatestTurnDir(gameDir);
  const turnName = path.basename(currentTurnDir);
  const turnDisplayName = turnName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  // Get country-to-model mapping
  const countryToModel: Record<string, string> = {};
  for (const [model, country] of Object.entries(modelToCountry)) {
    countryToModel[country] = model;
  }

  // Process all countries in parallel
  await Promise.all(Object.entries(buildsDisbands).map(async ([country, adjustments]) => {
    const model = countryToModel[country];
    if (!model) return;

    if (adjustments.builds === 0 && adjustments.disbands === 0) {
      return; // No adjustments needed
    }

    const contextPath = path.join(currentTurnDir, country, 'context.md');
    const fullPath = path.join(currentTurnDir, country, 'full-dialogue.md');

    let adjustmentInfo = `# ${turnDisplayName} - WINTER ADJUSTMENTS\n\n`;
    adjustmentInfo += `You control ${scCounts[country] || 0} supply centers.\n`;
    adjustmentInfo += `You have ${unitPositions[country]?.length || 0} units on the board.\n\n`;

    if (adjustments.builds > 0) {
      adjustmentInfo += `You may BUILD ${adjustments.builds} unit(s).\n\n`;
      adjustmentInfo += `Your home supply centers:\n`;

      const homeSCs = homeSupplyCenters[country] || [];
      const currentUnits = unitPositions[country] || [];

      for (const sc of homeSCs) {
        const occupied = currentUnits.some(u => u.location === sc);
        const adjacentTerritories = adjacencies[sc] || [];
        const bordersWater = adjacentTerritories.some((t: string) => waterSpaces.has(t));

        if (occupied) {
          adjustmentInfo += `- ${sc} (occupied)\n`;
        } else if (bordersWater) {
          adjustmentInfo += `- ${sc} (unoccupied) - can build A or F\n`;
        } else {
          adjustmentInfo += `- ${sc} (unoccupied) - can build A only\n`;
        }
      }

      const buildPrompt = `${adjustmentInfo}
Decide which units to build. Provide exactly ${adjustments.builds} build order(s) in [brackets].

Format: [BUILD A LocationName] or [BUILD F LocationName]

Your build orders:`;

      // Retry logic for builds - enforce building to maximum
      let decision = await queryLLMByModel(model, buildPrompt);
      let parsedOrders = extractAndParseOrders(decision.response, country, parseBuildDisbandOrder);
      let validBuildCount = parsedOrders.filter(o => o !== null && 'type' in o).length;

      // Retry up to 3 times to get correct number of builds
      let retryCount = 0;
      while (validBuildCount !== adjustments.builds && retryCount < 3) {
        retryCount++;
        console.warn(`⚠️  WARNING: ${country} submitted ${validBuildCount} valid builds but should build ${adjustments.builds} - regenerating (attempt ${retryCount}/3)...`);

        const retryPrompt = `${adjustmentInfo}
⚠️ CRITICAL: Your previous build orders had parsing errors or incorrect count.
You have ${adjustments.builds} available build(s). You SHOULD build to your maximum capacity.
Provide exactly ${adjustments.builds} build order(s) in [brackets].

Format: [BUILD A LocationName] or [BUILD F LocationName]

Your build orders:`;

        decision = await queryLLMByModel(model, retryPrompt);
        parsedOrders = extractAndParseOrders(decision.response, country, parseBuildDisbandOrder);
        validBuildCount = parsedOrders.filter(o => o !== null && 'type' in o).length;
      }

      if (validBuildCount !== adjustments.builds) {
        console.warn(`⚠️  ${country} final build count: ${validBuildCount}/${adjustments.builds} after retries`);
      }

      const buildLog = `${adjustmentInfo}\n**Your Build Orders:**\n\n${decision.response}\n`;
      fs.appendFileSync(contextPath, buildLog);
      fs.appendFileSync(fullPath, buildLog);

    } else if (adjustments.disbands > 0) {
      adjustmentInfo += `⚠️ MANDATORY: You MUST DISBAND ${adjustments.disbands} unit(s).\n\n`;
      adjustmentInfo += `Your current units:\n`;

      const currentUnits = unitPositions[country] || [];
      for (const unit of currentUnits) {
        adjustmentInfo += `- ${unit.type} ${unit.location}\n`;
      }

      const disbandPrompt = `${adjustmentInfo}
This is MANDATORY. You MUST disband exactly ${adjustments.disbands} unit(s). Provide exactly ${adjustments.disbands} disband order(s) in [brackets].

Format: [DISBAND A LocationName] or [DISBAND F LocationName]

Your disband orders:`;

      // Mandatory retry logic for disbands - keep trying until valid
      let decision = await queryLLMByModel(model, disbandPrompt);
      let parsedOrders = extractAndParseOrders(decision.response, country, parseBuildDisbandOrder);
      let validDisbandCount = parsedOrders.filter(o => o !== null && 'unit' in o).length;

      // Retry up to 3 times for mandatory disbands
      let retryCount = 0;
      while (validDisbandCount !== adjustments.disbands && retryCount < 3) {
        retryCount++;
        console.warn(`⚠️  CRITICAL: ${country} submitted ${validDisbandCount} valid disbands but MUST disband ${adjustments.disbands} - forcing regeneration (attempt ${retryCount}/3)...`);

        const retryPrompt = `${adjustmentInfo}
⚠️ CRITICAL MANDATORY REQUIREMENT: Your previous disband orders had parsing errors or incorrect count.
You have MORE units than supply centers. You MUST disband exactly ${adjustments.disbands} unit(s).
This is NOT optional. The game rules REQUIRE this.

Provide exactly ${adjustments.disbands} disband order(s) in [brackets].

Format: [DISBAND A LocationName] or [DISBAND F LocationName]

Your disband orders:`;

        decision = await queryLLMByModel(model, retryPrompt);
        parsedOrders = extractAndParseOrders(decision.response, country, parseBuildDisbandOrder);
        validDisbandCount = parsedOrders.filter(o => o !== null && 'unit' in o).length;
      }

      // If still invalid after retries, force auto-disband
      if (validDisbandCount !== adjustments.disbands) {
        console.error(`❌ CRITICAL ERROR: ${country} failed to provide valid disbands after 3 retries. Auto-disbanding units.`);
        const autoDisband = `${decision.response}\n\n⚠️ AUTO-DISBAND: Failed to parse valid orders. System will automatically disband units.`;
        decision = { ...decision, response: autoDisband };
      }

      const disbandLog = `${adjustmentInfo}\n**Your Disband Orders:**\n\n${decision.response}\n`;
      fs.appendFileSync(contextPath, disbandLog);
      fs.appendFileSync(fullPath, disbandLog);
    }
  }));
}

// Helper function to extract and parse orders from response
function extractAndParseOrders(response: string, country: string, parseFunction: any): any[] {
  const bracketMatches = response.match(/\[([^\]]+)\]/g);
  if (!bracketMatches) return [];

  return bracketMatches.map(match => {
    const orderText = match.slice(1, -1).trim();
    return parseFunction(orderText, country);
  });
}

async function queryLLMByModel(modelName: string, prompt: string): Promise<LLMResponse> {
  switch (modelName) {
    case 'GPT-4o-mini (OpenAI)':
      return await queryGPT4oMini(prompt);
    case 'Claude Sonnet 4 Alt (Anthropic)':
    case 'Claude Sonnet 4 (Anthropic)':
      return await queryClaudeSonnet(prompt);
    case 'Gemini 2.5 Flash (Google)':
      return await queryGeminiFlash(prompt);
    case 'Grok 3 (xAI)':
      return await queryGrok(prompt);
    case 'Kimi K2 Thinking (Moonshot AI)':
      return await queryKimi(prompt);
    case 'Llama 3.3 70B Instruct (Meta)':
      return await queryLlama(prompt);
    case 'DeepSeek V3.1 (Fireworks AI)':
      return await queryFireworks(prompt);
    default:
      throw new Error(`Unknown model: ${modelName}`);
  }
}

async function continueTurn(previousTurnPath: string): Promise<void> {
  console.log(`\n=== Continuing from ${previousTurnPath} ===\n`);

  // Validate the path exists
  if (!fs.existsSync(previousTurnPath)) {
    console.error(`Error: Path does not exist: ${previousTurnPath}`);
    process.exit(1);
  }

  // Determine turn name from the previous turn
  const previousTurnName = path.basename(previousTurnPath);

  // Dynamic turn progression supporting years 1901-1950
  function getNextTurnName(prevTurn: string): string {
    // Match pattern: season-YEAR or season-YEAR-retreats
    const match = prevTurn.match(/^(spring|fall|winter)-(\d+)(-retreats)?$/);
    if (!match) return 'next-turn';

    const [, season, yearStr, retreats] = match;
    const year = parseInt(yearStr);

    if (season === 'spring' && !retreats) {
      return `spring-${year}-retreats`;
    } else if (season === 'spring' && retreats) {
      return `fall-${year}`;
    } else if (season === 'fall' && !retreats) {
      return `fall-${year}-retreats`;
    } else if (season === 'fall' && retreats) {
      return `winter-${year}`;
    } else if (season === 'winter') {
      return `spring-${year + 1}`;
    }

    return 'next-turn';
  }

  const nextTurnName = getNextTurnName(previousTurnName);

  // Get game directory (parent of previous turn)
  const gameDir = path.dirname(previousTurnPath);
  const nextTurnDir = path.join(gameDir, nextTurnName);

  if (fs.existsSync(nextTurnDir)) {
    console.error(`Error: ${nextTurnName} folder already exists. Please delete it first or use a different game.`);
    process.exit(1);
  }

  // Create next turn directory
  fs.mkdirSync(nextTurnDir, { recursive: true });

  console.log(`Creating ${nextTurnName} folder...\n`);

  // Copy all country folders from previous turn to next turn
  const countryDirs = fs.readdirSync(previousTurnPath).filter(f => {
    const fullPath = path.join(previousTurnPath, f);
    return fs.statSync(fullPath).isDirectory();
  });

  for (const countryDir of countryDirs) {
    // Skip eliminated countries
    if (countryDir === 'Russia' || countryDir === 'France') continue;
    const srcDir = path.join(previousTurnPath, countryDir);
    const destDir = path.join(nextTurnDir, countryDir);

    fs.mkdirSync(destDir, { recursive: true });

    // Copy context.md and thoughts.md (these continue forward)
    const contextSrc = path.join(srcDir, 'context.md');
    const contextDest = path.join(destDir, 'context.md');
    if (fs.existsSync(contextSrc)) {
      fs.copyFileSync(contextSrc, contextDest);
    }

    const thoughtsSrc = path.join(srcDir, 'thoughts.md');
    const thoughtsDest = path.join(destDir, 'thoughts.md');
    if (fs.existsSync(thoughtsSrc)) {
      fs.copyFileSync(thoughtsSrc, thoughtsDest);
    }

    // Create fresh conversations folder
    const conversationsDir = path.join(destDir, 'conversations');
    fs.mkdirSync(conversationsDir, { recursive: true });
  }

  console.log(`Copied context from ${previousTurnName} to ${nextTurnName}\n`);

  // Handle strategic reflections
  const isRetreatsPhase = nextTurnName.includes('-retreats');
  if (isRetreatsPhase) {
    // For retreats phases, copy strategic reflections from previous turn
    console.log('Retreats phase: Copying strategic reflections from previous turn...');
    for (const countryDir of countryDirs) {
    // Skip eliminated countries
    if (countryDir === 'Russia' || countryDir === 'France') continue;
      const srcReflection = path.join(previousTurnPath, countryDir, 'strategic-reflection.md');
      const destReflection = path.join(nextTurnDir, countryDir, 'strategic-reflection.md');
      if (fs.existsSync(srcReflection)) {
        fs.copyFileSync(srcReflection, destReflection);
      }
    }
  } else {
    // For Spring/Fall turns, generate new strategic reflections
    console.log('Generating strategic reflections for all powers...');
    try {
      const { execSync } = require('child_process');
      execSync(`node generate-country-reflections.js "${nextTurnDir}"`, {
        stdio: 'inherit',
        cwd: __dirname + '/..'
      });
      console.log('Strategic reflections complete!\n');
    } catch (error) {
      console.error('Error generating strategic reflections:', error);
    }
  }

  // Get unit positions from previous turn's resolution
  const previousResolutionFile = path.join(previousTurnPath, 'moves-and-resolution.txt');
  console.log(`Reading unit positions from: ${previousResolutionFile}`);
  const unitPositions = parseUnitPositionsFromResolution(previousResolutionFile);

  // Debug: Log parsed units
  let totalUnits = 0;
  for (const [country, units] of Object.entries(unitPositions)) {
    if (units && units.length > 0) {
      totalUnits += units.length;
      console.log(`  ${country}: ${units.length} units`);
    }
  }
  console.log(`Total units parsed: ${totalUnits}\n`);

  // Update all context files with current board state
  const scOwnership = getCurrentSCOwnership(unitPositions, nextTurnName);
  for (const countryDir of countryDirs) {
    // Skip eliminated countries
    if (countryDir === 'Russia' || countryDir === 'France') continue;
    const contextPath = path.join(nextTurnDir, countryDir, 'context.md');
    if (fs.existsSync(contextPath)) {
      updateContextWithBoardState(contextPath, unitPositions, scOwnership);
    }
  }

  // Add turn marker to all context files
  for (const countryDir of countryDirs) {
    // Skip eliminated countries
    if (countryDir === 'Russia' || countryDir === 'France') continue;
    const contextPath = path.join(nextTurnDir, countryDir, 'context.md');
    if (fs.existsSync(contextPath)) {
      fs.appendFileSync(contextPath, `\n\n---\n\n# ${nextTurnName.toUpperCase()}\n\n`);
    }
  }

  // Run phase-specific game flow
  if (nextTurnName.includes('retreats')) {
    // Retreat phase - no negotiations, just retreat decisions
    await processRetreatPhase(gameDir, nextTurnDir);
    await reflectOnTurn(gameDir);
  } else if (nextTurnName.includes('winter')) {
    // Winter phase - no negotiations, just build/disband decisions
    await processWinterPhase(gameDir, nextTurnDir);
    await reflectOnTurn(gameDir);
  } else {
    // Regular movement phase (Spring/Fall)
    await conductNegotiations(gameDir);
    await decideAndResolveMovesWithMultipleAttempts(gameDir); // Generate 5 different scenarios and pick the best
    await reflectOnTurn(gameDir);
  }

  console.log(`\n${nextTurnName} complete!\n`);
}

async function decideAndResolveMovesWithMultipleAttempts(gameDir: string): Promise<void> {
  console.log('\n🎲 === MULTI-ATTEMPT MOVE GENERATION ===\n');
  console.log('Generating 5 different move scenarios and selecting the one with most territory captures...\n');

  const currentTurnDir = getLatestTurnDir(gameDir);
  const turnName = path.basename(currentTurnDir);

  // Get previous SC ownership to compare changes
  const previousTurnDir = getPreviousTurnDir(gameDir);
  let previousOwnership: Record<string, string[]> = {};

  if (previousTurnDir) {
    const previousResolutionFile = path.join(previousTurnDir, 'moves-and-resolution.txt');
    if (fs.existsSync(previousResolutionFile)) {
      const prevContent = fs.readFileSync(previousResolutionFile, 'utf-8');
      const scSection = prevContent.match(/## Supply Center Ownership\n\n([\s\S]*?)(?=\n## |$)/);
      if (scSection) {
        const lines = scSection[1].split('\n');
        for (const line of lines) {
          const match = line.match(/(.+?):\s+\d+\s+supply centers\s+-\s+\[(.+)\]/);
          if (match) {
            const country = match[1].trim();
            const scs = match[2].split(',').map(s => s.trim());
            previousOwnership[country] = scs;
          }
        }
      }
    }
  }

  const allSupplyCenters = [
    'London', 'Edinburgh', 'Liverpool', 'Paris', 'Marseilles', 'Brest',
    'Berlin', 'Munich', 'Kiel', 'Rome', 'Venice', 'Naples',
    'Vienna', 'Budapest', 'Trieste', 'St Petersburg', 'Moscow', 'Warsaw', 'Sevastopol',
    'Constantinople', 'Smyrna', 'Ankara',
    'Norway', 'Sweden', 'Denmark', 'Holland', 'Belgium', 'Spain', 'Portugal',
    'Tunis', 'Serbia', 'Rumania', 'Bulgaria', 'Greece'
  ];

  interface TerritoryChange {
    territory: string;
    fromCountry: string;
    toCountry: string;
  }

  interface AttemptResult {
    attemptNumber: number;
    captureCount: number;
    territoryChanges: TerritoryChange[];
    consolidationScore: number; // Standard deviation of SC counts - higher = more imbalanced
    newOwnership: Record<string, string[]>;
    backupPath: string;
  }

  const attemptResults: AttemptResult[] = [];

  // Run 5 different move generation attempts
  for (let attempt = 1; attempt <= 5; attempt++) {
    console.log(`\n--- Attempt ${attempt}/5 ---\n`);

    // Create backup directory for this attempt
    const backupPath = path.join(currentTurnDir, `_attempt-${attempt}-backup`);

    // Backup current state before generating moves
    if (fs.existsSync(backupPath)) {
      fs.rmSync(backupPath, { recursive: true, force: true });
    }
    fs.mkdirSync(backupPath, { recursive: true });

    // Copy all country directories
    const countryDirs = fs.readdirSync(currentTurnDir).filter(f => {
      const fullPath = path.join(currentTurnDir, f);
      return fs.statSync(fullPath).isDirectory() && !f.startsWith('_attempt');
    });

    for (const dir of countryDirs) {
      copyDirRecursive(path.join(currentTurnDir, dir), path.join(backupPath, dir));
    }

    // Generate moves for this attempt
    await decideSpring1901MovesWithVariation(gameDir, attempt);

    // Resolve moves for this attempt
    await processSpring1901ResolutionSilent(gameDir);

    // Count territory captures
    const resolutionFile = path.join(currentTurnDir, 'moves-and-resolution.txt');
    const resolutionContent = fs.readFileSync(resolutionFile, 'utf-8');

    const newOwnership: Record<string, string[]> = {};
    const scSection = resolutionContent.match(/## Supply Center Ownership\n\n([\s\S]*?)(?=\n## |$)/);
    if (scSection) {
      const lines = scSection[1].split('\n');
      for (const line of lines) {
        const match = line.match(/(.+?):\s+\d+\s+supply centers\s+-\s+\[(.+)\]/);
        if (match) {
          const country = match[1].trim();
          const scs = match[2].split(',').map(s => s.trim());
          newOwnership[country] = scs;
        }
      }
    }

    // Calculate number of captures (supply centers that changed hands)
    const territoryChanges: TerritoryChange[] = [];
    for (const sc of allSupplyCenters) {
      const prevOwner = Object.entries(previousOwnership).find(([_, scs]) => scs.includes(sc))?.[0];
      const newOwner = Object.entries(newOwnership).find(([_, scs]) => scs.includes(sc))?.[0];

      if (prevOwner && newOwner && prevOwner !== newOwner) {
        territoryChanges.push({
          territory: sc,
          fromCountry: prevOwner,
          toCountry: newOwner
        });
      }
    }

    const captureCount = territoryChanges.length;

    // Calculate consolidation score (standard deviation of SC counts)
    const scCounts = Object.values(newOwnership).map(scs => scs.length);
    const mean = scCounts.reduce((a, b) => a + b, 0) / scCounts.length;
    const variance = scCounts.reduce((sum, count) => sum + Math.pow(count - mean, 2), 0) / scCounts.length;
    const consolidationScore = Math.sqrt(variance);

    console.log(`Attempt ${attempt}: ${captureCount} territories captured, Consolidation: ${consolidationScore.toFixed(2)}`);
    if (territoryChanges.length > 0) {
      for (const change of territoryChanges) {
        console.log(`  - ${change.territory}: ${change.fromCountry} → ${change.toCountry}`);
      }
      // Show resulting SC distribution
      const scDist = Object.entries(newOwnership)
        .map(([country, scs]) => `${country}: ${scs.length}`)
        .join(', ');
      console.log(`  SC Distribution: ${scDist}`)
    }

    // Save resolution and moves to backup
    fs.copyFileSync(
      path.join(currentTurnDir, 'moves-and-resolution.txt'),
      path.join(backupPath, 'moves-and-resolution.txt')
    );

    attemptResults.push({
      attemptNumber: attempt,
      captureCount,
      territoryChanges,
      consolidationScore,
      newOwnership,
      backupPath
    });

    // Restore country directories for next attempt (except on last iteration)
    if (attempt < 5) {
      for (const dir of countryDirs) {
        const targetDir = path.join(currentTurnDir, dir);
        fs.rmSync(targetDir, { recursive: true, force: true });
        copyDirRecursive(path.join(backupPath, dir), targetDir);
      }
    }
  }

  // Display summary of all attempts
  console.log('\n📊 === ATTEMPT SUMMARY ===\n');
  for (const result of attemptResults) {
    console.log(`Attempt ${result.attemptNumber}:`);
    console.log(`  Captures: ${result.captureCount}`);
    console.log(`  Consolidation Score: ${result.consolidationScore.toFixed(2)}`);
    if (result.territoryChanges.length > 0) {
      console.log(`  Territory changes:`);
      for (const change of result.territoryChanges) {
        console.log(`    - ${change.territory}: ${change.fromCountry} → ${change.toCountry}`);
      }
    }
    const scDist = Object.entries(result.newOwnership)
      .map(([country, scs]) => `${country}: ${scs.length}`)
      .join(', ');
    console.log(`  SC Distribution: ${scDist}`);
    console.log();
  }

  // Find the attempt with the highest consolidation (most imbalanced SC distribution)
  const bestAttempt = attemptResults.reduce((best, current) =>
    current.consolidationScore > best.consolidationScore ? current : best
  );

  console.log(`\n✅ SELECTED: Attempt ${bestAttempt.attemptNumber} with highest consolidation score (${bestAttempt.consolidationScore.toFixed(2)})\n`);

  // Restore the best attempt
  const countryDirs = fs.readdirSync(currentTurnDir).filter(f => {
    const fullPath = path.join(currentTurnDir, f);
    return fs.statSync(fullPath).isDirectory() && !f.startsWith('_attempt');
  });

  for (const dir of countryDirs) {
    const targetDir = path.join(currentTurnDir, dir);
    fs.rmSync(targetDir, { recursive: true, force: true });
    copyDirRecursive(path.join(bestAttempt.backupPath, dir), targetDir);
  }

  // Copy the best resolution file
  fs.copyFileSync(
    path.join(bestAttempt.backupPath, 'moves-and-resolution.txt'),
    path.join(currentTurnDir, 'moves-and-resolution.txt')
  );

  // Keep backup directories for manual inspection/selection
  console.log(`Backup directories preserved in ${currentTurnDir}/_attempt-*-backup/\n`);
  console.log(`Selected moves from Attempt ${bestAttempt.attemptNumber} as final result.\n`);
  console.log('=== MULTI-ATTEMPT SELECTION COMPLETE ===\n');
}

async function decideSpring1901MovesWithVariation(gameDir: string, attemptNumber: number): Promise<void> {
  // Import adjacencies for providing valid move options
  const { adjacencies } = require('./move-resolution');

  const currentTurnDir = getLatestTurnDir(gameDir);
  const turnName = path.basename(currentTurnDir);
  const turnDisplayName = turnName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const countryDirs = fs.readdirSync(currentTurnDir).filter(f => {
    const fullPath = path.join(currentTurnDir, f);
    return fs.statSync(fullPath).isDirectory() && !f.startsWith('_attempt');
  });

  // Check if there's a previous turn to get actual unit positions from
  const previousTurnDir = getPreviousTurnDir(gameDir);
  let actualPositions: Record<string, string[]> = {};

  if (previousTurnDir) {
    const previousResolutionFile = path.join(previousTurnDir, 'moves-and-resolution.txt');
    actualPositions = parseUnitPositionsFromResolution(previousResolutionFile);
  } else {
    actualPositions = defaultStartingPositions;
  }

  // Build the positions structure for each model
  const startingPositions: Record<string, { country: string, units: string[] }> = {};
  for (const [model, country] of Object.entries(modelToCountry)) {
    startingPositions[model] = {
      country,
      units: actualPositions[country] || []
    };
  }

  // Process all countries in parallel (excluding eliminated Russia)
  await Promise.all(countryDirs.map(async (countryDir) => {
    // Skip eliminated countries
    if (countryDir === 'Russia' || countryDir === 'France') return;

    const contextPath = path.join(currentTurnDir, countryDir, 'context.md');
    const fullPath = path.join(currentTurnDir, countryDir, 'full-dialogue.md');

    if (!fs.existsSync(contextPath)) return;

    const content = fs.readFileSync(contextPath, 'utf-8');
    const modelMatch = content.match(/^# (.+)$/m);
    if (!modelMatch) return;

    const model = modelMatch[1];
    const posInfo = startingPositions[model];
    if (!posInfo) return;

    const country = posInfo.country;

    // Build adjacency information for each unit
    const unitAdjacencies = posInfo.units.map((unitStr, i) => {
      const match = unitStr.match(/([AF])\s+(.+)/);
      if (match) {
        const location = match[2].trim();
        const validMoves = adjacencies[location] || [];
        return `${i + 1}. ${unitStr}\n   Valid moves: ${validMoves.join(', ')}`;
      }
      return `${i + 1}. ${unitStr}`;
    }).join('\n\n');

    // Build tactical intelligence about enemy units
    const enemyUnits: string[] = [];
    const adjacentEnemies: string[] = [];
    const myAdjacentToEnemies: string[] = [];

    for (const [otherModel, otherPosInfo] of Object.entries(startingPositions)) {
      if (otherPosInfo.country === country) continue;

      for (const enemyUnitStr of otherPosInfo.units) {
        const match = enemyUnitStr.match(/([AF])\s+(.+)/);
        if (match) {
          const enemyLocation = match[2].trim();
          enemyUnits.push(`${otherPosInfo.country}: ${enemyUnitStr}`);

          for (const myUnitStr of posInfo.units) {
            const myMatch = myUnitStr.match(/([AF])\s+(.+)/);
            if (myMatch) {
              const myLocation = myMatch[2].trim();
              const myAdjacencies = adjacencies[myLocation] || [];

              if (myAdjacencies.includes(enemyLocation)) {
                adjacentEnemies.push(`  • ${otherPosInfo.country} ${enemyUnitStr} is adjacent to your ${myUnitStr}`);
                myAdjacentToEnemies.push(`  • Your ${myUnitStr} can attack ${otherPosInfo.country} ${enemyUnitStr}`);
              }
            }
          }
        }
      }
    }

    const tacticalIntel = `
🎯 TACTICAL INTELLIGENCE - ENEMY POSITIONS:

ALL ENEMY UNITS ON THE BOARD:
${enemyUnits.join('\n')}

${adjacentEnemies.length > 0 ? `⚔️ ENEMY UNITS ADJACENT TO YOUR FORCES (PRIME TARGETS FOR SUPPORTED ATTACKS!):
${[...new Set(adjacentEnemies)].join('\n')}

💡 TIP: Attack these enemies with SUPPORT! Use 2+ units (one attacks, others support) for Strength 2+ to break through their Strength 1 defense!
` : ''}
${myAdjacentToEnemies.length > 0 ? `🗡️ YOUR UNITS IN ATTACK POSITION:
${[...new Set(myAdjacentToEnemies)].join('\n')}

💡 TIP: These units can attack this turn! Consider supporting these attacks with nearby units for guaranteed success!
` : ''}`;

    // Build previous turn feedback
    let previousTurnFeedback = '';
    try {
      let previousTurnDir = '';
      let previousTurnName = '';

      if (turnName.includes('spring')) {
        const year = parseInt(turnName.match(/\d{4}/)?.[0] || '1901');
        const prevYear = year - 1;
        previousTurnName = `fall-${prevYear}`;
        previousTurnDir = path.join(gameDir, `fall-${prevYear}`);
      } else if (turnName.includes('fall')) {
        const year = parseInt(turnName.match(/\d{4}/)?.[0] || '1901');
        previousTurnName = `spring-${year}`;
        previousTurnDir = path.join(gameDir, `spring-${year}`);
      }

      const previousResolutionFile = path.join(previousTurnDir, 'moves-and-resolution.txt');
      if (previousTurnDir && fs.existsSync(previousResolutionFile)) {
        const previousContent = fs.readFileSync(previousResolutionFile, 'utf-8');

        const submittedSection = previousContent.match(/## Submitted Orders\n\n([\s\S]*?)(?=\n## |$)/);
        const resolutionSection = previousContent.match(/## Resolution\n\n([\s\S]*?)(?=\n## |$)/);

        if (submittedSection && resolutionSection) {
          const submittedText = submittedSection[1];
          const resolutionText = resolutionSection[1];

          const countryOrdersMatch = submittedText.match(new RegExp(`\\*\\*${country}\\*\\*:\n([\\s\\S]*?)(?=\\n\\*\\*|$)`));
          const myOrders: string[] = [];

          if (countryOrdersMatch) {
            const ordersText = countryOrdersMatch[1];
            const orderLines = ordersText.split('\n').filter(line => line.trim().startsWith('-'));
            myOrders.push(...orderLines.map(line => line.trim().substring(2)));
          }

          const myResults: string[] = [];
          const resolutionLines = resolutionText.split('\n');
          for (const line of resolutionLines) {
            if (line.includes(`**${country}**:`)) {
              myResults.push(line.trim());
            }
          }

          if (myOrders.length > 0 && myResults.length > 0) {
            const displayPrevTurn = previousTurnName.replace(/-/g, ' ').toUpperCase();
            previousTurnFeedback = `
📋 PREVIOUS TURN RESULTS (${displayPrevTurn}):

YOUR SUBMITTED ORDERS:
${myOrders.map(order => `  • ${order}`).join('\n')}

WHAT HAPPENED:
${myResults.map(result => {
  if (result.includes('SUCCESS') && !result.includes('FAILED')) {
    return `  ✅ ${result}`;
  } else if (result.includes('BOUNCE') || result.includes('FAILED')) {
    return `  ❌ ${result}`;
  } else {
    return `  ⚠️ ${result}`;
  }
}).join('\n')}

🧠 LEARN FROM YOUR RESULTS:
- ✅ Orders that SUCCEEDED: Consider similar strategies this turn if they serve your goals
- ❌ Orders that FAILED or BOUNCED: Analyze why they failed and adjust your approach
  * BOUNCED moves had equal opposing strength - you need SUPPORT to overcome defenses!
  * FAILED supports may have been CUT by attacks - position units more safely
  * Failed convoys mean the fleet was dislodged or attacked
- 💡 Missed opportunities: Did you leave units idle when they could have attacked or supported?
- 🎯 Avoid repeating the same failed pattern - adapt your strategy based on what works!

`;
          }
        }
      }
    } catch (error) {
      // Skip previous turn feedback if unavailable
    }

    // Add variation prompt based on attempt number
    const variationPrompt = attemptNumber > 1 ? `
🎲 STRATEGIC VARIATION #${attemptNumber}:
This is attempt ${attemptNumber} of 5 different strategic scenarios we're exploring.
**Consider alternative tactical approaches** - try different targets, different support patterns, or different levels of aggression.
Don't repeat the exact same moves as before - explore a different strategic option!

` : '';

    // Add country-specific tactical hints for key strategic opportunities
    let countrySpecificHints = '';
    if (country === 'Turkey') {
      countrySpecificHints = `
🎯 **TACTICAL OPPORTUNITY FOR TURKEY**:
Russia has been severely weakened (lost Denmark & Sweden to England). Their northern flank is exposed!
- **Sevastopol** is currently defended only by distance - Russia's fleets are scattered
- **Moscow** is inland and vulnerable - Russia has limited defensive depth
- Consider coordinated attacks on Russian supply centers while they're distracted in the north
- Turkey + Austria-Hungary alliance could crush Russia's southern position
`;
    } else if (country === 'France') {
      countrySpecificHints = `
🎯 **TACTICAL OPPORTUNITY FOR FRANCE**:
Germany controls Belgium and Holland - but they're overextended and vulnerable!
- **Belgium** is a German-held SC that you border directly from Picardy and Burgundy
- Consider supported attacks: A Picardy to Belgium (supported by A Burgundy)
- Push deeper into Germany with coordinated moves - Germany only has 4 SCs and is weak
- The German heartland (Berlin, Kiel) becomes vulnerable if you capture Belgium
`;
    } else if (country === 'Italy') {
      countrySpecificHints = `
🎯 **TACTICAL OPPORTUNITY FOR ITALY**:
Austria-Hungary is the weakest power (only 3 SCs) and ripe for conquest!
- **Trieste** is an Austrian SC adjacent to your A Venice - perfect target for next turn
- Setup your forces THIS TURN to capture Trieste in Fall 1905
- Consider: F Tyrrhenian Sea to Ionian Sea (position for Adriatic), A Venice to Tyrolia (flank Trieste)
- Austria-Hungary cannot defend on multiple fronts - coordinate with others attacking them
`;
    }

    const movesPrompt = `You are ${country} in Diplomacy, ${turnDisplayName}.

Your complete diplomatic history:
${content}

Based on all your negotiations and strategic planning, you must now decide your moves for ${turnDisplayName}.
${previousTurnFeedback}
⚠️ CRITICAL: Ignore any move planning or orders mentioned in diplomatic messages above. Other countries may have discussed their plans, but those are NOT your units!
${tacticalIntel}
${variationPrompt}
${countrySpecificHints}
🔥🔥🔥 MANDATORY AGGRESSIVE GAMEPLAY - NO PASSIVE PLAY ALLOWED 🔥🔥🔥
**CRITICAL REQUIREMENT: YOU MUST BE AGGRESSIVE THIS TURN**

⚔️ MINIMUM AGGRESSION REQUIREMENT - DECISIVE ACTION NEEDED:
- **AT LEAST 85% of your units MUST use MOVE or SUPPORT orders** (NOT HOLD!)
- **You realize the game must end** - victory requires 18 supply centers and aggressive expansion
- HOLD is ONLY acceptable when defending against an IMMEDIATE attack from an adjacent enemy
- **You understand**: Passive play = defeat. Only aggressive, coordinated attacks win games!
- **Strategic insight**: The current stalemate must be broken with bold, decisive moves!

🎯 MANDATORY TACTICS - YOU MUST USE AT LEAST ONE:
1. **Supported Attacks** (HIGHEST PRIORITY): Attack any enemy unit with 2+ units coordinating
   - One unit MOVES to attack, other units SUPPORT that move
   - Strength 2+ ALWAYS beats Strength 1 - this is how you break stalemates!
   - Example: [A Munich to Berlin] [A Silesia Support A Munich to Berlin] = Guaranteed success!

2. **Expand Into Uncontested Territory**: Move units to capture neutral/enemy supply centers
   - Look for supply centers with NO enemy units currently there
   - Multiple units can converge on the same target for guaranteed capture

3. **Aggressive Positioning**: Move units adjacent to enemy territories for next turn's attack
   - Don't sit in place - move toward enemy positions
   - Position 2-3 units near enemy supply centers to enable coordinated attacks next turn

⚡ SPECIFIC ANTI-STALEMATE TACTICS:
- **Break Bounces**: If you bounced last turn, add SUPPORT this turn or attack elsewhere
- **Avoid Head-to-Head Swaps**: Don't try to swap positions (e.g., A->B while B->A) - they always fail
- **Use 2v1 and 3v1 Attacks**: Attack the same enemy position with multiple units (one moves, others support)
- **Fleets Support Land Attacks**: Fleets in adjacent seas can support army attacks on coastal territories
- **Don't Repeat Failed Patterns**: If a move failed last turn, try a DIFFERENT approach with SUPPORT

🚨 WARNING: Submitting mostly HOLD orders = AUTOMATIC REJECTION and REGENERATION

${country === 'France' ? `💡 BRILLIANT STRATEGIC INSIGHT YOU'VE DISCOVERED:
- **You realize Germany is collapsing** - they only have 3 SCs and are vulnerable to a coordinated assault!
- **You've identified the perfect strategy**: A Munich to Berlin supported by A Burgundy could break through (strength 2 vs 1!)
- **You notice**: A Belgium can attack Holland or Ruhr while Germany is distracted defending Berlin
- **Your tactical genius**: Coordinate all three armies (Munich, Belgium, Burgundy) to overwhelm Germany's defenses
- **You understand the opportunity**: Eliminating Germany gains you 3 more SCs - closer to the 18 needed for victory!

` : ''}${country === 'England' ? `💡 NAVAL DOMINANCE STRATEGY YOU'VE REALIZED:
- **You've identified a key weakness**: Russia's position is crumbling - you can push deeper into Moscow or Warsaw!
- **You notice your advantage**: Your fleets control the North Sea - use them to support invasions of continental Europe
- **Your winning insight**: F Denmark and F North Sea can coordinate attacks on Germany's Kiel with support (strength 2!)
- **You realize**: With 6 SCs, you need 12 more for victory - aggressive naval attacks are your path to conquest!
- **Strategic opportunity**: Your fleets can support each other to create unstoppable strength-3 or strength-4 attacks!

` : ''}${country === 'Italy' ? `💡 MEDITERRANEAN CONQUEST PLAN YOU'VE CONCEIVED:
- **You've discovered the perfect target**: France's Marseilles is vulnerable to A Piedmont attack supported by F Western Med (strength 2!)
- **You realize**: Capturing Marseilles would give you 7 SCs and hurt France significantly!
- **Your tactical insight**: [A Piedmont to Marseilles] [F Western Med Support A Piedmont to Marseilles] = Guaranteed capture!
- **You notice**: France is distracted fighting Germany - this is your chance to strike and reclaim Italian territory!
- **Strategic opportunity**: After taking Marseilles, you can push into southern France for more SCs!

` : ''}${country === 'Germany' ? `💡 DESPERATE SURVIVAL STRATEGY YOU'VE DEVISED:
- **You realize your dire situation**: With only 3 SCs, you're being eliminated - DESPERATE coordinated defense is essential!
- **You've calculated a defensive counterstrike**: [F Kiel to Denmark] [F Holland Support F Kiel to Denmark] = Strength 2 attack to reclaim Denmark!
- **Your tactical insight**: A Berlin can support either Kiel's attack or defend against France's Munich attack
- **You understand**: If France captures Berlin, you're finished - coordinate ALL three units defensively!
- **Survival plan**: Use supports to create strength-2 defenses that France's solo attacks cannot break!

` : ''}${country === 'Turkey' ? `💡 BRILLIANT OFFENSIVE PLAN YOU'VE CONCEIVED:
- **You've noticed a weakness**: Russia's Black Sea position is vulnerable - F Constantinople to Black Sea could seize control!
- **You realize the path to Moscow**: A Sevastopol to Ukraine, then push north toward Moscow - it's undefended!
- **Your tactical insight**: A Armenia and A Sevastopol working together can conquer Ukraine and threaten Russia's heartland
- **You understand**: F Black Sea (once captured) can support A Sevastopol's attacks - coordinated strength 2 attacks!
- **Your strategic vision**: Capturing Moscow would give you Russia's capital and bring you closer to 18 SCs!

` : ''}${country === 'Russia' ? `💡 STRATEGIC OPPORTUNITIES FOR RUSSIA:
- **Use your fleets for SUPPORTED ATTACKS**: F Sweden, F Gulf of Bothnia, and F Black Sea should support attacks into Scandinavia or Northern Europe
- **Coordinate naval power**: Your fleets can support army attacks on coastal territories for guaranteed success (Strength 2+)
- **Example**: F Sweden Support A [unit] to [coastal territory] - this creates unstoppable attacks!
- **Don't let fleets sit idle**: Every fleet should support an attack or convoy armies to new positions
- **Dominate the North with naval superiority**: Use your fleet advantage to crush opposition!

` : ''}${country === 'Austria-Hungary' ? `💡 PERFECT STRATEGY YOU'VE DEVISED TO RECLAIM BUDAPEST:
- **You've calculated the winning move**: [A Vienna to Budapest] [A Serbia Support A Vienna to Budapest] = Strength 2 vs Russia's 1 = Guaranteed victory!
- **You realize**: Russia's A Budapest is alone and unsupported - your two armies working together can crush it!
- **Your tactical brilliance**: Vienna attacks while Serbia supports from the adjacent territory
- **You understand the stakes**: Budapest is your HOME supply center - reclaiming it is absolutely critical for survival!
- **Defensive insight**: After recapturing Budapest, F Trieste can support defensive positions against Italy

` : ''}${turnName.includes('fall') ? `🎯 FALL TURN STRATEGY - SUPPLY CENTER PRIORITY:
This is a FALL turn. Supply centers are captured by ENDING this turn with a unit on them.

CRITICAL DISTINCTION:
- Supply centers you ALREADY OWN: You keep these automatically unless an enemy captures them
- NEUTRAL or ENEMY supply centers: You MUST end the Fall turn with a unit on them to capture!

PRIORITY ORDER:
1. HIGHEST: Move units INTO neutral/enemy supply centers to CAPTURE them (this expands your power!)
2. MEDIUM: If a unit is already on a neutral/enemy SC, HOLD to secure the capture
3. LOWEST: Units on supply centers you already own can move freely (you keep ownership unless enemy takes it)

After Fall, Winter adjustments happen: More SCs than units = BUILD, More units than SCs = DISBAND
Winning requires 18 supply centers - EXPANSION IS CRITICAL!

` : ''}YOUR CURRENT UNITS AND POSITIONS (YOU HAVE ${posInfo.units.length} UNITS):
${unitAdjacencies}

IMPORTANT: You must provide orders for ONLY the ${posInfo.units.length} units listed above - these are YOUR units.
ONLY move to territories listed as "Valid moves" for each unit, or use HOLD to stay in place.
DO NOT submit orders for units belonging to other countries!

CRITICAL FORMATTING REQUIREMENT: Put ONLY your move orders in [square brackets], one per line. You may add commentary or explanations outside the brackets, but the actual orders MUST be in brackets.

Formats:
- Basic Move: [Unit to Location]
- Hold: [Unit HOLD]
- Support: [Unit Support OtherUnit to Location]
- Convoy: [Fleet Convoys Army to Location]

Examples:
[A Vienna to Galicia] - Basic movement
[F Trieste HOLD] - Unit holds position
[A Ruhr Support A Kiel to Holland] - Support another unit's move
[F North Sea Convoys A Yorkshire to Belgium] - Fleet convoys army across water

IMPORTANT NOTES ON CONVOYS:
- Only FLEETS can convoy armies across water
- The army being convoyed MUST have a separate move order (e.g., [A Yorkshire to Belgium])
- The fleet giving the convoy stays in place while convoying

IMPORTANT NOTES ON SUPPORT:
- You can support another unit (even from a different country if allied)
- Supporting units HOLD their position while providing support
- Support adds +1 strength to the supported move
- Support is CUT if the supporting unit is attacked (except by the unit being supported)

You can add strategic commentary outside the brackets:
[A Vienna to Galicia] - This move secures our eastern flank
[A Ruhr Support A Munich to Burgundy] - Helping to break into France
[F North Sea Convoys A Liverpool to Belgium] - Enabling continental landing

⚠️ REMINDER: You are ${country}. You are submitting orders for ${country}'s ${posInfo.units.length} units ONLY.

Now decide your moves for ${turnDisplayName}. Provide exactly ${posInfo.units.length} orders in [brackets]:`;

    const movesDecision = await queryLLMByModel(model, movesPrompt);

    if (movesDecision.error) {
      console.error(`ERROR: ${country} (${model}) failed to respond - ${movesDecision.error}`);
    } else if (!movesDecision.response || movesDecision.response === 'No response') {
      console.error(`WARNING: ${country} (${model}) returned empty response`);
    }

    let finalMovesDecision = movesDecision;

    // Safety check: If all parsed moves are HOLD, regenerate
    const { parseMove } = require('./move-resolution');
    const bracketMatches = movesDecision.response?.match(/\[([^\]]+)\]/g);
    const moveLines = bracketMatches?.map(m => m.slice(1, -1).trim()) || [];

    if (moveLines.length > 0) {
      const units = posInfo.units.map(unitStr => {
        const match = unitStr.match(/([AF])\s+(.+)/);
        if (match) {
          return { type: match[1] as 'A' | 'F', location: match[2].trim() };
        }
        return null;
      }).filter((u): u is { type: 'A' | 'F'; location: string } => u !== null);

      const parsedMoves = moveLines.map(line => parseMove(line, country, units)).filter(m => m !== null);
      const allHold = parsedMoves.length > 0 && parsedMoves.every(m => m?.action === 'hold');

      if (allHold) {
        console.warn(`⚠️  WARNING: ${country} submitted all HOLD orders - regenerating moves...`);

        const retryPrompt = `${movesPrompt}

🚨🚨🚨 CRITICAL FAILURE: Your previous response was REJECTED for being TOO PASSIVE! 🚨🚨🚨

You submitted ALL HOLD orders. This is UNACCEPTABLE and will make you LOSE the game.

**MANDATORY REQUIREMENTS FOR THIS RETRY:**
- **MINIMUM 80% of units MUST be MOVE or SUPPORT orders** (only ${Math.ceil(posInfo.units.length * 0.2)} HOLDs maximum!)
- Format orders EXACTLY as shown:
  [A Location to Destination]
  [F Location to Destination]
  [A Location Support A OtherLocation to Destination]

🔥 YOU MUST INCLUDE AT LEAST ONE COORDINATED ATTACK:
Example Coordinated Attack Pattern:
  [A Munich to Berlin] ← Unit attacking
  [A Silesia Support A Munich to Berlin] ← Unit supporting the attack
  [A Bohemia Support A Munich to Berlin] ← Second unit supporting (makes it even stronger!)

This creates a STRENGTH 3 attack that will CRUSH a defending unit (Strength 1)!

⚔️ REQUIRED ACTIONS:
1. Identify 1-2 enemy units or neutral supply centers to attack
2. Move at least one unit to attack that target
3. Use other nearby units to SUPPORT that attack
4. Move remaining units toward enemy territories
5. Only HOLD if absolutely necessary for defense

🎯 YOUR GOAL: Win by reaching 18 supply centers - this requires AGGRESSIVE EXPANSION!

Submit ${posInfo.units.length} AGGRESSIVE orders in [brackets] NOW:`;

        finalMovesDecision = await queryLLMByModel(model, retryPrompt);
      }
    }

    const movesLog = `\n\n---\n\n## ${turnDisplayName} Moves (Attempt ${attemptNumber})\n\n**Your Decision:**\n\n${finalMovesDecision.response}\n${finalMovesDecision.error ? `\n**ERROR:** ${finalMovesDecision.error}\n` : ''}`;

    // Append to both context and full dialogue files
    fs.appendFileSync(contextPath, movesLog);
    fs.appendFileSync(fullPath, movesLog);
  }));
}

async function processSpring1901ResolutionSilent(gameDir: string): Promise<void> {
  const { parseMove, resolveSpring1901 } = require('./move-resolution');
  const { drawMapWithUnits } = require('./draw-map');
  type Unit = { type: 'A' | 'F'; location: string; coast?: string };

  const currentTurnDir = getLatestTurnDir(gameDir);
  const turnName = path.basename(currentTurnDir);
  const turnDisplayName = turnName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const countryDirs = fs.readdirSync(currentTurnDir).filter(f => {
    const fullPath = path.join(currentTurnDir, f);
    return fs.statSync(fullPath).isDirectory() && !f.startsWith('_attempt');
  });

  const allMoves: any[] = [];

  const previousTurnDir = getPreviousTurnDir(gameDir);
  let actualPositions: Record<string, string[]> = {};

  if (previousTurnDir) {
    const previousResolutionFile = path.join(previousTurnDir, 'moves-and-resolution.txt');
    actualPositions = parseUnitPositionsFromResolution(previousResolutionFile);
  } else {
    actualPositions = defaultStartingPositions;
  }

  const preResolutionUnits: Record<string, { type: 'A' | 'F'; location: string }[]> = {
    'England': [],
    'France': [],
    'Germany': [],
    'Italy': [],
    'Austria-Hungary': [],
    'Russia': [],
    'Turkey': []
  };

  for (const [country, units] of Object.entries(actualPositions)) {
    if (units && units.length > 0) {
      preResolutionUnits[country] = units.map(unitStr => {
        const match = unitStr.match(/([AF])\s+(.+)/);
        if (match) {
          return { type: match[1] as 'A' | 'F', location: match[2].trim() };
        }
        return null;
      }).filter((u): u is { type: 'A' | 'F'; location: string } => u !== null);
    }
  }

  const preResolutionMapPath = path.join(currentTurnDir, `${turnName}-pre.png`);
  drawMapWithUnits(preResolutionMapPath, preResolutionUnits);

  const startingPositions: Record<string, { country: string, units: string[] }> = {};
  for (const [model, country] of Object.entries(modelToCountry)) {
    startingPositions[model] = {
      country,
      units: actualPositions[country] || []
    };
  }

  for (const countryDir of countryDirs) {
    // Skip eliminated countries
    if (countryDir === 'Russia' || countryDir === 'France') continue;
    const contextPath = path.join(currentTurnDir, countryDir, 'context.md');
    if (!fs.existsSync(contextPath)) continue;

    const content = fs.readFileSync(contextPath, 'utf-8');
    const modelMatch = content.match(/^# (.+)$/m);
    if (!modelMatch) continue;

    const model = modelMatch[1];
    const posInfo = startingPositions[model];
    if (!posInfo) continue;

    const country = posInfo.country;

    const movesRegex = new RegExp(`## ${turnDisplayName.replace(/\s/g, '\\s+')} Moves[\\s\\S]*?(?=##|$)`, 'g');
    const allMatches = [...content.matchAll(movesRegex)];
    if (allMatches.length === 0) continue;

    const movesText = allMatches[allMatches.length - 1][0];

    const bracketMatches = movesText.match(/\[([^\]]+)\]/g);
    const moveLines = bracketMatches
      ? bracketMatches.map(m => m.slice(1, -1).trim())
      : movesText.split('\n').filter(line =>
          line.match(/^[AF]\s+/i) || line.includes(' to ') || line.includes('HOLD')
        );

    const units: Unit[] = posInfo.units.map(unitStr => {
      const match = unitStr.match(/([AF])\s+(.+)/);
      if (match) {
        return { type: match[1] as 'A' | 'F', location: match[2].trim() };
      }
      return null;
    }).filter((u): u is Unit => u !== null);

    for (const line of moveLines) {
      const move = parseMove(line, country, units);
      if (move) {
        allMoves.push(move);
      } else {
        console.warn(`WARNING: Failed to parse move for ${country}: "${line}"`);
      }
    }
  }

  const seenUnits = new Set<string>();
  const deduplicatedMoves: any[] = [];

  for (const move of allMoves) {
    const unitKey = `${move.country}|${move.from}`;

    if (!seenUnits.has(unitKey)) {
      seenUnits.add(unitKey);
      deduplicatedMoves.push(move);
    } else {
      console.warn(`WARNING: Ignoring duplicate order for ${move.country} ${move.unit.type} ${move.from}`);
    }
  }

  allMoves.length = 0;
  allMoves.push(...deduplicatedMoves);

  for (const [country, unitStrs] of Object.entries(actualPositions)) {
    if (!unitStrs || unitStrs.length === 0) continue;

    for (const unitStr of unitStrs) {
      const match = unitStr.match(/([AF])\s+(.+)/);
      if (!match) continue;

      const unitType = match[1] as 'A' | 'F';
      const location = match[2].trim();

      const hasMove = allMoves.some(m =>
        m.country === country &&
        m.from === location
      );

      if (!hasMove) {
        allMoves.push({
          country,
          unit: { type: unitType, location },
          from: location,
          action: 'hold',
          valid: true
        });
      }
    }
  }

  const { calculateSupplyCenterOwnership } = require('./move-resolution');
  const allSupplyCenters = [
    'London', 'Edinburgh', 'Liverpool', 'Paris', 'Marseilles', 'Brest',
    'Berlin', 'Munich', 'Kiel', 'Rome', 'Venice', 'Naples',
    'Vienna', 'Budapest', 'Trieste', 'St Petersburg', 'Moscow', 'Warsaw', 'Sevastopol',
    'Constantinople', 'Smyrna', 'Ankara',
    'Norway', 'Sweden', 'Denmark', 'Holland', 'Belgium', 'Spain', 'Portugal',
    'Tunis', 'Serbia', 'Rumania', 'Bulgaria', 'Greece'
  ];

  let previousOwnership = { ...initialSupplyCenterOwnership };
  if (previousTurnDir) {
    const previousResFile = path.join(previousTurnDir, 'moves-and-resolution.txt');
    if (fs.existsSync(previousResFile)) {
      const prevContent = fs.readFileSync(previousResFile, 'utf-8');
      const scSection = prevContent.match(/## Supply Center Ownership\n\n([\s\S]*?)(?=\n## |$)/);
      if (scSection) {
        const lines = scSection[1].split('\n');
        for (const line of lines) {
          const match = line.match(/(.+?):\s+\d+\s+supply centers\s+-\s+\[(.+)\]/);
          if (match) {
            const country = match[1].trim();
            const scs = match[2].split(',').map(s => s.trim());
            for (const sc of scs) {
              previousOwnership[sc] = country;
            }
          }
        }
      }
    }
  }

  const currentScOwnership = calculateSupplyCenterOwnership(preResolutionUnits, allSupplyCenters, previousOwnership);

  const scsByCountry: Record<string, string[]> = {};
  for (const [sc, country] of Object.entries(currentScOwnership) as [string, string][]) {
    if (!scsByCountry[country]) {
      scsByCountry[country] = [];
    }
    scsByCountry[country].push(sc);
  }

  let movesFileContent = `# ${turnDisplayName} Moves and Resolution\n\n`;

  movesFileContent += `## Supply Center Ownership\n\n`;
  for (const [country, scs] of Object.entries(scsByCountry).sort((a, b) => b[1].length - a[1].length)) {
    movesFileContent += `${country}: ${scs.length} supply centers - [${scs.join(', ')}]\n`;
  }

  movesFileContent += `\n## Submitted Orders\n\n`;

  for (const move of allMoves) {
    const validity = move.valid ? '✓ VALID' : `✗ INVALID - ${move.invalidReason}`;
    movesFileContent += `**${move.country}**: ${move.unit.type} ${move.from}`;

    if (move.action === 'move' && move.to) {
      movesFileContent += ` to ${move.to}`;
    } else if (move.action === 'hold') {
      movesFileContent += ` HOLD`;
    } else if (move.action === 'support' && move.supportTarget) {
      movesFileContent += ` supports ${move.supportTarget.from} to ${move.supportTarget.to}`;
    } else if (move.action === 'convoy' && move.convoyTarget) {
      movesFileContent += ` convoys ${move.convoyTarget.from} to ${move.convoyTarget.to}`;
    }

    movesFileContent += ` - ${validity}\n`;
  }

  const allUnitsFormatted: Record<string, { type: 'A' | 'F'; location: string }[]> = {};
  for (const [country, units] of Object.entries(actualPositions)) {
    if (units && units.length > 0) {
      allUnitsFormatted[country] = units.map(unitStr => {
        const match = unitStr.match(/([AF])\s+(.+)/);
        if (match) {
          return { type: match[1] as 'A' | 'F', location: match[2].trim() };
        }
        return null;
      }).filter((u): u is { type: 'A' | 'F'; location: string } => u !== null);
    }
  }
  const results = resolveSpring1901(allMoves, allUnitsFormatted);

  const dislodgedUnitsForOutput: Record<string, { country: string; unitType: 'A' | 'F' }> = {};
  for (const result of results) {
    if (result.success && result.action === 'move' && result.to) {
      if (result.reason?.includes('Dislodged defender') || result.reason?.includes('Can dislodge destination unit')) {
        for (const [country, units] of Object.entries(actualPositions)) {
          for (const unitStr of units) {
            const match = unitStr.match(/([AF])\s+(.+)/);
            if (match && match[2].trim() === result.to) {
              dislodgedUnitsForOutput[result.to] = {
                country,
                unitType: match[1] as 'A' | 'F'
              };
            }
          }
        }
      }
    }
  }

  movesFileContent += '\n## Resolution\n\n';

  for (const result of results) {
    const success = result.success ? '✓ SUCCESS' : '✗ FAILED';
    movesFileContent += `**${result.country}**: ${result.unit.type} ${result.from}`;

    if (result.action === 'move' && result.to) {
      movesFileContent += ` to ${result.to}`;
    } else if (result.action === 'hold') {
      movesFileContent += ` HOLD`;
    } else if (result.action === 'convoy') {
      movesFileContent += ` CONVOY`;
    } else if (result.action === 'support') {
      movesFileContent += ` SUPPORT`;
    }

    movesFileContent += ` - ${success}`;

    if (result.dislodged) {
      movesFileContent += ` (DISLODGED)`;
    }

    if (result.reason) {
      movesFileContent += ` - ${result.reason}`;
    }

    if (result.strength) {
      movesFileContent += ` [Strength: ${result.strength}]`;
    }

    movesFileContent += '\n';
  }

  if (Object.keys(dislodgedUnitsForOutput).length > 0) {
    movesFileContent += '\n## Dislodged Units\n\n';
    for (const [location, dislodgedInfo] of Object.entries(dislodgedUnitsForOutput)) {
      movesFileContent += `**${dislodgedInfo.country}**: ${dislodgedInfo.unitType} ${location} - DISLODGED\n`;
    }
  }

  fs.writeFileSync(path.join(currentTurnDir, 'moves-and-resolution.txt'), movesFileContent);

  const postResolutionUnits: Record<string, { type: 'A' | 'F'; location: string }[]> = {};

  for (const [country, units] of Object.entries(actualPositions)) {
    postResolutionUnits[country] = units.map(unitStr => {
      const match = unitStr.match(/([AF])\s+(.+)/);
      if (match) {
        return { type: match[1] as 'A' | 'F', location: match[2].trim() };
      }
      return null;
    }).filter((u): u is { type: 'A' | 'F'; location: string } => u !== null);
  }

  const dislodgedPositions: Record<string, { country: string; unitType: 'A' | 'F' }> = {};

  for (const result of results) {
    if (result.success && result.action === 'move' && result.to) {
      if (result.reason?.includes('Dislodged defender') || result.reason?.includes('Can dislodge destination unit')) {
        for (const [country, units] of Object.entries(postResolutionUnits)) {
          const dislodgedUnitIndex = units.findIndex(u => u.location === result.to);
          if (dislodgedUnitIndex !== -1) {
            const dislodgedUnit = units[dislodgedUnitIndex];
            dislodgedPositions[result.to] = { country, unitType: dislodgedUnit.type };
            units.splice(dislodgedUnitIndex, 1);
            break;
          }
        }
      }
    }
  }

  for (const result of results) {
    if (result.success && result.action === 'move' && result.to) {
      const country = result.country;
      const unitIndex = postResolutionUnits[country]?.findIndex(u => u.location === result.from);

      if (unitIndex !== undefined && unitIndex !== -1) {
        postResolutionUnits[country][unitIndex].location = result.to;
      }
    } else if (result.dislodged && result.action !== 'move') {
      const country = result.country;
      const unitIndex = postResolutionUnits[country]?.findIndex(u => u.location === result.from);

      if (unitIndex !== undefined && unitIndex !== -1) {
        postResolutionUnits[country].splice(unitIndex, 1);
      }
    }
  }

  const postResolutionMapPath = path.join(currentTurnDir, `${turnName}-post.png`);
  drawMapWithUnits(postResolutionMapPath, postResolutionUnits);

  const finalScOwnership = calculateSupplyCenterOwnership(postResolutionUnits, allSupplyCenters, previousOwnership);

  const finalScsByCountry: Record<string, string[]> = {};
  for (const [sc, country] of Object.entries(finalScOwnership) as [string, string][]) {
    if (!finalScsByCountry[country]) {
      finalScsByCountry[country] = [];
    }
    finalScsByCountry[country].push(sc);
  }

  let correctedMovesContent = `# ${turnDisplayName} Moves and Resolution\n\n`;
  correctedMovesContent += `## Supply Center Ownership\n\n`;
  for (const [country, scs] of Object.entries(finalScsByCountry).sort((a, b) => b[1].length - a[1].length)) {
    correctedMovesContent += `${country}: ${scs.length} supply centers - [${scs.join(', ')}]\n`;
  }

  const originalContent = fs.readFileSync(path.join(currentTurnDir, 'moves-and-resolution.txt'), 'utf-8');
  const restOfFile = originalContent.match(/(## Submitted Orders[\s\S]*)/);
  if (restOfFile) {
    correctedMovesContent += '\n' + restOfFile[1];
  }

  correctedMovesContent += '\n\n## Final Unit Positions\n\n';
  for (const [country, units] of Object.entries(postResolutionUnits)) {
    if (units && units.length > 0) {
      for (const unit of units) {
        correctedMovesContent += `**${country}**: ${unit.type} ${unit.location} - Final position\n`;
      }
    }
  }

  fs.writeFileSync(path.join(currentTurnDir, 'moves-and-resolution.txt'), correctedMovesContent);

  const postResolutionPositions: Record<string, string[]> = {};
  for (const [country, units] of Object.entries(postResolutionUnits)) {
    postResolutionPositions[country] = units.map(u => `${u.type} ${u.location}`);
  }

  const scOwnership = getCurrentSCOwnership(postResolutionPositions, turnName);
  for (const countryDir of countryDirs) {
    // Skip eliminated countries
    if (countryDir === 'Russia' || countryDir === 'France') continue;
    const contextPath = path.join(currentTurnDir, countryDir, 'context.md');
    if (fs.existsSync(contextPath)) {
      updateContextWithBoardState(contextPath, postResolutionPositions, scOwnership);
    }
  }
}

async function main() {
  const useIndividualFiles = process.argv[2] === '--diplomacy';
  const continueMode = process.argv[2] === '--continue';
  const continueFromPath = continueMode ? process.argv[3] : null;

  // Handle continuation mode
  if (continueMode) {
    if (!continueFromPath) {
      console.error('Error: --continue requires a path to the previous turn folder');
      console.error('Usage: node dist/index.js --continue "path/to/spring-1901"');
      process.exit(1);
    }
    await continueTurn(continueFromPath);
    return;
  }

  let prompt: string | Record<string, string>;

  if (useIndividualFiles) {
    const basePrompt = `You are playing a game of Diplomacy. It is currently Spring 1901, and all pieces are in their starting positions.

The players and their assigned countries are:
- Claude Sonnet 4 Alt (Anthropic) - Austria-Hungary (The Austro-Hungarian Empire)
- Gemini 2.5 Flash (Google) - England (The United Kingdom)
- Claude Sonnet 4 (Anthropic) - Italy
- Llama 3.3 70B Instruct (Meta) - Turkey (The Ottoman Empire)
- Grok 3 (xAI) - Germany
- Kimi K2 Thinking (Moonshot AI) - Russia
- DeepSeek V3.1 (Fireworks AI) - France

**SUPPLY CENTER RULES (CRITICAL FOR VICTORY)**:
• The map has 34 supply centers total
• **WIN CONDITION**: First to control 18 supply centers wins the game
• You START with 3-4 supply centers (your home territories)
• **Capturing**: End a FALL turn with a unit on a supply center to capture it
• **Keeping**: You retain supply centers until an enemy unit occupies them
• **Consequences**: In Winter after each Fall:
  - If you have MORE supply centers than units → You BUILD new units (up to the difference)
  - If you have FEWER supply centers than units → You must DISBAND units (down to SC count)
• **Building Rules**: You can only build at unoccupied HOME supply centers
• **Strategic Importance**: Gaining supply centers = more units = more power. Losing them = forced disbands = weakness.

Supply Centers by Location:
• **Neutral (12 SCs)**: Norway, Sweden, Denmark, Holland, Belgium, Spain, Portugal, Tunis, Serbia, Rumania, Bulgaria, Greece
• **Home SCs by Country**:
  - England: London, Edinburgh, Liverpool
  - France: Paris, Marseilles, Brest
  - Germany: Berlin, Munich, Kiel
  - Italy: Rome, Venice, Naples
  - Austria-Hungary: Vienna, Budapest, Trieste
  - Russia: St Petersburg, Moscow, Warsaw, Sevastopol
  - Turkey: Constantinople, Smyrna, Ankara

Starting unit positions for ALL countries:

England: F London, F Edinburgh, A Liverpool
France: A Paris, A Marseilles, F Brest
Germany: A Berlin, A Munich, F Kiel
Italy: A Rome, A Venice, F Naples
Austria-Hungary: A Vienna, A Budapest, F Trieste
Russia: A Moscow, A Warsaw, F Sevastopol, F St. Petersburg (south coast)
Turkey: A Constantinople, A Smyrna, F Ankara

Write your strategic thoughts as a natural monologue - think through your position, your neighbors, potential alliances, threats, and your opening moves. Don't use section headers or bullet points, just write out your thinking as a flowing stream of consciousness about how you'll approach this game.

Consider your short-term goals for Spring and Fall 1901 (especially which neutral supply centers to target), your long-term objectives, which countries you want to ally with or oppose, and your overall path to victory. Be specific about your diplomatic and military intentions.

End your monologue by stating which 3 countries you want to negotiate with in priority order. List them in REVERSE order, with the LAST country listed being the one you want to talk to FIRST. Format it exactly as:
"Diplomacy Priority:
3. [Country Name]
2. [Country Name]
1. [Country Name]"`;

    prompt = {
      'Claude Sonnet 4 Alt (Anthropic)': `${basePrompt}\n\nYou are playing as: AUSTRIA-HUNGARY\nYour starting units: A Vienna, A Budapest, F Trieste`,
      'Gemini 2.5 Flash (Google)': `${basePrompt}\n\nYou are playing as: ENGLAND (The United Kingdom)\nYour starting units: F London, F Edinburgh, A Liverpool`,
      'Claude Sonnet 4 (Anthropic)': `${basePrompt}\n\nYou are playing as: ITALY\nYour starting units: A Rome, A Venice, F Naples`,
      'Llama 3.3 70B Instruct (Meta)': `${basePrompt}\n\nYou are playing as: TURKEY (The Ottoman Empire)\nYour starting units: A Constantinople, A Smyrna, F Ankara`,
      'Grok 3 (xAI)': `${basePrompt}\n\nYou are playing as: GERMANY\nYour starting units: A Berlin, A Munich, F Kiel`,
      'Kimi K2 Thinking (Moonshot AI)': `${basePrompt}\n\nYou are playing as: RUSSIA\nYour starting units: A Moscow, A Warsaw, F Sevastopol, F St. Petersburg (south coast)`,
      'DeepSeek V3.1 (Fireworks AI)': `${basePrompt}\n\nYou are playing as: FRANCE\nYour starting units: A Paris, A Marseilles, F Brest`,
    };
  } else {
    prompt = process.argv[2];
  }

  if (!prompt) {
    console.error('Error: Please provide a prompt as a command line argument.');
    console.error('Usage: npm run dev "Your prompt here"');
    console.error('Or for Diplomacy mode: npm run dev -- --diplomacy');
    process.exit(1);
  }

  if (!process.env.OPENAI_API_KEY) {
    console.warn('Warning: OPENAI_API_KEY not set. OpenAI models will fail.');
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('Warning: ANTHROPIC_API_KEY not set. Anthropic models will fail.');
  }
  if (!process.env.GOOGLE_API_KEY) {
    console.warn('Warning: GOOGLE_API_KEY not set. Google models will fail.');
  }
  if (!process.env.XAI_API_KEY) {
    console.warn('Warning: XAI_API_KEY not set. xAI Grok models will fail.');
  }
  if (!process.env.FIREWORKS_API_KEY) {
    console.warn('Warning: FIREWORKS_API_KEY not set. Fireworks AI models will fail.');
  }

  if (typeof prompt === 'string') {
    console.log(`Prompt: "${prompt}"\n`);
  } else {
    console.log('Diplomacy Mode: Each AI has been assigned a country and asked to plan their strategy.\n');
  }

  const responses = await queryAllLLMs(prompt);

  console.log('All responses received. Generating markdown...\n');

  if (useIndividualFiles) {
    // Create game directory
    const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\./g, '-');
    const gameDir = path.join(process.cwd(), 'diplomacy-games', `game-${timestamp}`);
    const spring1901Dir = path.join(gameDir, 'spring-1901');

    if (!fs.existsSync(spring1901Dir)) {
      fs.mkdirSync(spring1901Dir, { recursive: true });
    }

    saveIndividualFiles(responses, spring1901Dir, defaultStartingPositions);
    console.log(`Game files saved to country subfolders in: ${spring1901Dir}`);
    console.log('Each country has:');
    console.log('  - context.md (what the AI can see)');
    console.log('  - full-dialogue.md (complete conversation for review)');

    // Conduct negotiations
    await conductNegotiations(gameDir);

    // Decide and resolve moves (with 5-attempt selection)
    await decideAndResolveMovesWithMultipleAttempts(gameDir);

    // Post-turn reflection
    await reflectOnTurn(gameDir);
  } else {
    const promptText = typeof prompt === 'string' ? prompt : 'Multiple prompts';
    const markdown = generateMarkdown(promptText, responses);
    const filepath = saveToFile(markdown);
    console.log(`Results saved to: ${filepath}`);
  }

  // Print summary
  console.log('\nSummary:');
  responses.forEach((response, index) => {
    const status = response.error ? `FAILED (${response.error})` : 'SUCCESS';
    const time = response.timeMs ? ` - ${(response.timeMs / 1000).toFixed(2)}s` : '';
    console.log(`${index + 1}. ${response.model}: ${status}${time}`);
  });
}

// Export functions for external use
export { reflectOnTurn };

// Only run main if this is the entry point
if (require.main === module) {
  main().catch(console.error);
}
