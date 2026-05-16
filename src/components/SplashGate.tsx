"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import LoginScreenRN from "@/components/LoginScreenRN";
import OptionsScreenRN from "@/components/OptionsScreenRN";
import RoleSelectScreenRN from "@/components/RoleSelectScreenRN";
import DocenteAgendaMenuScreenRN from "@/components/DocenteAgendaMenuScreenRN";
import DocenteAgregarClaseScreenRN from "@/components/DocenteAgregarClaseScreenRN";
import DocenteHorarioGridScreenRN from "@/components/DocenteHorarioGridScreenRN";
import DocenteHubScreenRN from "@/components/DocenteHubScreenRN";
import DocenteSignupScreenRN from "@/components/DocenteSignupScreenRN";
import SignupCredentialsRN from "@/components/SignupCredentialsRN";
import SplashScreenRN from "@/components/SplashScreenRN";
import {
  fetchSession,
  logout,
  type SessionUser,
  type UserRole,
} from "@/lib/lockerAuth";

type Phase =
  | "splash"
  | "login"
  | "role"
  | "signup"
  | "options"
  | "docente_main"
  | "docente_agenda"
  | "docente_agregar_clase"
  | "docente_horario_grid";

type ClaseFormCtx = {
  cancelTo: "agenda" | "grid";
  editingId: string | null;
};

function parseInitialPhase(raw: string | null): Phase | null {
  if (raw === "login" || raw === "role" || raw === "signup") return raw;
  return null;
}

function SplashGateInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [phase, setPhase] = useState<Phase>("splash");
  const [signupRole, setSignupRole] = useState<UserRole | null>(null);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [claseFormCtx, setClaseFormCtx] = useState<ClaseFormCtx>({
    cancelTo: "agenda",
    editingId: null,
  });

  const displayPhase: Phase =
    phase === "signup" && !signupRole ? "role" : phase;

  useEffect(() => {
    const initial = parseInitialPhase(searchParams.get("phase"));
    const t = window.setTimeout(async () => {
      const user = await fetchSession();
      if (user) {
        setSessionUser(user);
        setPhase(user.role === "docente" ? "docente_main" : "options");
        return;
      }
      setPhase(initial ?? "login");
    }, 2000);
    return () => window.clearTimeout(t);
  }, [searchParams]);

  if (displayPhase === "splash") {
    return <SplashScreenRN />;
  }

  if (displayPhase === "login") {
    return (
      <LoginScreenRN
        onCreateAccount={() => setPhase("role")}
        onLoginSuccess={(user) => {
          setSessionUser(user);
          setPhase(user.role === "docente" ? "docente_main" : "options");
        }}
      />
    );
  }

  if (displayPhase === "role") {
    return (
      <RoleSelectScreenRN
        onBack={() => setPhase("login")}
        onPickRole={(role) => {
          setSignupRole(role);
          setPhase("signup");
        }}
      />
    );
  }

  if (displayPhase === "signup" && signupRole === "docente") {
    return (
      <DocenteSignupScreenRN
        onBack={() => setPhase("role")}
        onRegistered={(user) => {
          setSessionUser(user);
          setPhase("docente_main");
        }}
      />
    );
  }

  if (displayPhase === "signup" && signupRole === "alumno") {
    return (
      <SignupCredentialsRN
        role="alumno"
        onBack={() => setPhase("role")}
        onRegistered={(user) => {
          setSessionUser(user);
          setPhase("options");
        }}
      />
    );
  }

  if (displayPhase === "docente_main") {
    return (
      <DocenteHubScreenRN
        onBack={async () => {
          await logout();
          setSessionUser(null);
          setSignupRole(null);
          setPhase("login");
        }}
        onAgenda={() => setPhase("docente_agenda")}
        onPerfil={() => router.push("/perfil")}
      />
    );
  }

  if (displayPhase === "docente_agenda") {
    return (
      <DocenteAgendaMenuScreenRN
        onBack={() => setPhase("docente_main")}
        onAgregarHorario={() => {
          setClaseFormCtx({ cancelTo: "agenda", editingId: null });
          setPhase("docente_agregar_clase");
        }}
        onNotas={() => {}}
      />
    );
  }

  if (displayPhase === "docente_agregar_clase") {
    return (
      <DocenteAgregarClaseScreenRN
        key={claseFormCtx.editingId ?? "nueva"}
        editingId={claseFormCtx.editingId}
        onCancel={() => {
          const dest = claseFormCtx.cancelTo;
          setClaseFormCtx({ cancelTo: "agenda", editingId: null });
          setPhase(dest === "agenda" ? "docente_agenda" : "docente_horario_grid");
        }}
        onSaved={() => {
          setClaseFormCtx({ cancelTo: "grid", editingId: null });
          setPhase("docente_horario_grid");
        }}
      />
    );
  }

  if (displayPhase === "docente_horario_grid") {
    return (
      <DocenteHorarioGridScreenRN
        onBack={() => setPhase("docente_agenda")}
        onAgregarClase={() => {
          setClaseFormCtx({ cancelTo: "grid", editingId: null });
          setPhase("docente_agregar_clase");
        }}
        onEditClase={(id) => {
          setClaseFormCtx({ cancelTo: "grid", editingId: id });
          setPhase("docente_agregar_clase");
        }}
      />
    );
  }

  return (
    <OptionsScreenRN
      user={sessionUser}
      onSignOut={async () => {
        await logout();
        setSessionUser(null);
        setSignupRole(null);
        setPhase("login");
      }}
    />
  );
}

export default function SplashGate() {
  return (
    <Suspense fallback={<SplashScreenRN />}>
      <SplashGateInner />
    </Suspense>
  );
}
