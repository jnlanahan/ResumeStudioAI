/* screens.jsx — Dashboard, Upload, Extract, Generate */

/* ---------- Dashboard ---------- */
function Dashboard({ go }) {
  const stats = [
    { label: "Bullets in bank", icon: "bank", big: "9", delta: "+3 this week" },
    { label: "Roles tracked", icon: "builder", big: "3", delta: "Northwind, Lumen, Brightwave" },
    { label: "Resumes tailored", icon: "match", big: "5", delta: "+2 this month" },
    { label: "Avg. ATS score", icon: "target", big: "87%", delta: "Up from 71%" },
  ];
  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <section className="panel panel-pad" style={{ display: "flex", alignItems: "center", gap: 24, padding: 24 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: "var(--accent)", fontWeight: 700, letterSpacing: ".02em" }}>Welcome back, Sarah</div>
          <h2 style={{ margin: "8px 0 6px", fontSize: 26, letterSpacing: "-0.02em" }}>Tailor a resume in minutes, not hours.</h2>
          <p className="muted" style={{ margin: 0, fontSize: 14, maxWidth: 560, lineHeight: 1.55 }}>
            Your achievements live in one organized bank. Paste a job description and BulletBank picks the most relevant bullets for that exact role.
          </p>
          <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
            <button className="btn btn-gold btn-lg" onClick={() => go("upload")}><Icon.upload size={17} /> Upload a resume</button>
            <button className="btn btn-lg" onClick={() => go("tailor")}><Icon.target size={17} /> Tailor for a job</button>
          </div>
        </div>
        <div style={{ width: 220, flex: "none" }}>
          <MiniResume />
        </div>
      </section>

      <div className="stat-grid">
        {stats.map((s) => (
          <div className="stat" key={s.label}>
            <div className="label">{Icon[s.icon]({ size: 15 })} {s.label}</div>
            <div className="big">{s.big}</div>
            <div className="delta">{s.delta}</div>
          </div>
        ))}
      </div>

      <section className="panel">
        <div className="panel-head"><h3>Continue where you left off</h3></div>
        <div className="panel-pad" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { t: "Marketing Manager · Vireo Health", s: "Tailoring · 5 bullets matched", screen: "tailor", cta: "Resume" },
            { t: "Growth Lead · Atlas Labs", s: "Generated · ATS 85%", screen: "generate", cta: "Download" },
            { t: "Senior Marketing Manager · Northwind", s: "Bullet bank · 4 bullets", screen: "tailor", cta: "Open bank" },
          ].map((r, i) => (
            <div className="file-row" key={i} style={{ cursor: "pointer" }} onClick={() => go(r.screen)}>
              <div className="file-ic"><Icon.doc size={18} /></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{r.t}</div>
                <div className="muted" style={{ fontSize: 12 }}>{r.s}</div>
              </div>
              <button className="btn btn-sm">{r.cta} <Icon.arrowR size={14} /></button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ---------- Upload ---------- */
function UploadScreen({ go }) {
  return (
    <div className="fade-in" style={{ maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }}>
      <div className="dropzone">
        <div className="dz-icon"><Icon.upload size={28} stroke={2.2} /></div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Drop your resume to begin</div>
          <p className="muted" style={{ margin: "6px 0 0", fontSize: 13.5 }}>PDF or DOCX, up to 10 MB. We extract every achievement into your bullet bank.</p>
        </div>
        <button className="btn btn-gold">Browse files</button>
      </div>

      <section className="panel panel-pad">
        <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-3)", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 12 }}>Recently uploaded</div>
        <div className="file-row">
          <div className="file-ic"><Icon.doc size={18} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 13.5 }}>Sarah_Pendleton_Resume_2026.docx</div>
            <div className="muted" style={{ fontSize: 12 }}>248 KB · uploaded just now</div>
            <div className="progress"><span style={{ width: "100%" }} /></div>
          </div>
          <div className="check" style={{ width: 26, height: 26, borderRadius: 8 }}><Icon.check size={15} stroke={2.6} /></div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
          <button className="btn btn-gold btn-lg" onClick={() => go("extract")}>Extract bullets <Icon.arrowR size={16} /></button>
        </div>
      </section>
    </div>
  );
}

