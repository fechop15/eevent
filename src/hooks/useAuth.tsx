"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Timestamp } from "@/types";

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

  useEffect(() => {
    const unsubscribe = window.firebase.auth().onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await window.firebase.firestore().collection("usuarios").doc(firebaseUser.uid).get();
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUser({
            uid: firebaseUser.uid,
            cedula: data.cedula || "",
            nombre: data.nombre || "",
            apellido: data.apellido || "",
            email: data.email || "",
            rol: data.rol || "contador",
            estado: data.estado || "activo",
            fechaCreacion: data.fechaCreacion,
            ultimoAcceso: data.ultimoAcceso,
          });
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
    await window.firebase.auth().signInWithEmailAndPassword(email, password);
  };

  const register = async (data: Omit<User, "uid" | "fechaCreacion" | "ultimoAcceso"> & { password: string }) => {
    const email = `${data.cedula}@eevent.com`;
    const firebaseUser = await window.firebase.auth().createUserWithEmailAndPassword(email, data.password);

    await window.firebase.auth().updateProfile(firebaseUser.user as FirebaseUser, {
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
    await window.firebase.auth().signOut();
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