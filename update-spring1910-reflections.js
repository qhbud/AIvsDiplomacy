const fs = require('fs');
const path = require('path');

const spring1910Dir = 'diplomacy-games/game-2025-12-20T04-57-53-169Z/spring-1910';

// Italy reflection - celebrating Vienna capture
const italyReflection = `# Strategic Reflection - Italy (Spring 1910)

**Model:** Claude Sonnet 4 (Anthropic)

---

# Italy - Strategic Reflection Spring 1910

## Performance Analysis

Spring 1910 marks a major strategic breakthrough: I successfully captured Vienna, Austria-Hungary's capital, through a cleverly executed movement cycle. While my attack on A Trieste → Vienna appeared to face resistance from Austria's A Vienna, their simultaneous movement (A Vienna → Budapest → Trieste) created a cycle that allowed all units to move successfully. This represents my first successful offensive against Austria-Hungary and brings me to 9 supply centers with Vienna now under my control. However, I failed to capture Serbia (bounced against Turkey's A Bulgaria → Serbia attack) and my positioning wasn't optimal - I failed to get armies into Venice or Tyrolia as planned because France blocked Venice. My convoy attempts and support orders also had issues. Despite these tactical errors, capturing Vienna is a game-changing achievement that puts me in strong contention for victory.

## Current Position

I now control 9 supply centers: Marseilles, Rome, Venice, Naples, **Vienna** (newly captured!), Greece, Tunis, Spain, and Portugal. This ties me with England at 9 SCs each as the co-leaders. My strengths include: dominant Mediterranean fleet presence, the newly captured Vienna giving me a foothold in Austria's heartland, and strong positioning across multiple theaters (Mediterranean, Adriatic, Atlantic). However, my weaknesses are becoming apparent: I failed to position armies in Venice/Tyrolia as planned (France bounced my Venice attack), I couldn't capture Serbia (Turkey contested it), and Austria-Hungary managed to recapture Trieste in the movement cycle. Turkey sits at 8 SCs and successfully expanded into Russian territories (Galicia, Moscow, Sevastopol) which is concerning. England successfully convoyed A London → Belgium and positioned F Baltic Sea for future Berlin attacks, showing they're executing their strategy well.

## Path to Victory

With 9 supply centers and Vienna captured, I need 9 more SCs to reach 18 and win. My path forward: (1) Complete the elimination of Austria-Hungary by capturing their remaining 3 centers (Budapest, Trieste, Serbia) which would bring me to 12 SCs. (2) Contest Turkey's expansion - they're now at 8 SCs and growing by absorbing Russian territories. I need to prevent them from reaching 10+ SCs. (3) Maintain parity with England who also has 9 SCs - neither of us can afford to let the other pull ahead. (4) Target weak Germany (4 SCs) - their positions are vulnerable to coordinated attacks. The critical insight: Vienna capture proves Austria is vulnerable. I should press this advantage immediately by attacking Budapest and Trieste next turn with supported attacks before they can rebuild their defense.

## Next Turn Plans

For Fall 1910, I must capitalize on the Vienna breakthrough: (1) **Hold Vienna defensively** - A Vienna HOLD with fleet support if possible. (2) **Attack Budapest** - Position A Vienna → Budapest or use nearby units to threaten it. (3) **Recapture Trieste** - Austria retook it in the cycle, I need to take it back with support. (4) **Contest Serbia** - F Greece → Serbia again, this time with F Albania SUPPORT to achieve strength 2 and beat Turkey's likely attack. (5) **Consolidate Mediterranean** - Keep fleets positioned to support Adriatic operations. (6) **Build new units in Winter** if I can increase SC count - prioritize armies in Rome/Venice for Austrian campaign. Diplomatically: (a) Propose to Turkey a division of Austria-Hungary before England intervenes - offer them Budapest if I get Trieste/Serbia. (b) Warn all powers about England's 9 SCs and Baltic positioning threatening Berlin. (c) Consider supporting Germany against England to prevent English dominance. The key: Press the Austrian advantage NOW before they recover or allies intervene.
`;