/* ---------- Extract ---------- */
function ExtractScreen({ go }) {
  return (
    <div className="fade-in" style={{ maxWidth: 860, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="callout" style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <Icon.sparkle size={20} style={{ color: "var(--accent)", flex: "none" }} />
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: 0 }}>We found 9 achievements across 3 roles</h4>
          <p style={{ margin: "4px 0 0" }}>Confirm the company, role, and dates for each. You can edit anything before it lands in your bank.</p>
        </div>
        <div className="metric" style={{ flex: "none", minWidth: 120, textAlign: "center" }}>
          <div className="k">Extraction confidence</div>
          <div className="v good">96%</div>
        </div>
      </div>

      {BB.extracted.map((e, i) => {
        const c = BB.bank[i];
        return (
          <section className="panel" key={i}>
            <div className="panel-head">
              <CoBadge c={c} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{e.company}</span>
                  <span className="muted">·</span>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{e.role}</span>
                </div>
                <div className="muted" style={{ fontSize: 12 }}>{e.dates} · {e.count} bullets extracted</div>
              </div>
              <span className="b-act"><Icon.edit size={14} /> Edit role</span>
              <span className="status-dot" />
            </div>
            <div className="panel-pad" style={{ paddingTop: 14 }}>
              {c.bullets.map((b) => (
                <div className="bullet" key={b.id}>
                  <div className="check"><Icon.check size={12} stroke={2.6} /></div>
                  <div className="txt" dangerouslySetInnerHTML={{ __html: b.text }} />
                </div>
              ))}
            </div>
          </section>
        );
      })}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button className="btn btn-ghost" onClick={() => go("upload")}>Back</button>
        <button className="btn btn-gold btn-lg" onClick={() => go("tailor")}>Confirm & build bank <Icon.arrowR size={16} /></button>
      </div>
    </div>
  );
}

/* ---------- Resume paper (shared) ---------- */
function MiniResume({ scale }) {
  return (
    <div className="paper" style={{ fontSize: scale || 4.4 }}>
      <div className="paper-inner">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1>Sarah Pendleton</h1>
            <div className="rtitle">Senior Marketing Manager</div>
          </div>
          <div className="rmeta">San Francisco, CA<br/>sarah.pendleton@email.com<br/>linkedin.com/in/spendleton</div>
        </div>
        <div className="rsec">Summary</div>
        <p>Marketing leader with 8+ years driving integrated campaigns, lifecycle growth, and data-backed budget decisions across consumer brands.</p>
        <div className="rsec">Experience</div>
        <p style={{ fontWeight: 700, marginBottom: 2 }}>Northwind Commerce — Senior Marketing Manager</p>
        <ul style={{ margin: "0 0 8px", paddingLeft: "1.1em" }}>
          <li>Orchestrated 12 integrated social campaigns, lifting engagement 25% YoY.</li>
          <li>Managed a $1.4M paid media budget, improving ROAS to 3.6x.</li>
        </ul>
        <p style={{ fontWeight: 700, marginBottom: 2 }}>Lumen Media — Marketing Analyst</p>
        <ul style={{ margin: 0, paddingLeft: "1.1em" }}>
          <li>Reduced customer acquisition cost 22% through channel data analysis.</li>
        </ul>
      </div>
    </div>
  );
}

/* ---------- Generate ---------- */
function GenerateScreen({ go }) {
  return (
    <div className="fade-in" style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 22, alignItems: "start" }}>
      <section className="panel panel-pad" style={{ display: "flex", justifyContent: "center", padding: 28 }}>
        <div style={{ width: 540, maxWidth: "100%" }}>
          <MiniResume scale={9} />
        </div>
      </section>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <section className="panel panel-pad">
          <div style={{ fontSize: 12, color: "var(--ink-3)", fontWeight: 600 }}>Resume version</div>
          <div className="input" style={{ marginTop: 8 }}>
            <input defaultValue="Marketing Manager — Vireo Health" />
            <Icon.edit size={15} />
          </div>
          <div className="divider" />
          <div className="metric-row">
            <div className="metric">
              <div className="k">ATS score</div>
              <div className="v good">85%</div>
              <div className="bar"><span style={{ width: "85%" }} /></div>
            </div>
            <div className="metric">
              <div className="k">Keyword match</div>
              <div className="v gold">19/20</div>
              <div className="bar"><span style={{ width: "95%" }} /></div>
            </div>
          </div>
        </section>

        <section className="panel panel-pad">
          <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 4 }}>Summary statement</div>
          <p className="muted" style={{ fontSize: 12.5, margin: "0 0 10px", lineHeight: 1.5 }}>Co-created with AI from your matched bullets — fully editable.</p>
          <textarea className="jd" style={{ minHeight: 96 }} defaultValue="Marketing leader with 8+ years driving integrated campaigns, lifecycle growth, and data-backed budget decisions across consumer brands." />
        </section>

        <button className="btn btn-gold btn-lg" style={{ width: "100%" }}><Icon.download size={18} /> Download DOCX</button>
        <button className="btn" style={{ width: "100%" }} onClick={() => go("tailor")}><Icon.target size={16} /> Back to tailoring</button>
      </div>
    </div>
  );
}

Object.assign(window, { Dashboard, UploadScreen, ExtractScreen, GenerateScreen, MiniResume });
