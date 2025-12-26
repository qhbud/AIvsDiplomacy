const fs = require('fs');
const path = require('path');

const winter1909Dir = 'diplomacy-games/game-2025-12-20T04-57-53-169Z/winter-1909';

// Turkey strategic guidance
const turkeyContextPath = path.join(winter1909Dir, 'Turkey', 'context.md');
const turkeyContext = fs.readFileSync(turkeyContextPath, 'utf8');

const turkeyStrategy = `

---

## STRATEGIC DIRECTIVE - SPRING 1910

**CRITICAL INSTRUCTIONS: Russia is ELIMINATED (0 units). Their territories are undefended!**

### PRIMARY OBJECTIVES:

1. **CAPTURE SERBIA WITH SUPPORT**
   - **A Bulgaria -> Serbia** (attacking)
   - **A Rumania SUPPORT A Bulgaria -> Serbia** (providing support strength 2)
   - This WILL succeed if Italy doesn't also attack Serbia with equal/greater strength

2. **EXPAND INTO RUSSIA - FREE TERRITORIES**
   - **A Armenia -> Sevastopol** (Russia eliminated, undefended!)
   - **A Ukraine -> Moscow** (consolidate control)
   - **A Warsaw -> Galicia** (expand into former Russian territory)

3. **REPOSITION BLACK SEA FLEET**
   - **F Black Sea -> Constantinople** (no more Russian naval threat)
   - OR **F Black Sea -> Ankara** if you want coastal flexibility

4. **MAINTAIN DEFENSIVE POSITIONS**
   - Keep units in Ankara, Smyrna positioned to defend home centers
   - Watch for Italian expansion from Greece

### KEY POINTS:
- Russia's elimination gives you FREE expansion in the east
- Serbia is critical - use SUPPORT to guarantee capture
- You can safely move F Black Sea since no Russian units exist
- Focus: Capture Serbia (8->9 SCs), consolidate Russian territories

Execute these moves to reach 9 supply centers this turn!
`;

fs.writeFileSync(turkeyContextPath, turkeyContext + turkeyStrategy);

// Italy strategic guidance
const italyContextPath = path.join(winter1909Dir, 'Italy', 'context.md');
const italyContext = fs.readFileSync(italyContextPath, 'utf8');

const italyStrategy = `

---

## STRATEGIC DIRECTIVE - SPRING 1910

**CRITICAL INSTRUCTIONS: Target Austria-Hungary and Germany. France is weakened (1 SC)!**

### PRIMARY OBJECTIVES:

1. **POSITION FOR VIENNA ATTACK**
   - **A Trieste -> Vienna** (direct attack on Austrian capital)
   - **A Rome -> Venice** (get army into northern position)
   - **A Marseilles -> Tyrolia** (position for future supported attack)
   - Future turn: A Venice + A Tyrolia can SUPPORT attack Vienna with strength 3

2. **PRESSURE AUSTRIA-HUNGARY**
   - **F Greece -> Serbia** (contest Serbian capture with Turkey)
   - **F Adriatic Sea -> Trieste** (retake if Austria moves out)
   - **F Albania SUPPORT F Greece -> Serbia** (help Serbian attack)

3. **MAINTAIN STRONG POSITION**
   - Keep F Ionian Sea, F Apulia, F Naples positioned
   - **F Portugal HOLD** (Atlantic presence)
   - **F Mid-Atlantic Ocean** position for future moves

4. **GERMANY SECONDARY TARGET**
   - After Austria-Hungary falls, use Venice/Tyrolia armies to attack Munich
   - Consider naval support from Mediterranean

### KEY POINTS:
- You're tied with England at 9 SCs - need to pull ahead
- Austria-Hungary is weak (3 SCs), prime target for elimination
- Venice + Tyrolia positioning = future 2-army supported attack on Vienna
- France (1 SC) is no longer a threat, focus on Austria/Germany
- Capturing Vienna would give you 10 SCs, taking the lead!

Execute positioning moves to set up Vienna capture next turn!
`;

fs.writeFileSync(italyContextPath, italyContext + italyStrategy);

// England strategic guidance
const englandContextPath = path.join(winter1909Dir, 'England', 'context.md');
const englandContext = fs.readFileSync(englandContextPath, 'utf8');

const englandStrategy = `

---

## STRATEGIC DIRECTIVE - SPRING 1910

**CRITICAL INSTRUCTIONS: Convoy armies to mainland Europe! Position for Berlin attack!**

### PRIMARY OBJECTIVES:

1. **CONVOY ARMIES TO EUROPE**
   - **A London -> Belgium** (convoy via North Sea)
   - **F North Sea CONVOY A London -> Belgium**
   - OR **A Liverpool -> Belgium** (convoy via North Sea + English Channel)
   - Get armies OFF the island and onto the mainland!

2. **POSITION FLEET FOR BERLIN ATTACK**
   - **F Baltic Sea -> Prussia** (adjacent to Berlin for future support)
   - OR **F Baltic Sea HOLD** (maintain position)
   - Future: F Baltic can SUPPORT attack into Berlin

3. **MAINTAIN PRESSURE ON GERMANY**
   - **F Denmark -> Kiel** (attack German home center)
   - **F Norwegian Sea -> Norway** (consolidate)
   - Keep fleets positioned around German coast

4. **ALTERNATIVE CONVOY ROUTES**
   - North Sea route: London -> Belgium (1 fleet convoy)
   - English Channel route: Need F Brest + another fleet
   - Can convoy multiple armies if you position fleets correctly

### KEY POINTS:
- You have 8 units but 9 SCs - you're undermanned!
- Island armies (London, Liverpool, Edinburgh) are useless - CONVOY them!
- Baltic Sea is key to attacking Berlin with support
- Germany has 4 SCs, weakened target
- Belgium is good landing point - central position for future attacks

Execute convoys to get armies to mainland Europe!
`;

fs.writeFileSync(englandContextPath, englandContext + englandStrategy);

console.log('✓ Updated Turkey context with Serbia capture + Russian expansion strategy');
console.log('✓ Updated Italy context with Austria-Hungary/Germany attack positioning');
console.log('✓ Updated England context with convoy + Baltic positioning strategy');
