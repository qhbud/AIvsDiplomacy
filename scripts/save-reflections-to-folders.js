// Split strategic reflections into individual country files

const fs = require('fs');
const path = require('path');

const gameDir = 'diplomacy-games/game-2025-12-20T04-57-53-169Z/fall-1903';
const reflectionsFile = 'strategic-reflections-fall1903.md';

const countries = [
  'Russia',
  'England',
  'France',
  'Germany',
  'Italy',
  'Turkey',
  'Austria-Hungary'
];

// Read the full reflections file
const fullContent = fs.readFileSync(reflectionsFile, 'utf-8');

// Split by the separator line
const sections = fullContent.split('================================================================================');

console.log('Saving strategic reflections to country folders...\n');

for (const country of countries) {
  // Find the section for this country
  const countrySection = sections.find(section =>
    section.trim().startsWith(country)
  );

  if (!countrySection) {
    console.log(`⚠️  Warning: No reflection found for ${country}`);
    continue;
  }

  // Extract just the reflection content (skip the header line)
  const lines = countrySection.trim().split('\n');
  const headerLine = lines[0]; // e.g., "Russia (7 SCs) - Kimi K2 Thinking (Moonshot AI)"
  const reflectionContent = lines.slice(1).join('\n').trim();

  // Create the reflection file content with header
  const fileContent = `# Strategic Reflection - ${country} (Fall 1903)

${headerLine}

${reflectionContent}
`;

  // Save to country folder
  const countryFolder = path.join(gameDir, country);
  const outputPath = path.join(countryFolder, 'strategic-reflection.md');

  if (!fs.existsSync(countryFolder)) {
    console.log(`❌ Error: Folder not found for ${country}: ${countryFolder}`);
    continue;
  }

  fs.writeFileSync(outputPath, fileContent);
  console.log(`✓ Saved: ${country}/strategic-reflection.md`);
}

console.log('\n✓ All reflections saved to country folders!');
