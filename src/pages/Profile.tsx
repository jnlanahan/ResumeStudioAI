import { useState } from "react";
import { Briefcase, GraduationCap, Plus, Sparkles, Trash2, X } from "lucide-react";
import { useStore } from "@/store/useStore";
import { PageHeader } from "@/components/PageHeader";
import { ResumeDocument } from "@/components/ResumeDocument";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const master = useStore((s) => s.master);
  const rules = useStore((s) => s.settings.rules);
  const updateMaster = useStore((s) => s.updateMaster);
  const addExperience = useStore((s) => s.addExperience);
  const updateExperience = useStore((s) => s.updateExperience);
  const removeExperience = useStore((s) => s.removeExperience);
  const addBullet = useStore((s) => s.addBullet);
  const updateBullet = useStore((s) => s.updateBullet);
  const removeBullet = useStore((s) => s.removeBullet);
  const addEducation = useStore((s) => s.addEducation);
  const updateEducation = useStore((s) => s.updateEducation);
  const removeEducation = useStore((s) => s.removeEducation);
  const [skillDraft, setSkillDraft] = useState("");

  const addSkill = () => {
    const next = skillDraft.trim();
    if (!next || master.skills.includes(next)) { setSkillDraft(""); return; }
    updateMaster({ skills: [...master.skills, next] });
    setSkillDraft("");
  };

  const removeSkill = (skill: string) =>
    updateMaster({ skills: master.skills.filter((s) => s !== skill) });

  return (
    <>
      <PageHeader
        eyebrow="Master Profile"
        title="Your source of truth"
        description="Capture every role, bullet, and skill once. We'll tailor it to each job — no fabrication, no rewrites that change meaning."
      />

      <div
        className="canvas"
        style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 28, alignItems: "start" }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Identity */}
          <PanelSection
            icon={<Sparkles size={15} style={{ color: "var(--accent)" }} />}
            title="Identity"
            subtitle="Header that appears on every resume."
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FieldGroup label="Full Name">
                <input
                  className="field-native"
                  value={master.contact.fullName}
                  onChange={(e) => updateMaster({ contact: { ...master.contact, fullName: e.target.value } })}
                  placeholder="Alex Morgan"
                />
              </FieldGroup>
              <FieldGroup label="Headline">
                <input
                  className="field-native"
                  value={master.contact.headline}
                  onChange={(e) => updateMaster({ contact: { ...master.contact, headline: e.target.value } })}
                  placeholder="Senior Product Designer"
                />
              </FieldGroup>
              <FieldGroup label="Email">
                <input
                  className="field-native"
                  type="email"
                  value={master.contact.email}
                  onChange={(e) => updateMaster({ contact: { ...master.contact, email: e.target.value } })}
                  placeholder="alex@example.com"
                />
              </FieldGroup>
              <FieldGroup label="Phone">
                <input
                  className="field-native"
                  value={master.contact.phone}
                  onChange={(e) => updateMaster({ contact: { ...master.contact, phone: e.target.value } })}
                  placeholder="+1 555 123 4567"
                />
              </FieldGroup>
              <FieldGroup label="Location">
                <input
                  className="field-native"
                  value={master.contact.location}
                  onChange={(e) => updateMaster({ contact: { ...master.contact, location: e.target.value } })}
                  placeholder="Brooklyn, NY"
                />
              </FieldGroup>
              <FieldGroup label="Link Label">
                <input
                  className="field-native"
                  value={master.contact.linkLabel}
                  onChange={(e) => updateMaster({ contact: { ...master.contact, linkLabel: e.target.value } })}
                  placeholder="alex.design"
                />
              </FieldGroup>
              <FieldGroup label="Link URL" style={{ gridColumn: "span 2" }}>
                <input
                  className="field-native"
                  value={master.contact.linkUrl}
                  onChange={(e) => updateMaster({ contact: { ...master.contact, linkUrl: e.target.value } })}
                  placeholder="https://alex.design"
                />
              </FieldGroup>
            </div>
          </PanelSection>

          {/* Summary */}
          <PanelSection title="Summary" subtitle="Two or three sentences. We'll tighten it for each role.">
            <textarea
              className="field-textarea-native"
              style={{ minHeight: 110 }}
              value={master.summary}
              onChange={(e) => updateMaster({ summary: e.target.value })}
              placeholder="Product designer with 8 years shipping consumer software at the intersection of design systems and AI tooling…"
            />
          </PanelSection>

          {/* Experience */}
          <PanelSection
            icon={<Briefcase size={15} style={{ color: "var(--accent)" }} />}
            title="Experience"
            subtitle={`Up to ${rules.maxBulletsPerRole} bullets per role on the tailored resume — capture them all here.`}
            action={
              <button className="btn btn-sm" onClick={addExperience}>
                <Plus size={14} /> Add role
              </button>
            }
          >
            {master.experiences.length === 0 ? (
              <EmptyState title="No experience yet" cta="Add your first role" onClick={addExperience} />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {master.experiences.map((exp) => (
                  <div key={exp.id} className="panel panel-pad">
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, flex: 1 }}>
                        <input
                          className="field-native"
                          placeholder="Company"
                          value={exp.company}
                          onChange={(e) => updateExperience(exp.id, { company: e.target.value })}
                        />
                        <input
                          className="field-native"
                          placeholder="Role"
                          value={exp.role}
                          onChange={(e) => updateExperience(exp.id, { role: e.target.value })}
                        />
                        <input
                          className="field-native"
                          placeholder="Location (optional)"
                          value={exp.location}
                          onChange={(e) => updateExperience(exp.id, { location: e.target.value })}
                        />
                        <div style={{ display: "flex", gap: 8 }}>
                          <input
                            className="field-native"
                            type="month"
                            value={exp.startDate}
                            onChange={(e) => updateExperience(exp.id, { startDate: e.target.value })}
                            style={{ flex: 1 }}
                          />
                          <input
                            className="field-native"
                            type="month"
                            value={exp.endDate}
                            onChange={(e) => updateExperience(exp.id, { endDate: e.target.value })}
                            style={{ flex: 1 }}
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => removeExperience(exp.id)}
                        className="btn btn-danger btn-sm"
                        title="Delete role"
                        style={{ flexShrink: 0, marginTop: 4 }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {exp.bullets.map((b) => (
                        <BulletEditor
                          key={b.id}
                          text={b.text}
                          maxChars={rules.maxBulletChars}
                          onChange={(text) => updateBullet(exp.id, b.id, text)}
                          onRemove={() => removeBullet(exp.id, b.id)}
                        />
                      ))}
                      <button
                        onClick={() => addBullet(exp.id)}
                        className="btn btn-ghost btn-sm"
                        style={{ alignSelf: "flex-start" }}
                      >
                        <Plus size={14} /> Add bullet
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </PanelSection>

          {/* Skills */}
          <PanelSection
            title="Skills"
            subtitle={`We'll keep the most relevant ${rules.maxSkills} on each tailored resume.`}
          >
            <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
              <input
                className="field-native"
                style={{ flex: 1 }}
                value={skillDraft}
                onChange={(e) => setSkillDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
                placeholder="Type a skill and press Enter"
              />
              <button onClick={addSkill} className="btn btn-sm"><Plus size={14} /> Add</button>
            </div>
            {master.skills.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--ink-3)" }}>No skills added yet.</p>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {master.skills.map((s) => (
                  <button
                    key={s}
                    onClick={() => removeSkill(s)}
                    className="chip"
                    title="Remove"
                  >
                    {s}
                    <X size={12} style={{ opacity: 0.6 }} />
                  </button>
                ))}
              </div>
            )}
          </PanelSection>

          {/* Education */}
          <PanelSection
            icon={<GraduationCap size={15} style={{ color: "var(--accent)" }} />}
            title="Education"
            action={
              <button className="btn btn-sm" onClick={addEducation}>
                <Plus size={14} /> Add
              </button>
            }
          >
            {master.education.length === 0 ? (
              <EmptyState title="No education yet" cta="Add education" onClick={addEducation} />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {master.education.map((ed) => (
                  <div key={ed.id} className="panel panel-pad">
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, flex: 1 }}>
                        <input
                          className="field-native"
                          placeholder="School"
                          value={ed.school}
                          onChange={(e) => updateEducation(ed.id, { school: e.target.value })}
                        />
                        <input
                          className="field-native"
                          placeholder="Degree"
                          value={ed.degree}
                          onChange={(e) => updateEducation(ed.id, { degree: e.target.value })}
                        />
                        <div style={{ display: "flex", gap: 8, gridColumn: "span 2" }}>
                          <input
                            className="field-native"
                            type="month"
                            value={ed.startDate}
                            onChange={(e) => updateEducation(ed.id, { startDate: e.target.value })}
                            style={{ flex: 1 }}
                          />
                          <input
                            className="field-native"
                            type="month"
                            value={ed.endDate}
                            onChange={(e) => updateEducation(ed.id, { endDate: e.target.value })}
                            style={{ flex: 1 }}
                          />
                        </div>
                        <input
                          className="field-native"
                          style={{ gridColumn: "span 2" }}
                          placeholder="Detail (e.g., GPA, honors)"
                          value={ed.detail}
                          onChange={(e) => updateEducation(ed.id, { detail: e.target.value })}
                        />
                      </div>
                      <button
                        onClick={() => removeEducation(ed.id)}
                        className="btn btn-danger btn-sm"
                        style={{ flexShrink: 0, marginTop: 4 }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </PanelSection>
        </div>

        {/* Live preview column */}
        <div style={{ position: "sticky", top: 24, flexShrink: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 12 }}>
            Live preview
          </div>
          <div style={{ transformOrigin: "top left", transform: "scale(0.62)" }}>
            <div style={{ border: "1px solid var(--line)", borderRadius: 6, overflow: "hidden" }}>
              <ResumeDocument master={master} rules={rules} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function PanelSection({
  title,
  subtitle,
  icon,
  action,
  children,
  style,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <section className="panel" style={style}>
      <div className="panel-head">
        <div style={{ flex: 1 }}>
          <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {icon}{title}
          </h3>
          {subtitle && <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 3 }}>{subtitle}</div>}
        </div>
        {action}
      </div>
      <div className="panel-pad">{children}</div>
    </section>
  );
}

function FieldGroup({
  label,
  children,
  style,
}: {
  label: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6, ...style }}>
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}

function BulletEditor({
  text,
  maxChars,
  onChange,
  onRemove,
}: {
  text: string;
  maxChars: number;
  onChange: (v: string) => void;
  onRemove: () => void;
}) {
  const over = text.length > maxChars;
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
      <span style={{ marginTop: 14, width: 6, height: 6, borderRadius: "50%", background: "var(--ink-3)", flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <textarea
          className={cn("field-textarea-native", over ? "" : "")}
          style={{
            minHeight: 44,
            borderColor: over ? "var(--warn)" : undefined,
          }}
          rows={2}
          value={text}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Action verb + what you did + measurable outcome…"
        />
        <div style={{ marginTop: 4, fontSize: 11, color: over ? "var(--warn)" : "var(--ink-3)" }}>
          {text.length}/{maxChars}{over && " — too long, will be trimmed"}
        </div>
      </div>
      <button
        onClick={onRemove}
        className="btn btn-danger btn-sm"
        title="Delete bullet"
        style={{ marginTop: 4, flexShrink: 0 }}
      >
        <X size={13} />
      </button>
    </div>
  );
}

function EmptyState({ title, cta, onClick }: { title: string; cta: string; onClick: () => void }) {
  return (
    <div style={{ padding: "32px 0", textAlign: "center" }}>
      <p style={{ fontSize: 13, color: "var(--ink-3)", marginBottom: 14 }}>{title}</p>
      <button className="btn btn-gold btn-sm" onClick={onClick}>
        <Plus size={14} /> {cta}
      </button>
    </div>
  );
}
