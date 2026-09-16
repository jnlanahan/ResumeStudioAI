export interface Link {
  id: string;
  label: string;
  url: string;
}

export interface Contact {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  links: Link[];
}

/**
 * One accomplishment. `text` is the primary wording; `variants` are alternate
 * phrasings of the same fact (e.g. from different resume versions). Tailoring
 * may pick any variant but never invents a new one.
 */
export interface Bullet {
  id: string;
  text: string;
  variants: string[];
}

export interface Experience {
  id: string;
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string;
  bullets: Bullet[];
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  location: string;
  startDate: string;
  endDate: string;
  detail: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  url?: string;
}

export interface MasterResume {
  contact: Contact;
  /** e.g. "Product Manager" — shown next to the name in some templates. */
  headline: string;
  /** Master summary paragraph; source material for per-job summaries. */
  summary: string;
  experiences: Experience[];
  education: Education[];
  certifications: Certification[];
  skills: string[];
  tools: string[];
  /** Free-form lines for an "Additional Information" section. */
  additional: string[];
  updatedAt: string;
}

export interface FormatRules {
  maxBulletsPerRole: number;
  maxBulletChars: number;
  maxSkills: number;
  summarySentences: number;
}

export type TemplateId = "classic" | "modern" | "compact";

export interface TweakedBullet {
  originalId: string;
  original: string;
  tweaked: string;
  changed: boolean;
  rationale?: string;
}

export interface TweakedExperience {
  experienceId: string;
  bullets: TweakedBullet[];
}

export interface TailoredResume {
  id: string;
  label: string;
  jobTitle: string;
  company: string;
  jobDescription: string;
  headline: string;
  summary: string;
  experiences: TweakedExperience[];
  skills: string[];
  notes: string;
  template: TemplateId;
  createdAt: string;
}

export interface AppSettings {
  apiKey: string;
  model: string;
  template: TemplateId;
  rules: FormatRules;
}

// Ephemeral tailor workflow types (not persisted)
export type BulletRating = "strong" | "medium" | "weak";

export interface RatedBullet {
  bulletId: string;
  experienceId: string;
  rating: BulletRating;
  rationale: string;
  suggestedTweak?: string;
}

export interface AnalysisResult {
  ratedBullets: RatedBullet[];
  suggestedSkills: string[];
}

export interface IdentityOption {
  headline: string;
  summary: string;
}

// ─── Resume import (ephemeral) ───────────────────────────────────────────────

/** What Claude extracts from an uploaded resume, already matched against the existing bank. */
export interface ImportedBullet {
  /** id of an existing bullet this is a rewording of, or null if new */
  matchBulletId: string | null;
  text: string;
  variants: string[];
}

export interface ImportedExperience {
  /** id of an existing role this is the same job as, or null if new */
  matchExperienceId: string | null;
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string;
  bullets: ImportedBullet[];
}

export interface ImportedResume {
  contact: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    links: { label: string; url: string }[];
  };
  headline: string;
  summary: string;
  experiences: ImportedExperience[];
  education: {
    school: string;
    degree: string;
    location: string;
    startDate: string;
    endDate: string;
    detail: string;
  }[];
  certifications: { name: string; issuer: string; date: string }[];
  skills: string[];
  tools: string[];
  additional: string[];
}

/** Human-readable record of what an import will change, shown before applying. */
export interface ImportChange {
  kind: "new-role" | "new-bullet" | "variant" | "new-education" | "new-certification" | "skills" | "tools" | "additional" | "contact";
  label: string;
  detail?: string;
}