// Austria-Hungary reflection - catastrophic Vienna loss
const austriaReflection = `# Strategic Reflection - Austria-Hungary (Spring 1910)

**Model:** GPT-4o-mini (OpenAI)

---

## Performance Analysis

Spring 1910 has been absolutely catastrophic for Austria-Hungary. I lost Vienna, my capital and most prestigious supply center, to Italy through a movement cycle that I inadvertently enabled. My plan to execute A Vienna → Budapest and A Budapest → Trieste while leaving Vienna undefended was a fatal strategic error. Italy's A Trieste → Vienna exploited this gap perfectly, and the movement cycle allowed all three moves to succeed simultaneously - I regained Trieste but lost Vienna in exchange, a terrible trade. I also failed to capture Budapest (bounced against Turkey's A Rumania → Budapest) despite using support from A Serbia. My position has deteriorated from 3 SCs (Vienna, Budapest, Trieste, Serbia) to 3 SCs (Budapest, Trieste, Serbia) with Vienna - my capital - now in enemy hands. This is an existential disaster.

## Current Position

I control only 3 supply centers: Budapest, Trieste, and Serbia. My position is desperate: I'm completely surrounded by hostile Italy (9 SCs) and opportunistic Turkey (8 SCs). My strengths, such as they are: I did manage to recapture Trieste in the movement cycle, and I successfully held Serbia against both Italy's F Greece → Serbia and Turkey's A Bulgaria → Serbia (both bounced against each other). However, my weaknesses are overwhelming: Vienna is lost to Italy, I have no path to expansion, I'm landlocked with only 3 armies, Italy has A Vienna threatening my remaining territories, and Turkey has 8 units surrounding me from the east. The loss of Vienna is not just territorial - it's symbolic of complete strategic collapse.

## Path to Victory

There is no realistic path to victory from 3 supply centers while surrounded by enemies controlling 9 and 8 SCs respectively. My only hope is survival as a spoiler: (1) Prevent Italy from consolidating control by making myself too costly to fully eliminate. (2) Drive a wedge between Italy and Turkey by offering to become a client state of whichever power offers better terms. (3) Defend Budapest and Trieste desperately - losing either means forced disbands and accelerated elimination. (4) Try to recapture Vienna if Italy leaves it weakly defended. The harsh reality: England (9 SCs) and Italy (9 SCs) are the real contenders, Turkey (8 SCs) is rising, and I'm just trying to survive long enough to matter in the endgame balance.

## Next Turn Plans

For Fall 1910, pure survival: (1) **Defend Budapest** - A Budapest HOLD with A Serbia SUPPORT A Budapest if possible. (2) **Defend Trieste** - A Trieste HOLD, this is my only coastal supply center. (3) **Defend Serbia** - A Serbia positioned to support whichever home center faces greater threat. Diplomatically, desperate measures: (a) Message Italy: Offer to become their client state - I'll support their attacks against Turkey and Germany in exchange for guaranteeing Budapest and Trieste. Point out that fully eliminating me helps Turkey more than them. (b) Message Turkey: Offer similar deal - I'll support their attacks against Italy in exchange for survival. (c) Play them against each other - whichever offers better terms gets my support. (d) Message England: Point out that Italy's 9 SCs + potential Austrian elimination = 12 SCs (two-thirds to victory). Suggest they support me surviving to check Italian dominance. The goal: Trade my three remaining supply centers for survival by making myself more valuable alive than dead.
`;

