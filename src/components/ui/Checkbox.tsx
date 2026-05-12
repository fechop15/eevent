"use client";

import { InputHTMLAttributes, forwardRef } from "react";

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = "", label, id, ...props }, ref) => {
    return (
      <label htmlFor={id} className={`flex items-center gap-2 cursor-pointer ${className}`}>
        <input
          ref={ref}
          id={id}
          type="checkbox"
          className="w-4 h-4 rounded border-white/20 bg-slate-800 text-primary focus:ring-primary cursor-pointer"
          {...props}
        />
        {label && <span className="text-sm text-slate-300">{label}</span>}
      </label>
    );
  }
);

Checkbox.displayName = "Checkbox";
export { Checkbox };
