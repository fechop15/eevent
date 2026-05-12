"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { User, AuthContextType } from "@/types";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, "usuarios", firebaseUser.uid));
        if (userDoc.exists()) {
          setUser({ uid: firebaseUser.uid, ...userDoc.data() } as User);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (cedula: string, password: string) => {
    const email = `${cedula}@eevent.com`;
    await signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (
    data: Omit<User, "uid" | "fechaCreacion" | "ultimoAcceso"> & { password: string }
  ) => {
    const email = `${data.cedula}@eevent.com`;
    const firebaseUser = await createUserWithEmailAndPassword(auth, email, data.password);

    await updateProfile(firebaseUser.user, { displayName: `${data.nombre} ${data.apellido}` });

    const userData: Omit<User, "uid"> = {
      cedula: data.cedula,
      nombre: data.nombre,
      apellido: data.apellido,
      email: data.email,
      rol: data.rol,
      estado: "activo",
      fechaCreacion: Timestamp.now(),
      ultimoAcceso: Timestamp.now(),
    };

    await setDoc(doc(db, "usuarios", firebaseUser.user.uid), userData);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

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
