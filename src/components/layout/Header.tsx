"use client";

import { Button } from "../ui/Button";

interface HeaderProps {
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary" | "danger";
    disabled?: boolean;
  };
  back?: {
    label: string;
    onClick: () => void;
  };
}

export function Header({ title, subtitle, action, back }: HeaderProps) {
  return (
    <div className="mb-8">
      {back && (
        <button
          onClick={back.onClick}
          className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200 transition-colors mb-3"
        >
          <span>←</span>
          <span>{back.label}</span>
        </button>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">{title}</h1>
          {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
        </div>
        {action && (
          <Button variant={action.variant || "primary"} onClick={action.onClick} disabled={action.disabled}>
            {action.label}
          </Button>
        )}
      </div>
    </div>
  );
}
