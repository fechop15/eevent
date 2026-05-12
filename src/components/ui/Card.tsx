"use client";

import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const Card = ({ className = "", children, ...props }: CardProps) => {
  return (
    <div
      className={`bg-slate-800/70 backdrop-blur-sm border border-white/10 rounded-xl shadow-lg ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export { Card };
