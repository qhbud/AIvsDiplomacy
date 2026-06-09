// Test the deduplication logic

const testMoves = [
  // Austria-Hungary's duplicate orders (should deduplicate)
  { country: 'Austria-Hungary', unit: { type: 'A', location: 'Budapest' }, from: 'Budapest', to: 'Rumania', action: 'move', valid: true },
  { country: 'Austria-Hungary', unit: { type: 'A', location: 'Budapest' }, from: 'Budapest', to: 'Rumania', action: 'move', valid: true }, // DUPLICATE

  { country: 'Austria-Hungary', unit: { type: 'A', location: 'Vienna' }, from: 'Vienna', to: 'Galicia', action: 'move', valid: true },
  { country: 'Austria-Hungary', unit: { type: 'A', location: 'Vienna' }, from: 'Vienna', to: 'Galicia', action: 'move', valid: true }, // DUPLICATE

  { country: 'Austria-Hungary', unit: { type: 'F', location: 'Trieste' }, from: 'Trieste', action: 'hold', valid: true },
  { country: 'Austria-Hungary', unit: { type: 'F', location: 'Trieste' }, from: 'Trieste', action: 'hold', valid: true }, // DUPLICATE

  // Different units from same country (should NOT deduplicate)
  { country: 'Russia', unit: { type: 'A', location: 'Ukraine' }, from: 'Ukraine', to: 'Rumania', action: 'move', valid: true },
  { country: 'Russia', unit: { type: 'A', location: 'Galicia' }, from: 'Galicia', to: 'Vienna', action: 'move', valid: true }, // DIFFERENT UNIT - keep both

  // Same location, different countries (should NOT deduplicate - though this would be a bug)
  { country: 'Italy', unit: { type: 'A', location: 'Budapest' }, from: 'Budapest', action: 'hold', valid: false },
  // Austria-Hungary also has Budapest - but different countries, so both should be kept

  // Different action types for same unit (should deduplicate - only keep first)
  { country: 'Turkey', unit: { type: 'A', location: 'Bulgaria' }, from: 'Bulgaria', to: 'Serbia', action: 'move', valid: true },
  { country: 'Turkey', unit: { type: 'A', location: 'Bulgaria' }, from: 'Bulgaria', action: 'hold', valid: true }, // DUPLICATE - different action but same unit
];

console.log('Testing deduplication logic...\n');

// Apply the deduplication logic
const seenUnits = new Set();
const deduplicatedMoves = [];

for (const move of testMoves) {
  const unitKey = `${move.country}|${move.from}`;

  if (!seenUnits.has(unitKey)) {
    seenUnits.add(unitKey);
    deduplicatedMoves.push(move);
    console.log(`✓ KEPT: ${move.country} ${move.unit.type} ${move.from} ${move.action}`);
  } else {
    console.log(`✗ DUPLICATE (ignored): ${move.country} ${move.unit.type} ${move.from} ${move.action}`);
  }
}

console.log('\n=== Results ===\n');
console.log(`Original moves: ${testMoves.length}`);
console.log(`Deduplicated moves: ${deduplicatedMoves.length}`);
console.log(`Duplicates removed: ${testMoves.length - deduplicatedMoves.length}`);

console.log('\n=== Expected Results ===');
console.log('Should keep 7 moves:');
console.log('1. Austria-Hungary A Budapest to Rumania (first occurrence)');
console.log('2. Austria-Hungary A Vienna to Galicia (first occurrence)');
console.log('3. Austria-Hungary F Trieste HOLD (first occurrence)');
console.log('4. Russia A Ukraine to Rumania');
console.log('5. Russia A Galicia to Vienna');
console.log('6. Italy A Budapest HOLD (different country from Austria-Hungary)');
console.log('7. Turkey A Bulgaria to Serbia (first occurrence)');

console.log('\nShould remove 4 duplicates:');
console.log('1. Austria-Hungary A Budapest (second occurrence)');
console.log('2. Austria-Hungary A Vienna (second occurrence)');
console.log('3. Austria-Hungary F Trieste (second occurrence)');
console.log('4. Turkey A Bulgaria HOLD (second occurrence, different action)');

console.log('\n=== Detailed Results ===\n');
deduplicatedMoves.forEach((move, i) => {
  console.log(`${i + 1}. ${move.country} ${move.unit.type} ${move.from} - ${move.action}${move.to ? ' to ' + move.to : ''}`);
});

// Verify counts
if (deduplicatedMoves.length === 7) {
  console.log('\n✓ TEST PASSED: Correct number of moves kept');
} else {
  console.log(`\n✗ TEST FAILED: Expected 7 moves, got ${deduplicatedMoves.length}`);
}

// Verify no false positives (different units incorrectly removed)
const hasRussiaUkraine = deduplicatedMoves.some(m => m.country === 'Russia' && m.from === 'Ukraine');
const hasRussiaGalicia = deduplicatedMoves.some(m => m.country === 'Russia' && m.from === 'Galicia');
const hasItalyBudapest = deduplicatedMoves.some(m => m.country === 'Italy' && m.from === 'Budapest');

if (hasRussiaUkraine && hasRussiaGalicia && hasItalyBudapest) {
  console.log('✓ TEST PASSED: No false positives (different units kept)');
} else {
  console.log('✗ TEST FAILED: False positive detected (different unit incorrectly removed)');
  if (!hasRussiaUkraine) console.log('  Missing: Russia A Ukraine');
  if (!hasRussiaGalicia) console.log('  Missing: Russia A Galicia');
  if (!hasItalyBudapest) console.log('  Missing: Italy A Budapest');
}

// Verify no false negatives (duplicates not caught)
const austriaBudapestCount = deduplicatedMoves.filter(m => m.country === 'Austria-Hungary' && m.from === 'Budapest').length;
const austriaViennaCount = deduplicatedMoves.filter(m => m.country === 'Austria-Hungary' && m.from === 'Vienna').length;
const austriaTriesteCount = deduplicatedMoves.filter(m => m.country === 'Austria-Hungary' && m.from === 'Trieste').length;
const turkeyBulgariaCount = deduplicatedMoves.filter(m => m.country === 'Turkey' && m.from === 'Bulgaria').length;

if (austriaBudapestCount === 1 && austriaViennaCount === 1 && austriaTriesteCount === 1 && turkeyBulgariaCount === 1) {
  console.log('✓ TEST PASSED: No false negatives (duplicates correctly removed)');
} else {
  console.log('✗ TEST FAILED: False negative detected (duplicate not removed)');
  if (austriaBudapestCount !== 1) console.log(`  Austria-Hungary Budapest: ${austriaBudapestCount} (expected 1)`);
  if (austriaViennaCount !== 1) console.log(`  Austria-Hungary Vienna: ${austriaViennaCount} (expected 1)`);
  if (austriaTriesteCount !== 1) console.log(`  Austria-Hungary Trieste: ${austriaTriesteCount} (expected 1)`);
  if (turkeyBulgariaCount !== 1) console.log(`  Turkey Bulgaria: ${turkeyBulgariaCount} (expected 1)`);
}
