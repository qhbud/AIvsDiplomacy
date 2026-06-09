import * as path from 'path';

const gameDir = 'C:\\Users\\Quinn\\Desktop\\AIvsDiplomacy\\diplomacy-games\\game-2025-12-17T23-50-57-161Z';

async function test() {
  const { default: main } = await import('./dist/index.js');
  const module = require('../dist/index.js');

  // Call the processSpring1901Resolution function directly
  if (module.processSpring1901Resolution) {
    await module.processSpring1901Resolution(gameDir);
  } else {
    console.log('Function not exported, running manually...');

    const processFunc = `
      const path = require('path');
      const fs = require('fs');

      async function processSpring1901Resolution(gameDir) {
        const { parseMove, resolveSpring1901 } = require('../dist/move-resolution');

        console.log('Testing Spring 1901 resolution on:', gameDir);
      }

      processSpring1901Resolution('${gameDir}');
    `;

    eval(processFunc);
  }
}

test().catch(console.error);
