"use client";

import { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet as RNStyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native-web";

import {
  actualizarTareaAlumno,
  crearTareaAlumno,
  eliminarTareaAlumno,
  fetchTareaAlumno,
} from "@/lib/alumnoTareasClient";
import type { DocenteClaseGuardada } from "@/lib/horarioShared";
import { GRADIENTS } from "@/lib/lockerTheme";
import type { AlumnoTareaPendiente } from "@/lib/tareasShared";

export type AlumnoTareaClaseCtx = {
  clase: DocenteClaseGuardada;
  tareaId: string | null;
  entregaHoraInicio: string;
  entregaHoraFinal: string;
};

type Props = {
  ctx: AlumnoTareaClaseCtx;
  onCancel: () => void;
};

type ScreenMode = "loading" | "form" | "saved";

export default function AlumnoTareaClaseScreenRN({ ctx, onCancel }: Props) {
  const { clase, tareaId, entregaHoraInicio, entregaHoraFinal } = ctx;

  const [mode, setMode] = useState<ScreenMode>(tareaId ? "loading" : "form");
  const [tarea, setTarea] = useState<AlumnoTareaPendiente | null>(null);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [errNombre, setErrNombre] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!tareaId) return;
    let cancelled = false;
    void (async () => {
      const found = await fetchTareaAlumno(tareaId);
      if (cancelled) return;
      if (!found) {
        if (typeof window !== "undefined") {
          window.alert("No se encontró la tarea.");
        }
        onCancel();
        return;
      }
      setTarea(found);
      setNombre(found.nombre);
      setDescripcion(found.descripcion);
      setMode("saved");
    })();
    return () => {
      cancelled = true;
    };
  }, [tareaId, onCancel]);

  async function guardar() {
    const n = nombre.trim();
    if (!n) {
      setErrNombre("Indica el nombre de la tarea.");
      return;
    }
    setErrNombre(undefined);
    setSaving(true);

    const result = tarea
      ? await actualizarTareaAlumno(tarea.id, {
          nombre: n,
          descripcion: descripcion.trim(),
        })
      : await crearTareaAlumno({
          claseId: clase.id,
          claseMateria: clase.materia,
          claseDia: clase.dia,
          claseHoraInicio: clase.horaInicio,
          claseHoraFinal: clase.horaFinal,
          claseSalon: clase.salon,
          nombre: n,
          descripcion: descripcion.trim(),
          entregaHoraInicio,
          entregaHoraFinal,
        });

    setSaving(false);

    if (!result.ok || !result.tarea) {
      if (typeof window !== "undefined") {
        window.alert(
          result.error === "SAVE_FAILED" || !result.error
            ? "No se pudo guardar. Intenta de nuevo."
            : result.error,
        );
      }
      return;
    }

    setTarea(result.tarea);
    setNombre(result.tarea.nombre);
    setDescripcion(result.tarea.descripcion);
    setMode("saved");
  }

  function confirmarBorrar() {
    if (!tarea) return;
    const ok =
      typeof window !== "undefined"
        ? window.confirm(`¿Borrar la tarea «${tarea.nombre}»?`)
        : false;
    if (!ok) return;
    void (async () => {
      setSaving(true);
      const res = await eliminarTareaAlumno(tarea.id);
      setSaving(false);
      if (!res.ok) {
        if (typeof window !== "undefined") {
          window.alert("No se pudo borrar la tarea.");
        }
        return;
      }
      onCancel();
    })();
  }

  const entregaLabel = `${entregaHoraInicio} – ${entregaHoraFinal}`;

  if (mode === "loading") {
    return (
      <View style={styles.root}>
        <Header onBack={onCancel} title="Tarea pendiente" />
        <Text style={styles.loadingText}>Cargando tarea…</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Header
        onBack={onCancel}
        title={mode === "saved" ? "Tarea guardada" : "Nueva tarea"}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.claseCard}>
          <Text style={styles.claseCardTitle}>Clase</Text>
          <Text style={styles.claseLine}>
            <Text style={styles.claseLabel}>Materia: </Text>
            {clase.materia}
          </Text>
          <Text style={styles.claseLine}>
            <Text style={styles.claseLabel}>Inicio: </Text>
            {clase.horaInicio}
          </Text>
          <Text style={styles.claseLine}>
            <Text style={styles.claseLabel}>Fin: </Text>
            {clase.horaFinal}
          </Text>
          <Text style={styles.claseLine}>
            <Text style={styles.claseLabel}>Entrega: </Text>
            {entregaLabel}
          </Text>
        </View>

        {mode === "saved" && tarea ? (
          <View style={styles.form}>
            <FieldLabel label="Nombre de la tarea" />
            <Text style={styles.readonlyValue}>{tarea.nombre}</Text>
            <FieldLabel label="Descripción" />
            <Text style={styles.readonlyDesc}>
              {tarea.descripcion || "Sin descripción"}
            </Text>
          </View>
        ) : (
          <View style={styles.form}>
            <FieldLabel label="Nombre de la tarea" />
            <TextInput
              value={nombre}
              onChangeText={(t: string) => {
                setNombre(t);
                setErrNombre(undefined);
              }}
              placeholder="Ej. Ensayo, ejercicios del libro…"
              placeholderTextColor="#78716c"
              style={[styles.input, errNombre && styles.inputErr]}
            />
            {errNombre ? <Hint text={errNombre} /> : null}

            <FieldLabel label="Descripción" />
            <TextInput
              value={descripcion}
              onChangeText={setDescripcion}
              placeholder="Detalles de la tarea (opcional)"
              placeholderTextColor="#78716c"
              multiline
              numberOfLines={4}
              style={[styles.input, styles.inputMultiline]}
            />
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {mode === "saved" ? (
          <>
            <TouchableOpacity
              style={styles.btnEditar}
              onPress={() => setMode("form")}
              disabled={saving}
              activeOpacity={0.85}
            >
              <Text style={styles.footerBtnText}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btnBorrar}
              onPress={confirmarBorrar}
              disabled={saving}
              activeOpacity={0.85}
            >
              <Text style={styles.footerBtnText}>
                {saving ? "…" : "Borrar"}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={styles.btnCancelar}
              onPress={onCancel}
              disabled={saving}
              activeOpacity={0.85}
            >
              <Text style={styles.footerBtnText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnGuardar, saving && styles.btnDisabled]}
              onPress={() => void guardar()}
              disabled={saving}
              activeOpacity={0.85}
            >
              <Text style={styles.footerBtnText}>
                {saving ? "…" : "Guardar"}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

function Header({
  onBack,
  title,
}: {
  onBack: () => void;
  title: string;
}) {
  return (
    <View style={styles.topRow}>
      <TouchableOpacity
        style={styles.backWrap}
        onPress={onBack}
        accessibilityLabel="Volver al horario"
        activeOpacity={0.7}
      >
        <Text style={styles.backArrow}>←</Text>
      </TouchableOpacity>
      <Text style={styles.screenTitle}>{title}</Text>
      <Image
        accessibilityLabel="Logo Locker"
        alt="Logo Locker"
        source={{ uri: "/logo.png" }}
        style={styles.logoRight}
        resizeMode="contain"
      />
    </View>
  );
}

function FieldLabel({ label }: { label: string }) {
  return <Text style={styles.fieldLabel}>{label}</Text>;
}

function Hint({ text }: { text: string }) {
  return <Text style={styles.fieldHint}>{text}</Text>;
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
    marginBottom: 16,
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
  loadingText: {
    textAlign: "center",
    color: "#57534e",
    fontSize: 16,
    marginTop: 48,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingBottom: 24,
    maxWidth: 440,
    alignSelf: "center",
    width: "100%",
  },
  claseCard: {
    backgroundColor: "#B6F0FF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    gap: 8,
  },
  claseCardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1c1917",
    marginBottom: 4,
  },
  claseLine: { fontSize: 15, color: "#292524" },
  claseLabel: { fontWeight: "800" },
  form: { gap: 10 },
  fieldLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#292524",
  },
  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e7e5e4",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1c1917",
    outlineStyle: "none",
  },
  inputMultiline: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  inputErr: {
    borderColor: "#FE7F96",
    borderWidth: 2,
  },
  fieldHint: {
    fontSize: 13,
    color: "#b91c1c",
    marginTop: -6,
  },
  readonlyValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1c1917",
    marginBottom: 8,
  },
  readonlyDesc: {
    fontSize: 15,
    color: "#44403c",
    lineHeight: 22,
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
    maxWidth: 440,
    alignSelf: "center",
    width: "100%",
  },
  btnCancelar: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#FE7F96",
    backgroundImage: GRADIENTS.pinkCancel,
  },
  btnGuardar: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#C8A8EB",
    backgroundImage: GRADIENTS.purpleSave,
  },
  btnEditar: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#CFFFB5",
    backgroundImage: GRADIENTS.greenEdit,
  },
  btnBorrar: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#FE7F96",
    backgroundImage: GRADIENTS.pinkCancel,
  },
  btnDisabled: { opacity: 0.55 },
  footerBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1c1917",
  },
});
