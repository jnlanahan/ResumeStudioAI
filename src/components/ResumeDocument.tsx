import type { MasterResume, TailoredResume } from "@/types";
import { formatRange } from "@/lib/utils";

interface Props {
  master: MasterResume;
  tailored?: TailoredResume;
  rules: { maxBulletsPerRole: number; maxSkills: number };
}

export function ResumeDocument({ master, tailored, rules }: Props) {
  const headline = tailored?.headline ?? "";
  const summary = tailored?.summary ?? "";
  const skills = (tailored?.skills ?? []).slice(0, rules.maxSkills);

  const experiences = master.experiences.map((exp) => {
    const tweaks = tailored?.experiences.find((e) => e.experienceId === exp.id);
    let bullets: { id: string; text: string }[];
    if (tweaks && tweaks.bullets.length) {
      bullets = tweaks.bullets
        .slice(0, rules.maxBulletsPerRole)
        .map((b) => ({ id: b.originalId, text: b.tweaked || b.original }));
    } else {
      bullets = exp.bullets
        .filter((b) => b.text.trim())
        .slice(0, rules.maxBulletsPerRole)
        .map((b) => ({ id: b.id, text: b.text }));
    }
    return { exp, bullets };
  });

  const contactParts: (string | React.ReactElement)[] = [
    master.contact.location,
    master.contact.email,
    master.contact.phone,
    ...master.contact.links.map((l) =>
      l.url ? (
        <a key={l.id} href={l.url} target="_blank" rel="noreferrer">
          {l.label || l.url}
        </a>
      ) : l.label ? (
        <span key={l.id}>{l.label}</span>
      ) : null
    ),
  ].filter(Boolean) as (string | React.ReactElement)[];

  return (
    <article className="resume-page" id="resume-document">
      <header>
        <h1>{master.contact.fullName || "Your Name"}</h1>
        {headline && (
          <p style={{ marginTop: "2pt", fontSize: "10.5pt", color: "#334155", fontWeight: 500 }}>
            {headline}
          </p>
        )}
        <p className="contact">
          {contactParts.map((part, i) => (
            <span key={i}>
              {part}
              {i < contactParts.length - 1 && "  •  "}
            </span>
          ))}
        </p>
      </header>

      {summary && (
        <section>
          <h2>Summary</h2>
          <p className="summary">{summary}</p>
        </section>
      )}

      {experiences.some(({ bullets }) => bullets.length > 0) && (
        <section>
          <h2>Experience</h2>
          {experiences.map(({ exp, bullets }) => (
            <div className="experience-block" key={exp.id}>
              <div className="role-row">
                <h3>
                  {exp.role || "Role"}
                  {exp.company ? ` · ${exp.company}` : ""}
                </h3>
                <span className="role-meta">
                  {[exp.location, formatRange(exp.startDate, exp.endDate)]
                    .filter(Boolean)
                    .join("  •  ")}
                </span>
              </div>
              {bullets.length > 0 && (
                <ul>
                  {bullets.map((b) => (
                    <li key={b.id}>{b.text}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {skills.length > 0 && (
        <section>
          <h2>Skills</h2>
          <p className="skills">{skills.join(" · ")}</p>
        </section>
      )}

      {master.education.length > 0 && (
        <section>
          <h2>Education</h2>
          {master.education.map((ed) => (
            <div className="experience-block" key={ed.id}>
              <div className="role-row">
                <h3>
                  {ed.degree || "Degree"}
                  {ed.school ? ` · ${ed.school}` : ""}
                </h3>
                <span className="role-meta">{formatRange(ed.startDate, ed.endDate)}</span>
              </div>
              {ed.detail && (
                <p style={{ marginTop: "2pt", fontSize: "10pt", color: "#334155" }}>{ed.detail}</p>
              )}
            </div>
          ))}
        </section>
      )}

      {master.certifications.length > 0 && (
        <section>
          <h2>Certifications</h2>
          {master.certifications.map((cert) => (
            <div className="experience-block" key={cert.id}>
              <div className="role-row">
                <h3>{cert.name || "Certification"}{cert.issuer ? ` · ${cert.issuer}` : ""}</h3>
                <span className="role-meta">{cert.date}</span>
              </div>
              {cert.url && (
                <p style={{ marginTop: "2pt", fontSize: "10pt", color: "#334155" }}>
                  <a href={cert.url} target="_blank" rel="noreferrer" style={{ color: "#3b82f6" }}>Verify credential</a>
                </p>
              )}
            </div>
          ))}
        </section>
      )}
    </article>
  );
}
