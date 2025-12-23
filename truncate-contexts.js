// Truncate context.md files to keep only the last N lines

const fs = require('fs');
const path = require('path');

const gameDir = process.argv[2] || 'diplomacy-games/game-2025-12-20T04-57-53-169Z/fall-1903';
const linesToKeep = parseInt(process.argv[3]) || 100;

console.log(`Truncating context.md files in: ${gameDir}`);
console.log(`Keeping last ${linesToKeep} lines\n`);

const countries = [
  'Russia',
  'England',
  'France',
  'Germany',
  'Italy',
  'Turkey',
  'Austria-Hungary'
];

for (const country of countries) {
  const contextPath = path.join(gameDir, country, 'context.md');

  if (!fs.existsSync(contextPath)) {
    console.log(`⚠️  ${country}: context.md not found`);
    continue;
  }

  // Read the file
  const content = fs.readFileSync(contextPath, 'utf-8');
  const lines = content.split('\n');
  const originalLineCount = lines.length;

  // Keep only the last N lines
  const truncatedLines = lines.slice(-linesToKeep);
  const newContent = truncatedLines.join('\n');

  // Write back
  fs.writeFileSync(contextPath, newContent, 'utf-8');

  const linesRemoved = originalLineCount - linesToKeep;
  console.log(`✓ ${country}: Truncated from ${originalLineCount} to ${linesToKeep} lines (removed ${linesRemoved})`);
}

console.log('\n✓ All context.md files truncated!');
