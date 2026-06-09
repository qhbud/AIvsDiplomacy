// Test extracting the LAST "## Fall 1901 Moves" section

const sampleContent = `# Claude Sonnet 4 (Anthropic)

## Current Board State

**Italy**: F Ionian Sea, A Apulia, A Venice

Some diplomatic messages...

## Fall 1901 Moves

**Your Decision:**

Looking at the diplomatic landscape...

**A Serbia to Bulgaria** - This captures Bulgaria...

**A Budapest HOLD** - This maintains central position...

**F Trieste HOLD** - This honors my agreement with Italy...

---
### Diplomatic Message to Austria-Hungary

## Fall 1901 Moves

**Your Decision:**

Looking at my diplomatic position...

**My Moves:**

[F Ionian Sea to Albania] - This captures Albania as agreed
[A Apulia to Adriatic Sea] - This supports the Albanian operation
[A Venice HOLD] - This maintains defensive position

These moves secure my expansion...`;

console.log('Testing LAST match extraction...\n');

const turnDisplayName = 'Fall 1901';
const movesRegex = new RegExp(`## ${turnDisplayName.replace(/\s/g, '\\s+')} Moves[\\s\\S]*?(?=##|$)`, 'g');

console.log('Regex:', movesRegex);
console.log('\nFinding all matches...\n');

const allMatches = [...sampleContent.matchAll(movesRegex)];

console.log(`Found ${allMatches.length} matches\n`);

allMatches.forEach((match, index) => {
  const preview = match[0].substring(0, 200).replace(/\n/g, ' ');
  console.log(`Match ${index + 1}:`);
  console.log(`  Preview: ${preview}...`);
  console.log(`  Length: ${match[0].length} characters`);
  console.log('');
});

if (allMatches.length > 0) {
  const lastMatch = allMatches[allMatches.length - 1][0];
  console.log('=== LAST MATCH (will be used) ===\n');
  console.log(lastMatch);
  console.log('\n=== Extracting [bracketed] orders ===\n');

  const bracketMatches = lastMatch.match(/\[([^\]]+)\]/g);
  if (bracketMatches) {
    console.log(`Found ${bracketMatches.length} bracketed orders:`);
    bracketMatches.forEach((bracket, i) => {
      const order = bracket.slice(1, -1).trim();
      console.log(`  ${i + 1}. ${order}`);
    });
  } else {
    console.log('No bracketed orders found');
  }

  console.log('\n=== Expected Result ===');
  console.log('Should extract 3 orders:');
  console.log('1. F Ionian Sea to Albania');
  console.log('2. A Apulia to Adriatic Sea');
  console.log('3. A Venice HOLD');

  // Verify
  const hasAlbania = bracketMatches && bracketMatches.some(b => b.includes('Albania'));
  const hasAdriatic = bracketMatches && bracketMatches.some(b => b.includes('Adriatic Sea'));
  const hasVeniceHold = bracketMatches && bracketMatches.some(b => b.includes('Venice HOLD'));

  if (bracketMatches && bracketMatches.length === 3 && hasAlbania && hasAdriatic && hasVeniceHold) {
    console.log('\n✓ TEST PASSED: Correctly extracted Italy\'s actual orders from LAST section');
  } else {
    console.log('\n✗ TEST FAILED:');
    if (!bracketMatches || bracketMatches.length !== 3) {
      console.log(`  Expected 3 orders, got ${bracketMatches ? bracketMatches.length : 0}`);
    }
    if (!hasAlbania) console.log('  Missing: Albania order');
    if (!hasAdriatic) console.log('  Missing: Adriatic Sea order');
    if (!hasVeniceHold) console.log('  Missing: Venice HOLD order');
  }
} else {
  console.log('✗ TEST FAILED: No matches found');
}
