"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, FileText, LayoutGrid, Settings as SettingsIcon, Sparkles, UserSquare2 } from "lucide-react";

const navItems = [
  { to: "/profile",      label: "Master Profile", icon: UserSquare2 },
  { to: "/bullet-bank",  label: "Bullet Bank",    icon: BookOpen },
  { to: "/tailor",       label: "Tailor",         icon: Sparkles },
  { to: "/library",      label: "Library",        icon: LayoutGrid },
  { to: "/settings",     label: "Settings",       icon: SettingsIcon },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
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
            <Link
              key={item.to}
              href={item.to}
              className={"nav-item" + (pathname.startsWith(item.to) ? " active" : "")}
            >
              <item.icon className="nav-ic" size={17} strokeWidth={2} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-foot">
          <Sparkles size={13} />
          Local &amp; private — your data stays in this browser.
        </div>
      </aside>

      <div className="main">
        {children}
      </div>
    </div>
  );
}
