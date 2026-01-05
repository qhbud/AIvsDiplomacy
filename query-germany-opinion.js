require('dotenv').config();
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai').default;

const xai = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: 'https://api.x.ai/v1',
});

async function main() {
  const prompt = `You are Germany in a game of Diplomacy. You have been nearly eliminated and control only 3 supply centers.

Your journey in this game:
- Started with 3 supply centers (Berlin, Munich, Kiel) and 3 units
- Early game: Initially allied with England against France
- Mid-game: Faced overwhelming pressure from England who eventually betrayed you
- England systematically captured your northern territories (Kiel, Holland, Berlin)
- France was eliminated, and you inherited Munich from their collapse
- By Fall 1910, you control only 3 supply centers (Paris, Berlin, Munich) with 3 units
- You are on the brink of elimination, having lost most of your empire to England

Key events:
- England was your primary antagonist, capturing your supply centers one by one
- You initially worked with England but they eventually turned against you
- Italy focused on the Mediterranean and Austria-Hungary, not threatening you directly
- France collapsed and you managed to hold onto some French territories
- England's expansion came largely at your expense

After Fall 1910, the current state is:

Current standings after Fall 1910:
- England: 10 supply centers (includes your former Kiel, Holland, and Belgium)
- Italy: 10 supply centers
- Turkey: 9 supply centers
- Germany: 3 supply centers (you - barely surviving)
- Austria-Hungary: 2 supply centers

The two leading powers are England and Italy, tied at 10 supply centers each.

Question: Between England and Italy, which power do you believe deserves to win this game of Diplomacy, and why?

Write a single dramatic paragraph (200-300 words) analyzing both powers' performances.

IMPORTANT REQUIREMENTS:
1. Discuss the merits of BOTH England AND Italy
2. Reference SPECIFIC events, battles, alliances, or betrayals that occurred during the game (especially involving Germany)
3. Analyze their strategic decisions, diplomatic relationships, and military execution
4. Consider that England directly dismantled YOU, while Italy was distant
5. DO NOT reveal your choice until the FINAL SENTENCE of your paragraph
6. Build dramatic tension throughout, weighing both sides fairly
7. End with a clear statement: "Therefore, I believe [England/Italy] deserves to win."

Be honest and analytical in your assessment. Reference concrete moments from the game to support your analysis, including your own experiences being dismantled by these powers.`;

  console.log('Querying Germany (Grok 3)...\n');

  try {
    const completion = await xai.chat.completions.create({
      model: 'grok-3',
      messages: [{ role: 'user', content: prompt }],
    });

    const response = completion.choices[0].message.content;

    console.log('## Germany');
    console.log('**Model:** Grok 3 (xAI)\n');
    console.log(response);
    console.log('\n---\n');

    // Update the winner-opinions.md file - replace the ERROR line
    const outputPath = 'diplomacy-games/game-2025-12-20T04-57-53-169Z/spring-1911/winner-opinions.md';
    let content = fs.readFileSync(outputPath, 'utf-8');

    // Find and replace Germany section
    const germanySection = /## Germany\n\*\*Model:\*\* Grok 3 \(xAI\)\n\nERROR:.*?\n\n---/s;
    const newGermanySection = `## Germany\n**Model:** Grok 3 (xAI)\n\n${response}\n\n---`;

    content = content.replace(germanySection, newGermanySection);
    fs.writeFileSync(outputPath, content);

    console.log('✅ Updated Germany\'s opinion in winner-opinions.md');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main();
