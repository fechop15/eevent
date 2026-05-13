"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const firebaseConfig = {
  apiKey: "AIzaSyC6WecBcLCjDM1gUnWLksDpfSgNb2-EcqE",
  authDomain: "eevent-59ae4.firebaseapp.com",
  projectId: "eevent-59ae4",
  storageBucket: "eevent-59ae4.firebasestorage.app",
  messagingSenderId: "101879572487",
  appId: "1:101879572487:web:82dfd11f1501c7b3e662a2",
  measurementId: "G-XE4H2KN33D",
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