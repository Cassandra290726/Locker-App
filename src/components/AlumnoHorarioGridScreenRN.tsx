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
  actualizarClaseAlumno,
  eliminarClaseAlumno,
  fetchClasesAlumno,
  registrarClaseAlumno,
} from "@/lib/alumnoHorarioClient";
import { fetchTareasAlumno } from "@/lib/alumnoTareasClient";
import {
  COLUMNAS_DIA_HORARIO,
  FRANJAS_DOCENTE,
  claseSolapaFranja,
  parseHoraAMinutos,
  type DocenteClaseGuardada,
  type DiaCalendarioKey,
  type FranjaHoraria,
} from "@/lib/horarioShared";
import { GRADIENTS } from "@/lib/lockerTheme";
import type { AlumnoTareaPendiente } from "@/lib/tareasShared";

type GridMode = "idle" | "delete";

export type AlumnoHorarioClaseSlotCtx = {
  clase: DocenteClaseGuardada;
  entregaHoraInicio: string;
  entregaHoraFinal: string;
};

type Props = {
  onBack: () => void;
  onAgregarClase: () => void;
  onEditClase: (id: string) => void;
  onAgregarTarea: (ctx: AlumnoHorarioClaseSlotCtx) => void;
  onVerTarea: (ctx: AlumnoHorarioClaseSlotCtx & { tareaId: string }) => void;
};

