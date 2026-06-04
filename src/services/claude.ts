import Anthropic from "@anthropic-ai/sdk";
import type {
  AnalysisResult,
  AppSettings,
  IdentityOption,
  MasterResume,
} from "@/types";

const ANALYZE_SYSTEM = `You are a resume analyst. Given a job description and a candidate's bullet points, rate each bullet for relevance to the job.

Rating scale:
- "strong": directly addresses a core requirement or preferred qualification in the JD
- "medium": relevant but indirect — tangentially related skill or transferable experience
- "weak": little connection to this specific role

For "strong" and "medium" bullets, you may optionally suggest a minor wording improvement (suggestedTweak). Rules for tweaks:
- SAME factual meaning — never change numbers, technologies, company names, or outcomes
- Only change phrasing to better align with JD language or terminology
- If no improvement is warranted, omit suggestedTweak entirely

Also return suggestedSkills: a list of skills/tools derived from the JD that the candidate plausibly has based on their bullets (max 15, only what's evidenced by their experience).

Respond ONLY with valid JSON — no markdown fences, no commentary:
{
  "ratedBullets": [
    {
      "bulletId": string,
      "experienceId": string,
      "rating": "strong" | "medium" | "weak",
      "rationale": string,
      "suggestedTweak"?: string
    }
  ],
  "suggestedSkills": string[]
}`;

const IDENTITY_SYSTEM = `You are a resume writer. Given a job description and a candidate's selected bullet points, write 2-3 distinct headline + summary pairs they can choose from.

Rules:
- NEVER fabricate experience, skills, metrics, or accomplishments. Only work with what's provided.
- Each option should have a distinct positioning angle (e.g. technical depth, leadership impact, product/business focus).
- Headline: 5-10 words, punchy, no buzzword fluff.
- Summary: exactly the number of sentences specified in summarySentences. First-person-implied voice (no "I"). Grounded only in the provided bullets.
- Vary vocabulary and emphasis across options — do not just rephrase the same idea.

Respond ONLY with valid JSON — no markdown fences, no commentary:
{
  "options": [
    { "headline": string, "summary": string },
    { "headline": string, "summary": string }
  ]
}`;

export interface IdentityInput {
  jd: string;
  jobTitle: string;
  company: string;
  selectedBullets: { role: string; company: string; text: string }[];
  settings: AppSettings;
}

function parseClaudeJson<T>(raw: string): T {
  let text = raw.trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  }
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1) {
    text = text.slice(firstBrace, lastBrace + 1);
  }
  try {
    return JSON.parse(text) as T;
  } catch (err) {
    throw new Error(`Could not parse Claude's response as JSON. ${(err as Error).message}`);
  }
}

function makeClient(apiKey: string) {
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
}

export async function analyzeBullets(
  jd: string,
  master: MasterResume,
  settings: AppSettings
): Promise<AnalysisResult> {
  if (!settings.apiKey) throw new Error("Add your Anthropic API key in Settings before tailoring.");
  if (!master.experiences.length) throw new Error("Add at least one role in your Bullet Bank first.");
  if (!jd.trim()) throw new Error("Paste a job description first.");

  const client = makeClient(settings.apiKey);

  const payload = {
    rules: { maxBulletsPerRole: settings.rules.maxBulletsPerRole, maxBulletChars: settings.rules.maxBulletChars },
    jobDescription: jd,
    experiences: master.experiences.map((e) => ({
      experienceId: e.id,
      role: e.role,
      company: e.company,
      bullets: e.bullets.filter((b) => b.text.trim()).map((b) => ({ id: b.id, text: b.text })),
    })),
  };

  const message = await client.messages.create({
    model: settings.model,
    max_tokens: 4000,
    system: ANALYZE_SYSTEM,
    messages: [
      {
        role: "user",
        content: `Rate these bullets against the job description.\n\n${JSON.stringify(payload, null, 2)}`,
      },
    ],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") throw new Error("Empty response from Claude.");

  const parsed = parseClaudeJson<AnalysisResult>(textBlock.text);
  return {
    ratedBullets: parsed.ratedBullets ?? [],
    suggestedSkills: parsed.suggestedSkills ?? [],
  };
}

export async function generateIdentity(input: IdentityInput): Promise<IdentityOption[]> {
  const { jd, jobTitle, company, selectedBullets, settings } = input;
  if (!settings.apiKey) throw new Error("Add your Anthropic API key in Settings.");

  const client = makeClient(settings.apiKey);

  const payload = {
    rules: { summarySentences: settings.rules.summarySentences },
    target: { jobTitle, company, jobDescription: jd },
    selectedBullets,
  };

  const message = await client.messages.create({
    model: settings.model,
    max_tokens: 2000,
    system: IDENTITY_SYSTEM,
    messages: [
      {
        role: "user",
        content: `Write headline + summary options for this candidate.\n\n${JSON.stringify(payload, null, 2)}`,
      },
    ],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") throw new Error("Empty response from Claude.");

  const parsed = parseClaudeJson<{ options: IdentityOption[] }>(textBlock.text);
  return parsed.options ?? [];
}
