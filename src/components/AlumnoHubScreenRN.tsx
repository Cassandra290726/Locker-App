"use client";

import { StyleSheet as RNStyleSheet, Text, TouchableOpacity, View } from "react-native-web";

import DocenteFlowLayout from "@/components/DocenteFlowLayout";

type Props = {
  onBack: () => void;
  onRegistrarHorario: () => void;
  onNotas: () => void;
  onDocente: () => void;
};

const horarioGradient = {
  backgroundImage:
    "linear-gradient(160deg, #e8ffd8 0%, #CEFFB4 45%, #9ae68a 100%)",
} as const;

const notasGradient = {
  backgroundImage:
    "linear-gradient(160deg, #d5f7ff 0%, #B6F0FF 45%, #7dd4ed 100%)",
} as const;

const docenteGradient = {
  backgroundImage:
    "linear-gradient(160deg, #e4d4f7 0%, #C9A7EB 45%, #a67fd4 100%)",
} as const;

export default function AlumnoHubScreenRN({
  onBack,
  onRegistrarHorario,
  onNotas,
  onDocente,
}: Props) {
  return (
    <DocenteFlowLayout onBack={onBack}>
      <View style={styles.center}>
        <TouchableOpacity
          style={[styles.bigBtn, horarioGradient]}
          onPress={onRegistrarHorario}
          activeOpacity={0.88}
        >
          <Text style={styles.bigBtnText}>Registrar Horario</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.bigBtn, notasGradient]}
          onPress={onNotas}
          activeOpacity={0.88}
        >
          <Text style={styles.bigBtnText}>Notas</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.bigBtn, docenteGradient]}
          onPress={onDocente}
          activeOpacity={0.88}
        >
          <Text style={styles.bigBtnText}>Docente</Text>
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
