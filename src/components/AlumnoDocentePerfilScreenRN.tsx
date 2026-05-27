"use client";

import { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet as RNStyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native-web";

import {
  fetchDocenteDetalle,
  type DocentePublico,
} from "@/lib/alumnoDocentesClient";

type Props = {
  docenteEmail: string;
  onBack: () => void;
  onVerHorario: (docente: DocentePublico) => void;
};

export default function AlumnoDocentePerfilScreenRN({
  docenteEmail,
  onBack,
  onVerHorario,
}: Props) {
  const [docente, setDocente] = useState<DocentePublico | null>(null);

  useEffect(() => {
    void fetchDocenteDetalle(docenteEmail).then(setDocente);
  }, [docenteEmail]);

  if (!docente) {
    return (
      <View style={styles.root}>
        <TouchableOpacity onPress={onBack} style={styles.backWrap}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.loading}>Cargando…</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.topRow}>
        <TouchableOpacity onPress={onBack} style={styles.backWrap} activeOpacity={0.7}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.logoSpacer} />
        <Image
          accessibilityLabel="Logo Locker"
          alt="Logo Locker"
          source={{ uri: "/logo.png" }}
          style={styles.logoRight}
          resizeMode="contain"
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            {docente.fotoUrl ? (
              <Image
                source={{ uri: docente.fotoUrl }}
                style={styles.avatarImg}
                resizeMode="cover"
                accessibilityLabel="Foto del docente"
              />
            ) : (
              <Text style={styles.avatarPlaceholder}>👤</Text>
            )}
          </View>
          <View style={styles.nameCol}>
            <Text style={styles.nameLine}>{docente.apellidoPaterno}</Text>
            <Text style={styles.nameLine}>{docente.apellidoMaterno}</Text>
            <Text style={styles.nameLine}>{docente.nombres}</Text>
          </View>
        </View>

        <FieldBlock label="Escuela" lines={docente.escuelas} />
        <FieldBlock label="Materias" lines={docente.materias} />
        <FieldBlock label="Correo" lines={[docente.correo || docente.email]} />
        <FieldBlock label="Número" lines={[docente.telefono || "—"]} />
      </ScrollView>

      <TouchableOpacity
        style={styles.verHorarioBtn}
        onPress={() => onVerHorario(docente)}
        activeOpacity={0.85}
      >
        <Text style={styles.verHorarioText}>Ver Horario</Text>
      </TouchableOpacity>
    </View>
  );
}

function FieldBlock({ label, lines }: { label: string; lines: string[] }) {
  const show = lines.filter(Boolean).length > 0 ? lines.filter(Boolean) : ["—"];
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {show.map((line, i) => (
        <View key={`${label}-${i}`} style={styles.valueRow}>
          <Text style={styles.fieldValue}>{line}</Text>
          <View style={styles.underline} />
        </View>
      ))}
    </View>
  );
}

const styles = RNStyleSheet.create({
  root: {
    width: "100%",
    minHeight: "100vh",
    backgroundColor: "#FFFBDB",
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 32,
    maxWidth: 480,
    alignSelf: "center",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  backWrap: { padding: 8 },
  backArrow: { fontSize: 28, color: "#806b63", fontWeight: "600" },
  logoSpacer: { flex: 1 },
  logoRight: { width: 72, height: 72 },
  loading: { textAlign: "center", marginTop: 40, color: "#57534e" },
  profileRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 28,
    alignItems: "flex-start",
  },
  avatar: {
    width: 100,
    height: 100,
    borderWidth: 2,
    borderColor: "#806b63",
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImg: { width: 100, height: 100 },
  avatarPlaceholder: { fontSize: 48 },
  nameCol: { flex: 1, gap: 8, paddingTop: 8 },
  nameLine: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1c1917",
    borderBottomWidth: 2,
    borderBottomColor: "#806b63",
    paddingBottom: 4,
  },
  fieldBlock: { marginBottom: 22 },
  fieldLabel: {
    fontSize: 18,
    fontWeight: "800",
    color: "#806b63",
    marginBottom: 8,
  },
  valueRow: { marginBottom: 10, maxWidth: 320 },
  fieldValue: {
    fontSize: 15,
    color: "#44403c",
    marginBottom: 4,
  },
  underline: {
    height: 2,
    backgroundColor: "#806b63",
    opacity: 0.5,
  },
  verHorarioBtn: {
    alignSelf: "center",
    backgroundColor: "#FF7F96",
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 16,
    marginTop: 24,
    minWidth: 220,
    alignItems: "center",
  },
  verHorarioText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1c1917",
  },
});
