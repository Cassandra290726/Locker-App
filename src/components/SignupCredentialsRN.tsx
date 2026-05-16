"use client";

import { useState } from "react";
import {
  StyleSheet as RNStyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native-web";

import {
  fetchSession,
  getEmailInputError,
  getPasswordInputError,
  getPasswordMismatchError,
  MAX_EMAIL_LENGTH,
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  register,
  type SessionUser,
  type UserRole,
} from "@/lib/lockerAuth";

type Props = {
  role: UserRole;
  onBack: () => void;
  onRegistered: (user: SessionUser) => void;
};

export default function SignupCredentialsRN({
  role,
  onBack,
  onRegistered,
}: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [emailErr, setEmailErr] = useState<string | undefined>();
  const [passErr, setPassErr] = useState<string | undefined>();
  const [pass2Err, setPass2Err] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  function clearPwMsgs() {
    setPassErr(undefined);
    setPass2Err(undefined);
  }

  const submit = async () => {
    const pErr = getPasswordInputError(password);

    let p2Issue: string | undefined;
    if (pErr !== null) {
      p2Issue =
        password2.trim().length === 0
          ? "Confirma la contraseña."
          : password !== password2
            ? "Las contraseñas no coinciden."
            : undefined;
    } else {
      p2Issue = getPasswordMismatchError(password, password2) ?? undefined;
    }

    const eErr = getEmailInputError(email) ?? undefined;

    setPassErr(pErr ?? undefined);
    setPass2Err(p2Issue);
    setEmailErr(eErr ?? undefined);

    if (getEmailInputError(email) !== null || pErr !== null || p2Issue) return;

    const eTrim = email.trim();
    const p = password;

    setLoading(true);
    const result = await register(eTrim, p, role);
    setLoading(false);

    if (!result.ok) {
      setEmailErr(
        result.error === "EMAIL_TAKEN"
          ? "Este correo ya está registrado."
          : getEmailInputError(email) ?? undefined,
      );
      return;
    }

    const session = await fetchSession();
    if (session) {
      onRegistered(session);
    }
  };

  const showEmailSecondary = !emailErr;

  return (
    <View style={styles.root}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
        <Text style={styles.backArrow}>←</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Completa tu cuenta</Text>
      <Text style={styles.hint}>
        Rol: {role === "docente" ? "Docente" : "Alumno/a"}
      </Text>

      <View style={styles.form}>
        <TextInput
          value={email}
          onChangeText={(t: string) => {
            setEmail(t);
            setEmailErr(undefined);
          }}
          placeholder="Correo"
          placeholderTextColor="#78716c"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          maxLength={MAX_EMAIL_LENGTH}
          style={[styles.input, emailErr && styles.inputError]}
        />
        {emailErr ? (
          <Text style={styles.fieldHint}>{emailErr}</Text>
        ) : showEmailSecondary ? (
          <Text style={styles.secondaryHint}>
            Usa tu correo asignado por la institución.
          </Text>
        ) : null}

        <TextInput
          value={password}
          onChangeText={(t: string) => {
            setPassword(t.slice(0, MAX_PASSWORD_LENGTH));
            clearPwMsgs();
          }}
          placeholder="Contraseña"
          placeholderTextColor="#78716c"
          secureTextEntry
          maxLength={MAX_PASSWORD_LENGTH}
          style={[styles.input, passErr && styles.inputError]}
        />
        {passErr ? <Text style={styles.fieldHint}>{passErr}</Text> : null}

        <TextInput
          value={password2}
          onChangeText={(t: string) => {
            setPassword2(t.slice(0, MAX_PASSWORD_LENGTH));
            clearPwMsgs();
          }}
          placeholder="Confirma la contraseña"
          placeholderTextColor="#78716c"
          secureTextEntry
          maxLength={MAX_PASSWORD_LENGTH}
          style={[styles.input, pass2Err && styles.inputError]}
        />
        {pass2Err ? <Text style={styles.fieldHint}>{pass2Err}</Text> : null}

        {!passErr && !pass2Err ? (
          <Text style={styles.secondaryHint}>
            Entre {MIN_PASSWORD_LENGTH} y {MAX_PASSWORD_LENGTH} caracteres; deben coincidir
            ambas.
          </Text>
        ) : null}
      </View>

      <TouchableOpacity
        style={[styles.primary, loading && styles.btnDisabled]}
        onPress={() => void submit()}
        activeOpacity={0.85}
        disabled={loading}
      >
        <Text style={styles.primaryText}>
          {loading ? "Creando…" : "Crear cuenta"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = RNStyleSheet.create({
  root: {
    width: "100%",
    minHeight: "100vh",
    backgroundColor: "#FFFBDB",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
  },
  backBtn: {
    alignSelf: "flex-start",
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  backArrow: {
    fontSize: 28,
    color: "#806b63",
    fontWeight: "600",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#292524",
    marginBottom: 6,
  },
  hint: {
    fontSize: 15,
    color: "#57534e",
    marginBottom: 24,
  },
  form: {
    gap: 14,
    marginBottom: 24,
  },
  input: {
    width: "100%",
    maxWidth: 400,
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
    borderColor: "#FF7F96",
    borderWidth: 2,
  },
  fieldHint: {
    color: "#b91c1c",
    fontSize: 13,
    marginTop: -10,
    marginBottom: -4,
    alignSelf: "stretch",
    maxWidth: 400,
    paddingHorizontal: 2,
  },
  secondaryHint: {
    fontSize: 13,
    color: "#78716c",
    marginTop: -10,
    marginBottom: -2,
    maxWidth: 400,
  },
  primary: {
    backgroundColor: "#B6F0FF",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    maxWidth: 400,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  primaryText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1c1917",
  },
});
