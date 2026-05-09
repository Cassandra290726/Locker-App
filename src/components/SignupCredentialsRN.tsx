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
  isValidEmailFormat,
  registerAccount,
  setStoredSessionEmail,
  type UserRole,
} from "@/lib/lockerAuth";

type Props = {
  role: UserRole;
  onBack: () => void;
  onRegistered: () => void;
};

export default function SignupCredentialsRN({
  role,
  onBack,
  onRegistered,
}: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailErr, setEmailErr] = useState(false);
  const [passErr, setPassErr] = useState(false);
  const [taken, setTaken] = useState(false);

  const submit = () => {
    setTaken(false);
    const e = email.trim();
    const p = password;
    const empty = !e || !p;
    const badEmail = !isValidEmailFormat(e);
    setEmailErr(empty || badEmail);
    setPassErr(empty);
    if (empty || badEmail) return;

    try {
      registerAccount(e, p, role);
      setStoredSessionEmail(e);
      onRegistered();
    } catch (err) {
      if (err instanceof Error && err.message === "EMAIL_TAKEN") {
        setTaken(true);
        setEmailErr(true);
        return;
      }
      throw err;
    }
  };

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
            setEmailErr(false);
            setTaken(false);
          }}
          placeholder="Correo"
          placeholderTextColor="#78716c"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          style={[styles.input, emailErr && styles.inputError]}
        />
        <TextInput
          value={password}
          onChangeText={(t: string) => {
            setPassword(t);
            setPassErr(false);
          }}
          placeholder="Contraseña"
          placeholderTextColor="#78716c"
          secureTextEntry
          style={[styles.input, passErr && styles.inputError]}
        />
        {taken ? (
          <Text style={styles.errText}>Ese correo ya está registrado.</Text>
        ) : null}
      </View>

      <TouchableOpacity style={styles.primary} onPress={submit} activeOpacity={0.85}>
        <Text style={styles.primaryText}>Crear cuenta</Text>
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
  errText: {
    color: "#b91c1c",
    fontSize: 14,
  },
  primary: {
    backgroundColor: "#B6F0FF",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    maxWidth: 400,
  },
  primaryText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1c1917",
  },
});
