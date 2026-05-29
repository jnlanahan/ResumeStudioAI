/* ui.jsx — icons + app shell (Sidebar, TopBar, Stepper) */
const { useState } = React;

/* ---------- icons (stroke, currentColor) ---------- */
const I = ({ d, size = 18, fill, stroke = 2, children, vb = 24 }) => (
  <svg className="ic" width={size} height={size} viewBox={`0 0 ${vb} ${vb}`}
       fill={fill || "none"} stroke={fill ? "none" : "currentColor"}
       strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    {children || <path d={d} />}
  </svg>
);

const Icon = {
  dashboard: (p) => <I {...p}><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></I>,
  upload: (p) => <I {...p}><path d="M12 16V4m0 0L7 9m5-5 5 5"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></I>,
  bank: (p) => <I {...p}><path d="M4 7h16M4 12h16M4 17h10"/><circle cx="18.5" cy="17" r="1.6" fill="currentColor" stroke="none"/></I>,
  match: (p) => <I {...p}><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></I>,
  builder: (p) => <I {...p}><path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M13 3v6h6"/><path d="M9 13h6M9 17h4"/></I>,
  bell: (p) => <I {...p}><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z"/><path d="M10 19a2 2 0 0 0 4 0"/></I>,
  search: (p) => <I {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></I>,
  filter: (p) => <I {...p}><path d="M3 5h18l-7 8v6l-4-2v-4L3 5Z"/></I>,
  sliders: (p) => <I {...p}><path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="18" cy="18" r="2"/></I>,
  edit: (p) => <I {...p}><path d="M4 20h4L19 9l-4-4L4 16v4Z"/><path d="m14 6 4 4"/></I>,
  trash: (p) => <I {...p}><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/></I>,
  sparkle: (p) => <I {...p}><path d="M12 3l1.8 5L19 9.8 14 12l-2 5-2-5-5-2.2L10 8l2-5Z"/></I>,
  check: (p) => <I {...p}><path d="m5 12 4.5 4.5L19 7"/></I>,
  chevR: (p) => <I {...p}><path d="m9 6 6 6-6 6"/></I>,
  chevD: (p) => <I {...p}><path d="m6 9 6 6 6-6"/></I>,
  x: (p) => <I {...p}><path d="M6 6l12 12M18 6 6 18"/></I>,
  plus: (p) => <I {...p}><path d="M12 5v14M5 12h14"/></I>,
  download: (p) => <I {...p}><path d="M12 4v11m0 0 4-4m-4 4-4-4"/><path d="M5 19h14"/></I>,
  doc: (p) => <I {...p}><path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M13 3v6h6"/></I>,
  regen: (p) => <I {...p}><path d="M20 11a8 8 0 1 0-2.3 5.7M20 5v5h-5"/></I>,
  arrowR: (p) => <I {...p}><path d="M5 12h14m-6-6 6 6-6 6"/></I>,
  target: (p) => <I {...p}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/></I>,
  layers: (p) => <I {...p}><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5"/></I>,
};

/* ---------- sidebar ---------- */
const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard", screen: "dashboard" },
  { id: "upload", label: "Resume Upload", icon: "upload", screen: "upload" },
  { id: "bank", label: "My Bullet Bank", icon: "bank", screen: "tailor" },
  { id: "matches", label: "Job Matches", icon: "match", screen: "tailor" },
  { id: "builder", label: "Resume Builder", icon: "builder", screen: "generate" },
];

function Sidebar({ screen, go }) {
  const activeNav = {
    dashboard: "dashboard", upload: "upload", extract: "upload",
    tailor: "bank", generate: "builder",
  }[screen];
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark"><Icon.layers size={19} stroke={2.2} /></div>
        <div className="brand-name">BulletBank <span className="ai">AI</span></div>
      </div>
      <nav className="nav">
        <div className="nav-label">Workspace</div>
        {NAV.map((n) => (
          <div key={n.id}
               className={"nav-item" + (activeNav === n.id ? " active" : "")}
               onClick={() => go(n.screen)}>
            {Icon[n.icon]({ size: 17 })}
            <span>{n.label}</span>
          </div>
        ))}
      </nav>
      <div className="sidebar-foot">
        <Icon.sparkle size={14} /> BulletBank AI · v1.0
      </div>
    </aside>
  );
}

/* ---------- flow stepper ---------- */
const STEPS = [
  { id: "upload", label: "Upload" },
  { id: "extract", label: "Extract" },
  { id: "tailor", label: "Tailor" },
  { id: "generate", label: "Generate" },
];

function Stepper({ screen, go }) {
  const order = STEPS.map((s) => s.id);
  const cur = order.indexOf(screen);
  return (
    <div className="stepper">
      {STEPS.map((s, i) => {
        const state = i === cur ? "active" : i < cur ? "done" : "";
        return (
          <React.Fragment key={s.id}>
            {i > 0 && <Icon.chevR className="step-sep" size={13} />}
            <div className={"step " + state} onClick={() => go(s.id)}>
              <span className="dot">{state === "done" ? <Icon.check size={11} stroke={2.6} /> : i + 1}</span>
              {s.label}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ---------- top bar ---------- */
function TopBar({ title, sub, screen, go, showStepper = true }) {
  return (
    <header className="topbar">
      <div>
        <div className="page-title">{title}</div>
        {sub && <div className="page-sub">{sub}</div>}
      </div>
      <div className="topbar-spacer" />
      {showStepper && <Stepper screen={screen} go={go} />}
      <div className="icon-btn"><Icon.bell size={18} /></div>
      <div className="avatar">
        <div className="pic">{BB.user.initials}</div>
        <span className="nm">Sarah P.</span>
        <Icon.chevD size={14} />
      </div>
    </header>
  );
}

/* ---------- shared bits ---------- */
function CoBadge({ c }) {
  return <div className="co-badge" style={{ background: `linear-gradient(150deg, ${c.color}, ${c.color}bb)` }}>{c.mono}</div>;
}

Object.assign(window, { Icon, Sidebar, Stepper, TopBar, CoBadge });
