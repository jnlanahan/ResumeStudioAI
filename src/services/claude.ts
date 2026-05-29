import Anthropic from "@anthropic-ai/sdk";
import type {
  AppSettings,
  MasterResume,
  TailoredResume,
  TweakedExperience,
} from "@/types";
import { newId } from "@/lib/utils";

interface TailorInput {
  master: MasterResume;
  jobDescription: string;
  jobTitle: string;
  company: string;
  settings: AppSettings;
}

interface ModelResponse {
  summary: string;
  experiences: {
    experienceId: string;
    bullets: {
      originalId: string;
      tweaked: string;
      changed: boolean;
      rationale?: string;
    }[];
  }[];
  skills: string[];
  notes: string;
}

const SYSTEM_PROMPT = `You are a precise resume tailoring assistant. You help a single user adapt their existing resume to a specific job posting.

ABSOLUTE RULES — these are non-negotiable:
1. NEVER fabricate experience, skills, metrics, dates, companies, technologies, or accomplishments. Only work with content the user provided.
2. Tweaks must be WORDING ONLY. The factual meaning of every bullet must remain identical to the original. If you cannot tweak a bullet without changing its meaning, leave it identical and mark "changed": false.
3. Do not invent numbers or quantitative impact. If the user said "led a team", do not change to "led a team of 12". If a number is already present, you may keep it but never modify it.
4. Pick the most relevant existing bullets per role given the job description. Do not write new bullets.
5. Keep every bullet under the character limit specified in the rules.
6. Skills list: select only skills the user already listed; reorder to put job-relevant skills first; never add skills the user did not list.
7. Summary: 2-3 sentences max, written in first-person-implied voice (no "I"), grounded only in the user's provided experience and the role they are targeting.

Respond ONLY with a single JSON object — no markdown fences, no commentary. Structure:
{
  "summary": string,
  "experiences": [
    {
      "experienceId": string,
      "bullets": [
        { "originalId": string, "tweaked": string, "changed": boolean, "rationale"?: string }
      ]
    }
  ],
  "skills": string[],
  "notes": string
}

The "bullets" array per experience must be ordered by relevance (most relevant first) and capped at the maxBulletsPerRole rule. "notes" is a short observation about the tailoring (1-2 sentences) — what you emphasized and why.`;

export async function tailorResume(input: TailorInput): Promise<TailoredResume> {
  const { master, jobDescription, jobTitle, company, settings } = input;
  if (!settings.apiKey) {
    throw new Error("Add your Anthropic API key in Settings before tailoring.");
  }
  if (!master.experiences.length) {
    throw new Error("Fill out at least one experience in your master profile.");
  }
  if (!jobDescription.trim()) {
    throw new Error("Paste a job description first.");
  }

  const client = new Anthropic({
    apiKey: settings.apiKey,
    dangerouslyAllowBrowser: true,
  });

  const userPayload = {
    rules: settings.rules,
    target: { jobTitle, company, jobDescription },
    master: {
      contact: master.contact,
      summary: master.summary,
      skills: master.skills,
      experiences: master.experiences.map((e) => ({
        id: e.id,
        company: e.company,
        role: e.role,
        startDate: e.startDate,
        endDate: e.endDate,
        bullets: e.bullets.map((b) => ({ id: b.id, text: b.text })),
      })),
    },
  };

  const message = await client.messages.create({
    model: settings.model,
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Tailor this resume to the target job. Preserve meaning, tweak wording only.\n\n${JSON.stringify(
          userPayload,
          null,
          2
        )}`,
      },
    ],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Empty response from Claude.");
  }
  const parsed = parseJson(textBlock.text);

  return assembleTailored({ master, parsed, jobTitle, company, jobDescription });
}

function parseJson(raw: string): ModelResponse {
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
    return JSON.parse(text) as ModelResponse;
  } catch (err) {
    throw new Error(
      `Could not parse Claude's response as JSON. ${(err as Error).message}`
    );
  }
}

function assembleTailored(args: {
  master: MasterResume;
  parsed: ModelResponse;
  jobTitle: string;
  company: string;
  jobDescription: string;
}): TailoredResume {
  const { master, parsed, jobTitle, company, jobDescription } = args;

  const experiences: TweakedExperience[] = master.experiences.map((exp) => {
    const match = parsed.experiences?.find((e) => e.experienceId === exp.id);
    const ordered = (match?.bullets ?? []).map((b) => {
      const original = exp.bullets.find((bb) => bb.id === b.originalId);
      return {
        originalId: b.originalId,
        original: original?.text ?? "",
        tweaked: b.tweaked,
        changed: Boolean(b.changed) && b.tweaked !== original?.text,
        ...(b.rationale ? { rationale: b.rationale } : {}),
      };
    });
    return { experienceId: exp.id, bullets: ordered };
  });

  return {
    id: newId(),
    label: `${jobTitle || "Untitled"}${company ? " — " + company : ""}`.trim(),
    jobTitle,
    company,
    jobDescription,
    summary: parsed.summary ?? "",
    experiences,
    skills: parsed.skills ?? master.skills,
    notes: parsed.notes ?? "",
    createdAt: new Date().toISOString(),
  };
}
