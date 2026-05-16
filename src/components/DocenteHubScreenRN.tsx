"use client";

import { StyleSheet as RNStyleSheet, Text, TouchableOpacity, View } from "react-native-web";

import DocenteFlowLayout from "@/components/DocenteFlowLayout";

type Props = {
  onBack: () => void;
  onAgenda: () => void;
  onPerfil: () => void;
};

const agendaGradient = {
  backgroundImage:
    "linear-gradient(160deg, #e0ffd0 0%, #CEFFB4 40%, #a8e890 100%)",
} as const;

const perfilGradient = {
  backgroundImage:
    "linear-gradient(160deg, #d5f7ff 0%, #B6F0FF 45%, #7dd4ed 100%)",
} as const;

export default function DocenteHubScreenRN({
  onBack,
  onAgenda,
  onPerfil,
}: Props) {
  return (
    <DocenteFlowLayout onBack={onBack}>
      <View style={styles.center}>
        <TouchableOpacity
          style={[styles.bigBtn, agendaGradient]}
          onPress={onAgenda}
          activeOpacity={0.88}
          accessibilityLabel="Agenda"
        >
          <Text style={styles.bigBtnText}>Agenda</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.bigBtn, perfilGradient]}
          onPress={onPerfil}
          activeOpacity={0.88}
          accessibilityLabel="Perfil"
        >
          <Text style={styles.bigBtnText}>Perfil</Text>
        </TouchableOpacity>
      </View>
    </DocenteFlowLayout>
  );
}

const styles = RNStyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 28,
    paddingBottom: 48,
    width: "100%",
  },
  bigBtn: {
    width: "100%",
    maxWidth: 320,
    paddingVertical: 28,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  bigBtnText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1c1917",
  },
});
