// Test that supporting units defend their position
const { resolveSpring1901 } = require('./dist/move-resolution');

// Scenario: F Black Sea supports A Ukraine to Rumania
//           F Constantinople tries to move to Black Sea
// Expected: F Constantinople should BOUNCE (1 vs 1)

const moves = [
  {
    country: 'Russia',
    unit: { type: 'F', location: 'Black Sea' },
    from: 'Black Sea',
    action: 'support',
    supportTarget: { from: 'Ukraine', to: 'Rumania' },
    valid: true
  },
  {
    country: 'Russia',
    unit: { type: 'A', location: 'Ukraine' },
    from: 'Ukraine',
    to: 'Rumania',
    action: 'move',
    valid: true
  },
  {
    country: 'Turkey',
    unit: { type: 'F', location: 'Constantinople' },
    from: 'Constantinople',
    to: 'Black Sea',
    action: 'move',
    valid: true
  }
];

const allUnits = {
  'Russia': [
    { type: 'F', location: 'Black Sea' },
    { type: 'A', location: 'Ukraine' }
  ],
  'Turkey': [
    { type: 'F', location: 'Constantinople' }
  ]
};

const results = resolveSpring1901(moves, allUnits);

console.log('Test: Supporting unit defends its position\n');
console.log('Scenario:');
console.log('  - F Black Sea supports A Ukraine to Rumania');
console.log('  - F Constantinople to Black Sea');
console.log('\nExpected: F Constantinople BOUNCES (1 vs 1)\n');

const constMove = results.find(r => r.from === 'Constantinople');

console.log('Result:');
console.log(`  F Constantinople -> Black Sea: ${constMove.success ? 'SUCCESS ❌ BUG!' : 'FAILED ✓ CORRECT'}`);
console.log(`  Reason: ${constMove.reason || 'N/A'}`);
console.log(`  Strength: ${constMove.strength}`);

if (!constMove.success) {
  console.log('\n✅ TEST PASSED: Supporting units properly defend their position!');
  process.exit(0);
} else {
  console.log('\n❌ TEST FAILED: Supporting units are not defending their position!');
  process.exit(1);
}
