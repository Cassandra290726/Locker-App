"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import AlumnoAgregarClaseScreenRN from "@/components/AlumnoAgregarClaseScreenRN";
import AlumnoDocenteHorarioScreenRN from "@/components/AlumnoDocenteHorarioScreenRN";
import AlumnoDocentePerfilScreenRN from "@/components/AlumnoDocentePerfilScreenRN";
import AlumnoDocentesListScreenRN from "@/components/AlumnoDocentesListScreenRN";
import AlumnoHorarioGridScreenRN from "@/components/AlumnoHorarioGridScreenRN";
import AlumnoHubScreenRN from "@/components/AlumnoHubScreenRN";
import AlumnoNotasScreenRN from "@/components/AlumnoNotasScreenRN";
import AlumnoSignupFlowRN from "@/components/AlumnoSignupFlowRN";
import LoginScreenRN from "@/components/LoginScreenRN";
import DocenteAgendaMenuScreenRN from "@/components/DocenteAgendaMenuScreenRN";
import DocenteAgregarClaseScreenRN from "@/components/DocenteAgregarClaseScreenRN";
import DocenteNotasScreenRN from "@/components/DocenteNotasScreenRN";
import DocenteHorarioGridScreenRN from "@/components/DocenteHorarioGridScreenRN";
import DocenteHubScreenRN from "@/components/DocenteHubScreenRN";
import DocentePerfilFlowRN from "@/components/DocentePerfilFlowRN";
import DocenteSignupScreenRN from "@/components/DocenteSignupScreenRN";
import RoleSelectScreenRN from "@/components/RoleSelectScreenRN";
import SplashScreenRN from "@/components/SplashScreenRN";
import WelcomeRoleScreenRN from "@/components/WelcomeRoleScreenRN";
import { fetchClasesAlumno } from "@/lib/alumnoHorarioClient";
import type { DocentePublico } from "@/lib/alumnoDocentesClient";
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
  | "welcome"
  | "alumno_main"
  | "alumno_agregar_clase"
  | "alumno_horario_grid"
  | "alumno_notas"
  | "alumno_docentes"
  | "alumno_docente_perfil"
  | "alumno_docente_horario"
  | "docente_main"
  | "docente_agenda"
  | "docente_agregar_clase"
  | "docente_horario_grid"
  | "docente_notas"
  | "docente_perfil";

type AlumnoClaseFormCtx = {
  cancelTo: "hub" | "grid";
  editingId: string | null;
};

type DocenteClaseFormCtx = {
  cancelTo: "agenda" | "grid";
  editingId: string | null;
};

function welcomeStorageKey(email: string) {
  return `locker_welcome_${email}`;
}

function shouldShowWelcome(email: string): boolean {
  try {
    return sessionStorage.getItem(welcomeStorageKey(email)) !== "1";
  } catch {
    return false;
  }
}

