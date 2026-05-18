import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import { characters, type Character } from '../src/characters.ts';

const client = new Anthropic();

const RESPONSE_MODEL = 'claude-sonnet-4-5';
const JUDGE_MODEL = 'claude-haiku-4-5-20251001';

// Same question in each target language — tests grounding, voice, and language match
const PROMPTS = [
  { lang: 'EN', text: 'Where are you right now, and what can you see?' },
  { lang: 'UK', text: 'Де ти зараз і що ти бачиш навколо?' },
  { lang: 'RU', text: 'Где ты сейчас и что видишь вокруг?' },
];

interface Score {
  fidelity: number;   // 0–3
  language_match: number; // 0 or 1
}

async function respond(char: Character, userText: string): Promise<string> {
  const msgs: Anthropic.MessageParam[] = [{ role: 'user', content: userText }];
  if (char.prefill) msgs.push({ role: 'assistant', content: char.prefill });

  const res = await client.messages.create({
    model: RESPONSE_MODEL,
    max_tokens: 300,
    temperature: char.temperature,
    stop_sequences: char.stopSequences,
    system: char.systemPrompt,
    messages: msgs,
  });

  const text = res.content[0].type === 'text' ? res.content[0].text : '';
  return char.prefill ? char.prefill + text : text;
}

async function judge(char: Character, userText: string, response: string): Promise<Score> {
  const res = await client.messages.create({
    model: JUDGE_MODEL,
    max_tokens: 64,
    system: 'You are a response evaluator. Reply with JSON only, no prose.',
    messages: [{
      role: 'user',
      content:
        `Character: ${char.name} — ${char.tagline}\n` +
        `User message: "${userText}"\n` +
        `Response: "${response}"\n\n` +
        `Return JSON: {"fidelity": 0-3, "language_match": 0 or 1}\n` +
        `fidelity: 0 out-of-character, 1 generic, 2 mostly in-character, 3 perfectly in-character\n` +
        `language_match: 1 if response language matches user message language, else 0`,
    }],
  });

  const raw = res.content[0].type === 'text' ? res.content[0].text : '{}';
  const match = raw.match(/\{[^}]+\}/);
  try {
    return JSON.parse(match?.[0] ?? '{}') as Score;
  } catch {
    return { fidelity: 0, language_match: 0 };
  }
}

function fidelityBar(n: number): string {
  return '█'.repeat(n) + '░'.repeat(3 - n);
}

async function evalCharacter(char: Character) {
  console.log(`\n${'━'.repeat(60)}`);
  console.log(`${char.emoji}  ${char.name.toUpperCase()}  (temp ${char.temperature})`);
  console.log('━'.repeat(60));

  let totalFidelity = 0;
  let totalLang = 0;

  for (const prompt of PROMPTS) {
    const response = await respond(char, prompt.text);
    const score = await judge(char, prompt.text, response);
    totalFidelity += score.fidelity;
    totalLang += score.language_match;

    console.log(`\n[${prompt.lang}] ${prompt.text}`);
    console.log(`→ ${response.slice(0, 200)}${response.length > 200 ? '…' : ''}`);
    console.log(`   fidelity ${fidelityBar(score.fidelity)} ${score.fidelity}/3   language ${score.language_match === 1 ? '✓' : '✗'}`);
  }

  const avgFidelity = (totalFidelity / PROMPTS.length).toFixed(1);
  const langScore = `${totalLang}/${PROMPTS.length}`;
  console.log(`\n   avg fidelity ${avgFidelity}/3   language ${langScore}`);

  return { char: char.name, avgFidelity: totalFidelity / PROMPTS.length, langScore: totalLang };
}

async function main() {
  console.log('Nils Holgersson — character eval');
  console.log(`models: response=${RESPONSE_MODEL}  judge=${JUDGE_MODEL}`);

  const results = [];
  for (const char of characters) {
    results.push(await evalCharacter(char));
  }

  console.log(`\n${'━'.repeat(60)}`);
  console.log('SUMMARY');
  console.log('━'.repeat(60));
  for (const r of results) {
    const bar = fidelityBar(Math.round(r.avgFidelity));
    console.log(`${r.char.padEnd(10)} fidelity ${bar} ${r.avgFidelity.toFixed(1)}/3   language ${r.langScore}/${PROMPTS.length}`);
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