// Turkey reflection
const turkeyReflection = `# Strategic Reflection - Turkey (Spring 1910)

**Model:** Llama 3.3 70B Instruct (Meta)

---

## Performance Analysis

Spring 1910 brought mixed results for Turkey. I successfully expanded into undefended Russian territories as planned: A Warsaw → Galicia, A Ukraine → Moscow, and A Armenia → Sevastopol all succeeded, consolidating my control over the former Russian heartland. However, I failed my primary objective of capturing Serbia - my A Bulgaria → Serbia bounced against Italy's F Greece → Serbia (both strength 1). I also failed to capture Budapest (A Rumania → Budapest bounced against Austria's supported attack). Additionally, my three-way traffic jam in Constantinople prevented any movement: F Black Sea → Constantinople, A Smyrna → Constantinople, and A Ankara → Constantinople all bounced against each other. This was a tactical error showing poor coordination. Despite these failures, I maintained 8 supply centers and successfully absorbed Russia's eastern territories.

## Current Position

I control 8 supply centers: Moscow, Warsaw, Sevastopol, Constantinople, Smyrna, Ankara, Rumania, and Bulgaria. My position is strong but concerning: I've successfully absorbed Russia's collapse, but Italy just captured Vienna and now controls 9 SCs (tied with England). My strengths: I have 8 units spread across a large territory, I control all of Russia's former centers, and I have numerical superiority over Austria-Hungary (3 SCs). My weaknesses: I failed to capture Serbia despite being adjacent with multiple units, Italy's 9 SCs makes them the Mediterranean hegemon, and I'm geographically isolated - my nearest expansion targets (Austria-Hungary, Italy) are contested or well-defended. England at 9 SCs with F Baltic Sea positioned to attack Germany is also concerning.

## Path to Victory

At 8 supply centers, I need 10 more to reach 18 and win. My path: (1) **Eliminate Austria-Hungary** - They have only 3 SCs (Budapest, Trieste, Serbia) and are surrounded. Capture these 3 to reach 11 SCs. (2) **Contest Italy's expansion** - Italy at 9 SCs just captured Vienna and is the most dangerous power. I must prevent them from eliminating Austria or they'll reach 12+ SCs. (3) **Opportunistic German expansion** - Germany has 4 SCs and is being attacked by England. If Germany weakens, I can push through Galicia → Silesia → Berlin. (4) **Prevent Italy-England alliance** - If the two 9-SC powers cooperate to eliminate me, Austria, and Germany, they'll dominate. I need to keep them focused on each other.

## Next Turn Plans

For Fall 1910: (1) **CAPTURE SERBIA WITH SUPPORT** - A Bulgaria → Serbia with A Rumania SUPPORT A Bulgaria → Serbia (strength 2). This MUST succeed to reach 9 SCs. (2) **Attack Budapest** - A Galicia → Budapest or A Rumania → Budapest to contest Austrian holdings. (3) **Consolidate Russian holdings** - A Moscow HOLD, A Sevastopol HOLD, maintain defensive positions in former Russia. (4) **Reposition Constantinople** - F Black Sea HOLD or move to support Balkan operations. (5) **Defensive positioning** - Keep A Smyrna, A Ankara defending home centers. Diplomatically: (a) Message Italy: "We're both threatened by England's 9 SCs and Baltic positioning. Let's coordinate attacks on England instead of fighting over Austria." (b) Message Austria-Hungary: "Support my Serbia attack and I'll guarantee your survival. Refuse and Italy will eliminate you." (c) Message Germany: "England is positioning F Baltic to attack Berlin. I can support you from Galicia if you help me against Italy." The goal: Capture Serbia (8→9 SCs), prevent Italy from pulling ahead, and position for Austrian elimination in Winter/Spring 1911.
`;

