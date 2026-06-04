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

export interface Bullet {
  id: string;
  text: string;
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
  experiences: Experience[];
  education: Education[];
  certifications: Certification[];
  updatedAt: string;
}

export interface FormatRules {
  maxBulletsPerRole: number;
  maxBulletChars: number;
  maxSkills: number;
  summarySentences: number;
}

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
  createdAt: string;
}

export interface AppSettings {
  apiKey: string;
  model: string;
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
