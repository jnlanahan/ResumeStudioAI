import { Award, GraduationCap, Link2, Plus, Trash2, User, X } from "lucide-react";
import { useStore } from "@/store/useStore";
import { PageHeader } from "@/components/PageHeader";

export default function ProfilePage() {
  const master = useStore((s) => s.master);
  const updateMaster = useStore((s) => s.updateMaster);
  const addEducation = useStore((s) => s.addEducation);
  const updateEducation = useStore((s) => s.updateEducation);
  const removeEducation = useStore((s) => s.removeEducation);
  const addLink = useStore((s) => s.addLink);
  const updateLink = useStore((s) => s.updateLink);
  const removeLink = useStore((s) => s.removeLink);
  const addCertification = useStore((s) => s.addCertification);
  const updateCertification = useStore((s) => s.updateCertification);
  const removeCertification = useStore((s) => s.removeCertification);

  return (
    <>
      <PageHeader
        eyebrow="Master Profile"
        title="Your permanent info"
        description="Contact details, education, and certifications — the parts that don't change per job. Your bullet bank and tailoring are handled separately."
      />

      <div className="canvas" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Contact */}
        <PanelSection
          icon={<User size={15} style={{ color: "var(--accent)" }} />}
          title="Contact"
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <FieldGroup label="Full Name" style={{ gridColumn: "span 2" }}>
              <input
                className="field-native"
                value={master.contact.fullName}
                onChange={(e) => updateMaster({ contact: { ...master.contact, fullName: e.target.value } })}
                placeholder="Alex Morgan"
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
            <FieldGroup label="Location" style={{ gridColumn: "span 2" }}>
              <input
                className="field-native"
                value={master.contact.location}
                onChange={(e) => updateMaster({ contact: { ...master.contact, location: e.target.value } })}
                placeholder="Brooklyn, NY"
              />
            </FieldGroup>
          </div>
        </PanelSection>

        {/* Links */}
        <PanelSection
          icon={<Link2 size={15} style={{ color: "var(--accent)" }} />}
          title="Links"
          subtitle="GitHub, portfolio, LinkedIn — any links you want on your resume."
          action={
            <button className="btn btn-sm" onClick={addLink}>
              <Plus size={14} /> Add link
            </button>
          }
        >
          {master.contact.links.length === 0 ? (
            <EmptyState title="No links yet" cta="Add a link" onClick={addLink} />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {master.contact.links.map((link) => (
                <div key={link.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    className="field-native"
                    style={{ width: 140, flexShrink: 0 }}
                    placeholder="Label (e.g. GitHub)"
                    value={link.label}
                    onChange={(e) => updateLink(link.id, { label: e.target.value })}
                  />
                  <input
                    className="field-native"
                    style={{ flex: 1 }}
                    placeholder="https://github.com/yourname"
                    value={link.url}
                    onChange={(e) => updateLink(link.id, { url: e.target.value })}
                  />
                  <button
                    onClick={() => removeLink(link.id)}
                    className="btn btn-danger btn-sm"
                    title="Remove link"
                    style={{ flexShrink: 0 }}
                  >
                    <X size={13} />
                  </button>
                </div>
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

        {/* Certifications */}
        <PanelSection
          icon={<Award size={15} style={{ color: "var(--accent)" }} />}
          title="Certifications"
          action={
            <button className="btn btn-sm" onClick={addCertification}>
              <Plus size={14} /> Add
            </button>
          }
        >
          {master.certifications.length === 0 ? (
            <EmptyState title="No certifications yet" cta="Add a certification" onClick={addCertification} />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {master.certifications.map((cert) => (
                <div key={cert.id} className="panel panel-pad">
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, flex: 1 }}>
                      <input
                        className="field-native"
                        placeholder="Certification name"
                        value={cert.name}
                        onChange={(e) => updateCertification(cert.id, { name: e.target.value })}
                      />
                      <input
                        className="field-native"
                        placeholder="Issuer (e.g. AWS, Google)"
                        value={cert.issuer}
                        onChange={(e) => updateCertification(cert.id, { issuer: e.target.value })}
                      />
                      <input
                        className="field-native"
                        placeholder="Date (e.g. Jun 2023)"
                        value={cert.date}
                        onChange={(e) => updateCertification(cert.id, { date: e.target.value })}
                      />
                      <input
                        className="field-native"
                        placeholder="Verify URL (optional)"
                        value={cert.url ?? ""}
                        onChange={(e) => updateCertification(cert.id, { url: e.target.value })}
                      />
                    </div>
                    <button
                      onClick={() => removeCertification(cert.id)}
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
    </>
  );
}

function PanelSection({
  title,
  subtitle,
  icon,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="panel">
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
