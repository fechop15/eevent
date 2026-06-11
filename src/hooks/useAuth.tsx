"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Timestamp } from "@/types";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID!,
};

interface User {
  uid: string;
  cedula: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: "admin" | "organizador" | "contador";
  estado: "activo" | "inactivo";
  fechaCreacion: Timestamp;
  ultimoAcceso: Timestamp;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (cedula: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: Omit<User, "uid" | "fechaCreacion" | "ultimoAcceso"> & { password: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [firebaseReady, setFirebaseReady] = useState(false);

  useEffect(() => {
    const scripts = [
      "https://www.gstatic.com/firebasejs/11.3.1/firebase-app-compat.js",
      "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth-compat.js",
      "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore-compat.js",
    ];

    let loaded = 0;
    scripts.forEach((src) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        loaded++;
        if (loaded === scripts.length) {
          window.firebase.initializeApp(firebaseConfig);
          setFirebaseReady(true);
        }
        return;
      }
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = () => {
        loaded++;
        if (loaded === scripts.length) {
          window.firebase.initializeApp(firebaseConfig);
          setFirebaseReady(true);
        }
      };
      document.head.appendChild(script);
    });
  }, []);

  useEffect(() => {
    if (!firebaseReady) return;

    const unsubscribe = window.firebase.auth().onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        window.firebase.firestore().collection("usuarios").doc(firebaseUser.uid).get().then((userDoc) => {
          if (userDoc.exists) {
            const data = userDoc.data();
            setUser({
              uid: firebaseUser.uid,
              cedula: String(data.cedula || ""),
              nombre: String(data.nombre || ""),
              apellido: String(data.apellido || ""),
              email: String(data.email || ""),
              rol: (data.rol as "admin" | "organizador" | "contador") || "contador",
              estado: (data.estado as "activo" | "inactivo") || "activo",
              fechaCreacion: data.fechaCreacion as Timestamp,
              ultimoAcceso: data.ultimoAcceso as Timestamp,
            });
          } else {
            setUser(null);
          }
        });
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, [firebaseReady]);

  const login = async (cedula: string, password: string) => {
    if (!firebaseReady) throw new Error("Firebase no está listo");
    const email = `${cedula}@eevent.com`;
    await window.firebase.auth().signInWithEmailAndPassword(email, password);
  };

  const register = async (data: Omit<User, "uid" | "fechaCreacion" | "ultimoAcceso"> & { password: string }) => {
    if (!firebaseReady) throw new Error("Firebase no está listo");
    const email = `${data.cedula}@eevent.com`;
    const firebaseUser = await window.firebase.auth().createUserWithEmailAndPassword(email, data.password);

    await (window.firebase.auth().updateProfile as (user: unknown, profile: { displayName: string }) => Promise<void>)(firebaseUser.user, {
      displayName: `${data.nombre} ${data.apellido}`,
    });

    await window.firebase.firestore().collection("usuarios").doc(firebaseUser.user.uid).set({
      cedula: data.cedula,
      nombre: data.nombre,
      apellido: data.apellido,
      email: data.email,
      rol: data.rol,
      estado: "activo",
      fechaCreacion: Timestamp.now(),
      ultimoAcceso: Timestamp.now(),
    });
  };

  const logout = async () => {
    if (!firebaseReady) return;
    await window.firebase.auth().signOut();
    setUser(null);
  };

  if (!firebaseReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
}