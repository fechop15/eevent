import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import { FirebaseProvider } from "@/components/providers/FirebaseProvider";

export const metadata: Metadata = {
  title: "EEvent - Gestión de Eventos",
  description: "Plataforma para gestionar eventos de todo tipo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          <FirebaseProvider>{children}</FirebaseProvider>
        </AuthProvider>
      </body>
    </html>
  );
}