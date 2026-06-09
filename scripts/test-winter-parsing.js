// Test parsing winter moves-and-resolution.txt

const fs = require('fs');

const content = fs.readFileSync('diplomacy-games/game-2025-12-19T06-12-57-290Z/winter-1901/moves-and-resolution.txt', 'utf-8');

const unitPositions = {
  'England': [],
  'France': [],
  'Germany': [],
  'Italy': [],
  'Austria-Hungary': [],
  'Russia': [],
  'Turkey': []
};

// Parse the resolution section to find final unit positions
const resolutionMatch = content.match(/## (Resolution|Final Unit Positions)([\s\S]*)/);
if (!resolutionMatch) {
  console.log('No resolution section found!');
  process.exit(1);
}

const resolutionText = resolutionMatch[2];
const lines = resolutionText.split('\n');

console.log('Parsing winter-1901/moves-and-resolution.txt...\n');

for (const line of lines) {
  // Check for HOLD commands: **Turkey**: A Constantinople HOLD - ✓ SUCCESS [Strength: 1]
  const holdMatch = line.match(/\*\*(.+?)\*\*:\s+([AF])\s+(.+?)\s+HOLD\s+-\s+✓\s+SUCCESS/);
  if (holdMatch) {
    const country = holdMatch[1];
    const unitType = holdMatch[2];
    const location = holdMatch[3];

    if (!unitPositions[country]) {
      console.log(`WARNING: Unknown country: ${country}`);
      unitPositions[country] = [];
    }

    unitPositions[country].push(`${unitType} ${location}`);
    console.log(`✓ Parsed: ${country} ${unitType} ${location}`);
    continue;
  }
}

console.log('\n=== Results ===\n');

for (const [country, units] of Object.entries(unitPositions)) {
  console.log(`${country}: ${units.length} units`);
  units.forEach(u => console.log(`  - ${u}`));
}

let total = 0;
for (const units of Object.values(unitPositions)) {
  total += units.length;
}

console.log(`\nTotal units: ${total}`);
console.log(`Expected: 28`);
console.log(total === 28 ? '\n✓ TEST PASSED' : '\n✗ TEST FAILED');
