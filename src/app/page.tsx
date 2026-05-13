"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { FirebaseLoader } from "@/components/providers/FirebaseLoader";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return (
    <FirebaseLoader>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    </FirebaseLoader>
  );
}