export default function AlumnoHorarioGridScreenRN({
  onBack,
  onAgregarClase,
  onEditClase,
  onAgregarTarea,
  onVerTarea,
}: Props) {
  const [clases, setClases] = useState<DocenteClaseGuardada[]>([]);
  const [mode, setMode] = useState<GridMode>("idle");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetClase, setSheetClase] = useState<DocenteClaseGuardada | null>(null);
  const [sheetFranja, setSheetFranja] = useState<FranjaHoraria | null>(null);
  const [tareasClase, setTareasClase] = useState<AlumnoTareaPendiente[]>([]);
  const [tareasLoading, setTareasLoading] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    const list = await fetchClasesAlumno();
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

  async function openClaseSheet(
    c: DocenteClaseGuardada,
    franja: (typeof FRANJAS_DOCENTE)[number],
  ) {
    setSelectedId(c.id);
    setSheetClase(c);
    setSheetFranja(franja);
    setSheetOpen(true);
    setTareasLoading(true);
    const list = await fetchTareasAlumno(c.id);
    setTareasClase(list);
    setTareasLoading(false);
  }

  function slotCtx(): AlumnoHorarioClaseSlotCtx | null {
    if (!sheetClase) return null;
    return {
      clase: sheetClase,
      entregaHoraInicio: sheetFranja?.horaInicio ?? sheetClase.horaInicio,
      entregaHoraFinal: sheetFranja?.horaFinal ?? sheetClase.horaFinal,
    };
  }

  function tapClase(c: DocenteClaseGuardada, franja?: (typeof FRANJAS_DOCENTE)[number]) {
    if (mode === "idle" && franja) {
      void openClaseSheet(c, franja);
      return;
    }
    if (mode === "delete" && franja) {
      const ok =
        typeof window !== "undefined"
          ? window.confirm(`¿Eliminar solo esta hora (${franja.horaInicio} - ${franja.horaFinal}) de la clase: «${c.materia}»?`)
          : false;
      if (!ok) return;
      void (async () => {
        const c0 = parseHoraAMinutos(c.horaInicio)!;
        const c1 = parseHoraAMinutos(c.horaFinal)!;
        const f0 = parseHoraAMinutos(franja.horaInicio)!;
        const f1 = parseHoraAMinutos(franja.horaFinal)!;

        // Tolerancia si el usuario puso un horario que no cuadra exacto pero solapa:
        // Consideramos que borra el extremo si es el primer o último bloque que toca.
        if (c0 >= f0 && c1 <= f1) {
          // La clase cabe entera en la franja, o es exacta
          await eliminarClaseAlumno(c.id);
        } else if (c0 >= f0 && c0 < f1) {
          // Toca el inicio
          await actualizarClaseAlumno(c.id, { ...c, horaInicio: franja.horaFinal });
        } else if (c1 > f0 && c1 <= f1) {
          // Toca el final
          await actualizarClaseAlumno(c.id, { ...c, horaFinal: franja.horaInicio });
        } else {
          // Está en el medio, partimos en dos
          await actualizarClaseAlumno(c.id, { ...c, horaFinal: franja.horaInicio });
          await registrarClaseAlumno({
            materia: c.materia,
            dia: c.dia,
            horaInicio: franja.horaFinal,
            horaFinal: c.horaFinal,
            salon: c.salon,
          });
        }

        setSelectedId((cur) => (cur === c.id ? null : cur));
        await reload();
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
    if (selectedId) return "Clase seleccionada. Toca el lápiz para editarla o toca otra celda para ver tareas.";
    return "Toca una clase en el horario para ver detalles y agregar tareas pendientes.";
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
        <Text style={styles.screenTitle}>Horario</Text>
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
                              onPress={() => tapClase(c, franja)}
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

      {sheetOpen && sheetClase ? (
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
                <Text style={styles.detailLabel}>Nombre: </Text>
                {sheetClase.materia}
              </Text>
              <Text style={styles.detailLine}>
                <Text style={styles.detailLabel}>Hora inicio: </Text>
                {sheetClase.horaInicio}
              </Text>
              <Text style={styles.detailLine}>
                <Text style={styles.detailLabel}>Hora fin: </Text>
                {sheetClase.horaFinal}
              </Text>
              {sheetFranja ? (
                <Text style={styles.detailLine}>
                  <Text style={styles.detailLabel}>Franja: </Text>
                  {sheetFranja.label}
                </Text>
              ) : null}
            </View>

            {tareasLoading ? (
              <Text style={styles.tareasHint}>Cargando tareas…</Text>
            ) : tareasClase.length > 0 ? (
              <View style={styles.tareasList}>
                <Text style={styles.tareasListTitle}>Tareas pendientes</Text>
                {tareasClase.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={styles.tareaItem}
                    onPress={() => {
                      const ctx = slotCtx();
                      if (!ctx) return;
                      setSheetOpen(false);
                      onVerTarea({ ...ctx, tareaId: t.id });
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.tareaItemName}>{t.nombre}</Text>
                    <Text style={styles.tareaItemEntrega}>
                      Entrega: {t.entregaHoraInicio} – {t.entregaHoraFinal}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}

            <TouchableOpacity
              style={styles.btnAgregarTarea}
              onPress={() => {
                const ctx = slotCtx();
                if (!ctx) return;
                setSheetOpen(false);
                onAgregarTarea(ctx);
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.btnAgregarTareaText}>Agregar tarea pendiente</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

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
    paddingBottom: 120,
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
    backgroundImage: GRADIENTS.green,
  },
  btnEliminar: {
    backgroundColor: "#FE7F96",
    backgroundImage: GRADIENTS.pinkCancel,
  },
  btnEliminarOn: {
    borderWidth: 2,
    borderColor: "#1c1917",
  },
  footerBtnText: {
    fontWeight: "700",
    fontSize: 14,
    color: "#1c1917",
  },
  footerBtnTextEliminar: {
    fontWeight: "700",
    fontSize: 14,
    color: "#1c1917",
  },
  footerBtnTextEliminarOn: {
    color: "#1c1917",
  },
  btnEditReady: {
    borderColor: "#2563eb",
    backgroundColor: "#e0ecff",
  },
  iconPencil: {
    fontSize: 20,
  },
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
    paddingBottom: 28,
    paddingTop: 8,
    maxWidth: 480,
    alignSelf: "center",
    width: "100%",
    maxHeight: "70vh",
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
    marginBottom: 12,
  },
  sheetBody: { gap: 10, marginBottom: 16 },
  detailLine: { fontSize: 16, color: "#292524" },
  detailLabel: { fontWeight: "800" },
  tareasHint: {
    fontSize: 14,
    color: "#44403c",
    textAlign: "center",
    marginBottom: 12,
  },
  tareasList: {
    gap: 8,
    marginBottom: 16,
    maxHeight: 160,
  },
  tareasListTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1c1917",
    marginBottom: 4,
  },
  tareaItem: {
    backgroundColor: "rgba(255,255,255,0.55)",
    borderRadius: 10,
    padding: 10,
  },
  tareaItemName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1c1917",
  },
  tareaItemEntrega: {
    fontSize: 12,
    color: "#44403c",
    marginTop: 4,
  },
  btnAgregarTarea: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#CEFFB4",
    backgroundImage: GRADIENTS.green,
  },
  btnAgregarTareaText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1c1917",
  },
});
