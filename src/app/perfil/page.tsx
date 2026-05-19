import Link from "next/link";

import DocentePerfilScreenRN from "@/components/DocentePerfilScreenRN";
import { getSessionFromCookies } from "@/lib/session";

export default async function PerfilPage() {
  const user = await getSessionFromCookies();

  if (!user) {
    return (
      <main className="min-h-screen bg-[#FFFBDB] px-6 py-10 text-stone-800">
        <p>Inicia sesión para ver tu perfil.</p>
        <Link href="/login" className="mt-4 inline-block text-stone-600 underline">
          Ir a login
        </Link>
      </main>
    );
  }

  if (user.role === "docente") {
    return <DocentePerfilScreenRN />;
  }

  return (
    <main className="min-h-screen bg-[#FFFBDB] px-6 py-10 text-stone-800">
      <Link href="/" className="text-stone-600 underline">
        ← Volver
      </Link>
      <h1 className="mt-6 text-2xl font-bold">Perfil</h1>
      <p className="mt-2 text-stone-600">Sesión: {user.email}</p>
      <p className="mt-4 text-stone-500">Perfil de alumno — próximamente.</p>
    </main>
  );
}
