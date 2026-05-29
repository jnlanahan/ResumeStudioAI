import type { MasterResume, TailoredResume } from "@/types";
import { formatRange } from "@/lib/utils";

interface Props {
  master: MasterResume;
  tailored?: TailoredResume;
  rules: { maxBulletsPerRole: number; maxSkills: number };
}

export function ResumeDocument({ master, tailored, rules }: Props) {
  const summary = tailored?.summary || master.summary;
  const skills = (tailored?.skills && tailored.skills.length
    ? tailored.skills
    : master.skills
  ).slice(0, rules.maxSkills);

  const experiences = master.experiences.map((exp) => {
    const tweaks = tailored?.experiences.find(
      (e) => e.experienceId === exp.id
    );
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

  return (
    <article className="resume-page" id="resume-document">
      <header>
        <h1>{master.contact.fullName || "Your Name"}</h1>
        {master.contact.headline && (
          <p
            style={{
              marginTop: "2pt",
              fontSize: "10.5pt",
              color: "#334155",
              fontWeight: 500,
            }}
          >
            {master.contact.headline}
          </p>
        )}
        <p className="contact">
          {[
            master.contact.location,
            master.contact.email,
            master.contact.phone,
            master.contact.linkUrl
              ? master.contact.linkLabel || master.contact.linkUrl
              : null,
          ]
            .filter(Boolean)
            .join("  •  ")}
        </p>
      </header>

      {summary && (
        <section>
          <h2>Summary</h2>
          <p className="summary">{summary}</p>
        </section>
      )}

      {experiences.length > 0 && (
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
                <span className="role-meta">
                  {formatRange(ed.startDate, ed.endDate)}
                </span>
              </div>
              {ed.detail && (
                <p style={{ marginTop: "2pt", fontSize: "10pt", color: "#334155" }}>
                  {ed.detail}
                </p>
              )}
            </div>
          ))}
        </section>
      )}
    </article>
  );
}
