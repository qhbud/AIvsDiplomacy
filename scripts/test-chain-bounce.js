// Test chain bounce logic
// Scenario: Unit A tries to move to X but fails (bounces)
// Unit B tries to move to A's current location
// Unit B should also fail because A is still there

const { resolveSpring1901 } = require('../dist/move-resolution.js');

console.log('Testing Chain Bounce Logic\n');
console.log('=' .repeat(80));

// Test Case 1: Austria-Hungary scenario from Spring 1902
// A Budapest -> Rumania (bounces with Turkey)
// A Vienna -> Budapest (should bounce because Budapest is still occupied)
console.log('\nTest 1: Chain Bounce - Unit tries to move into space of failed mover');
console.log('-'.repeat(80));

const test1Moves = [
  // Austria-Hungary
  {
    country: 'Austria-Hungary',
    unit: { type: 'A', location: 'Budapest' },
    from: 'Budapest',
    to: 'Rumania',
    action: 'move',
    valid: true
  },
  {
    country: 'Austria-Hungary',
    unit: { type: 'A', location: 'Vienna' },
    from: 'Vienna',
    to: 'Budapest',
    action: 'move',
    valid: true
  },
  // Turkey (competing for Rumania)
  {
    country: 'Turkey',
    unit: { type: 'A', location: 'Serbia' },
    from: 'Serbia',
    to: 'Rumania',
    action: 'move',
    valid: true
  }
];

console.log('Moves:');
console.log('  Austria-Hungary A Budapest -> Rumania');
console.log('  Austria-Hungary A Vienna -> Budapest');
console.log('  Turkey A Serbia -> Rumania');

const test1Results = resolveSpring1901(test1Moves);

console.log('\nResults:');
const budapestToRumania = test1Results.find(r => r.from === 'Budapest' && r.to === 'Rumania');
const viennaToBudapest = test1Results.find(r => r.from === 'Vienna' && r.to === 'Budapest');
const serbiaToRumania = test1Results.find(r => r.from === 'Serbia' && r.to === 'Rumania');

console.log(`  A Budapest -> Rumania: ${budapestToRumania.success ? 'SUCCESS' : 'FAILED'} - ${budapestToRumania.reason || 'N/A'}`);
console.log(`  A Vienna -> Budapest: ${viennaToBudapest.success ? 'SUCCESS' : 'FAILED'} - ${viennaToBudapest.reason || 'N/A'}`);
console.log(`  A Serbia -> Rumania: ${serbiaToRumania.success ? 'SUCCESS' : 'FAILED'} - ${serbiaToRumania.reason || 'N/A'}`);

const test1Pass = !budapestToRumania.success && !viennaToBudapest.success && !serbiaToRumania.success;
console.log(`\n${test1Pass ? '✓ PASS' : '✗ FAIL'}: ${test1Pass ? 'All moves correctly bounced' : 'EXPECTED: All moves fail, Budapest and Vienna stay in place'}`);

// Test Case 2: Simple chain bounce
console.log('\n\nTest 2: Simple A->B->C chain where all should bounce');
console.log('-'.repeat(80));

const test2Moves = [
  {
    country: 'England',
    unit: { type: 'A', location: 'London' },
    from: 'London',
    to: 'Wales',
    action: 'move',
    valid: true
  },
  {
    country: 'England',
    unit: { type: 'A', location: 'Yorkshire' },
    from: 'Yorkshire',
    to: 'London',
    action: 'move',
    valid: true
  },
  // Defender in Wales
  {
    country: 'France',
    unit: { type: 'A', location: 'Wales' },
    from: 'Wales',
    action: 'hold',
    valid: true
  }
];

console.log('Moves:');
console.log('  England A London -> Wales');
console.log('  England A Yorkshire -> London');
console.log('  France A Wales HOLD');

const test2Results = resolveSpring1901(test2Moves);

const londonToWales = test2Results.find(r => r.from === 'London' && r.to === 'Wales');
const yorkshireToLondon = test2Results.find(r => r.from === 'Yorkshire' && r.to === 'London');

console.log('\nResults:');
console.log(`  A London -> Wales: ${londonToWales.success ? 'SUCCESS' : 'FAILED'} - ${londonToWales.reason || 'N/A'}`);
console.log(`  A Yorkshire -> London: ${yorkshireToLondon.success ? 'SUCCESS' : 'FAILED'} - ${yorkshireToLondon.reason || 'N/A'}`);

const test2Pass = !londonToWales.success && !yorkshireToLondon.success;
console.log(`\n${test2Pass ? '✓ PASS' : '✗ FAIL'}: ${test2Pass ? 'Chain bounce works correctly' : 'EXPECTED: Both moves fail, units stay in place'}`);

