"use client";

import { useState } from "react";
import {
  StyleSheet as RNStyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native-web";

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  hasError?: boolean;
  maxLength?: number;
  accessibilityLabel?: string;
};

export default function PasswordFieldRN({
  value,
  onChangeText,
  placeholder = "Contraseña",
  hasError = false,
  maxLength,
  accessibilityLabel = "Contraseña",
}: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.wrap}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#78716c"
        secureTextEntry={!visible}
        maxLength={maxLength}
        accessibilityLabel={accessibilityLabel}
        style={[styles.input, hasError && styles.inputError]}
      />
      <TouchableOpacity
        style={styles.toggle}
        onPress={() => setVisible((v) => !v)}
        accessibilityLabel={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        activeOpacity={0.7}
      >
        <Text style={styles.toggleIcon}>{visible ? "🙈" : "👁️"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = RNStyleSheet.create({
  wrap: {
    position: "relative",
    width: "100%",
  },
  input: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e7e5e4",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingRight: 48,
    paddingVertical: 14,
    fontSize: 16,
    color: "#1c1917",
    outlineStyle: "none",
  },
  inputError: {
    borderColor: "#FF7F96",
    borderWidth: 2,
  },
  toggle: {
    position: "absolute",
    right: 4,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  toggleIcon: {
    fontSize: 20,
    lineHeight: 24,
  },
});
