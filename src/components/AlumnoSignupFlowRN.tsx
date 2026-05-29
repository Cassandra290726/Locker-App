"use client";

import { useState } from "react";
import {
  StyleSheet as RNStyleSheet,
  Text,
  TextInput,
  View,
} from "react-native-web";

import AlumnoRegistroHeader from "@/components/AlumnoRegistroHeader";
import PasswordFieldRN from "@/components/PasswordFieldRN";
import SignupLoadingOverlay from "@/components/SignupLoadingOverlay";
import {
  LockerGradientButton,
  LockerIncompleteMsg,
  RoleBadge,
} from "@/components/locker/LockerUi";
import { FONT_ROUNDED, LOCKER } from "@/lib/lockerTheme";
import {
  fetchSession,
  getEmailInputError,
  getInstitucionInputError,
  getMunicipioInputError,
  getNombreInputError,
  getPasswordInputError,
  getPasswordMismatchError,
  getPlantelInputError,
  getTurnoInputError,
  MAX_EMAIL_LENGTH,
  MAX_PASSWORD_LENGTH,
  MUNICIPIOS_BCN,
  register,
  type SessionUser,
} from "@/lib/lockerAuth";

type Props = {
  onBack: () => void;
  onRegistered: (user: SessionUser) => void;
};

type Step = 1 | 2;

function LabeledField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={fieldStyles.wrap}>
      <Text style={fieldStyles.label}>{label}</Text>
      {children}
      {error ? <Text style={fieldStyles.err}>{error}</Text> : null}
    </View>
  );
}

const fieldStyles = RNStyleSheet.create({
  wrap: { gap: 6, marginBottom: 4 },
  label: {
    fontSize: 15,
    fontWeight: "700",
    color: LOCKER.text,
    fontFamily: FONT_ROUNDED,
  },
  err: {
    color: "#b91c1c",
    fontSize: 13,
    marginTop: 2,
    fontFamily: FONT_ROUNDED,
  },
});

