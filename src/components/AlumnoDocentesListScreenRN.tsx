"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet as RNStyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native-web";

import {
  fetchDocentesAlumno,
  type DocentePublico,
} from "@/lib/alumnoDocentesClient";

type Props = {
  onBack: () => void;
  onSelectDocente: (docente: DocentePublico) => void;
};

export default function AlumnoDocentesListScreenRN({
  onBack,
  onSelectDocente,
}: Props) {
  const [query, setQuery] = useState("");
  const [docentes, setDocentes] = useState<DocentePublico[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async (q: string) => {
    setLoading(true);
    const list = await fetchDocentesAlumno(q);
    setDocentes(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => void reload(query), 300);
    return () => window.clearTimeout(t);
  }, [query, reload]);

  return (
    <View style={styles.root}>
      <View style={styles.topRow}>
        <TouchableOpacity onPress={onBack} style={styles.backWrap} activeOpacity={0.7}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Docentes</Text>
        <Image
          accessibilityLabel="Logo Locker"
          alt="Logo Locker"
          source={{ uri: "/logo.png" }}
          style={styles.logoRight}
          resizeMode="contain"
        />
      </View>

      <View style={styles.searchRow}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar por nombre"
          placeholderTextColor="#78716c"
          style={styles.searchInput}
        />
        <Text style={styles.searchIcon}>🔍</Text>
      </View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {loading ? (
          <Text style={styles.empty}>Cargando…</Text>
        ) : docentes.length === 0 ? (
          <Text style={styles.empty}>No se encontraron coincidencias</Text>
        ) : (
          docentes.map((d) => (
            <TouchableOpacity
              key={d.email}
              style={styles.card}
              onPress={() => onSelectDocente(d)}
              activeOpacity={0.8}
            >
              <View style={styles.avatar}>
                {d.fotoUrl ? (
                  <Image
                    source={{ uri: d.fotoUrl }}
                    style={styles.avatarImg}
                    resizeMode="cover"
                    accessibilityLabel={`Foto de ${d.nombre}`}
                  />
                ) : (
                  <Text style={styles.avatarPlaceholder}>👤</Text>
                )}
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardName}>
                  {d.nombre} {d.apellidos}
                </Text>
                <Text style={styles.cardLine}>
                  <Text style={styles.cardLabel}>Correo: </Text>
                  {d.email}
                </Text>
                <Text style={styles.cardLine}>
                  <Text style={styles.cardLabel}>Número: </Text>
                  {d.telefono || "—"}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = RNStyleSheet.create({
  root: {
    width: "100%",
    minHeight: "100vh",
    backgroundColor: "#FFFBDB",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 24,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 6,
  },
  backWrap: { padding: 8, width: 44 },
  backArrow: { fontSize: 28, color: "#806b63", fontWeight: "600" },
  screenTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: "800",
    color: "#806b63",
    textAlign: "center",
  },
  logoRight: { width: 64, height: 64 },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#1c1917",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1c1917",
    outlineStyle: "none",
  },
  searchIcon: { fontSize: 18, marginLeft: 8 },
  list: { flex: 1 },
  empty: {
    textAlign: "center",
    color: "#806b63",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 40,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#e7e5e4",
    borderWidth: 1,
    borderColor: "#a8a29e",
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
    gap: 12,
  },
  avatar: {
    width: 72,
    height: 72,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#1c1917",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImg: { width: 72, height: 72 },
  avatarPlaceholder: { fontSize: 36 },
  cardBody: { flex: 1, gap: 6, justifyContent: "center" },
  cardName: { fontSize: 16, fontWeight: "700", color: "#1c1917" },
  cardLine: { fontSize: 14, color: "#44403c" },
  cardLabel: { fontWeight: "700" },
});
