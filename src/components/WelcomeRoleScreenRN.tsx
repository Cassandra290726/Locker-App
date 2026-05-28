"use client";

import { StyleSheet as RNStyleSheet, Text, View } from "react-native-web";

import { LockerGradientButton, LockerTitle } from "@/components/locker/LockerUi";
import { FONT_ROUNDED, GRADIENTS, LOCKER } from "@/lib/lockerTheme";
import type { UserRole } from "@/lib/lockerAuth";

type Props = {
  role: UserRole;
  email: string;
  onContinue: () => void;
};

export default function WelcomeRoleScreenRN({ role, email, onContinue }: Props) {
  const label = role === "docente" ? "Docente" : "Alumno/a";
  const grad = role === "docente" ? GRADIENTS.docente : GRADIENTS.alumno;

  return (
    <View style={styles.root}>
      <LockerTitle center size={24}>
        ¡Bienvenido/a a Locker!
      </LockerTitle>
      <View style={[styles.badge, { backgroundImage: grad } as object]}>
        <Text style={styles.badgeTxt}>Tu cuenta está registrada como</Text>
        <Text style={styles.badgeRole}>{label}</Text>
      </View>
      <Text style={styles.email}>{email}</Text>
      <Text style={styles.hint}>
        En tu primer inicio de sesión confirmamos tu rol. Revisa tu correo si recibiste
        el código de verificación.
      </Text>
      <LockerGradientButton
        label="Continuar"
        variant={role === "docente" ? "docente" : "alumno"}
        onPress={onContinue}
      />
    </View>
  );
}

const styles = RNStyleSheet.create({
  btnDocente: {
    backgroundColor: "#FF7F96",
    backgroundImage: GRADIENTS.docente,
  },
  btnAlumno: {
    backgroundColor: "#CEFFB4",
    backgroundImage: GRADIENTS.alumno,
  },
  root: {
    flex: 1,
    minHeight: "100vh",
    backgroundColor: LOCKER.bg,
    padding: 28,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    maxWidth: 400,
    alignSelf: "center",
    width: "100%",
  },
  badge: {
    paddingVertical: 20,
    paddingHorizontal: 28,
    borderRadius: 18,
    alignItems: "center",
    width: "100%",
  },
  badgeTxt: {
    fontSize: 15,
    color: LOCKER.text,
    fontFamily: FONT_ROUNDED,
    fontWeight: "600",
  },
  badgeRole: {
    fontSize: 26,
    fontWeight: "800",
    color: LOCKER.text,
    fontFamily: FONT_ROUNDED,
    marginTop: 6,
  },
  email: {
    fontSize: 14,
    color: LOCKER.text,
    fontFamily: FONT_ROUNDED,
    opacity: 0.85,
  },
  hint: {
    fontSize: 13,
    color: LOCKER.text,
    textAlign: "center",
    lineHeight: 20,
    fontFamily: FONT_ROUNDED,
    marginBottom: 12,
  },
});