export default function AlumnoSignupFlowRN({ onBack, onRegistered }: Props) {
  const [step, setStep] = useState<Step>(1);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [institucion, setInstitucion] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [plantel, setPlantel] = useState("");
  const [turno, setTurno] = useState("");
  const [errs, setErrs] = useState<Record<string, string | undefined>>({});
  const [showIncomplete, setShowIncomplete] = useState(false);
  const [loading, setLoading] = useState(false);

  const canStep1 =
    !getNombreInputError(nombre) &&
    getEmailInputError(email) === null &&
    getPasswordInputError(password) === null &&
    getPasswordMismatchError(password, password2) === null;

  const canStep2 =
    !getInstitucionInputError(institucion) &&
    getMunicipioInputError(municipio) === null &&
    !getPlantelInputError(plantel) &&
    !getTurnoInputError(turno);

  function goStep2() {
    if (!canStep1) {
      setShowIncomplete(true);
      const next: Record<string, string | undefined> = {
        nombre: getNombreInputError(nombre) ?? undefined,
        email: getEmailInputError(email) ?? undefined,
        password: getPasswordInputError(password) ?? undefined,
        password2: getPasswordMismatchError(password, password2) ?? undefined,
      };
      setErrs(next);
      if (typeof window !== "undefined") {
        let errStr = "Corrige los siguientes errores:\n";
        if (next.nombre) errStr += "- " + next.nombre + "\n";
        if (next.email) errStr += "- " + next.email + "\n";
        if (next.password) errStr += "- " + next.password + "\n";
        if (next.password2) errStr += "- " + next.password2 + "\n";
        if (!errStr.includes("-")) errStr += "- Campos incompletos\n";
        window.alert(errStr);
      }
      return;
    }
    setShowIncomplete(false);
    setStep(2);
  }

  async function submitRegister() {
    if (!canStep2) {
      setShowIncomplete(true);
      const next: Record<string, string | undefined> = {
        institucion: getInstitucionInputError(institucion) ?? undefined,
        municipio: getMunicipioInputError(municipio) ?? undefined,
        plantel: getPlantelInputError(plantel) ?? undefined,
        turno: getTurnoInputError(turno) ?? undefined,
      };
      setErrs(next);
      if (typeof window !== "undefined") {
        let errStr = "Corrige los siguientes errores:\n";
        if (next.institucion) errStr += "- " + next.institucion + "\n";
        if (next.municipio) errStr += "- " + next.municipio + "\n";
        if (next.plantel) errStr += "- " + next.plantel + "\n";
        if (next.turno) errStr += "- " + next.turno + "\n";
        if (!errStr.includes("-")) errStr += "- Campos incompletos\n";
        window.alert(errStr);
      }
      return;
    }
    setShowIncomplete(false);

    setLoading(true);
    const result = await register(email.trim(), password, "alumno", {
      alumnoProfile: {
        nombre: nombre.trim(),
        institucion: institucion.trim(),
        municipio,
        plantel: plantel.trim(),
        turno: turno.trim(),
      },
    });
    setLoading(false);

    if (!result.ok) {
      if (result.error === "EMAIL_TAKEN") {
        setErrs({ email: "Este correo ya está registrado." });
      } else {
        window.alert("Error de conexión a la base de datos o llave incorrecta. Verifica tu Supabase URL y SERVICE_ROLE KEY.");
      }
      setStep(1);
      return;
    }

    const session = await fetchSession();
    if (session) onRegistered(session);
  }

  if (step === 1) {
    return (
      <View style={styles.root}>
        <SignupLoadingOverlay visible={loading} />
        <AlumnoRegistroHeader onBack={onBack} />
        <RoleBadge role="alumno" />
        <View style={styles.spacer} />
        <View style={styles.form}>
          <LabeledField label="Nombre" error={errs.nombre}>
            <TextInput
              value={nombre}
              onChangeText={(t: string) => {
                setNombre(t);
                setErrs((e) => ({ ...e, nombre: undefined }));
              }}
              placeholder="Tu nombre completo"
              placeholderTextColor="#78716c"
              style={[styles.input, errs.nombre && styles.inputErr]}
            />
          </LabeledField>
          <LabeledField label="Correo" error={errs.email}>
            <TextInput
              value={email}
              onChangeText={(t: string) => {
                setEmail(t);
                setErrs((e) => ({ ...e, email: undefined }));
              }}
              placeholder="correo@ejemplo.com"
              autoCapitalize="none"
              keyboardType="email-address"
              maxLength={MAX_EMAIL_LENGTH}
              style={[styles.input, errs.email && styles.inputErr]}
              placeholderTextColor="#78716c"
            />
          </LabeledField>
          <LabeledField label="Contraseña" error={errs.password}>
            <PasswordFieldRN
              value={password}
              onChangeText={(t: string) => {
                setPassword(t.slice(0, MAX_PASSWORD_LENGTH));
                setErrs((e) => ({
                  ...e,
                  password: undefined,
                  password2: undefined,
                }));
              }}
              placeholder="Mínimo 8 caracteres"
              hasError={Boolean(errs.password)}
              maxLength={MAX_PASSWORD_LENGTH}
            />
          </LabeledField>
          <LabeledField label="Confirma contraseña" error={errs.password2}>
            <PasswordFieldRN
              value={password2}
              onChangeText={(t: string) => {
                setPassword2(t.slice(0, MAX_PASSWORD_LENGTH));
                setErrs((e) => ({ ...e, password2: undefined }));
              }}
              placeholder="Repite la contraseña"
              hasError={Boolean(errs.password2)}
              maxLength={MAX_PASSWORD_LENGTH}
              accessibilityLabel="Confirmar contraseña"
            />
          </LabeledField>
          <LockerIncompleteMsg show={showIncomplete && !canStep1} />
        </View>
        <View style={styles.footerRow}>
          <LockerGradientButton
            label="Siguiente"
            variant="alumno"
            onPress={goStep2}
            disabled={loading}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <SignupLoadingOverlay visible={loading} />
      <AlumnoRegistroHeader
        onBack={() => {
          setStep(1);
          setErrs({});
          setShowIncomplete(false);
        }}
      />
      <RoleBadge role="alumno" />
      <View style={styles.spacer} />
      <View style={styles.form}>
        <LabeledField label="Institución" error={errs.institucion}>
          <TextInput
            value={institucion}
            onChangeText={(t: string) => {
              setInstitucion(t);
              setErrs((e) => ({ ...e, institucion: undefined }));
            }}
            placeholder="Nombre de tu institución"
            placeholderTextColor="#78716c"
            style={[styles.input, errs.institucion && styles.inputErr]}
          />
        </LabeledField>
        <LabeledField label="Municipio" error={errs.municipio}>
          <View style={styles.selectWrap}>
            <select
              value={municipio}
              onChange={(e) => {
                setMunicipio(e.target.value);
                setErrs((er) => ({ ...er, municipio: undefined }));
              }}
              style={{
                width: "100%",
                padding: "14px 16px",
                fontSize: 16,
                borderRadius: 12,
                border: errs.municipio ? "2px solid #EF5B5B" : "1px solid #e7e5e4",
                backgroundColor: "#fff",
                color: municipio ? LOCKER.text : "#78716c",
                fontFamily: FONT_ROUNDED,
              }}
            >
              <option value="">Selecciona tu municipio</option>
              {MUNICIPIOS_BCN.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </View>
        </LabeledField>
        <LabeledField label="Plantel" error={errs.plantel}>
          <TextInput
            value={plantel}
            onChangeText={(t: string) => {
              setPlantel(t);
              setErrs((e) => ({ ...e, plantel: undefined }));
            }}
            placeholder="Nombre del plantel"
            placeholderTextColor="#78716c"
            style={[styles.input, errs.plantel && styles.inputErr]}
          />
        </LabeledField>
        <LabeledField label="Turno" error={errs.turno}>
          <TextInput
            value={turno}
            onChangeText={(t: string) => {
              setTurno(t);
              setErrs((e) => ({ ...e, turno: undefined }));
            }}
            placeholder="Ej. Matutino, Vespertino"
            placeholderTextColor="#78716c"
            style={[styles.input, errs.turno && styles.inputErr]}
          />
        </LabeledField>
        <LockerIncompleteMsg show={showIncomplete && !canStep2} />
      </View>
      <View style={styles.footerRow}>
        <View style={{ flex: 1, alignItems: "flex-end" }}>
          {loading && (
            <Text style={{ fontSize: 13, color: "#78716c", marginBottom: 6, textAlign: "right" }}>
              Creando perfil...
            </Text>
          )}
          <LockerGradientButton
            label={loading ? "Registrando…" : "Siguiente"}
            variant="alumno"
            onPress={() => void submitRegister()}
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
    backgroundColor: LOCKER.bg,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  spacer: {
    height: 24,
  },
  form: {
    gap: 20,
    maxWidth: 400,
    alignSelf: "center",
    width: "100%",
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
    color: LOCKER.text,
    outlineStyle: "none",
    fontFamily: FONT_ROUNDED,
  },
  inputErr: {
    borderColor: "#EF5B5B",
    borderWidth: 2,
  },
  selectWrap: {
    width: "100%",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 40,
    maxWidth: 400,
    alignSelf: "center",
    width: "100%",
  },
  verifyHint: {
    fontSize: 13,
    color: LOCKER.text,
    textAlign: "center",
    fontFamily: FONT_ROUNDED,
    marginTop: 8,
  },
});
