"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID!,
};

export function FirebaseLoader({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const scripts = [
      "https://www.gstatic.com/firebasejs/11.3.1/firebase-app-compat.js",
      "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth-compat.js",
      "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore-compat.js",
    ];

    let loaded = 0;
    scripts.forEach((src) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = () => {
        loaded++;
        if (loaded === scripts.length) {
          window.firebase.initializeApp(firebaseConfig);
          setReady(true);
        }
      };
      document.head.appendChild(script);
    });

    return () => {
      scripts.forEach((src) => {
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) existing.remove();
      });
    };
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}