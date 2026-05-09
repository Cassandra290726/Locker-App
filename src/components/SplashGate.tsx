"use client";

import { useEffect, useState } from "react";

import LoginScreenRN from "@/components/LoginScreenRN";
import OptionsScreenRN from "@/components/OptionsScreenRN";
import RoleSelectScreenRN from "@/components/RoleSelectScreenRN";
import SignupCredentialsRN from "@/components/SignupCredentialsRN";
import SplashScreenRN from "@/components/SplashScreenRN";
import {
  clearStoredSession,
  getAccount,
  getStoredSessionEmail,
  type UserRole,
} from "@/lib/lockerAuth";

type Phase =
  | "splash"
  | "login"
  | "role"
  | "signup"
  | "options";

export default function SplashGate() {
  const [phase, setPhase] = useState<Phase>("splash");
  const [signupRole, setSignupRole] = useState<UserRole | null>(null);

  useEffect(() => {
    if (phase === "signup" && !signupRole) {
      setPhase("role");
    }
  }, [phase, signupRole]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      const sessionEmail = getStoredSessionEmail();
      if (sessionEmail && getAccount(sessionEmail)) {
        setPhase("options");
      } else {
        if (sessionEmail) clearStoredSession();
        setPhase("login");
      }
    }, 2000);
    return () => window.clearTimeout(t);
  }, []);

  if (phase === "splash") {
    return <SplashScreenRN />;
  }

  if (phase === "login") {
    return (
      <LoginScreenRN
        onCreateAccount={() => setPhase("role")}
        onLoginSuccess={() => setPhase("options")}
      />
    );
  }

  if (phase === "role") {
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

  if (phase === "signup" && signupRole) {
    return (
      <SignupCredentialsRN
        role={signupRole}
        onBack={() => setPhase("role")}
        onRegistered={() => setPhase("options")}
      />
    );
  }

  return (
    <OptionsScreenRN
      onSignOut={() => {
        clearStoredSession();
        setSignupRole(null);
        setPhase("login");
      }}
    />
  );
}
