import Link from "next/link";

import { getSessionFromCookies } from "@/lib/session";

export default async function AgendaPage() {
  const user = await getSessionFromCookies();

  return (
    <main className="min-h-screen bg-[#FFFBDB] px-6 py-10 text-stone-800">
      <Link href="/" className="text-stone-600 underline">
        ← Volver a opciones
      </Link>
      <h1 className="mt-6 text-2xl font-bold">Agenda</h1>
      <p className="mt-2 text-stone-600">
        Sesión activa: {user?.email} ({user?.role === "docente" ? "Docente" : "Alumno/a"})
      </p>
      <p className="mt-4 text-stone-500">Contenido de agenda — próximamente.</p>
    </main>
  );
}
