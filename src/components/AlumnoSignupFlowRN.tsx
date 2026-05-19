"use client";

import { useState } from "react";
import {
  StyleSheet as RNStyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native-web";

import AlumnoRegistroHeader from "@/components/AlumnoRegistroHeader";
import PasswordFieldRN from "@/components/PasswordFieldRN";
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
    color: "#806b63",
  },
  err: {
    color: "#b91c1c",
    fontSize: 13,
    marginTop: 2,
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
    const next: Record<string, string | undefined> = {
      nombre: getNombreInputError(nombre) ?? undefined,
      email: getEmailInputError(email) ?? undefined,
      password: getPasswordInputError(password) ?? undefined,
      password2: getPasswordMismatchError(password, password2) ?? undefined,
    };
    setErrs(next);
    if (
      next.nombre ||
      next.email ||
      next.password ||
      next.password2
    ) {
      return;
    }
    setStep(2);
  }

  async function submitRegister() {
    const next: Record<string, string | undefined> = {
      institucion: getInstitucionInputError(institucion) ?? undefined,
      municipio: getMunicipioInputError(municipio) ?? undefined,
      plantel: getPlantelInputError(plantel) ?? undefined,
      turno: getTurnoInputError(turno) ?? undefined,
    };
    setErrs(next);
    if (Object.values(next).some(Boolean)) return;

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
      setErrs({
        email:
          result.error === "EMAIL_TAKEN"
            ? "Este correo ya está registrado."
            : getEmailInputError(email) ?? undefined,
      });
      setStep(1);
      return;
    }

    const session = await fetchSession();
    if (session) onRegistered(session);
  }

  if (step === 1) {
    return (
      <View style={styles.root}>
        <AlumnoRegistroHeader onBack={onBack} />
        <View style={styles.spacer} />
        <View style={styles.form}>
          <LabeledField label="Nombre" error={errs.nombre}>
            <TextInput
              value={nombre}
              onChangeText={(t: string) => {
                setNombre(t);
                setErrs((e) => ({ ...e, nombre: undefined }));
              }}
              style={[styles.input, errs.nombre && styles.inputErr]}
              placeholderTextColor="#78716c"
            />
          </LabeledField>
          <LabeledField label="Correo" error={errs.email}>
            <TextInput
              value={email}
              onChangeText={(t: string) => {
                setEmail(t);
                setErrs((e) => ({ ...e, email: undefined }));
              }}
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
              placeholder="Confirma la contraseña"
              hasError={Boolean(errs.password2)}
              maxLength={MAX_PASSWORD_LENGTH}
              accessibilityLabel="Confirmar contraseña"
            />
          </LabeledField>
        </View>
        <View style={styles.footerRow}>
          <TouchableOpacity
            style={[styles.nextBtn, (!canStep1 || loading) && styles.nextDisabled]}
            onPress={goStep2}
            disabled={!canStep1 || loading}
            activeOpacity={0.85}
          >
            <Text style={styles.nextText}>Siguiente</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <AlumnoRegistroHeader
        onBack={() => {
          setStep(1);
          setErrs({});
        }}
      />
      <View style={styles.spacer} />
      <View style={styles.form}>
        <LabeledField label="Institución" error={errs.institucion}>
          <TextInput
            value={institucion}
            onChangeText={(t: string) => {
              setInstitucion(t);
              setErrs((e) => ({ ...e, institucion: undefined }));
            }}
            style={[styles.input, errs.institucion && styles.inputErr]}
            placeholderTextColor="#78716c"
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
                border: errs.municipio ? "2px solid #FF7F96" : "1px solid #e7e5e4",
                backgroundColor: "#fff",
                color: municipio ? "#1c1917" : "#78716c",
              }}
            >
              <option value="">Selecciona municipio</option>
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
            style={[styles.input, errs.plantel && styles.inputErr]}
            placeholderTextColor="#78716c"
          />
        </LabeledField>
        <LabeledField label="Turno" error={errs.turno}>
          <TextInput
            value={turno}
            onChangeText={(t: string) => {
              setTurno(t);
              setErrs((e) => ({ ...e, turno: undefined }));
            }}
            style={[styles.input, errs.turno && styles.inputErr]}
            placeholderTextColor="#78716c"
          />
        </LabeledField>
      </View>
      <View style={styles.footerRow}>
        <TouchableOpacity
          style={[styles.nextBtn, (!canStep2 || loading) && styles.nextDisabled]}
          onPress={() => void submitRegister()}
          disabled={!canStep2 || loading}
          activeOpacity={0.85}
        >
          <Text style={styles.nextText}>
            {loading ? "Registrando…" : "Siguiente"}
          </Text>
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
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  spacer: {
    height: 48,
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
    color: "#1c1917",
    outlineStyle: "none",
  },
  inputErr: {
    borderColor: "#FF7F96",
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
  nextBtn: {
    backgroundColor: "#B6F0FF",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
  },
  nextDisabled: {
    opacity: 0.45,
  },
  nextText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1c1917",
  },
});
