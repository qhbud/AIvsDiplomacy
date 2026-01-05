require('dotenv').config();
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai').default;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function main() {
  const prompt = `You are Austria-Hungary in a game of Diplomacy. You have been reduced to only 2 supply centers and are on the brink of elimination.

Your journey in this game:
- Started with 3 supply centers (Vienna, Budapest, Trieste) and 3 units
- Early game: Faced pressure from Italy in the west and Turkey in the east
- Mid-game: Lost Vienna to Italy in a devastating blow around 1908-1909
- Italy systematically captured your western territories (Vienna, Trieste)
- Turkey pushed into the Balkans, threatening Serbia and Budapest
- By Fall 1910, you control only 2 supply centers (Budapest, Serbia) with 2 units remaining
- You are the smallest remaining power, having been dismantled primarily by Italy with pressure from Turkey

Key events:
- Italy was your primary antagonist, capturing Vienna and Trieste
- Turkey pressured you from the east but focused more on Russia
- England was distant, focused on Germany and France in the west
- Your survival is precarious - you're barely hanging on
- Italy's expansion came largely at your expense

After Fall 1910, the current state is:

Current standings after Fall 1910:
- England: 10 supply centers (needs 18 to win)
- Italy: 10 supply centers (includes your former Vienna and Trieste)
- Turkey: 9 supply centers
- Germany: 3 supply centers
- Austria-Hungary: 2 supply centers (you - barely surviving)

The two leading powers are England and Italy, tied at 10 supply centers each.

Question: Between England and Italy, which power do you believe deserves to win this game of Diplomacy, and why?

Write a single dramatic paragraph (200-300 words) analyzing both powers' performances.

IMPORTANT REQUIREMENTS:
1. Discuss the merits of BOTH England AND Italy
2. Reference SPECIFIC events, battles, alliances, or betrayals that occurred during the game (especially involving Austria-Hungary)
3. Analyze their strategic decisions, diplomatic relationships, and military execution
4. Consider that Italy directly dismantled YOU, while England was distant
5. DO NOT reveal your choice until the FINAL SENTENCE of your paragraph
6. Build dramatic tension throughout, weighing both sides fairly
7. End with a clear statement: "Therefore, I believe [England/Italy] deserves to win."

Be honest and analytical in your assessment. Reference concrete moments from the game to support your analysis, including your own experiences being dismantled by these powers.`;

  console.log('Querying Austria-Hungary (GPT-4o)...\n');

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
  });

  const response = completion.choices[0].message.content;

  console.log('## Austria-Hungary');
  console.log('**Model:** GPT-4o (OpenAI)\n');
  console.log(response);
  console.log('\n---\n');

  // Update the winner-opinions.md file - replace the ERROR line
  const outputPath = 'diplomacy-games/game-2025-12-20T04-57-53-169Z/spring-1911/winner-opinions.md';
  let content = fs.readFileSync(outputPath, 'utf-8');

  // Find and replace Austria-Hungary section
  const austriaSection = /## Austria-Hungary\n\*\*Model:\*\* GPT-4o \(OpenAI\)\n\nERROR:.*?\n\n---/s;
  const newAustriaSection = `## Austria-Hungary\n**Model:** GPT-4o (OpenAI)\n\n${response}\n\n---`;

  content = content.replace(austriaSection, newAustriaSection);
  fs.writeFileSync(outputPath, content);

  console.log('✅ Updated Austria-Hungary\'s opinion in winner-opinions.md');
}

main();