// Test Case 3: Successful chain (all units move)
console.log('\n\nTest 3: Successful chain - A->B->C where C is empty');
console.log('-'.repeat(80));

const test3Moves = [
  {
    country: 'England',
    unit: { type: 'A', location: 'London' },
    from: 'London',
    to: 'Wales',
    action: 'move',
    valid: true
  },
  {
    country: 'England',
    unit: { type: 'A', location: 'Yorkshire' },
    from: 'Yorkshire',
    to: 'London',
    action: 'move',
    valid: true
  }
];

console.log('Moves:');
console.log('  England A London -> Wales (Wales is empty)');
console.log('  England A Yorkshire -> London');

const test3Results = resolveSpring1901(test3Moves);

const londonToWales3 = test3Results.find(r => r.from === 'London' && r.to === 'Wales');
const yorkshireToLondon3 = test3Results.find(r => r.from === 'Yorkshire' && r.to === 'London');

console.log('\nResults:');
console.log(`  A London -> Wales: ${londonToWales3.success ? 'SUCCESS' : 'FAILED'} - ${londonToWales3.reason || 'N/A'}`);
console.log(`  A Yorkshire -> London: ${yorkshireToLondon3.success ? 'SUCCESS' : 'FAILED'} - ${yorkshireToLondon3.reason || 'N/A'}`);

const test3Pass = londonToWales3.success && yorkshireToLondon3.success;
console.log(`\n${test3Pass ? '✓ PASS' : '✗ FAIL'}: ${test3Pass ? 'Both moves succeed as expected' : 'EXPECTED: Both moves succeed'}`);

// Test Case 4: Move into space with support override
console.log('\n\nTest 4: Move into failed mover\'s space WITH enough support');
console.log('-'.repeat(80));

const test4Moves = [
  {
    country: 'Austria-Hungary',
    unit: { type: 'A', location: 'Budapest' },
    from: 'Budapest',
    to: 'Rumania',
    action: 'move',
    valid: true
  },
  {
    country: 'Austria-Hungary',
    unit: { type: 'A', location: 'Vienna' },
    from: 'Vienna',
    to: 'Budapest',
    action: 'move',
    valid: true
  },
  {
    country: 'Austria-Hungary',
    unit: { type: 'A', location: 'Trieste' },
    from: 'Trieste',
    to: 'Budapest',
    action: 'support',
    supportTarget: { from: 'Vienna', to: 'Budapest' },
    valid: true
  },
  {
    country: 'Turkey',
    unit: { type: 'A', location: 'Serbia' },
    from: 'Serbia',
    to: 'Rumania',
    action: 'move',
    valid: true
  }
];

console.log('Moves:');
console.log('  Austria-Hungary A Budapest -> Rumania');
console.log('  Austria-Hungary A Vienna -> Budapest');
console.log('  Austria-Hungary A Trieste supports Vienna -> Budapest');
console.log('  Turkey A Serbia -> Rumania');

const test4Results = resolveSpring1901(test4Moves);

const budapestToRumania4 = test4Results.find(r => r.from === 'Budapest' && r.to === 'Rumania');
const viennaToBudapest4 = test4Results.find(r => r.from === 'Vienna' && r.to === 'Budapest');

console.log('\nResults:');
console.log(`  A Budapest -> Rumania: ${budapestToRumania4.success ? 'SUCCESS' : 'FAILED'} - ${budapestToRumania4.reason || 'N/A'}`);
console.log(`  A Vienna -> Budapest: ${viennaToBudapest4.success ? 'SUCCESS' : 'FAILED'} - ${viennaToBudapest4.reason || 'N/A'} [strength: ${viennaToBudapest4.strength}]`);

const test4Pass = !budapestToRumania4.success && viennaToBudapest4.success;
console.log(`\n${test4Pass ? '✓ PASS' : '✗ FAIL'}: ${test4Pass ? 'Vienna succeeds with support (strength 2 vs 1)' : 'EXPECTED: Budapest fails, Vienna succeeds with support'}`);

// Summary
console.log('\n' + '='.repeat(80));
console.log('\nSummary:');
console.log(`  Test 1 (Chain bounce): ${test1Pass ? '✓ PASS' : '✗ FAIL'}`);
console.log(`  Test 2 (Simple chain bounce): ${test2Pass ? '✓ PASS' : '✗ FAIL'}`);
console.log(`  Test 3 (Successful chain): ${test3Pass ? '✓ PASS' : '✗ FAIL'}`);
console.log(`  Test 4 (Override with support): ${test4Pass ? '✓ PASS' : '✗ FAIL'}`);

const allPass = test1Pass && test2Pass && test3Pass && test4Pass;
console.log(`\n${allPass ? '✓ ALL TESTS PASSED' : '✗ SOME TESTS FAILED'}`);
process.exit(allPass ? 0 : 1);
