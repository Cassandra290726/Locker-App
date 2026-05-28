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

import {
  eliminarClaseDocente,
  fetchClasesDocente,
} from "@/lib/horarioClient";
import {
  COLUMNAS_DIA_HORARIO,
  FRANJAS_DOCENTE,
  claseSolapaFranja,
  type DocenteClaseGuardada,
  type DiaCalendarioKey,
} from "@/lib/horarioShared";

type GridMode = "idle" | "delete";

type Props = {
  onBack: () => void;
  onAgregarClase: () => void;
  onEditClase: (id: string) => void;
};

export default function DocenteHorarioGridScreenRN({
  onBack,
  onAgregarClase,
  onEditClase,
}: Props) {
  const [clases, setClases] = useState<DocenteClaseGuardada[]>([]);
  const [mode, setMode] = useState<GridMode>("idle");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const list = await fetchClasesDocente();
    setClases(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => void reload(), 0);
    return () => window.clearTimeout(id);
  }, [reload]);

  function clasesEnCelda(
    dia: DiaCalendarioKey,
    franja: (typeof FRANJAS_DOCENTE)[number],
  ): DocenteClaseGuardada[] {
    return clases.filter(
      (c) =>
        c.dia === dia && claseSolapaFranja(c.horaInicio, c.horaFinal, franja),
    );
  }

  function tapClase(c: DocenteClaseGuardada) {
    if (mode === "idle") {
      setSelectedId((prev) => (prev === c.id ? null : c.id));
      return;
    }
    if (mode === "delete") {
      const ok =
        typeof window !== "undefined"
          ? window.confirm(`¿Eliminar solo esta clase: «${c.materia}»?`)
          : false;
      if (!ok) return;
      void (async () => {
        const res = await eliminarClaseDocente(c.id);
        if (res.ok) {
          setSelectedId((cur) => (cur === c.id ? null : cur));
          await reload();
        }
      })();
    }
  }

  function onPencil() {
    if (!selectedId) {
      if (typeof window !== "undefined") {
        window.alert(
          "Selecciona una clase tocando su cuadro en el horario y luego usa el lápiz para editarla.",
        );
      }
      return;
    }
    setMode("idle");
    onEditClase(selectedId);
  }

  function setModeWithClear(next: GridMode) {
    setMode(next);
    if (next === "delete") setSelectedId(null);
  }

  function bannerText(): string | null {
    if (mode === "delete")
      return "Toca el cuadro de la clase que quieres eliminar (solo esa entrada).";
    if (selectedId) return "Clase seleccionada. Toca el lápiz para editarla.";
    return null;
  }

  const banner = bannerText();

  return (
    <View style={styles.root}>
      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.backWrap}
          onPress={onBack}
          accessibilityLabel="Volver"
          activeOpacity={0.7}
        >
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

      {banner ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{banner}</Text>
        </View>
      ) : null}

      <ScrollView style={styles.gridScroll} showsVerticalScrollIndicator={false}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.table}>
            <View style={[styles.row, styles.headerRow]}>
              <View style={[styles.cornerCell, styles.cellBorder]} />
              {COLUMNAS_DIA_HORARIO.map((d) => (
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
                  {COLUMNAS_DIA_HORARIO.map((col) => {
                    const lista = clasesEnCelda(col.key, franja);
                    const interactive = mode === "delete" || mode === "idle";
                    const celda =
                      lista.length > 0 ? (
                        lista.map((c) => {
                          const selected = selectedId === c.id;
                          const chipInner = (
                            <>
                              <Text style={styles.chipMat}>{c.materia}</Text>
                              <Text style={styles.chipSal}>{c.salon}</Text>
                              <Text style={styles.chipHor}>
                                {c.horaInicio} – {c.horaFinal}
                              </Text>
                            </>
                          );
                          const chipStyle = [
                            styles.chip,
                            selected && styles.chipSelected,
                          ];
                          return interactive ? (
                            <TouchableOpacity
                              key={`${c.id}-${col.key}-${fi}`}
                              style={chipStyle}
                              activeOpacity={0.75}
                              onPress={() => tapClase(c)}
                            >
                              {chipInner}
                            </TouchableOpacity>
                          ) : (
                            <View key={`${c.id}-${col.key}-${fi}`} style={chipStyle}>
                              {chipInner}
                            </View>
                          );
                        })
                      ) : (
                        <Text style={styles.slotEmpty}> </Text>
                      );
                    return (
                      <View
                        key={col.key}
                        style={[styles.slotCell, styles.cellBorder]}
                      >
                        <View style={styles.slotInner}>{celda}</View>
                      </View>
                    );
                  })}
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </ScrollView>

      <View style={styles.footerBtns}>
        <TouchableOpacity
          style={[styles.footerBtn, styles.btnAgregar]}
          onPress={() => {
            setModeWithClear("idle");
            onAgregarClase();
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.footerBtnText}>Agregar clase</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.footerBtn,
            styles.btnEliminar,
            mode === "delete" && styles.btnEliminarOn,
          ]}
          onPress={() =>
            setModeWithClear(mode === "delete" ? "idle" : "delete")
          }
          activeOpacity={0.85}
        >
          <Text
            style={[
              styles.footerBtnTextEliminar,
              mode === "delete" && styles.footerBtnTextEliminarOn,
            ]}
          >
            Eliminar clase
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.footerBtnIcon,
  selectedId && mode === "idle" && styles.btnEditReady,
          ]}
          onPress={onPencil}
          accessibilityLabel="Editar clase seleccionada"
          activeOpacity={0.85}
        >
          <Text style={styles.iconPencil}>✏️</Text>
        </TouchableOpacity>
      </View>
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
  backWrap: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    width: 44,
  },
  backArrow: {
    fontSize: 28,
    color: "#806b63",
    fontWeight: "600",
  },
  screenTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "800",
    color: "#806b63",
    textAlign: "center",
  },
  logoRight: {
    width: 64,
    height: 64,
  },
  banner: {
    backgroundColor: "#fef3c7",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#fcd34d",
  },
  bannerText: {
    fontSize: 13,
    color: "#92400e",
    textAlign: "center",
    fontWeight: "600",
  },
  gridScroll: {
    flex: 1,
  },
  table: {
    minWidth: 640,
    paddingBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  headerRow: {
    backgroundColor: "#DDD6FE",
  },
  cornerCell: {
    width: 78,
    minHeight: 36,
    backgroundColor: "#DDD6FE",
  },
  dayHead: {
    flex: 1,
    minWidth: 72,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 8,
    backgroundColor: "#DDD6FE",
  },
  dayHeadText: {
    fontWeight: "800",
    fontSize: 14,
    color: "#1c1917",
  },
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
  slotInner: {
    flex: 1,
    padding: 4,
    justifyContent: "flex-start",
    gap: 4,
  },
  slotEmpty: {
    fontSize: 1,
    opacity: 0,
  },
  chip: {
    marginBottom: 2,
    gap: 2,
    borderRadius: 6,
    padding: 4,
    borderWidth: 2,
    borderColor: "transparent",
  },
  chipSelected: {
    borderColor: "#2563eb",
    backgroundColor: "rgba(37, 99, 235, 0.08)",
  },
  chipMat: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1c1917",
  },
  chipSal: {
    fontSize: 10,
    color: "#44403c",
  },
  chipHor: {
    fontSize: 9,
    color: "#57534e",
  },
  cellBorder: {
    borderWidth: 1,
    borderColor: "#1c1917",
  },
  loading: {
    padding: 24,
    textAlign: "center",
    color: "#57534e",
  },
  footerBtns: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e7e5e4",
  },
  footerBtn: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    minWidth: 120,
    alignItems: "center",
  },
  footerBtnIcon: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#78716c",
    backgroundColor: "#fafaf9",
  },
  btnAgregar: {
    backgroundColor: "#CEFFB4",
  },
  btnEliminar: {
    borderWidth: 2,
    borderColor: "#FF7F96",
    backgroundColor: "#ffffff",
  },
  btnEliminarOn: {
    backgroundColor: "#FFE4E9",
  },
  footerBtnText: {
    fontWeight: "700",
    fontSize: 14,
    color: "#1c1917",
  },
  footerBtnTextEliminar: {
    fontWeight: "700",
    fontSize: 14,
    color: "#b91c1c",
  },
  footerBtnTextEliminarOn: {
    color: "#991b1b",
  },
  btnEditReady: {
    borderColor: "#2563eb",
    backgroundColor: "#e0ecff",
  },
  iconPencil: {
    fontSize: 20,
  },
});
