"use client";

import {
  Image,
  StyleSheet as RNStyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native-web";

import type { UserRole } from "@/lib/lockerAuth";

type Props = {
  onBack: () => void;
  onPickRole: (role: UserRole) => void;
};

export default function RoleSelectScreenRN({ onBack, onPickRole }: Props) {
  return (
    <View style={styles.root}>
      <TouchableOpacity
        style={styles.backBtn}
        onPress={onBack}
        accessibilityLabel="Volver"
        activeOpacity={0.7}
      >
        <Text style={styles.backArrow}>←</Text>
      </TouchableOpacity>

      <View style={styles.center}>
        <Image
          accessibilityLabel="Logo Locker"
          alt="Logo Locker"
          source={{ uri: "/logo.png" }}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.welcome}>Bienvenido</Text>
        <Text style={styles.subtitle}>Elige tu ocupación</Text>

        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.roleBtn, styles.docente]}
            onPress={() => onPickRole("docente")}
            activeOpacity={0.85}
          >
            <Text style={styles.roleBtnText}>Docente</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleBtn, styles.alumno]}
            onPress={() => onPickRole("alumno")}
            activeOpacity={0.85}
          >
            <Text style={styles.roleBtnText}>Alumno/a</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = RNStyleSheet.create({
  root: {
    width: "100%",
    minHeight: "100vh",
    backgroundColor: "#FFFBDB",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
  },
  backBtn: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  backArrow: {
    fontSize: 28,
    color: "#806b63",
    fontWeight: "600",
    lineHeight: 32,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 48,
    width: "100%",
  },
  logo: {
    width: "46%",
    maxWidth: 200,
    height: 120,
    marginBottom: 20,
  },
  welcome: {
    fontSize: 26,
    fontWeight: "700",
    color: "#292524",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#44403c",
    textAlign: "center",
    marginBottom: 48,
  },
  buttons: {
    width: "100%",
    maxWidth: 320,
    gap: 48,
    alignItems: "stretch",
  },
  roleBtn: {
    paddingVertical: 22,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  docente: {
    backgroundColor: "#FF7F96",
  },
  alumno: {
    backgroundColor: "#CEFFB4",
  },
  roleBtnText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1c1917",
  },
});
