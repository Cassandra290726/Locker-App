"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet as RNStyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native-web";

import { fetchHorarioDocenteAlumno } from "@/lib/alumnoDocentesClient";
import {
  COLUMNAS_DIA,
  FRANJAS_DOCENTE,
  claseSolapaFranja,
  type DocenteClaseGuardada,
  type DiaCalendarioKey,
} from "@/lib/horarioShared";

type Props = {
  docenteEmail: string;
  onBack: () => void;
};

export default function AlumnoDocenteHorarioScreenRN({
  docenteEmail,
  onBack,
}: Props) {
  const [clases, setClases] = useState<DocenteClaseGuardada[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selected, setSelected] = useState<DocenteClaseGuardada | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    const data = await fetchHorarioDocenteAlumno(docenteEmail);
    setClases(data?.clases ?? []);
    setLoading(false);
  }, [docenteEmail]);

  useEffect(() => {
    void reload();
  }, [reload]);

  function clasesEnCelda(
    dia: DiaCalendarioKey,
    franja: (typeof FRANJAS_DOCENTE)[number],
  ) {
    return clases.filter(
      (c) =>
        c.dia === dia && claseSolapaFranja(c.horaInicio, c.horaFinal, franja),
    );
  }

  function openClase(c: DocenteClaseGuardada) {
    setSelected(c);
    setSheetOpen(true);
  }

  return (
    <View style={styles.root}>
      <View style={styles.topRow}>
        <TouchableOpacity onPress={onBack} style={styles.backWrap} activeOpacity={0.7}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Horario del Docente</Text>
        <Image
          accessibilityLabel="Logo Locker"
          alt="Logo Locker"
          source={{ uri: "/logo.png" }}
          style={styles.logoRight}
          resizeMode="contain"
        />
      </View>

      <ScrollView style={styles.gridScroll} showsVerticalScrollIndicator={false}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.table}>
            <View style={[styles.row, styles.headerRow]}>
              <View style={[styles.cornerCell, styles.cellBorder]} />
              {COLUMNAS_DIA.map((d) => (
                <View key={d.key} style={[styles.dayHead, styles.cellBorder]}>
                  <Text style={styles.dayHeadText}>{d.key}</Text>
                </View>
              ))}
            </View>
            {loading ? (
              <Text style={styles.loading}>Cargando horario…</Text>
            ) : (
              FRANJAS_DOCENTE.map((franja, fi) => (
                <View key={fi} style={styles.row}>
                  <View style={[styles.timeCell, styles.cellBorder]}>
                    <Text style={styles.timeText}>{franja.label}</Text>
                  </View>
                  {COLUMNAS_DIA.map((col) => {
                    const lista = clasesEnCelda(col.key, franja);
                    return (
                      <View
                        key={col.key}
                        style={[styles.slotCell, styles.cellBorder]}
                      >
                        <View style={styles.slotInner}>
                          {lista.length > 0
                            ? lista.map((c) => (
                                <TouchableOpacity
                                  key={`${c.id}-${col.key}-${fi}`}
                                  style={styles.chip}
                                  onPress={() => openClase(c)}
                                  activeOpacity={0.75}
                                >
                                  <Text style={styles.chipMat}>{c.materia}</Text>
                                  <Text style={styles.chipSal}>{c.salon}</Text>
                                </TouchableOpacity>
                              ))
                            : (
                              <Text style={styles.slotEmpty}> </Text>
                            )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </ScrollView>

      {sheetOpen && selected ? (
        <View style={styles.sheetOverlay}>
          <TouchableOpacity
            style={styles.sheetBackdrop}
            onPress={() => setSheetOpen(false)}
            activeOpacity={1}
          />
          <View style={styles.sheet}>
            <TouchableOpacity
              style={styles.sheetHandle}
              onPress={() => setSheetOpen(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.sheetArrow}>▼</Text>
            </TouchableOpacity>
            <Text style={styles.sheetTitle}>Detalles de la clase</Text>
            <View style={styles.sheetBody}>
              <Text style={styles.detailLine}>
                <Text style={styles.detailLabel}>Materia: </Text>
                {selected.materia}
              </Text>
              <Text style={styles.detailLine}>
                <Text style={styles.detailLabel}>Hora inicio: </Text>
                {selected.horaInicio}
              </Text>
              <Text style={styles.detailLine}>
                <Text style={styles.detailLabel}>Hora fin: </Text>
                {selected.horaFinal}
              </Text>
              <Text style={styles.detailLine}>
                <Text style={styles.detailLabel}>Grupo / Salón: </Text>
                {selected.salon}
              </Text>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = RNStyleSheet.create({
  root: {
    width: "100%",
    minHeight: "100vh",
    backgroundColor: "#FFFBDB",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 6,
  },
  backWrap: { paddingVertical: 8, paddingHorizontal: 4, width: 44 },
  backArrow: { fontSize: 28, color: "#806b63", fontWeight: "600" },
  screenTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "800",
    color: "#806b63",
    textAlign: "center",
  },
  logoRight: { width: 64, height: 64 },
  gridScroll: { flex: 1 },
  table: { minWidth: 640, paddingBottom: 120 },
  row: { flexDirection: "row", alignItems: "stretch" },
  headerRow: { backgroundColor: "#DDD6FE" },
  cornerCell: { width: 78, minHeight: 36, backgroundColor: "#DDD6FE" },
  dayHead: {
    flex: 1,
    minWidth: 72,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 8,
    backgroundColor: "#DDD6FE",
  },
  dayHeadText: { fontWeight: "800", fontSize: 14, color: "#1c1917" },
  timeCell: {
    width: 78,
    paddingVertical: 6,
    paddingHorizontal: 4,
    justifyContent: "center",
    backgroundColor: "#EDE9FE",
  },
  timeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#292524",
    textAlign: "center",
    lineHeight: 13,
  },
  slotCell: {
    flex: 1,
    minWidth: 72,
    minHeight: 56,
    backgroundColor: "#DDD6FE",
  },
  slotInner: { flex: 1, padding: 4, gap: 4 },
  slotEmpty: { fontSize: 1, opacity: 0 },
  chip: {
    borderRadius: 6,
    padding: 4,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  chipMat: { fontSize: 11, fontWeight: "700", color: "#1c1917" },
  chipSal: { fontSize: 10, color: "#44403c" },
  cellBorder: { borderWidth: 1, borderColor: "#1c1917" },
  loading: { padding: 24, textAlign: "center", color: "#57534e" },
  sheetOverlay: {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    justifyContent: "flex-end",
    zIndex: 100,
  },
  sheetBackdrop: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  sheet: {
    backgroundColor: "#B6F0FF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 8,
    minHeight: 200,
    maxWidth: 480,
    alignSelf: "center",
    width: "100%",
  },
  sheetHandle: {
    alignItems: "center",
    paddingVertical: 8,
  },
  sheetArrow: { fontSize: 18, color: "#1c1917", fontWeight: "700" },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1c1917",
    textAlign: "center",
    marginBottom: 16,
  },
  sheetBody: { gap: 12 },
  detailLine: { fontSize: 16, color: "#292524" },
  detailLabel: { fontWeight: "800" },
});
