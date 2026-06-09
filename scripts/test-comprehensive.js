// Comprehensive test of move resolution rules

const { parseMove, resolveSpring1901 } = require('../dist/move-resolution');

console.log('=== COMPREHENSIVE MOVE RESOLUTION TESTS ===\n');

// TEST 1: Head-to-head swap (should fail)
console.log('TEST 1: Head-to-head swap (should FAIL)');
{
  const unitPositions = {
    'France': [{ type: 'A', location: 'Paris' }, { type: 'A', location: 'Burgundy' }]
  };

  const moves = [
    parseMove('A Paris to Burgundy', 'France', unitPositions['France']),
    parseMove('A Burgundy to Paris', 'France', unitPositions['France'])
  ];

  const results = resolveSpring1901(moves, unitPositions);
  const parisMove = results.find(r => r.from === 'Paris');
  const burgundyMove = results.find(r => r.from === 'Burgundy');

  console.log(`  Paris->Burgundy: ${parisMove?.success ? 'SUCCESS' : 'FAILED'} (expected: FAILED) ${!parisMove?.success ? '✓' : '✗'}`);
  console.log(`  Burgundy->Paris: ${burgundyMove?.success ? 'SUCCESS' : 'FAILED'} (expected: FAILED) ${!burgundyMove?.success ? '✓' : '✗'}`);
  console.log();
}

// TEST 2: 3-way cycle (should succeed)
console.log('TEST 2: 3-way cycle (should SUCCEED)');
{
  const unitPositions = {
    'France': [
      { type: 'A', location: 'Paris' },
      { type: 'A', location: 'Burgundy' },
      { type: 'A', location: 'Gascony' }
    ]
  };

  const moves = [
    parseMove('A Paris to Burgundy', 'France', unitPositions['France']),
    parseMove('A Burgundy to Gascony', 'France', unitPositions['France']),
    parseMove('A Gascony to Paris', 'France', unitPositions['France'])
  ];

  const results = resolveSpring1901(moves, unitPositions);
  const allSuccess = results.every(r => r.success);

  console.log(`  All moves: ${allSuccess ? 'SUCCESS' : 'FAILED'} (expected: SUCCESS) ${allSuccess ? '✓' : '✗'}`);
  console.log();
}

// TEST 3: Follow-the-leader chain (should FAIL)
console.log('TEST 3: Follow-the-leader chain (should FAIL)');
{
  const unitPositions = {
    'France': [
      { type: 'A', location: 'Belgium' },
      { type: 'A', location: 'Ruhr' },
      { type: 'A', location: 'Burgundy' }
    ],
    'England': [{ type: 'F', location: 'North Sea' }],
    'Germany': [{ type: 'F', location: 'Holland' }]
  };

  const moves = [
    parseMove('A Belgium to Holland', 'France', unitPositions['France']),
    parseMove('A Ruhr to Belgium', 'France', unitPositions['France']),
    parseMove('A Burgundy to Ruhr', 'France', unitPositions['France']),
    parseMove('F North Sea supports Belgium to Holland', 'England', unitPositions['England']),
    parseMove('F Holland to North Sea', 'Germany', unitPositions['Germany'])
  ];

  const results = resolveSpring1901(moves, unitPositions);
  const belgiumMove = results.find(r => r.from === 'Belgium' && r.to === 'Holland');
  const ruhrMove = results.find(r => r.from === 'Ruhr');
  const burgundyMove = results.find(r => r.from === 'Burgundy');

  console.log(`  Belgium->Holland: ${belgiumMove?.success ? 'SUCCESS' : 'FAILED'} (expected: SUCCESS) ${belgiumMove?.success ? '✓' : '✗'}`);
  console.log(`  Ruhr->Belgium: ${ruhrMove?.success ? 'SUCCESS' : 'FAILED'} (expected: FAILED) ${!ruhrMove?.success ? '✓' : '✗'}`);
  console.log(`  Burgundy->Ruhr: ${burgundyMove?.success ? 'SUCCESS' : 'FAILED'} (expected: FAILED) ${!burgundyMove?.success ? '✓' : '✗'}`);
  console.log();
}

// TEST 4: Cycle disrupted by external attack (should FAIL if attacker has strength)
console.log('TEST 4: Cycle with weak external attack (cycle should SUCCEED)');
{
  const unitPositions = {
    'France': [
      { type: 'A', location: 'Paris' },
      { type: 'A', location: 'Burgundy' }
    ],
    'Germany': [{ type: 'A', location: 'Munich' }]
  };

  const moves = [
    parseMove('A Paris to Burgundy', 'France', unitPositions['France']),
    parseMove('A Burgundy to Paris', 'France', unitPositions['France']), // Head-to-head swap
    parseMove('A Munich to Burgundy', 'Germany', unitPositions['Germany'])
  ];

  const results = resolveSpring1901(moves, unitPositions);
  const parisMove = results.find(r => r.from === 'Paris');
  const burgundyMove = results.find(r => r.from === 'Burgundy');

  // Head-to-head swaps fail regardless of external attacks
  console.log(`  Paris->Burgundy: ${parisMove?.success ? 'SUCCESS' : 'FAILED'} (expected: FAILED - head-to-head swap) ${!parisMove?.success ? '✓' : '✗'}`);
  console.log(`  Burgundy->Paris: ${burgundyMove?.success ? 'SUCCESS' : 'FAILED'} (expected: FAILED - head-to-head swap) ${!burgundyMove?.success ? '✓' : '✗'}`);
  console.log();
}

console.log('=== ALL TESTS COMPLETE ===');