function markWelcomeSeen(email: string) {
  try {
    sessionStorage.setItem(welcomeStorageKey(email), "1");
  } catch {
    /* ignore */
  }
}

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
  const [claseFormCtx, setClaseFormCtx] = useState<AlumnoClaseFormCtx>({
    cancelTo: "hub",
    editingId: null,
  });
  const [docenteSel, setDocenteSel] = useState<DocentePublico | null>(null);
  const [docenteClaseCtx, setDocenteClaseCtx] = useState<DocenteClaseFormCtx>({
    cancelTo: "agenda",
    editingId: null,
  });

  function goAfterAuth(user: SessionUser) {
    setSessionUser(user);
    if (shouldShowWelcome(user.email)) {
      setPhase("welcome");
      return;
    }
    setPhase(user.role === "docente" ? "docente_main" : "alumno_main");
  }

  const displayPhase: Phase =
    phase === "signup" && !signupRole ? "role" : phase;

  useEffect(() => {
    const initial = parseInitialPhase(searchParams.get("phase"));
    const t = window.setTimeout(async () => {
      const user = await fetchSession();
      if (user) {
        setSessionUser(user);
        setPhase(user.role === "docente" ? "docente_main" : "alumno_main");
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
        onLoginSuccess={goAfterAuth}
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
        onRegistered={goAfterAuth}
      />
    );
  }

  if (displayPhase === "signup" && signupRole === "alumno") {
    return (
      <AlumnoSignupFlowRN
        onBack={() => setPhase("role")}
        onRegistered={goAfterAuth}
      />
    );
  }

  if (displayPhase === "welcome" && sessionUser) {
    return (
      <WelcomeRoleScreenRN
        role={sessionUser.role}
        email={sessionUser.email}
        onContinue={() => {
          markWelcomeSeen(sessionUser.email);
          setPhase(
            sessionUser.role === "docente" ? "docente_main" : "alumno_main",
          );
        }}
      />
    );
  }

  if (displayPhase === "alumno_main") {
    return (
      <AlumnoHubScreenRN
        onBack={async () => {
          await logout();
          setSessionUser(null);
          setSignupRole(null);
          setPhase("login");
        }}
        onRegistrarHorario={async () => {
          const clases = await fetchClasesAlumno();
          if (clases.length === 0) {
            setClaseFormCtx({ cancelTo: "hub", editingId: null });
            setPhase("alumno_agregar_clase");
          } else {
            setPhase("alumno_horario_grid");
          }
        }}
        onNotas={() => setPhase("alumno_notas")}
        onDocente={() => setPhase("alumno_docentes")}
      />
    );
  }

  if (displayPhase === "alumno_agregar_clase") {
    return (
      <AlumnoAgregarClaseScreenRN
        key={claseFormCtx.editingId ?? "nueva"}
        editingId={claseFormCtx.editingId}
        onCancel={() => {
          const dest = claseFormCtx.cancelTo;
          setClaseFormCtx({ cancelTo: "hub", editingId: null });
          setPhase(dest === "hub" ? "alumno_main" : "alumno_horario_grid");
        }}
        onSaved={() => {
          setClaseFormCtx({ cancelTo: "grid", editingId: null });
          setPhase("alumno_horario_grid");
        }}
      />
    );
  }

  if (displayPhase === "alumno_horario_grid") {
    return (
      <AlumnoHorarioGridScreenRN
        onBack={() => setPhase("alumno_main")}
        onAgregarClase={() => {
          setClaseFormCtx({ cancelTo: "grid", editingId: null });
          setPhase("alumno_agregar_clase");
        }}
        onEditClase={(id) => {
          setClaseFormCtx({ cancelTo: "grid", editingId: id });
          setPhase("alumno_agregar_clase");
        }}
      />
    );
  }

  if (displayPhase === "alumno_notas") {
    return <AlumnoNotasScreenRN onBack={() => setPhase("alumno_main")} />;
  }

  if (displayPhase === "alumno_docentes") {
    return (
      <AlumnoDocentesListScreenRN
        onBack={() => setPhase("alumno_main")}
        onSelectDocente={(d) => {
          setDocenteSel(d);
          setPhase("alumno_docente_perfil");
        }}
      />
    );
  }

  if (displayPhase === "alumno_docente_perfil" && docenteSel) {
    return (
      <AlumnoDocentePerfilScreenRN
        docenteEmail={docenteSel.email}
        onBack={() => setPhase("alumno_docentes")}
        onVerHorario={(d) => {
          setDocenteSel(d);
          setPhase("alumno_docente_horario");
        }}
      />
    );
  }

  if (displayPhase === "alumno_docente_horario" && docenteSel) {
    return (
      <AlumnoDocenteHorarioScreenRN
        docenteEmail={docenteSel.email}
        onBack={() => setPhase("alumno_docente_perfil")}
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
        onPerfil={() => setPhase("docente_perfil")}
      />
    );
  }

  if (displayPhase === "docente_agenda") {
    return (
      <DocenteAgendaMenuScreenRN
        onBack={() => setPhase("docente_main")}
        onAgregarHorario={() => {
          setDocenteClaseCtx({ cancelTo: "agenda", editingId: null });
          setPhase("docente_agregar_clase");
        }}
        onNotas={() => setPhase("docente_notas")}
      />
    );
  }

  if (displayPhase === "docente_agregar_clase") {
    return (
      <DocenteAgregarClaseScreenRN
        key={docenteClaseCtx.editingId ?? "nueva"}
        editingId={docenteClaseCtx.editingId}
        onCancel={() => {
          const dest = docenteClaseCtx.cancelTo;
          setDocenteClaseCtx({ cancelTo: "agenda", editingId: null });
          setPhase(dest === "agenda" ? "docente_agenda" : "docente_horario_grid");
        }}
        onSaved={() => {
          setDocenteClaseCtx({ cancelTo: "grid", editingId: null });
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
          setDocenteClaseCtx({ cancelTo: "grid", editingId: null });
          setPhase("docente_agregar_clase");
        }}
        onEditClase={(id) => {
          setDocenteClaseCtx({ cancelTo: "grid", editingId: id });
          setPhase("docente_agregar_clase");
        }}
      />
    );
  }

  if (displayPhase === "docente_notas") {
    return (
      <DocenteNotasScreenRN onBack={() => setPhase("docente_agenda")} />
    );
  }

  if (displayPhase === "docente_perfil") {
    return (
      <DocentePerfilFlowRN onClose={() => setPhase("docente_main")} />
    );
  }

  return <SplashScreenRN />;
}

export default function SplashGate() {
  return (
    <Suspense fallback={<SplashScreenRN />}>
      <SplashGateInner />
    </Suspense>
  );
}
