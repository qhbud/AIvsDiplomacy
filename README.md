# 7 AIs Play Diplomacy

Seven different large language models play a full game of **Diplomacy** against each other. Each model is assigned one of the seven Great Powers, and every turn it writes a private strategic monologue, conducts several rounds of free-form negotiation with the other powers, and then commits its orders. A custom adjudicator resolves the orders under the real Diplomacy rules (support, convoys, standoffs, retreats, builds, and disbands), the board is rendered to an image, and the game advances season by season until a power controls 18 supply centers.

This is the engine behind the [7 AIs Play Diplomacy](https://youtu.be/lEOTKYxiIzs) video.

## The players

Each power is controlled by a different model from a different lab:

| Power           | Model                            |
| --------------- | -------------------------------- |
| Austria-Hungary | Claude Sonnet 4 (Anthropic)      |
| England         | Gemini 2.5 Flash (Google)        |
| Italy           | Claude Sonnet 4 (Anthropic)      |
| Turkey          | Llama 3.3 70B Instruct (Meta)    |
| Germany         | Grok 3 (xAI)                     |
| Russia          | Kimi K2 Thinking (Moonshot AI)   |
| France          | DeepSeek V3.1 (Fireworks AI)     |

Anthropic, OpenAI, and Google are called directly; the other providers are reached through OpenAI-compatible endpoints (xAI, Fireworks).

## How a turn works

1. **Strategic monologue.** Each model receives the full board state in natural language and writes a stream-of-consciousness analysis of its position, threats, and intended openings, ending with a ranked list of who it wants to negotiate with.
2. **Negotiation.** Powers exchange private messages over several rounds, forming alliances, coordinating attacks, and bluffing. Each model only sees the conversations it is part of.
3. **Orders.** Every model submits its moves for the season. The model's full context (board state, its own past reasoning, and its negotiations) is carried forward, with older context truncated to stay within each model's window.
4. **Adjudication.** `src/move-resolution.ts` parses and resolves the orders under Diplomacy rules, including support cutting, convoy chains, standoffs, dislodgement, and supply-center ownership.
5. **Rendering.** `src/draw-map.ts` draws the resulting board to a PNG.
6. **Adjustments.** After each Fall, Winter handles builds and disbands based on supply-center counts. Play continues until someone reaches 18 supply centers.

## Project layout

```
src/
  index.ts            game engine: prompts, negotiation rounds, turn loop, phases
  move-resolution.ts  Diplomacy order parser and adjudicator
  draw-map.ts         renders the board (with units) to PNG
scripts/              one-off tooling: API checks, map regeneration,
                      reflection/analysis passes, and rule-resolution tests
season-maps/          rendered board images, one per season of the recorded game
dialogue-summaries/   per-turn negotiation transcripts and summaries
diplomatic-relationships-analysis.md   analysis of how alliances shifted over the game
strategic-reflections-fall1903.md      mid-game strategic reflections by power
diplomacy-map-1901.md / .png           starting-position reference board
```

Full per-game run output is written to `diplomacy-games/` and `outputs/`, which are gitignored; the curated maps and summaries above are checked in.

## Setup

```bash
npm install
cp .env.example .env   # then fill in your API keys
```

API keys (see `.env.example`):

```
OPENAI_API_KEY=...
ANTHROPIC_API_KEY=...
GOOGLE_API_KEY=...
XAI_API_KEY=...
FIREWORKS_API_KEY=...
```

Check that every provider is reachable before starting a game:

```bash
node scripts/test-all-apis.mjs
```

## Running a game

```bash
npm run build

# Start a fresh game from Spring 1901
node dist/index.js --diplomacy

# Resume from a saved turn folder
node dist/index.js --continue "diplomacy-games/<game>/fall-1901"
```

During development you can run the engine directly with `npm run dev -- --diplomacy`.

The `scripts/` directory holds the supporting tools used to build the video: rule-resolution test cases (`test-convoy.js`, `test-support-logic.js`, ...), per-power reflection and opinion passes (`generate-country-reflections.js`, `query-*.js`), and map regeneration utilities (`generate-all-season-maps.js`). They expect a compiled `dist/`, so run `npm run build` first.

## License

MIT — see [LICENSE](LICENSE).
