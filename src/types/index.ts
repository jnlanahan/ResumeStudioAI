export interface Contact {
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  linkLabel: string;
  linkUrl: string;
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

export interface MasterResume {
  contact: Contact;
  summary: string;
  experiences: Experience[];
  skills: string[];
  education: Education[];
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
