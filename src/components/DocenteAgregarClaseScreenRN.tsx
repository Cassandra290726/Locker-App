"use client";

import { useEffect, useState } from "react";
import {
  StyleSheet as RNStyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native-web";

import DocenteFlowLayout from "@/components/DocenteFlowLayout";
import {
  actualizarClaseDocente,
  fetchClasesDocente,
  registrarClaseDocente,
} from "@/lib/horarioClient";
import {
  COLUMNAS_DIA,
  hayErroresClase,
  normalizarDiaEntrada,
  validarFormularioClase,
  type ErroresClaseCampos,
} from "@/lib/horarioShared";

type Props = {
  editingId: string | null;
  onCancel: () => void;
  onSaved: () => void;
};

export default function DocenteAgregarClaseScreenRN({
  editingId,
  onCancel,
  onSaved,
}: Props) {
  const [materia, setMateria] = useState("");
  const [diaRaw, setDiaRaw] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFinal, setHoraFinal] = useState("");
  const [salon, setSalon] = useState("");
  const [errs, setErrs] = useState<ErroresClaseCampos>({});
  const [loading, setLoading] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(Boolean(editingId));

  useEffect(() => {
    if (!editingId) return;
    let cancelled = false;
    void (async () => {
      const list = await fetchClasesDocente();
      const found = list.find((c) => c.id === editingId);
      if (cancelled || !found) {
        setLoadingEdit(false);
        return;
      }
      setMateria(found.materia);
      const dayCol = COLUMNAS_DIA.find((d) => d.key === found.dia);
      setDiaRaw(dayCol?.nombre ?? found.dia);
      setHoraInicio(found.horaInicio);
      setHoraFinal(found.horaFinal);
      setSalon(found.salon);
      setLoadingEdit(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [editingId]);

  function touchField() {
    setErrs({});
  }

  async function guardar() {
    const next = validarFormularioClase({
      materia,
      diaRaw,
      horaInicio,
      horaFinal,
      salon,
    });
    setErrs(next);
    if (hayErroresClase(next)) return;

    const dia = normalizarDiaEntrada(diaRaw);
    if (!dia) return;

    setLoading(true);
    const payload = {
      materia: materia.trim(),
      dia,
      horaInicio: horaInicio.trim(),
      horaFinal: horaFinal.trim(),
      salon: salon.trim(),
    };

    const result = editingId
      ? await actualizarClaseDocente(editingId, payload)
      : await registrarClaseDocente(payload);

    setLoading(false);

    if (!result.ok) {
      const msg =
        result.error === "SAVE_FAILED" || !result.error
          ? "No se pudo guardar. Intenta de nuevo."
          : result.error;
      setErrs(erroresDesdeServidor(msg));
      return;
    }

    onSaved();
  }

  if (loadingEdit) {
    return (
      <DocenteFlowLayout onBack={onCancel}>
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>Cargando…</Text>
        </View>
      </DocenteFlowLayout>
    );
  }

  return (
    <DocenteFlowLayout onBack={onCancel}>
      <View style={styles.form}>
        <FieldLabel label="Materia" />
        <TextInput
          value={materia}
          onChangeText={(t: string) => {
            setMateria(t);
            touchField();
          }}
          placeholder="Ej. Matemáticas"
          placeholderTextColor="#78716c"
          style={[styles.input, errs.materia && styles.inputErr]}
        />
        {errs.materia ? <Hint text={errs.materia} /> : null}

        <FieldLabel label="Día" />
        <TextInput
          value={diaRaw}
          onChangeText={(t: string) => {
            setDiaRaw(t);
            touchField();
          }}
          placeholder="Ej. Lunes, Mi, Viernes"
          placeholderTextColor="#78716c"
          style={[styles.input, errs.dia && styles.inputErr]}
        />
        {errs.dia ? <Hint text={errs.dia} /> : null}

        <FieldLabel label="Hora inicio" />
        <TextInput
          value={horaInicio}
          onChangeText={(t: string) => {
            setHoraInicio(t);
            touchField();
          }}
          placeholder="Ej. 13:30"
          placeholderTextColor="#78716c"
          style={[styles.input, errs.horaInicio && styles.inputErr]}
        />
        {errs.horaInicio ? <Hint text={errs.horaInicio} /> : null}

        <FieldLabel label="Hora final" />
        <TextInput
          value={horaFinal}
          onChangeText={(t: string) => {
            setHoraFinal(t);
            touchField();
          }}
          placeholder="Ej. 14:20"
          placeholderTextColor="#78716c"
          style={[styles.input, errs.horaFinal && styles.inputErr]}
        />
        {errs.horaFinal ? <Hint text={errs.horaFinal} /> : null}

        <FieldLabel label="Salón" />
        <Text style={styles.salonExpl}>
          Indica número de salón y edificio (cuando aplique).
        </Text>
        <TextInput
          value={salon}
          onChangeText={(t: string) => {
            setSalon(t);
            touchField();
          }}
          placeholder="Ej. A-302, Edificio norte"
          placeholderTextColor="#78716c"
          style={[styles.input, errs.salon && styles.inputErr]}
        />
        {errs.salon ? <Hint text={errs.salon} /> : null}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.75}>
          <Text style={styles.cancelText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveBtn, loading && styles.disabled]}
          onPress={() => void guardar()}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={styles.saveText}>{loading ? "…" : "Registrar"}</Text>
        </TouchableOpacity>
      </View>
    </DocenteFlowLayout>
  );
}

function erroresDesdeServidor(msg: string): ErroresClaseCampos {
  const m = msg.toLowerCase();
  if (m.includes("materia")) return { materia: msg };
  if (m.includes("día") || m.includes("dia")) return { dia: msg };
  if (m.includes("inicio")) return { horaInicio: msg };
  if (m.includes("final")) return { horaFinal: msg };
  if (m.includes("salón") || m.includes("salon")) return { salon: msg };
  return { materia: msg };
}

function FieldLabel({ label }: { label: string }) {
  return <Text style={styles.fieldLabel}>{label}</Text>;
}

function Hint({ text }: { text: string }) {
  return <Text style={styles.fieldHint}>{text}</Text>;
}

const styles = RNStyleSheet.create({
  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 48,
  },
  loadingText: {
    fontSize: 16,
    color: "#57534e",
  },
  form: {
    flex: 1,
    gap: 10,
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
    paddingBottom: 24,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#292524",
    marginBottom: -4,
  },
  salonExpl: {
    fontSize: 13,
    color: "#57534e",
    marginTop: -6,
    marginBottom: -4,
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
  inputErr: {
    borderColor: "#FF7F96",
    borderWidth: 2,
  },
  fieldHint: {
    fontSize: 13,
    color: "#b91c1c",
    marginTop: -6,
    marginBottom: 4,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    paddingTop: 12,
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d6d3d1",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  cancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#44403c",
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#B6F0FF",
    alignItems: "center",
  },
  saveText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1c1917",
  },
  disabled: {
    opacity: 0.55,
  },
});
