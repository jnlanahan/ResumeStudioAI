import { NavLink, Outlet } from "react-router-dom";
import { BookOpen, FileText, LayoutGrid, Settings as SettingsIcon, Sparkles, UserSquare2 } from "lucide-react";

const navItems = [
  { to: "/profile",      label: "Master Profile", icon: UserSquare2 },
  { to: "/bullet-bank",  label: "Bullet Bank",    icon: BookOpen },
  { to: "/tailor",       label: "Tailor",         icon: Sparkles },
  { to: "/library",      label: "Library",        icon: LayoutGrid },
  { to: "/settings",     label: "Settings",       icon: SettingsIcon },
];

export default function Layout() {
  return (
    <div className="app">
      <aside className="sidebar no-print">
        <div className="brand">
          <div className="brand-mark">
            <FileText size={17} strokeWidth={2.2} />
          </div>
          <div className="brand-name">
            Resume Studio <span className="ai">AI</span>
          </div>
        </div>

        <nav className="nav">
          <div className="nav-label">Workspace</div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}
            >
              <item.icon className="nav-ic" size={17} strokeWidth={2} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-foot">
          <Sparkles size={13} />
          Local &amp; private — your data stays in this browser.
        </div>
      </aside>

      <div className="main">
        <Outlet />
      </div>
    </div>
  );
}
