const fs = require('fs');
const path = require('path');

const gameDir = 'diplomacy-games/game-2025-12-20T04-57-53-169Z';
const fall1909Dir = path.join(gameDir, 'fall-1909');

// Update Italy's strategic reflection to reflect successful Trieste capture
const italyReflection = `# Strategic Reflection - Italy (Fall 1909)

**Model:** Claude Sonnet 4 (Anthropic)

---

# Italy - Strategic Reflection Fall 1909

## Performance Analysis

My performance in Fall 1909 marks a decisive turning point after several turns of frustrating stagnation. I successfully executed two critical captures: Trieste from Austria-Hungary using a supported attack (A Venice to Trieste with F Adriatic Sea support, achieving strength 2 vs 1), and Portugal through naval expansion (F Mid-Atlantic Ocean to Portugal). These victories demonstrate that decisive unilateral action succeeds where endless diplomatic coordination fails. I've now reached 9 supply centers, matching England's position and establishing myself as a genuine contender for victory. However, my earlier strategic errors - particularly the prolonged hesitation to attack vulnerable Austria-Hungary - cost me valuable momentum that could have put me in an even stronger position.

## Current Position

I now control 9 supply centers: Marseilles, Rome, Venice, Naples, Trieste, Greece, Tunis, Spain, and Portugal. My strengths include dominant Mediterranean naval presence across multiple sea zones, the newly captured Trieste securing my Adriatic position, and Portugal giving me Atlantic expansion capability. I'm now tied with England at 9 centers each, making us the two leading powers in the game. Turkey sits at 8 centers, representing my main Mediterranean rival. My biggest achievement is the elimination of Austria-Hungary as a viable threat - they've been reduced to just 3 centers (Vienna, Budapest, Serbia) and lost their only fleet. However, I face strategic challenges: England's 9 centers in Northern Europe represent a symmetric threat, Turkey's 8 centers and land-based expansion could threaten my Balkans position, and I need 9 more centers to reach the 18 needed for victory.

## Path to Victory

With 9 supply centers, I'm positioned in the leading tier alongside England. My path to 18 centers requires aggressive expansion on multiple fronts while preventing England from breaking away. First priority: complete the destruction of Austria-Hungary by capturing their remaining 3 centers (Vienna, Budapest, Serbia), which would bring me to 12 centers. This requires coordination with either Turkey or Germany to split Austrian territories. Second priority: establish an anti-English coalition since England at 9 centers is equally threatening to everyone. Third priority: identify additional expansion targets - possibilities include pushing into German territory if they remain weak (4 centers), supporting Turkey's destruction if they become too strong, or capturing additional neutrals. The critical insight is that with both England and myself at 9 centers, the next phase determines whether this becomes a two-power race or whether one of us pulls decisively ahead.

## Next Turn Plans

For Fall 1909 Retreats, Austria-Hungary's F Trieste must retreat (likely to Albania or somewhere else), confirming my Trieste capture. For Winter 1909, I'll have 9 centers and 9 units, so no builds or disbands. My Spring 1910 strategy must focus on: (1) Consolidating Trieste with defensive positioning in the Adriatic, (2) Proposing a concrete anti-Austria alliance with Turkey or Germany offering specific territorial divisions - I'm willing to cede Vienna/Budapest to a partner if I can secure Serbia and prevent Austrian rebuilding, (3) Building an anti-English coalition by emphasizing to all powers that England's 9 centers represent an equal existential threat to my 9 centers, (4) Positioning my Atlantic fleet (F Portugal) to threaten either English or German positions depending on diplomatic developments. The key is maintaining offensive pressure on multiple fronts while preventing England from expanding further.
`;

// Update Austria-Hungary's strategic reflection to reflect Trieste loss
const austriaReflection = `# Strategic Reflection - Austria-Hungary (Fall 1909)

**Model:** GPT-4o-mini (OpenAI)

---

## Performance Analysis

Fall 1909 has been catastrophic for Austria-Hungary. I lost Trieste to Italy's supported attack (their A Venice to Trieste with F Adriatic Sea support achieved strength 2 vs my defending fleet's strength 1), resulting in my fleet being dislodged and my supply center count dropping from 4 to 3. This represents a devastating blow both strategically and symbolically - Trieste was my only coastal supply center and my fleet was my only naval unit, leaving me completely landlocked. My attempted counterattacks all failed: A Vienna to Budapest bounced against Turkish A Rumania to Budapest (both strength 1), and my F Trieste to Venice attack was crushed by Italy's superior strength. I'm now reduced to 3 supply centers (Vienna, Budapest, Serbia) with 3 armies and no naval presence, surrounded by hostile powers and facing imminent elimination.

## Current Position

I control only 3 supply centers: Vienna, Budapest, and Serbia. My position is dire - I'm completely surrounded by enemies with no realistic expansion opportunities. My strengths, such as they are, include defensive units in Vienna and Budapest that can hold against unsupported attacks, and Serbia giving me a small Balkan foothold. However, my weaknesses are overwhelming: I'm landlocked with no fleet, squeezed between Italy (9 centers) to the west, Turkey (8 centers) to the east, and Germany (4 centers) to the north. Italy's capture of Trieste gives them complete Adriatic dominance, while Turkey's presence in Bulgaria, Rumania, and Ukraine threatens my eastern territories. I have no viable allies - Italy just attacked me, Turkey tried to capture Budapest, and Germany shows no interest in cooperation.

## Path to Victory

Realistically, there is no path to victory from this position. With 3 supply centers and surrounded by hostile powers, survival is the only achievable goal. My best hope is to play spoiler - make myself too costly to eliminate while the major powers (England 9, Italy 9, Turkey 8) fight among themselves. If I can somehow convince one power that eliminating me helps their rival more than themselves, I might survive another season or two. The most likely scenario is gradual elimination through coordinated Italian-Turkish attacks, but if I can drive a diplomatic wedge between them, I might extend the game long enough for the board situation to shift.

## Next Turn Plans

For Fall 1909 Retreats, my F Trieste must retreat. The valid retreat squares depend on adjacent territories not occupied by Italian units - likely options include Albania if available. For Winter 1909, I have 3 supply centers and 3 units (after the fleet retreats), so no builds or disbands required. My Spring 1910 strategy must be purely defensive: (1) A Vienna HOLD to defend my capital, (2) A Budapest HOLD to defend this key center, (3) A Serbia HOLD unless I can identify a specific opportunity to support a neighbor's attack in exchange for survival guarantees. Diplomatically, I'll send desperate proposals to both Italy and Turkey offering to become their client state in exchange for survival - I'll propose supporting their attacks against each other in exchange for guaranteeing my remaining territories. My only hope is to make myself more valuable alive than dead.
`;

// Write the updated reflections
fs.writeFileSync(
  path.join(fall1909Dir, 'Italy', 'strategic-reflection.md'),
  italyReflection,
  'utf8'
);

fs.writeFileSync(
  path.join(fall1909Dir, 'Austria-Hungary', 'strategic-reflection.md'),
  austriaReflection,
  'utf8'
);

console.log('✓ Updated Italy strategic reflection with Trieste capture success');
console.log('✓ Updated Austria-Hungary strategic reflection with Trieste loss');
