"use client";

import { StyleSheet as RNStyleSheet, Text, TouchableOpacity, View } from "react-native-web";

import { FONT_ROUNDED, GRADIENTS, LOCKER, MSG_LLENAR_TODO } from "@/lib/lockerTheme";

export const lockerText = {
  color: LOCKER.text,
  fontFamily: FONT_ROUNDED,
};

export function LockerTitle({
  children,
  size = 22,
  center,
}: {
  children: React.ReactNode;
  size?: number;
  center?: boolean;
}) {
  return (
    <Text
      style={{
        fontSize: size,
        fontWeight: "800",
        color: LOCKER.text,
        fontFamily: FONT_ROUNDED,
        textAlign: center ? "center" : "left",
        lineHeight: size * 1.35,
      }}
    >
      {children}
    </Text>
  );
}

export function LockerIncompleteMsg({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <View style={ui.incompleteWrap}>
      <Text style={ui.incompleteTxt}>{MSG_LLENAR_TODO}</Text>
    </View>
  );
}

type BtnVariant = "green" | "blue" | "pink" | "purple" | "alumno" | "docente";

export function LockerGradientButton({
  label,
  onPress,
  disabled,
  variant = "blue",
  loading,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: BtnVariant;
  loading?: boolean;
}) {
  const grad = GRADIENTS[variant];
  return (
    <TouchableOpacity
      style={[
        ui.gradBtn,
        { backgroundImage: grad } as object,
        (disabled || loading) && ui.gradBtnOff,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.88}
    >
      <Text style={ui.gradBtnTxt}>{loading ? "…" : label}</Text>
    </TouchableOpacity>
  );
}

export function RoleBadge({ role }: { role: "docente" | "alumno" }) {
  const label = role === "docente" ? "Docente" : "Alumno/a";
  const grad = role === "docente" ? GRADIENTS.docente : GRADIENTS.alumno;
  return (
    <View style={[ui.roleBadge, { backgroundImage: grad } as object]}>
      <Text style={ui.roleBadgeTxt}>Registrándose como: {label}</Text>
    </View>
  );
}

const ui = RNStyleSheet.create({
  incompleteWrap: {
    backgroundColor: "#fff5f5",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 10,
    padding: 12,
    marginVertical: 10,
  },
  incompleteTxt: {
    color: "#b91c1c",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    fontFamily: FONT_ROUNDED,
  },
  gradBtn: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  gradBtnOff: { opacity: 0.45 },
  gradBtnTxt: {
    fontSize: 16,
    fontWeight: "800",
    color: LOCKER.text,
    fontFamily: FONT_ROUNDED,
  },
  roleBadge: {
    alignSelf: "center",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 14,
    marginBottom: 16,
  },
  roleBadgeTxt: {
    fontSize: 15,
    fontWeight: "800",
    color: LOCKER.text,
    fontFamily: FONT_ROUNDED,
    textAlign: "center",
  },
});
