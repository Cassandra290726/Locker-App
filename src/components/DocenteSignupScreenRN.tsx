"use client";

import { useMemo, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet as RNStyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native-web";

import PasswordFieldRN from "@/components/PasswordFieldRN";
import {
  LockerGradientButton,
  LockerIncompleteMsg,
  RoleBadge,
} from "@/components/locker/LockerUi";
import { FONT_ROUNDED, LOCKER } from "@/lib/lockerTheme";
import {
  fetchSession,
  getEmailInputError,
  getMatriculaInputError,
  getPasswordInputError,
  getPasswordMismatchError,
  MAX_DOCENTE_SCHOOLS,
  MAX_EMAIL_LENGTH,
  MAX_PASSWORD_LENGTH,
  normalizeEscuelaNombre,
  register,
  type SessionUser,
} from "@/lib/lockerAuth";

type SchoolBlock = {
  escuela: string;
  matricula: string;
};

type SchoolFieldErrors = { escuela?: string; matricula?: string };

type FieldErrorsState = {
  nombre?: string;
  correo?: string;
  contrasena?: string;
  contrasena2?: string;
  escuelas?: SchoolFieldErrors[];
};

function emptySchool(): SchoolBlock {
  return { escuela: "", matricula: "" };
}

function escuelaDuplicadoEnIndice(
  schools: SchoolBlock[],
  index: number,
): boolean {
  const s = schools[index];
  const e = normalizeEscuelaNombre(s.escuela);
  const m = s.matricula.trim();
  if (!e || !/^\d+$/.test(m)) return false;
  const key = `${e}|${m}`;
  for (let i = 0; i < index; i++) {
    const s2 = schools[i];
    const e2 = normalizeEscuelaNombre(s2.escuela);
    const m2 = s2.matricula.trim();
    if (!e2 || !/^\d+$/.test(m2)) continue;
    if (`${e2}|${m2}` === key) return true;
  }
  return false;
}

function rowCompleta(s: SchoolBlock): boolean {
  return Boolean(
    s.escuela.trim() &&
      s.matricula.trim() &&
      getMatriculaInputError(s.matricula) === null,
  );
}

type Props = {
  onBack: () => void;
  onRegistered: (user: SessionUser) => void;
};

export default function DocenteSignupScreenRN({
  onBack,
  onRegistered,
}: Props) {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [contrasena2, setContrasena2] = useState("");
  const [schools, setSchools] = useState<SchoolBlock[]>([emptySchool()]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrorsState>({});
  const [showIncomplete, setShowIncomplete] = useState(false);
  const [loading, setLoading] = useState(false);

  const tienenDuplicado = useMemo(
    () => schools.some((_, i) => escuelaDuplicadoEnIndice(schools, i)),
    [schools],
  );

  const todasFilasCompletas = schools.every(rowCompleta);

  const canAddSchool =
    schools.length < MAX_DOCENTE_SCHOOLS &&
    todasFilasCompletas &&
    !tienenDuplicado;

  const canSubmit =
    nombre.trim().length > 0 &&
    getEmailInputError(correo) === null &&
    getPasswordInputError(contrasena) === null &&
    getPasswordMismatchError(contrasena, contrasena2) === null &&
    todasFilasCompletas &&
    !tienenDuplicado;

  function clearTouches() {
    setFieldErrors({});
  }

  const updateSchool = (index: number, patch: Partial<SchoolBlock>) => {
    setSchools((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    );
    clearTouches();
  };

  function addSchool() {
    if (!canAddSchool) return;
    setSchools((prev) => [...prev, emptySchool()]);
    clearTouches();
  }

  function validate(nowTaken: boolean): FieldErrorsState {
    const out: FieldErrorsState = {};

    out.nombre = !nombre.trim() ? "Escribe tu nombre." : undefined;

    if (nowTaken) {
      out.correo = "Este correo ya está registrado.";
    } else {
      out.correo = getEmailInputError(correo) ?? undefined;
    }

    out.contrasena = getPasswordInputError(contrasena) ?? undefined;

    if (!out.contrasena) {
      out.contrasena2 =
        getPasswordMismatchError(contrasena, contrasena2) ?? undefined;
    } else if (contrasena2.trim().length === 0) {
      out.contrasena2 = "Confirma la contraseña.";
    } else if (contrasena !== contrasena2) {
      out.contrasena2 = "Las contraseñas no coinciden.";
    }

    const schoolErrList: SchoolFieldErrors[] = schools.map((sch, idx) => {
      const row: SchoolFieldErrors = {};

      if (!sch.escuela.trim()) {
        row.escuela = "Indica la escuela.";
      } else if (escuelaDuplicadoEnIndice(schools, idx)) {
        row.escuela = "Ya usaste esta escuela con esta matrícula.";
      }

      if (sch.escuela.trim()) {
        const matErr = getMatriculaInputError(sch.matricula);
        if (matErr) {
          row.matricula = matErr;
        }
      }

      return row;
    });

    if (
      schoolErrList.some((r) => Boolean(r.escuela) || Boolean(r.matricula))
    ) {
      out.escuelas = schoolErrList;
    }

    return stripEmpty(out);
  }

  function stripEmpty(e: FieldErrorsState): FieldErrorsState {
    const r: FieldErrorsState = {};
    if (e.nombre) r.nombre = e.nombre;
    if (e.correo) r.correo = e.correo;
    if (e.contrasena) r.contrasena = e.contrasena;
    if (e.contrasena2) r.contrasena2 = e.contrasena2;
    if (e.escuelas) r.escuelas = e.escuelas;
    return r;
  }

  function hasProblems(e: FieldErrorsState): boolean {
    if (e.nombre || e.correo || e.contrasena || e.contrasena2) return true;
    if (
      e.escuelas?.some((row) =>
        typeof row?.escuela === "string"
          ? true
          : typeof row?.matricula === "string"
            ? true
            : false,
      )
    ) {
      return true;
    }
    return false;
  }

  async function submit() {
    const v = validate(false);
    if (hasProblems(v) || !canSubmit) {
      setShowIncomplete(true);
      setFieldErrors(v);
      if (typeof window !== "undefined") {
        let errStr = "Corrige los siguientes errores:\n";
        if (v.nombre) errStr += "- " + v.nombre + "\n";
        if (v.correo) errStr += "- " + v.correo + "\n";
        if (v.contrasena) errStr += "- " + v.contrasena + "\n";
        if (v.contrasena2) errStr += "- " + v.contrasena2 + "\n";
        if (v.escuelas) errStr += "- Revisa las escuelas y matrículas\n";
        window.alert(errStr);
      }
      return;
    }
    setShowIncomplete(false);

    const n = nombre.trim();
    const e = correo.trim();
    const p = contrasena;
    const escuelas = schools.map((s) => ({
      escuela: s.escuela.trim(),
      matricula: s.matricula.trim(),
    }));

    setLoading(true);
    const result = await register(e, p, "docente", {
      docenteProfile: { nombre: n, escuelas },
    });
    setLoading(false);

    if (!result.ok) {
      setFieldErrors(validate(result.error === "EMAIL_TAKEN"));
      return;
    }

    const session = await fetchSession();
    if (session) {
      onRegistered(session);
    }
  }

  const nombreMsg = fieldErrors.nombre;
  const correoMsg = fieldErrors.correo;
  const contrasenaMsg = fieldErrors.contrasena;
  const contrasena2Msg = fieldErrors.contrasena2;

  function schoolErrRow(i: number): SchoolFieldErrors {
    return fieldErrors.escuelas?.[i] ?? {};
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerSide}
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityLabel="Volver"
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Registro</Text>
        <View style={styles.headerSideRight}>
          <Image
            accessibilityLabel="Logo Locker"
            alt="Logo Locker"
            source={{ uri: "/logo.png" }}
            style={styles.headerLogo}
            resizeMode="contain"
          />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <RoleBadge role="docente" />
        <View style={styles.spacer} />

        <TextInput
          value={nombre}
          onChangeText={(t: string) => {
            setNombre(t);
            clearTouches();
          }}
          placeholder="Tu nombre completo"
          placeholderTextColor="#78716c"
          style={[styles.input, nombreMsg && styles.inputError]}
        />
        {nombreMsg ? <Text style={styles.fieldHint}>{nombreMsg}</Text> : null}

        <TextInput
          value={correo}
          onChangeText={(t: string) => {
            setCorreo(t);
            clearTouches();
          }}
          placeholder="correo@ejemplo.com"
          placeholderTextColor="#78716c"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          maxLength={MAX_EMAIL_LENGTH}
          style={[styles.input, correoMsg && styles.inputError]}
        />
        {correoMsg ? (
          <Text style={styles.fieldHint}>{correoMsg}</Text>
        ) : null}
        <Text style={[styles.emailHint, correoMsg && styles.hintNearError]}>
          Usa el correo de trabajo o el asignado por tu institución.
        </Text>

        <PasswordFieldRN
          value={contrasena}
          onChangeText={(t: string) => {
            setContrasena(t.slice(0, MAX_PASSWORD_LENGTH));
            clearTouches();
          }}
          placeholder="Mínimo 8 caracteres"
          hasError={Boolean(contrasenaMsg)}
          maxLength={MAX_PASSWORD_LENGTH}
        />
        {contrasenaMsg ? (
          <Text style={styles.fieldHint}>{contrasenaMsg}</Text>
        ) : null}

        <PasswordFieldRN
          value={contrasena2}
          onChangeText={(t: string) => {
            setContrasena2(t.slice(0, MAX_PASSWORD_LENGTH));
            clearTouches();
          }}
          placeholder="Confirma la contraseña"
          hasError={Boolean(contrasena2Msg)}
          maxLength={MAX_PASSWORD_LENGTH}
          accessibilityLabel="Confirmar contraseña"
        />
        {contrasena2Msg ? (
          <Text style={styles.fieldHint}>{contrasena2Msg}</Text>
        ) : null}

        {!contrasenaMsg && !contrasena2Msg ? (
          <Text style={styles.passRule}>
            Entre 8 y {MAX_PASSWORD_LENGTH} caracteres; escribe la contraseña
            dos veces.
          </Text>
        ) : null}

        {schools.map((school, index) => {
          const se = schoolErrRow(index);
          return (
            <View key={index} style={styles.schoolBlock}>
              <TextInput
                value={school.escuela}
                onChangeText={(t: string) => {
                  updateSchool(index, {
                    escuela: t,
                    ...(t.trim() ? {} : { matricula: "" }),
                  });
                }}
                placeholder="Nombre de la escuela"
                placeholderTextColor="#78716c"
                style={[styles.input, se.escuela && styles.inputError]}
              />
              {se.escuela ? (
                <Text style={styles.fieldHint}>{se.escuela}</Text>
              ) : null}
              {school.escuela.trim().length > 0 ? (
                <>
                  <TextInput
                    value={school.matricula}
                    onChangeText={(t: string) =>
                      updateSchool(index, {
                        matricula: t.replace(/\D/g, ""),
                      })
                    }
                    placeholder="Matrícula (solo números)"
                    placeholderTextColor="#78716c"
                    keyboardType="number-pad"
                    style={[styles.input, se.matricula && styles.inputError]}
                  />
                  {se.matricula ? (
                    <Text style={styles.fieldHint}>{se.matricula}</Text>
                  ) : null}
                </>
              ) : null}
            </View>
          );
        })}

        <TouchableOpacity
          style={[styles.addBtn, !canAddSchool && styles.addBtnDisabled]}
          onPress={addSchool}
          activeOpacity={canAddSchool ? 0.75 : 1}
          accessibilityLabel="Añadir escuela"
          disabled={!canAddSchool}
        >
          <Text style={[styles.addIcon, !canAddSchool && styles.addMuted]}>
            +
          </Text>
          <Text style={[styles.addLabel, !canAddSchool && styles.addMuted]}>
            añadir
          </Text>
        </TouchableOpacity>

        <LockerIncompleteMsg show={showIncomplete && !canSubmit} />
      </ScrollView>

      <View style={styles.footer}>
        <View style={{ flex: 1, alignItems: "flex-end" }}>
          {loading && (
            <Text style={{ fontSize: 13, color: "#78716c", marginBottom: 6, textAlign: "right" }}>
              Creando perfil...
            </Text>
          )}
          <LockerGradientButton
            label={loading ? "Procesando…" : "Siguiente"}
            variant="docente"
            onPress={() => void submit()}
            disabled={loading}
            loading={loading}
          />
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
    paddingTop: 16,
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  headerSide: {
    width: 48,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  headerSideRight: {
    width: 48,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  backArrow: {
    fontSize: 28,
    color: "#806b63",
    fontWeight: "600",
    lineHeight: 32,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: LOCKER.text,
    textAlign: "center",
    fontFamily: FONT_ROUNDED,
  },
  headerLogo: {
    width: 40,
    height: 40,
  },
  scroll: {
    flex: 1,
    width: "100%",
  },
  scrollContent: {
    paddingBottom: 24,
    gap: 14,
    alignItems: "stretch",
    maxWidth: 400,
    alignSelf: "center",
    width: "100%",
  },
  spacer: {
    height: 32,
  },
  fieldHint: {
    color: "#b91c1c",
    fontSize: 13,
    marginTop: -10,
    marginBottom: -4,
    paddingHorizontal: 2,
  },
  emailHint: {
    fontSize: 13,
    color: "#57534e",
    marginTop: -6,
    marginBottom: 2,
  },
  hintNearError: {
    marginTop: -2,
  },
  passRule: {
    fontSize: 13,
    color: "#78716c",
    marginTop: -4,
    marginBottom: 2,
  },
  input: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e7e5e4",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#1c1917",
    outlineStyle: "none",
  },
  inputError: {
    borderColor: "#EF5B5B",
    borderWidth: 2,
  },
  schoolBlock: {
    gap: 14,
  },
  addBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    gap: 4,
  },
  addBtnDisabled: {
    opacity: 0.35,
  },
  addIcon: {
    fontSize: 32,
    fontWeight: "300",
    color: "#44403c",
    lineHeight: 36,
  },
  addLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#44403c",
    textTransform: "lowercase",
  },
  addMuted: {
    color: "#a8a29e",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingTop: 12,
  },
  nextBtn: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    backgroundColor: "#B6F0FF",
    alignItems: "center",
    justifyContent: "center",
  },
  btnDisabled: {
    opacity: 0.6,
  },
  nextBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1c1917",
  },
  verifyHint: {
    fontSize: 13,
    color: LOCKER.text,
    textAlign: "center",
    fontFamily: FONT_ROUNDED,
    marginTop: 8,
  },
});
