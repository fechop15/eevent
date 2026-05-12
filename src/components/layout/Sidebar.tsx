"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  {
    name: "Eventos",
    href: "/eventos",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    name: "Personas",
    href: "/personas",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    name: "Configuración",
    href: "/configuracion",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.258-.636 2.53-1.098 3.79-1.323 1.357-.262 2.558-.447 3.85-.355a5.466 5.466 0 011.045.17 3 3 0 000 5.922c-1.292.114-2.493.316-3.85.355-1.292.226-2.532.553-3.79 1.323a5.466 5.466 0 01-1.045.17 3 3 0 00-5.922 0 5.466 5.466 0 01-1.045-.17 3 3 0 00-3.79-1.323 5.466 5.466 0 01-3.85-.355 5.466 5.466 0 01-1.045-.17 3 3 0 000-5.922 5.466 5.466 0 011.045-.17 5.466 5.466 0 011.045.17 3 3 0 005.922 0c1.292-.114 2.493-.316 3.85-.355 1.292-.226 2.532-.553 3.79-1.323a5.466 5.466 0 011.045-.17 3 3 0 000-5.922 5.466 5.466 0 01-1.045.17 3 3 0 00-3.79-1.323 5.466 5.466 0 01-3.85-.355 5.466 5.466 0 01-1.045-.17 3 3 0 000 5.922c1.292-.114 2.493-.316 3.85-.355 1.292-.226 2.532-.553 3.79-1.323a5.466 5.466 0 011.045-.17 3 3 0 000 5.922" />
      </svg>
    ),
  },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/eventos") {
      return pathname.startsWith("/eventos");
    }
    return pathname === href;
  };

  return (
    <aside className="fixed left-0 top-0 z-40 w-64 h-screen bg-slate-900/50 backdrop-blur-sm border-r border-white/10">
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-lg">E</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-100">EEvent</h1>
            <p className="text-xs text-slate-500">Gestión de eventos</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? "bg-primary text-white"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
              }`}
            >
              {item.icon}
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-white/10">
          <div className="px-3 py-2.5 text-xs text-slate-500">
            © 2026 EEvent
          </div>
        </div>
      </div>
    </aside>
  );
}
