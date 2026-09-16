import type { Experience, MasterResume, TailoredResume, TemplateId } from "@/types";
import { formatRange } from "@/lib/utils";

interface Props {
  master: MasterResume;
  tailored?: TailoredResume;
  rules: { maxBulletsPerRole: number; maxSkills: number };
  /** Used when no tailored resume is given (or as a fallback). */
  template?: TemplateId;
}

interface RenderedExperience {
  exp: Experience;
  bullets: { id: string; text: string }[];
}

interface Model {
  master: MasterResume;
  headline: string;
  summary: string;
  skills: string[];
  experiences: RenderedExperience[];
}

const norm = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();

function buildModel({ master, tailored, rules }: Props): Model {
  const headline = tailored?.headline || master.headline;
  const summary = tailored?.summary || master.summary;
  const skills = (tailored?.skills.length ? tailored.skills : master.skills).slice(0, rules.maxSkills);

  const experiences = master.experiences.map((exp) => {
    const tweaks = tailored?.experiences.find((e) => e.experienceId === exp.id);
    let bullets: { id: string; text: string }[];
    if (tweaks && tweaks.bullets.length) {
      bullets = tweaks.bullets
        .slice(0, rules.maxBulletsPerRole)
        .map((b) => ({ id: b.originalId, text: b.tweaked || b.original }));
    } else if (tailored) {
      // A tailored resume with nothing selected for this role hides the role.
      bullets = [];
    } else {
      bullets = exp.bullets
        .filter((b) => b.text.trim())
        .slice(0, rules.maxBulletsPerRole)
        .map((b) => ({ id: b.id, text: b.text }));
    }
    return { exp, bullets };
  });

  return { master, headline, summary, skills, experiences };
}

/** Consecutive roles at the same employer, for templates that group them. */
function groupByEmployer(list: RenderedExperience[]) {
  const groups: { company: string; roles: RenderedExperience[] }[] = [];
  for (const item of list) {
    const last = groups[groups.length - 1];
    if (last && norm(last.company) === norm(item.exp.company)) last.roles.push(item);
    else groups.push({ company: item.exp.company, roles: [item] });
  }
  return groups.map((g) => {
    const starts = g.roles.map((r) => r.exp.startDate).filter(Boolean).sort();
    const dated = g.roles.filter((r) => r.exp.startDate || r.exp.endDate);
    const endDate = dated.some((r) => !r.exp.endDate) ? "" : dated.map((r) => r.exp.endDate).sort().pop() ?? "";
    const locations = new Set(g.roles.map((r) => norm(r.exp.location)));
    const sharedLocation = locations.size === 1 ? g.roles[0].exp.location : "";
    return { ...g, startDate: starts[0] ?? "", endDate, sharedLocation };
  });
}

