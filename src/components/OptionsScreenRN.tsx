"use client";

import {
  StyleSheet as RNStyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native-web";

type Props = {
  onSignOut: () => void;
};

export default function OptionsScreenRN({ onSignOut }: Props) {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>Opciones</Text>
      <Text style={styles.sub}>Agenda, perfil y más (próximamente).</Text>

      <View style={styles.card}>
        <Text style={styles.item}>· Agenda</Text>
        <Text style={styles.item}>· Perfil</Text>
      </View>

      <TouchableOpacity style={styles.out} onPress={onSignOut} activeOpacity={0.8}>
        <Text style={styles.outText}>Cerrar sesión</Text>
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
    paddingTop: 36,
    paddingBottom: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#292524",
    marginBottom: 8,
  },
  sub: {
    fontSize: 16,
    color: "#57534e",
    marginBottom: 28,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e7e5e4",
    gap: 12,
    marginBottom: 32,
  },
  item: {
    fontSize: 17,
    color: "#44403c",
  },
  out: {
    alignSelf: "flex-start",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: "#e7e5e4",
  },
  outText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1c1917",
  },
});