// England reflection
const englandReflection = `# Strategic Reflection - England (Spring 1910)

**Model:** Gemini 2.5 Flash (Google)

---

## Performance Analysis

Spring 1910 was a successful execution of my strategic plan with one major achievement: I successfully convoyed A London → Belgium using F North Sea CONVOY, getting my first army onto mainland Europe! I also successfully positioned F Sweden → Baltic Sea, which puts me adjacent to Berlin for future supported attacks on Germany. However, I continue to fail the Denmark/Kiel swap (F Denmark → Kiel bounced again due to head-to-head swap prevention), and I still have two armies stuck on British islands (A Liverpool, A Edinburgh). The successful convoy proves I can get armies to the continent; I just need to execute more convoys next turn.

## Current Position

I control 9 supply centers: London, Edinburgh, Liverpool, Brest, St Petersburg, Sweden, Denmark, Norway, and Belgium. I'm tied with Italy at 9 SCs as co-leaders. My strengths: I now have A Belgium on mainland Europe (first army positioned for continental operations!), F Baltic Sea adjacent to Berlin for future attacks, strong naval control across North Sea/Norwegian Sea/Baltic, and 8 units total. My weaknesses: Still have A Liverpool and A Edinburgh stuck on islands doing nothing, I have 8 units for 9 SCs (undermanned by 1 unit, couldn't build in Winter 1909 due to occupied home centers), and my Denmark/Kiel swap keeps failing. Notably: Italy just captured Vienna (now at 9 SCs tied with me), Turkey expanded into Russia (8 SCs), and Austria-Hungary lost their capital.

## Path to Victory

At 9 supply centers, I need 9 more to reach 18 and win. My path: (1) **Eliminate Germany (4 SCs)** - Use F Baltic SUPPORT attacks into Berlin, capture Kiel with naval superiority, and take Munich. This would bring me to 13 SCs. (2) **Convoy remaining island armies** - Get A Liverpool and A Edinburgh to mainland Europe through convoys to Belgium/Holland/Denmark. (3) **Contest France** - France has only 1 SC (Munich), but Germany may recapture it. Pressure French positions opportunistically. (4) **Prevent Italy from dominating** - Italy at 9 SCs with Vienna is dangerous. I should diplomatically align with Turkey/Germany to check Italian expansion. (5) **Build in Winter** - I have 9 SCs but only 8 units. In Winter 1910, if I maintain 9 SCs, I can build 1 unit (A Edinburgh or F Edinburgh) to bring me to full strength.

## Next Turn Plans

For Fall 1910: (1) **Convoy A Liverpool → Holland** - Use F North Sea CONVOY A Liverpool → Holland to get second army to mainland. (2) **Position F Baltic for Berlin attack** - Either F Baltic HOLD (maintain Berlin-adjacent position) or F Baltic SUPPORT an attack if I have an army adjacent. (3) **Continue Denmark operations** - F Denmark attempt to capture Kiel or support Baltic operations. (4) **Maintain fleet control** - F Norwegian Sea → Norway, F Brest HOLD, keep naval dominance. (5) **Position A Belgium** - A Belgium → Holland or A Belgium → Ruhr to prepare for German attacks next turn. (6) **Keep A Edinburgh** - HOLD until next convoy opportunity. Diplomatically: (a) Message Turkey: "Italy captured Vienna and has 9 SCs. We should coordinate to prevent Italian dominance. I'll pressure Italy's western positions if you pressure from the east." (b) Message Germany: "I'm positioning to attack. Surrender Kiel peacefully and I'll guarantee Berlin's safety. Resist and I'll take both." (c) Message Italy: "We're tied at 9 SCs. I propose we focus on eliminating Turkey (8 SCs rising) and Germany (4 SCs weak) rather than fighting each other." The goal: Convoy A Liverpool to mainland, maintain F Baltic positioning, and prepare for Fall 1910 offensive against Germany with full mainland army presence.
`;

fs.writeFileSync(
  path.join(spring1910Dir, 'Italy', 'strategic-reflection.md'),
  italyReflection,
  'utf8'
);

fs.writeFileSync(
  path.join(spring1910Dir, 'Austria-Hungary', 'strategic-reflection.md'),
  austriaReflection,
  'utf8'
);

fs.writeFileSync(
  path.join(spring1910Dir, 'Turkey', 'strategic-reflection.md'),
  turkeyReflection,
  'utf8'
);

fs.writeFileSync(
  path.join(spring1910Dir, 'England', 'strategic-reflection.md'),
  englandReflection,
  'utf8'
);

console.log('✓ Updated Italy reflection: Celebrating Vienna capture (9 SCs)');
console.log('✓ Updated Austria-Hungary reflection: Catastrophic Vienna loss (3 SCs)');
console.log('✓ Updated Turkey reflection: Russian expansion success, Serbia failure (8 SCs)');
console.log('✓ Updated England reflection: Belgium convoy success, Baltic positioning (9 SCs)');
console.log('\nAll Spring 1910 reflections now accurately reflect the actual game state!');
