const fs = require('fs');
const path = require('path');

const winter1909Dir = 'diplomacy-games/game-2025-12-20T04-57-53-169Z/winter-1909';

// Remove old strategies from all three countries
['Turkey', 'Italy', 'England'].forEach(country => {
  const contextPath = path.join(winter1909Dir, country, 'context.md');
  let context = fs.readFileSync(contextPath, 'utf8');

  // Remove everything after "STRATEGIC DIRECTIVE" if it exists
  const strategicIndex = context.indexOf('## STRATEGIC DIRECTIVE');
  if (strategicIndex !== -1) {
    context = context.substring(0, strategicIndex).trim();
  }

  fs.writeFileSync(contextPath, context);
});

// Turkey specific orders
const turkeyContextPath = path.join(winter1909Dir, 'Turkey', 'context.md');
let turkeyContext = fs.readFileSync(turkeyContextPath, 'utf8');

const turkeyStrategy = `

---

## STRATEGIC DIRECTIVE - SPRING 1910

**RUSSIA IS ELIMINATED - Their territories are undefended! Expand freely!**

### EXACT MOVES TO SUBMIT:

**PRIORITY 1: CAPTURE SERBIA WITH SUPPORT**
- [A Bulgaria to Serbia]
- [A Rumania SUPPORT A Bulgaria to Serbia]

**PRIORITY 2: EXPAND INTO UNDEFENDED RUSSIA**
- [A Armenia to Sevastopol]
- [A Ukraine to Moscow]
- [A Warsaw to Galicia]

**PRIORITY 3: REPOSITION BLACK SEA FLEET (no Russian navy)**
- [F Black Sea to Constantinople]

**PRIORITY 4: DEFENSIVE HOLDS**
- [A Smyrna HOLD]
- [A Ankara HOLD]

### WHY THESE MOVES:
- Serbia capture (with support strength 2) brings you to 9 SCs
- Russian territories are FREE - no units to defend them
- Black Sea Fleet can safely move (no Russian naval threats)
- This gives you maximum expansion this turn!

**CRITICAL:** Use the SUPPORT order exactly as shown - this guarantees Serbia capture!
`;

fs.writeFileSync(turkeyContextPath, turkeyContext + turkeyStrategy);

// Italy specific orders
const italyContextPath = path.join(winter1909Dir, 'Italy', 'context.md');
let italyContext = fs.readFileSync(italyContextPath, 'utf8');

const italyStrategy = `

---

## STRATEGIC DIRECTIVE - SPRING 1910

**TARGET: Austria-Hungary (3 SCs, weak) and Germany (4 SCs). France is finished (1 SC)!**

### EXACT MOVES TO SUBMIT:

**PRIORITY 1: POSITION FOR VIENNA ATTACK**
- [A Trieste to Vienna]
- [A Rome to Venice]
- [A Marseilles to Tyrolia]

**PRIORITY 2: CONTEST SERBIA**
- [F Greece to Serbia]
- [F Ionian Sea to Albania]

**PRIORITY 3: MAINTAIN ADRIATIC CONTROL**
- [F Adriatic Sea HOLD] (or support Trieste -> Vienna if possible)

**PRIORITY 4: MEDITERRANEAN FLEET POSITIONING**
- [F Naples to Apulia]
- [F Spain to Mid-Atlantic Ocean]
- [F Portugal HOLD]

### WHY THESE MOVES:
- Venice + Tyrolia positioning = FUTURE 2-army supported attack on Vienna!
- Next turn you can: A Venice -> Vienna + A Tyrolia SUPPORT = strength 2
- Contesting Serbia keeps Turkey from dominating Balkans
- If Vienna falls, you go to 10 SCs (taking the lead from England!)

**NEXT TURN:** After positioning, you'll have Venice + Tyrolia both adjacent to Vienna for supported attack!
`;

fs.writeFileSync(italyContextPath, italyContext + italyStrategy);

// England specific orders
const englandContextPath = path.join(winter1909Dir, 'England', 'context.md');
let englandContext = fs.readFileSync(englandContextPath, 'utf8');

const englandStrategy = `

---

## STRATEGIC DIRECTIVE - SPRING 1910

**GET YOUR ARMIES OFF THE ISLANDS! Position for Berlin attack!**

### EXACT MOVES TO SUBMIT:

**PRIORITY 1: CONVOY ARMY TO MAINLAND**
- [A London to Belgium]
- [F North Sea CONVOY A London to Belgium]
- (This gets an army onto mainland Europe!)

**PRIORITY 2: POSITION FLEET FOR BERLIN ATTACK**
- [F Sweden to Baltic Sea]
- (Baltic Sea is adjacent to Berlin for FUTURE support attacks!)

**PRIORITY 3: ATTEMPT KIEL CAPTURE**
- [F Denmark to Kiel]

**PRIORITY 4: FLEET REPOSITIONING**
- [F Norway to Norwegian Sea]
- [F Picardy to Brest] (or HOLD)

**PRIORITY 5: REMAINING ISLAND ARMIES**
- [A Liverpool HOLD] (next turn convoy this too!)
- [A Edinburgh HOLD]

### WHY THESE MOVES:
- London -> Belgium convoy gets army to mainland
- F Sweden -> Baltic positions for FUTURE: "F Baltic SUPPORT A ??? to Berlin" (strength 2!)
- Island armies are useless - need to convoy them to Europe
- After this turn: F Baltic Sea can support attacks into Berlin

**NEXT TURN:** Convoy Liverpool to mainland, use F Baltic to support attack on Berlin!
`;

fs.writeFileSync(englandContextPath, englandContext + englandStrategy);

console.log('✓ Turkey: Serbia capture + Russian expansion (8 specific moves)');
console.log('✓ Italy: Vienna positioning + Serbia contest (9 specific moves)');
console.log('✓ England: Belgium convoy + Baltic positioning (7 specific moves)');
console.log('\nAll strategies updated with EXACT move orders!');
