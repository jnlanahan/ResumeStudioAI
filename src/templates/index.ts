import type { TemplateId } from "@/types";

export interface TemplateMeta {
  id: TemplateId;
  name: string;
  description: string;
}

export const TEMPLATES: TemplateMeta[] = [
  {
    id: "classic",
    name: "Classic",
    description: "Centered serif header, roles grouped under each employer, Education and Additional Information sections. Traditional and ATS-friendly.",
  },
  {
    id: "modern",
    name: "Modern",
    description: "Clean sans-serif with ruled section headings. Summary, Experience, Skills, Education, Certifications.",
  },
  {
    id: "compact",
    name: "Compact",
    description: "Tight margins and smaller type to fit more on one page. Skills line sits directly under the header.",
  },
];

export const templateName = (id: TemplateId) => TEMPLATES.find((t) => t.id === id)?.name ?? id;
