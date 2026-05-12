"use client";

import { useRef } from "react";

interface FileUploadProps {
  label?: string;
  accept?: string;
  onChange: (file: File | null) => void;
  error?: string;
}

export function FileUpload({ label, accept = "*", onChange, error }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-slate-300">{label}</label>}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={(e) => onChange(e.target.files?.[0] || null)}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex items-center justify-center gap-2 px-4 py-8 border-2 border-dashed border-white/20 rounded-lg text-slate-400 hover:border-primary hover:text-primary transition-colors cursor-pointer"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16.6 7c-.21.91-.45 1.81-.73 2.68A4 4 0 0114 15.9z" />
        </svg>
        <span className="text-sm">Subir archivo</span>
      </button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
