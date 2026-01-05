require('dotenv').config();
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai').default;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function main() {
  const prompt = `You are Russia in a game of Diplomacy. You were eliminated from the game during 1910, losing all your territories to Turkey.

Your journey in this game:
- Started with 4 supply centers (St Petersburg, Moscow, Warsaw, Sevastopol) and 4 units
- Early game: Faced aggressive expansion from Turkey in the south
- Mid-game: Fought a losing war against Turkey who systematically captured your southern territories (Sevastopol, then Warsaw, then Moscow)
- England focused on western expansion against Germany and France, taking minimal action against you
- Italy focused on the Mediterranean and Balkans, never directly threatening Russian territories
- By Fall 1909, you were reduced to just 1 unit (A Galicia) with no supply centers remaining
- Winter 1909-1910: You were completely eliminated as Turkey captured your last territories

Key events:
- Turkey was your primary antagonist throughout the game, relentlessly pushing north
- England betrayed France early and expanded into Scandinavia, but didn't directly attack you
- Italy systematically dismantled Austria-Hungary and expanded in the Mediterranean
- You attempted various alliances but couldn't stem Turkey's advance
- Your elimination was primarily due to Turkey's focused aggression

After your elimination, the game progressed to Fall 1910. Here is the current state:

Current standings after Fall 1910:
- England: 10 supply centers (needs 18 to win)
- Italy: 10 supply centers
- Turkey: 9 supply centers (Turkey now controls all your former territories: St Petersburg, Moscow, Warsaw, Sevastopol)
- Germany: 3 supply centers
- Austria-Hungary: 2 supply centers

The two leading powers are England and Italy, tied at 10 supply centers each.

Question: Between England and Italy, which power do you believe deserves to win this game of Diplomacy, and why?

Write a single dramatic paragraph (200-300 words) analyzing both powers' performances.

IMPORTANT REQUIREMENTS:
1. Discuss the merits of BOTH England AND Italy
2. Reference SPECIFIC events, battles, alliances, or betrayals that occurred during the game (especially involving Russia)
3. Analyze their strategic decisions, diplomatic relationships, and military execution
4. Consider who was your greatest threat and who contributed to Russia's downfall
5. DO NOT reveal your choice until the FINAL SENTENCE of your paragraph
6. Build dramatic tension throughout, weighing both sides fairly
7. End with a clear statement: "Therefore, I believe [England/Italy] deserves to win."

Be honest and analytical in your assessment. Reference concrete moments from the game to support your analysis, including your own experiences fighting against these powers.`;

  console.log('Querying Russia (using GPT-4o as fallback since Kimi API has issues)...\n');

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
  });

  const response = completion.choices[0].message.content;

  console.log('## Russia');
  console.log('**Model:** Kimi K2 Thinking (Moonshot AI) [Using GPT-4o fallback due to API issues]\n');
  console.log(response);
  console.log('\n---\n');

  // Append to the winner-opinions.md file
  const outputPath = 'diplomacy-games/game-2025-12-20T04-57-53-169Z/spring-1911/winner-opinions.md';
  const appendContent = `\n## Russia\n**Model:** Kimi K2 Thinking (Moonshot AI) [Using GPT-4o fallback due to API issues]\n\n${response}\n\n---\n\n`;
  fs.appendFileSync(outputPath, appendContent);
  console.log('✅ Appended Russia\'s opinion to winner-opinions.md');
}

main();
