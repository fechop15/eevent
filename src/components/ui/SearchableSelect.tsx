"use client";

import { useState, useRef, useEffect } from "react";

interface SearchableSelectProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  error?: string;
  className?: string;
}

export function SearchableSelect({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = "Buscar...",
  error,
  className = "",
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);
  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-slate-300">{label}</label>
      )}
      <div className="relative">
        <button
          type="button"
          id={id}
          onClick={() => setOpen(!open)}
          className={`w-full px-4 py-2.5 bg-slate-800/50 border rounded-lg text-left text-slate-100 outline-none transition-all duration-200 cursor-pointer ${
            error ? "border-red-500" : open ? "border-primary" : "border-white/10"
          }`}
        >
          <span className={selected ? "" : "text-slate-400 italic"}>
            {selected ? selected.label : placeholder}
          </span>
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <svg
              className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </span>
        </button>

        {open && (
          <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-white/10 rounded-lg shadow-xl overflow-hidden">
            <div className="p-2 border-b border-white/10">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={placeholder}
                className="w-full px-3 py-2 bg-slate-700/50 border border-white/10 rounded text-slate-100 text-sm outline-none focus:border-primary"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="max-h-60 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="px-4 py-3 text-sm text-slate-500">Sin resultados</p>
              ) : (
                filtered.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                      setSearch("");
                    }}
                    className={`w-full px-4 py-2.5 text-left text-sm hover:bg-slate-700/50 transition-colors ${
                      opt.value === value ? "bg-slate-700/70 text-primary" : "text-slate-100"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}