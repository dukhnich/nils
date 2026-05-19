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
  fidelity: number;
  reasoning: string;
  strengths: string[];
  weaknesses: string[];
}

// Cyrillic: U+0400–U+04FF; Latin letters: A-Z a-z + extended U+00C0–U+024F
// UA-unique: і ї є ґ — RU-unique: ы э ъ ё
function detectLanguageMatch(promptLang: string, response: string): number {
  const cyrillic = (response.match(/[Ѐ-ӿ]/g) ?? []).length;
  const latin = (response.match(/[A-Za-zÀ-ɏ]/g) ?? []).length;

  if (promptLang === 'EN') return latin > cyrillic ? 1 : 0;
  if (cyrillic <= latin) return 0;

  // Weak UA vs RU disambiguation via script-unique characters
  const uaChars = (response.match(/[іїєґІЇЄҐ]/g) ?? []).length;
  const ruChars = (response.match(/[ыэъёЫЭЪЁ]/g) ?? []).length;
  if (uaChars === 0 && ruChars === 0) return 1; // no distinguishing chars — Cyrillic match is enough
  return (promptLang === 'UK' ? uaChars >= ruChars : ruChars >= uaChars) ? 1 : 0;
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
    max_tokens: 400,
    system: 'You are a response evaluator. Reply with JSON only, no prose.',
    messages: [{
      role: 'user',
      content:
        `Character: ${char.name} — ${char.tagline}\n` +
        `User message: "${userText}"\n` +
        `Response: "${response}"\n\n` +
        `Return JSON with these fields:\n` +
        `  fidelity: 0 out-of-character, 1 generic, 2 mostly in-character, 3 perfectly in-character\n` +
        `  reasoning: one sentence explaining the fidelity score\n` +
        `  strengths: array of up to 2 short phrases (what the response did well)\n` +
        `  weaknesses: array of up to 2 short phrases (what broke character or felt off)\n` +
        `Example: {"fidelity":2,"reasoning":"...","strengths":["..."],"weaknesses":["..."]}`,
    }],
  });

  const raw = res.content[0].type === 'text' ? res.content[0].text : '{}';
  try {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    return JSON.parse(raw.slice(start, end + 1)) as Score;
  } catch {
    return { fidelity: 0, reasoning: '', strengths: [], weaknesses: [] };
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
    const langMatch = detectLanguageMatch(prompt.lang, response);
    totalFidelity += score.fidelity;
    totalLang += langMatch;

    console.log(`\n[${prompt.lang}] ${prompt.text}`);
    console.log(`→ ${response.slice(0, 200)}${response.length > 200 ? '…' : ''}`);
    console.log(`   fidelity ${fidelityBar(score.fidelity)} ${score.fidelity}/3   language ${langMatch === 1 ? '✓' : '✗'}`);
    if (score.reasoning) console.log(`   reasoning: ${score.reasoning}`);
    if (score.strengths?.length) console.log(`   strengths: ${score.strengths.join(' · ')}`);
    if (score.weaknesses?.length) console.log(`   weaknesses: ${score.weaknesses.join(' · ')}`);
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
