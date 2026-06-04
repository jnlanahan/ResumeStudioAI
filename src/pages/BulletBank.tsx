import { useEffect, useRef, useState } from "react";
import { Briefcase, ChevronDown, ChevronRight, Plus, Trash2, X } from "lucide-react";
import { useStore } from "@/store/useStore";
import { PageHeader } from "@/components/PageHeader";
import { formatRange, cn } from "@/lib/utils";

export default function BulletBankPage() {
  const master = useStore((s) => s.master);
  const rules = useStore((s) => s.settings.rules);
  const addExperience = useStore((s) => s.addExperience);
  const updateExperience = useStore((s) => s.updateExperience);
  const removeExperience = useStore((s) => s.removeExperience);
  const addBullet = useStore((s) => s.addBullet);
  const updateBullet = useStore((s) => s.updateBullet);
  const removeBullet = useStore((s) => s.removeBullet);

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const prevLengthRef = useRef(master.experiences.length);

  // Auto-expand newly added experiences
  useEffect(() => {
    if (master.experiences.length > prevLengthRef.current) {
      const newExp = master.experiences[master.experiences.length - 1];
      setExpanded((prev) => new Set([...prev, newExp.id]));
    }
    prevLengthRef.current = master.experiences.length;
  }, [master.experiences.length, master.experiences]);

  const toggleExpanded = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <>
      <PageHeader
        eyebrow="Bullet Bank"
        title="Your experience & bullets"
        description="Every role and bullet you've ever written. The tailoring wizard picks the best ones for each job — capture them all here."
        actions={
          <button className="btn btn-gold btn-sm" onClick={addExperience}>
            <Plus size={14} /> Add role
          </button>
        }
      />

      <div className="canvas" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {master.experiences.length === 0 ? (
          <div
            className="panel"
            style={{ padding: "64px 40px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}
          >
            <div style={{ width: 48, height: 48, borderRadius: 14, background: "var(--raised)", display: "grid", placeItems: "center", marginBottom: 16 }}>
              <Briefcase size={20} style={{ color: "var(--ink-3)" }} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>No roles yet</div>
            <p style={{ fontSize: 13, color: "var(--ink-3)", margin: "0 0 18px" }}>
              Add your first role and start building your bullet bank.
            </p>
            <button className="btn btn-gold btn-sm" onClick={addExperience}>
              <Plus size={14} /> Add your first role
            </button>
          </div>
        ) : (
          master.experiences.map((exp) => {
            const isOpen = expanded.has(exp.id);
            const dateRange = formatRange(exp.startDate, exp.endDate);
            return (
              <div key={exp.id} className="panel">
                {/* Role header */}
                <div
                  className="panel-head"
                  style={{ cursor: "pointer", userSelect: "none" }}
                  onClick={() => toggleExpanded(exp.id)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                    <span style={{ color: "var(--ink-3)", flexShrink: 0 }}>
                      {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {exp.role || <span style={{ color: "var(--ink-3)" }}>Untitled role</span>}
                        {exp.company && (
                          <span style={{ fontWeight: 400, color: "var(--ink-3)" }}> · {exp.company}</span>
                        )}
                      </div>
                      {dateRange && (
                        <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 1 }}>{dateRange}</div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    <span style={{ fontSize: 12, color: "var(--ink-3)" }}>
                      {exp.bullets.filter((b) => b.text.trim()).length} bullet{exp.bullets.filter((b) => b.text.trim()).length !== 1 ? "s" : ""}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Delete this role and all its bullets?")) removeExperience(exp.id);
                      }}
                      className="btn btn-danger btn-sm"
                      title="Delete role"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Expanded content */}
                {isOpen && (
                  <div className="panel-pad" style={{ borderTop: "1px solid var(--line)" }}>
                    {/* Role metadata */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                      <input
                        className="field-native"
                        placeholder="Company"
                        value={exp.company}
                        onChange={(e) => updateExperience(exp.id, { company: e.target.value })}
                      />
                      <input
                        className="field-native"
                        placeholder="Role / Title"
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

                    {/* Bullets */}
                    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 8 }}>
                      Bullets
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
                )}
              </div>
            );
          })
        )}
      </div>
    </>
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
          className={cn("field-textarea-native")}
          style={{ minHeight: 44, borderColor: over ? "var(--warn)" : undefined }}
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
