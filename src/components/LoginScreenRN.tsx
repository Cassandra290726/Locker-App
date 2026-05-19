"use client";

import { useState } from "react";
import {
  Image,
  StyleSheet as RNStyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native-web";

import PasswordFieldRN from "@/components/PasswordFieldRN";
import {
  fetchSession,
  isValidEmailFormat,
  login,
  type SessionUser,
} from "@/lib/lockerAuth";

type Props = {
  onCreateAccount: () => void;
  onLoginSuccess: (user: SessionUser) => void;
};

export default function LoginScreenRN({
  onCreateAccount,
  onLoginSuccess,
}: Props) {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [fieldHighlight, setFieldHighlight] = useState(false);
  const [credError, setCredError] = useState(false);
  const [loading, setLoading] = useState(false);

  const tryNext = async () => {
    setFieldHighlight(false);
    setCredError(false);

    const e = correo.trim();
    const p = contrasena;

    if (!e || !p) {
      setFieldHighlight(true);
      return;
    }

    if (!isValidEmailFormat(e)) {
      setFieldHighlight(true);
      return;
    }

    setLoading(true);
    const result = await login(e, p);
    setLoading(false);

    if (!result.ok) {
      setCredError(true);
      setFieldHighlight(true);
      return;
    }

    const session = await fetchSession();
    if (session) {
      onLoginSuccess(session);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.top}>
        <Image
          accessibilityLabel="Logo Locker"
          alt="Logo Locker"
          source={{ uri: "/logo.png" }}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.form}>
        <TextInput
          value={correo}
          onChangeText={(t: string) => {
            setCorreo(t);
            setFieldHighlight(false);
            setCredError(false);
          }}
          placeholder="Correo"
          placeholderTextColor="#78716c"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          style={[styles.input, fieldHighlight && styles.inputError]}
        />
        <View style={styles.pwWrap}>
          <PasswordFieldRN
            value={contrasena}
            onChangeText={(t: string) => {
              setContrasena(t);
              setFieldHighlight(false);
              setCredError(false);
            }}
            hasError={fieldHighlight}
          />
        </View>
        {credError ? (
          <Text style={styles.errText}>Credenciales incorrectas.</Text>
        ) : null}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.btnGhost}
          onPress={onCreateAccount}
          activeOpacity={0.75}
        >
          <Text style={styles.btnGhostText}>crear cuenta</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btnPrimary, loading && styles.btnDisabled]}
          onPress={() => void tryNext()}
          activeOpacity={0.85}
          disabled={loading}
        >
          <Text style={styles.btnPrimaryText}>
            {loading ? "Entrando…" : "siguiente"}
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
    paddingTop: 28,
    paddingBottom: 24,
  },
  top: {
    alignItems: "center",
    paddingBottom: 16,
  },
  logo: {
    width: "58%",
    maxWidth: 260,
    height: 160,
  },
  form: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 14,
    paddingVertical: 12,
    width: "100%",
  },
  pwWrap: {
    width: "100%",
    maxWidth: 360,
  },
  input: {
    width: "100%",
    maxWidth: 360,
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
    width: "100%",
    maxWidth: 360,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingTop: 8,
  },
  btnGhost: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  btnGhostText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#44403c",
    textAlign: "center",
  },
  btnPrimary: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#B6F0FF",
    alignItems: "center",
    justifyContent: "center",
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnPrimaryText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1c1917",
    textAlign: "center",
  },
});
