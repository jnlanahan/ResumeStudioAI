import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  AppSettings,
  Certification,
  Education,
  Experience,
  Link,
  MasterResume,
  TailoredResume,
} from "@/types";
import { newId } from "@/lib/utils";

interface AppState {
  master: MasterResume;
  library: TailoredResume[];
  settings: AppSettings;

  setMaster: (master: MasterResume) => void;
  updateMaster: (patch: Partial<MasterResume>) => void;
  addExperience: () => void;
  updateExperience: (id: string, patch: Partial<Experience>) => void;
  removeExperience: (id: string) => void;
  addBullet: (experienceId: string) => void;
  updateBullet: (experienceId: string, bulletId: string, text: string) => void;
  removeBullet: (experienceId: string, bulletId: string) => void;
  addEducation: () => void;
  updateEducation: (id: string, patch: Partial<Education>) => void;
  removeEducation: (id: string) => void;
  addLink: () => void;
  updateLink: (id: string, patch: Partial<Link>) => void;
  removeLink: (id: string) => void;
  addCertification: () => void;
  updateCertification: (id: string, patch: Partial<Certification>) => void;
  removeCertification: (id: string) => void;

  saveTailored: (resume: TailoredResume) => void;
  removeTailored: (id: string) => void;
  renameTailored: (id: string, label: string) => void;

  setSettings: (patch: Partial<AppSettings>) => void;
}

const blankMaster = (): MasterResume => ({
  contact: {
    fullName: "",
    email: "",
    phone: "",
    location: "",
    links: [],
  },
  experiences: [],
  education: [],
  certifications: [],
  updatedAt: new Date().toISOString(),
});

const defaultSettings = (): AppSettings => ({
  apiKey: "",
  model: "claude-sonnet-4-6",
  rules: {
    maxBulletsPerRole: 4,
    maxBulletChars: 150,
    maxSkills: 12,
    summarySentences: 3,
  },
});

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      master: blankMaster(),
      library: [],
      settings: defaultSettings(),

      setMaster: (master) =>
        set({ master: { ...master, updatedAt: new Date().toISOString() } }),
      updateMaster: (patch) =>
        set((s) => ({
          master: {
            ...s.master,
            ...patch,
            updatedAt: new Date().toISOString(),
          },
        })),

      addExperience: () =>
        set((s) => ({
          master: {
            ...s.master,
            experiences: [
              ...s.master.experiences,
              {
                id: newId(),
                company: "",
                role: "",
                location: "",
                startDate: "",
                endDate: "",
                bullets: [{ id: newId(), text: "" }],
              },
            ],
            updatedAt: new Date().toISOString(),
          },
        })),
      updateExperience: (id, patch) =>
        set((s) => ({
          master: {
            ...s.master,
            experiences: s.master.experiences.map((e) =>
              e.id === id ? { ...e, ...patch } : e
            ),
            updatedAt: new Date().toISOString(),
          },
        })),
      removeExperience: (id) =>
        set((s) => ({
          master: {
            ...s.master,
            experiences: s.master.experiences.filter((e) => e.id !== id),
            updatedAt: new Date().toISOString(),
          },
        })),
      addBullet: (experienceId) =>
        set((s) => ({
          master: {
            ...s.master,
            experiences: s.master.experiences.map((e) =>
              e.id === experienceId
                ? { ...e, bullets: [...e.bullets, { id: newId(), text: "" }] }
                : e
            ),
            updatedAt: new Date().toISOString(),
          },
        })),
      updateBullet: (experienceId, bulletId, text) =>
        set((s) => ({
          master: {
            ...s.master,
            experiences: s.master.experiences.map((e) =>
              e.id === experienceId
                ? {
                    ...e,
                    bullets: e.bullets.map((b) =>
                      b.id === bulletId ? { ...b, text } : b
                    ),
                  }
                : e
            ),
            updatedAt: new Date().toISOString(),
          },
        })),
      removeBullet: (experienceId, bulletId) =>
        set((s) => ({
          master: {
            ...s.master,
            experiences: s.master.experiences.map((e) =>
              e.id === experienceId
                ? { ...e, bullets: e.bullets.filter((b) => b.id !== bulletId) }
                : e
            ),
            updatedAt: new Date().toISOString(),
          },
        })),

      addEducation: () =>
        set((s) => ({
          master: {
            ...s.master,
            education: [
              ...s.master.education,
              {
                id: newId(),
                school: "",
                degree: "",
                startDate: "",
                endDate: "",
                detail: "",
              },
            ],
            updatedAt: new Date().toISOString(),
          },
        })),
      updateEducation: (id, patch) =>
        set((s) => ({
          master: {
            ...s.master,
            education: s.master.education.map((e) =>
              e.id === id ? { ...e, ...patch } : e
            ),
            updatedAt: new Date().toISOString(),
          },
        })),
      removeEducation: (id) =>
        set((s) => ({
          master: {
            ...s.master,
            education: s.master.education.filter((e) => e.id !== id),
            updatedAt: new Date().toISOString(),
          },
        })),

      addLink: () =>
        set((s) => ({
          master: {
            ...s.master,
            contact: {
              ...s.master.contact,
              links: [...s.master.contact.links, { id: newId(), label: "", url: "" }],
            },
            updatedAt: new Date().toISOString(),
          },
        })),
      updateLink: (id, patch) =>
        set((s) => ({
          master: {
            ...s.master,
            contact: {
              ...s.master.contact,
              links: s.master.contact.links.map((l) =>
                l.id === id ? { ...l, ...patch } : l
              ),
            },
            updatedAt: new Date().toISOString(),
          },
        })),
      removeLink: (id) =>
        set((s) => ({
          master: {
            ...s.master,
            contact: {
              ...s.master.contact,
              links: s.master.contact.links.filter((l) => l.id !== id),
            },
            updatedAt: new Date().toISOString(),
          },
        })),

      addCertification: () =>
        set((s) => ({
          master: {
            ...s.master,
            certifications: [
              ...s.master.certifications,
              { id: newId(), name: "", issuer: "", date: "", url: "" },
            ],
            updatedAt: new Date().toISOString(),
          },
        })),
      updateCertification: (id, patch) =>
        set((s) => ({
          master: {
            ...s.master,
            certifications: s.master.certifications.map((c) =>
              c.id === id ? { ...c, ...patch } : c
            ),
            updatedAt: new Date().toISOString(),
          },
        })),
      removeCertification: (id) =>
        set((s) => ({
          master: {
            ...s.master,
            certifications: s.master.certifications.filter((c) => c.id !== id),
            updatedAt: new Date().toISOString(),
          },
        })),

      saveTailored: (resume) =>
        set((s) => {
          const existingIdx = s.library.findIndex((r) => r.id === resume.id);
          if (existingIdx >= 0) {
            const next = [...s.library];
            next[existingIdx] = resume;
            return { library: next };
          }
          return { library: [resume, ...s.library] };
        }),
      removeTailored: (id) =>
        set((s) => ({ library: s.library.filter((r) => r.id !== id) })),
      renameTailored: (id, label) =>
        set((s) => ({
          library: s.library.map((r) => (r.id === id ? { ...r, label } : r)),
        })),

      setSettings: (patch) =>
        set((s) => ({
          settings: {
            ...s.settings,
            ...patch,
            rules: { ...s.settings.rules, ...(patch.rules ?? {}) },
          },
        })),
    }),
    {
      name: "resume-studio-ai-v2",
      version: 2,
    }
  )
);
