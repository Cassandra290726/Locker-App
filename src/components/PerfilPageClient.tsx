"use client";

import { useRouter } from "next/navigation";

import DocentePerfilFlowRN from "@/components/DocentePerfilFlowRN";

export default function PerfilPageClient() {
  const router = useRouter();
  return <DocentePerfilFlowRN onClose={() => router.push("/")} />;
}