const prettyUrl = (url: string) => url.replace(/^https?:\/\//, "").replace(/\/$/, "");

export function ResumeDocument(props: Props) {
  const model = buildModel(props);
  const template = props.tailored?.template ?? props.template ?? "classic";
  const body =
    template === "classic" ? <Classic m={model} /> : template === "compact" ? <Compact m={model} /> : <Modern m={model} />;
  return (
    <article className={`resume-page tpl-${template}`} id="resume-document">
      {body}
    </article>
  );
}

// ─── Classic ─────────────────────────────────────────────────────────────────

function Classic({ m }: { m: Model }) {
  const { master } = m;
  const c = master.contact;
  const groups = groupByEmployer(m.experiences).filter((g) => g.roles.some((r) => r.bullets.length));
  const hasAdditional =
    master.additional.length > 0 || master.certifications.length > 0 || m.skills.length > 0 || master.tools.length > 0;

  return (
    <>
      <header className="c-head">
        <h1>
          {c.fullName || "Your Name"}
          {m.headline ? ` / ${m.headline}` : ""}
        </h1>
        <p className="contact">{[c.email, c.phone, c.location].filter(Boolean).join(" • ")}</p>
        {c.links.map((l) => (
          <p className="c-link" key={l.id}>
            {l.url ? (
              <a href={l.url} target="_blank" rel="noreferrer">
                {prettyUrl(l.url)}
              </a>
            ) : (
              l.label
            )}
            {l.url && l.label && norm(l.label) !== norm(prettyUrl(l.url)) ? ` – ${l.label}` : ""}
          </p>
        ))}
        {m.summary && <p className="summary">{m.summary}</p>}
      </header>

      {groups.length > 0 && (
        <section>
          <h2>Professional Experience</h2>
          {groups.map((g, gi) => (
            <div className="employer" key={gi}>
              <div className="role-row">
                <span>
                  <b>{g.company || "Company"}</b>
                  {g.sharedLocation ? ` (${g.sharedLocation})` : ""}
                </span>
                <span className="role-meta">
                  <i>{formatRange(g.startDate, g.endDate)}</i>
                </span>
              </div>
              {g.roles.map(({ exp, bullets }) => {
                if (!bullets.length) return null;
                const showLoc = !g.sharedLocation && exp.location;
                const roleRange = formatRange(exp.startDate, exp.endDate);
                const showDates =
                  g.roles.length > 1 && (exp.startDate || exp.endDate) && roleRange !== formatRange(g.startDate, g.endDate);
                return (
                  <div className="role" key={exp.id}>
                    <div className="role-row">
                      <b>
                        {exp.role || "Role"}
                        {showLoc ? ` (${exp.location})` : ""}
                      </b>
                      {showDates && (
                        <span className="role-meta">
                          <i>{roleRange}</i>
                        </span>
                      )}
                    </div>
                    <ul>
                      {bullets.map((b) => (
                        <li key={b.id}>{b.text}</li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          ))}
        </section>
      )}

      {master.education.length > 0 && (
        <section>
          <h2>Education</h2>
          {master.education.map((ed) => (
            <div className="edu" key={ed.id}>
              <div className="role-row">
                <b>{ed.school || "School"}</b>
                <span className="role-meta">
                  <b>{ed.location}</b>
                </span>
              </div>
              <p>{[ed.degree, ed.detail].filter(Boolean).join(", ")}</p>
            </div>
          ))}
        </section>
      )}

      {hasAdditional && (
        <section>
          <h2>Additional Information</h2>
          <ul>
            {master.additional.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
            {master.certifications.length > 0 && (
              <li>
                <u>Certifications</u>:{" "}
                {master.certifications.map((x) => (x.issuer ? `${x.name} (${x.issuer})` : x.name)).join(", ")}
              </li>
            )}
            {m.skills.length > 0 && (
              <li>
                <u>Skills</u>: {m.skills.join(", ")}
              </li>
            )}
            {master.tools.length > 0 && (
              <li>
                <u>Tools</u>: {master.tools.join(", ")}
              </li>
            )}
          </ul>
        </section>
      )}
    </>
  );
}

// ─── Modern ──────────────────────────────────────────────────────────────────

function ContactLine({ master }: { master: MasterResume }) {
  const parts: (string | React.ReactElement)[] = [
    master.contact.location,
    master.contact.email,
    master.contact.phone,
    ...master.contact.links.map((l) =>
      l.url ? (
        <a key={l.id} href={l.url} target="_blank" rel="noreferrer">
          {l.label || prettyUrl(l.url)}
        </a>
      ) : l.label ? (
        <span key={l.id}>{l.label}</span>
      ) : null
    ),
  ].filter(Boolean) as (string | React.ReactElement)[];
  return (
    <p className="contact">
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 && "  •  "}
        </span>
      ))}
    </p>
  );
}

function Modern({ m }: { m: Model }) {
  const { master } = m;
  return (
    <>
      <header>
        <h1>{master.contact.fullName || "Your Name"}</h1>
        {m.headline && (
          <p style={{ marginTop: "2pt", fontSize: "10.5pt", color: "#334155", fontWeight: 500 }}>{m.headline}</p>
        )}
        <ContactLine master={master} />
      </header>

      {m.summary && (
        <section>
          <h2>Summary</h2>
          <p className="summary">{m.summary}</p>
        </section>
      )}

      {m.experiences.some(({ bullets }) => bullets.length > 0) && (
        <section>
          <h2>Experience</h2>
          {m.experiences.map(({ exp, bullets }) =>
            bullets.length ? (
              <div className="experience-block" key={exp.id}>
                <div className="role-row">
                  <h3>
                    {exp.role || "Role"}
                    {exp.company ? ` · ${exp.company}` : ""}
                  </h3>
                  <span className="role-meta">
                    {[exp.location, formatRange(exp.startDate, exp.endDate)].filter(Boolean).join("  •  ")}
                  </span>
                </div>
                <ul>
                  {bullets.map((b) => (
                    <li key={b.id}>{b.text}</li>
                  ))}
                </ul>
              </div>
            ) : null
          )}
        </section>
      )}

      {(m.skills.length > 0 || master.tools.length > 0) && (
        <section>
          <h2>Skills</h2>
          {m.skills.length > 0 && <p className="skills">{m.skills.join(" · ")}</p>}
          {master.tools.length > 0 && (
            <p className="skills" style={{ marginTop: "2pt" }}>
              <b>Tools:</b> {master.tools.join(" · ")}
            </p>
          )}
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
                  {[ed.location, formatRange(ed.startDate, ed.endDate)].filter(Boolean).join("  •  ")}
                </span>
              </div>
              {ed.detail && <p style={{ marginTop: "2pt", fontSize: "10pt", color: "#334155" }}>{ed.detail}</p>}
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
                <h3>
                  {cert.name || "Certification"}
                  {cert.issuer ? ` · ${cert.issuer}` : ""}
                </h3>
                <span className="role-meta">{cert.date}</span>
              </div>
            </div>
          ))}
        </section>
      )}

      {master.additional.length > 0 && (
        <section>
          <h2>Additional</h2>
          <ul>
            {master.additional.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

// ─── Compact ─────────────────────────────────────────────────────────────────

function Compact({ m }: { m: Model }) {
  const { master } = m;
  const c = master.contact;
  return (
    <>
      <header className="k-head">
        <div>
          <h1>{c.fullName || "Your Name"}</h1>
          {m.headline && <p className="k-headline">{m.headline}</p>}
        </div>
        <div className="k-contact">
          {[c.email, c.phone, c.location].filter(Boolean).map((x, i) => (
            <div key={i}>{x}</div>
          ))}
          {c.links.map((l) => (
            <div key={l.id}>
              {l.url ? (
                <a href={l.url} target="_blank" rel="noreferrer">
                  {prettyUrl(l.url)}
                </a>
              ) : (
                l.label
              )}
            </div>
          ))}
        </div>
      </header>

      {m.skills.length > 0 && (
        <p className="k-skills">
          <b>Skills:</b> {m.skills.join(" · ")}
          {master.tools.length > 0 && (
            <>
              {"   "}
              <b>Tools:</b> {master.tools.join(" · ")}
            </>
          )}
        </p>
      )}

      {m.summary && <p className="summary">{m.summary}</p>}

      {m.experiences.some(({ bullets }) => bullets.length > 0) && (
        <section>
          <h2>Experience</h2>
          {m.experiences.map(({ exp, bullets }) =>
            bullets.length ? (
              <div className="experience-block" key={exp.id}>
                <div className="role-row">
                  <span>
                    <b>{exp.role || "Role"}</b>
                    {exp.company ? `, ${exp.company}` : ""}
                    {exp.location ? ` — ${exp.location}` : ""}
                  </span>
                  <span className="role-meta">{formatRange(exp.startDate, exp.endDate)}</span>
                </div>
                <ul>
                  {bullets.map((b) => (
                    <li key={b.id}>{b.text}</li>
                  ))}
                </ul>
              </div>
            ) : null
          )}
        </section>
      )}

      {master.education.length > 0 && (
        <section>
          <h2>Education</h2>
          {master.education.map((ed) => (
            <div className="role-row" key={ed.id}>
              <span>
                <b>{ed.degree || "Degree"}</b>
                {ed.school ? `, ${ed.school}` : ""}
                {ed.detail ? ` — ${ed.detail}` : ""}
              </span>
              <span className="role-meta">{ed.location || formatRange(ed.startDate, ed.endDate)}</span>
            </div>
          ))}
        </section>
      )}

      {(master.certifications.length > 0 || master.additional.length > 0) && (
        <section>
          <h2>Certifications &amp; Additional</h2>
          {master.certifications.length > 0 && (
            <p>{master.certifications.map((x) => (x.issuer ? `${x.name} (${x.issuer})` : x.name)).join(" · ")}</p>
          )}
          {master.additional.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </section>
      )}
    </>
  );
}
