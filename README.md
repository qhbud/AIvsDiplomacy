# LLM Comparison Tool

Compare responses from 7 different Large Language Models using a single prompt.

## Supported Models

This tool queries the following 7 LLMs in parallel:

1. **GPT-4o** (OpenAI)
2. **GPT-4o-mini** (OpenAI)
3. **GPT-3.5-turbo** (OpenAI)
4. **Claude Sonnet 4.5** (Anthropic)
5. **Claude Opus 4.5** (Anthropic)
6. **Gemini 1.5 Pro** (Google)
7. **Gemini 1.5 Flash** (Google)

## Prerequisites

You need API keys from:
- [OpenAI](https://platform.openai.com/api-keys)
- [Anthropic](https://console.anthropic.com/settings/keys)
- [Google AI Studio](https://aistudio.google.com/app/apikey)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file with your API keys:
```bash
cp .env.example .env
```

3. Edit `.env` and add your API keys:
```
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=AI...
```

## Usage

Run the comparison with your prompt as a command line argument:

```bash
npm run dev "What is the capital of France?"
```

Or build and run:

```bash
npm run build
npm start "What is the capital of France?"
```

## Output

The tool will:
1. Query all 7 LLMs in parallel
2. Generate a markdown file with all responses
3. Save the file to `outputs/llm-comparison-[timestamp].md`
4. Print a summary to the console

Example output structure:

```markdown
# LLM Comparison Results

**Generated:** 12/17/2025, 10:30:00 AM

## Prompt

What is the capital of France?

---

## 1. GPT-4o (OpenAI)

The capital of France is Paris.

*Response time: 1.23s*

---

## 2. GPT-4o-mini (OpenAI)

...

```

## Notes

- All 7 models are queried simultaneously for faster results
- Response times are measured and included in the output
- If an API key is missing, those models will fail with an error message
- Outputs are timestamped to prevent overwriting previous comparisons
