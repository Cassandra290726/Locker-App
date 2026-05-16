"use client";

import { StyleSheet as RNStyleSheet, Text, TouchableOpacity, View } from "react-native-web";

import DocenteFlowLayout from "@/components/DocenteFlowLayout";

type Props = {
  onBack: () => void;
  onAgregarHorario: () => void;
  onNotas: () => void;
};

const horarioGradient = {
  backgroundImage:
    "linear-gradient(160deg, #d5f7ff 0%, #B6F0FF 45%, #7dd4ed 100%)",
} as const;

const notasGradient = {
  backgroundImage:
    "linear-gradient(160deg, #ffb8c9 0%, #FF7F96 45%, #e85d78 100%)",
} as const;

/** Menú inicial de Agenda (primer acceso sin horarios registrados). */
export default function DocenteAgendaMenuScreenRN({
  onBack,
  onAgregarHorario,
  onNotas,
}: Props) {
  return (
    <DocenteFlowLayout onBack={onBack}>
      <View style={styles.center}>
        <TouchableOpacity
          style={[styles.bigBtn, horarioGradient]}
          onPress={onAgregarHorario}
          activeOpacity={0.88}
          accessibilityLabel="Agregar horario"
        >
          <Text style={styles.bigBtnText}>Agregar horario</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.bigBtn, notasGradient]}
          onPress={onNotas}
          activeOpacity={0.88}
          accessibilityLabel="Notas"
        >
          <Text style={styles.bigBtnText}>Notas</Text>
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
