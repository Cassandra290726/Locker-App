"use client";

import { ActivityIndicator, StyleSheet as RNStyleSheet, Text, View } from "react-native-web";

import { FONT_ROUNDED, LOCKER } from "@/lib/lockerTheme";

const VERIFY_MSG = "Se enviará un código de verificación a tu cuenta";

type Props = {
  visible: boolean;
};

export default function SignupLoadingOverlay({ visible }: Props) {
  if (!visible) return null;
  return (
    <View style={styles.overlay} accessibilityRole="alert">
      <View style={styles.card}>
        <ActivityIndicator size="large" color={LOCKER.text} />
        <Text style={styles.message}>{VERIFY_MSG}</Text>
      </View>
    </View>
  );
}

const styles = RNStyleSheet.create({
  overlay: {
    position: "fixed",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 251, 219, 0.92)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 200,
    padding: 24,
  },
  card: {
    maxWidth: 320,
    alignItems: "center",
    gap: 20,
    padding: 28,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e7e5e4",
  },
  message: {
    fontSize: 16,
    fontWeight: "700",
    color: LOCKER.text,
    textAlign: "center",
    lineHeight: 24,
    fontFamily: FONT_ROUNDED,
  },
});
