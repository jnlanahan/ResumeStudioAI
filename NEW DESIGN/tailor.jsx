/* tailor.jsx — Bullet Bank + Job Matching workspace + AI Suggestions modal */

function Bullet({ b, onAI }) {
  return (
    <div className="bullet">
      <div className="check"><Icon.check size={12} stroke={2.6} /></div>
      <div className="txt" dangerouslySetInnerHTML={{ __html: b.text }} />
      <div className="bullet-actions">
        <span className="b-act"><Icon.edit size={13} /> Edit</span>
        <span className="b-act danger"><Icon.trash size={13} /> Delete</span>
        <span className="b-act ai" onClick={() => onAI(b)}><Icon.sparkle size={13} /> AI Suggestion</span>
      </div>
    </div>
  );
}

function BulletBank({ onAI }) {
  const [tab, setTab] = useState("recent");
  return (
    <section className="panel" style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
      <div className="panel-head">
        <h3>My Bullet Bank</h3>
        <span className="sub">· 9 achievements across 3 roles</span>
      </div>
      <div className="panel-pad" style={{ paddingBottom: 0 }}>
        <div style={{ display: "flex", gap: 10 }}>
          <div className="input grow">
            <Icon.search size={16} />
            <input placeholder="Search bullets, companies, keywords…" />
            <Icon.sliders size={16} />
          </div>
          <div className="chip"><Icon.filter size={14} /> All roles <Icon.chevD size={13} /></div>
          <div className="chip"><Icon.filter size={14} /> Filters</div>
        </div>
        <div className="tabs" style={{ marginTop: 16 }}>
          <div className={"tab" + (tab === "ach" ? " active" : "")} onClick={() => setTab("ach")}>Achievements</div>
          <div className={"tab" + (tab === "recent" ? " active" : "")} onClick={() => setTab("recent")}>Recent Matches</div>
        </div>
      </div>
      <div className="panel-pad" style={{ overflowY: "auto", flex: 1, paddingTop: 14 }}>
        {BB.bank.map((c) => (
          <div key={c.id}>
            <div className="group-head">
              <CoBadge c={c} />
              <div>
                <div className="role">{c.company} · {c.role}</div>
                <div className="dates">{c.dates}</div>
              </div>
              <span className="status-dot" title="Verified" />
              <span className="count">{c.bullets.length} bullets</span>
            </div>
            {c.bullets.map((b) => <Bullet key={b.id} b={b} onAI={onAI} />)}
          </div>
        ))}
      </div>
    </section>
  );
}

function JobMatching() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, minHeight: 0, overflowY: "auto" }}>
      <section className="panel panel-pad">
        <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
          <h3 style={{ margin: 0, fontSize: 14 }}>Paste the job description</h3>
          <span className="muted" style={{ marginLeft: "auto", fontSize: 12 }}>{BB.jobTitle} · {BB.jobCompany}</span>
        </div>
        <textarea className="jd" defaultValue={BB.jd} />
      </section>

      <section className="panel">
        <div className="panel-head">
          <Icon.target size={16} />
          <h3>Matched Bullets</h3>
          <span className="sub" style={{ marginLeft: "auto" }}>5 of 9 · ranked by relevance</span>
        </div>
        <div className="panel-pad">
          {BB.matched.map((m) => (
            <div className="match" key={m.id}>
              <div className="check"><Icon.check size={12} stroke={2.6} /></div>
              <div className="txt" dangerouslySetInnerHTML={{ __html: m.text }} />
            </div>
          ))}
        </div>
      </section>

      <div className="callout">
        <h4><Icon.sparkle size={16} style={{ color: "var(--accent)" }} /> Missing experience</h4>
        <p>The job description emphasizes <b style={{ color: "var(--ink)" }}>budget management</b>, which appears lightly in your bank. Want to co-create a bullet that captures it honestly?</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-gold btn-sm">Yes, co-create</button>
          <button className="btn btn-ghost btn-sm">Skip</button>
        </div>
      </div>
    </div>
  );
}

function AIModal({ open, onClose }) {
  if (!open) return null;
  const s = BB.suggestion;
  return (
    <div className="scrim" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3><Icon.sparkle size={17} style={{ color: "var(--accent)" }} /> AI Suggestion</h3>
          <div className="modal-x" onClick={onClose}><Icon.x size={17} /></div>
        </div>
        <div className="compare">
          <div>
            <div className="col-label">Original bullet</div>
            <div className="compare-box">
              {s.original}
              <span className="score-pill">Impact {s.scoreOriginal}/10</span>
            </div>
          </div>
          <div>
            <div className="col-label">AI-enhanced suggestion</div>
            <div className="compare-box enh">
              <span dangerouslySetInnerHTML={{ __html: s.enhanced }} />
              <span className="score-pill">Impact {s.scoreEnhanced}/10</span>
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-gold" onClick={onClose}><Icon.check size={15} /> Accept</button>
          <button className="btn btn-ghost" onClick={onClose}>Decline</button>
          <span className="b-act ai" style={{ marginLeft: "auto" }}><Icon.regen size={14} /> Re-generate</span>
        </div>
      </div>
    </div>
  );
}

function TailorScreen() {
  const [modal, setModal] = useState(false);
  return (
    <div className="fade-in" style={{ display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: 22, flex: 1, minHeight: 0, width: "100%" }}>
      <BulletBank onAI={() => setModal(true)} />
      <JobMatching />
      <AIModal open={modal} onClose={() => setModal(false)} />
    </div>
  );
}

Object.assign(window, { TailorScreen, AIModal });
