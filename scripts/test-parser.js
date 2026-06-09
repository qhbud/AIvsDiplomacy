const fs = require('fs');
const path = require('path');

// Copy the parseUnitPositionsFromResolution function
function parseUnitPositionsFromResolution(resolutionFilePath) {
  if (!fs.existsSync(resolutionFilePath)) {
    console.log(`File not found: ${resolutionFilePath}`);
    return {};
  }

  const content = fs.readFileSync(resolutionFilePath, 'utf-8');
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
    console.log('No Resolution or Final Unit Positions section found');
    return unitPositions;
  }

  const resolutionText = resolutionMatch[2];
  const lines = resolutionText.split('\n');

  for (const line of lines) {
    // Check for Unchanged lines from retreat phases
    const unchangedMatch = line.match(/\*\*(.+?)\*\*:\s+([AF])\s+(.+?)\s+-\s+Unchanged/);
    if (unchangedMatch) {
      const country = unchangedMatch[1];
      const unitType = unchangedMatch[2];
      const location = unchangedMatch[3];

      if (!unitPositions[country]) {
        unitPositions[country] = [];
      }

      unitPositions[country].push(`${unitType} ${location}`);
      continue;
    }

    // Check for HOLD commands
    const holdMatch = line.match(/\*\*(.+?)\*\*:\s+([AF])\s+(.+?)\s+HOLD\s+-\s+✓\s+SUCCESS/);
    if (holdMatch) {
      const country = holdMatch[1];
      const unitType = holdMatch[2];
      const location = holdMatch[3];

      if (!unitPositions[country]) {
        unitPositions[country] = [];
      }

      unitPositions[country].push(`${unitType} ${location}`);
      continue;
    }

    // Match move lines
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

      let finalLocation = from;
      if (success && to) {
        finalLocation = to;
      }

      finalLocation = finalLocation.split(' - ')[0].trim();

      unitPositions[country].push(`${unitType} ${finalLocation}`);
    }
  }

  return unitPositions;
}

// Test with the retreat file
const testFile = 'C:\\Users\\Quinn\\Desktop\\AIvsDiplomacy\\diplomacy-games\\game-2025-12-19T06-12-57-290Z\\spring-1901-retreats\\moves-and-resolution.txt';

console.log('Testing parser on spring-1901-retreats file...\n');

const result = parseUnitPositionsFromResolution(testFile);

console.log('Parsed unit positions:\n');
for (const [country, units] of Object.entries(result)) {
  if (units && units.length > 0) {
    console.log(`${country}: ${units.join(', ')}`);
  }
}

console.log('\n--- Expected Results ---');
console.log('France: A Picardy, A Spain, F Mid-Atlantic Ocean');
console.log('Germany: F Holland, A Kiel, A Ruhr');
console.log('Russia: A Ukraine, A Galicia, F Sevastopol, F Gulf of Bothnia');
console.log('...etc');
