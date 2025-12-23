// Test for the "follow-the-leader" bug
// Belgium → Holland (with support, should succeed)
// Ruhr → Belgium (should FAIL - not a cycle)
// Burgundy → Ruhr (should FAIL - depends on Ruhr moving)

const { parseMove, resolveSpring1901 } = require('./dist/move-resolution');

const unitPositions = {
  'France': [
    { type: 'A', location: 'Belgium' },
    { type: 'A', location: 'Ruhr' },
    { type: 'A', location: 'Burgundy' }
  ],
  'England': [
    { type: 'F', location: 'North Sea' }
  ],
  'Germany': [
    { type: 'F', location: 'Holland' }
  ]
};

const moves = [];

// France moves
moves.push(parseMove('A Belgium to Holland', 'France', unitPositions['France']));
moves.push(parseMove('A Ruhr to Belgium', 'France', unitPositions['France']));
moves.push(parseMove('A Burgundy to Ruhr', 'France', unitPositions['France']));

// England supports
moves.push(parseMove('F North Sea supports Belgium to Holland', 'England', unitPositions['England']));

// Germany
moves.push(parseMove('F Holland to North Sea', 'Germany', unitPositions['Germany']));

console.log('\n=== MOVES ===');
moves.forEach(m => {
  if (m) console.log(`${m.country} ${m.unit.type} ${m.from} -> ${m.to || 'HOLD'} [${m.action}]`);
});

const results = resolveSpring1901(moves, unitPositions);

console.log('\n=== RESULTS ===');
results.forEach(r => {
  const status = r.success ? '✓ SUCCESS' : '✗ FAILED';
  console.log(`${r.country} ${r.unit.type} ${r.from} -> ${r.to || 'HOLD'}: ${status}`);
  if (r.reason) console.log(`  Reason: ${r.reason}`);
});

console.log('\n=== EXPECTED ===');
console.log('France A Belgium -> Holland: ✓ SUCCESS (has support from England)');
console.log('France A Ruhr -> Belgium: ✗ FAILED (Belgium occupied, not a cycle)');
console.log('France A Burgundy -> Ruhr: ✗ FAILED (Ruhr not vacated)');
console.log('England F North Sea SUPPORT: ✓ SUCCESS');
console.log('Germany F Holland -> North Sea: ✗ FAILED (bounced with support)');

console.log('\n=== ACTUAL vs EXPECTED ===');
const belgiumResult = results.find(r => r.from === 'Belgium' && r.to === 'Holland');
const ruhrResult = results.find(r => r.from === 'Ruhr' && r.to === 'Belgium');
const burgundyResult = results.find(r => r.from === 'Burgundy' && r.to === 'Ruhr');

console.log(`Belgium->Holland: ${belgiumResult?.success ? 'SUCCESS' : 'FAILED'} (expected: SUCCESS) ${belgiumResult?.success ? '✓' : '✗'}`);
console.log(`Ruhr->Belgium: ${ruhrResult?.success ? 'SUCCESS' : 'FAILED'} (expected: FAILED) ${!ruhrResult?.success ? '✓' : '✗ BUG!'}`);
console.log(`Burgundy->Ruhr: ${burgundyResult?.success ? 'SUCCESS' : 'FAILED'} (expected: FAILED) ${!burgundyResult?.success ? '✓' : '✗ BUG!'}`);
