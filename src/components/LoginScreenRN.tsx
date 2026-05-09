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

import { getAccount, isValidEmailFormat, setStoredSessionEmail } from "@/lib/lockerAuth";

type Props = {
  onCreateAccount: () => void;
  onLoginSuccess: () => void;
};

export default function LoginScreenRN({
  onCreateAccount,
  onLoginSuccess,
}: Props) {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [emailHighlight, setEmailHighlight] = useState(false);
  const [passHighlight, setPassHighlight] = useState(false);

  const tryNext = () => {
    setEmailHighlight(false);
    setPassHighlight(false);

    const e = correo.trim();
    const p = contrasena;

    if (!e || !p) {
      setEmailHighlight(true);
      setPassHighlight(true);
      return;
    }

    if (!isValidEmailFormat(e)) {
      setEmailHighlight(true);
      return;
    }

    const acc = getAccount(e);
    if (!acc) {
      setEmailHighlight(true);
      return;
    }

    if (acc.password !== p) {
      setPassHighlight(true);
      return;
    }

    setStoredSessionEmail(e);
    onLoginSuccess();
  };

  return (
    <View style={styles.root}>
      <View style={styles.top}>
        <Image
          accessibilityLabel="Logo Locker"
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
            setEmailHighlight(false);
          }}
          placeholder="Correo"
          placeholderTextColor="#78716c"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          style={[styles.input, emailHighlight && styles.inputError]}
        />
        <TextInput
          value={contrasena}
          onChangeText={(t: string) => {
            setContrasena(t);
            setPassHighlight(false);
          }}
          placeholder="Contraseña"
          placeholderTextColor="#78716c"
          secureTextEntry
          style={[styles.input, passHighlight && styles.inputError]}
        />
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.btnGhost}
          onPress={onCreateAccount}
          activeOpacity={0.75}
        >
          <Text style={styles.btnGhostText}>crear cuenta</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnPrimary} onPress={tryNext} activeOpacity={0.85}>
          <Text style={styles.btnPrimaryText}>siguiente</Text>
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
  btnPrimaryText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1c1917",
    textAlign: "center",
  },
});
