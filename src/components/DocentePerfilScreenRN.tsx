"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet as RNStyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native-web";

import type { DocenteProfile } from "@/lib/authShared";

export default function DocentePerfilScreenRN() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [telefono, setTelefono] = useState("");
  const [materiasText, setMateriasText] = useState("");
  const [fotoUrl, setFotoUrl] = useState("");
  const [escuelasText, setEscuelasText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/docente/perfil", { credentials: "include" });
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const data = (await res.json()) as {
        email?: string;
        profile?: DocenteProfile;
      };
      const p = data.profile;
      if (p) {
        setEmail(data.email ?? "");
        setNombre(p.nombre);
        setApellidos(p.apellidos ?? "");
        setTelefono(p.telefono ?? "");
        setMateriasText((p.materias ?? []).join(", "));
        setFotoUrl(p.fotoUrl ?? "");
        setEscuelasText(
          p.escuelas.map((s) => s.escuela).filter(Boolean).join(", "),
        );
      }
      setLoading(false);
    })();
  }, []);

  async function guardar() {
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/docente/perfil", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre,
        apellidos,
        telefono,
        materias: materiasText,
        fotoUrl,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setMsg("Perfil guardado. Los alumnos podrán verte en Docente.");
    } else {
      setMsg("No se pudo guardar. Intenta de nuevo.");
    }
  }

  if (loading) {
    return (
      <View style={styles.root}>
        <Text style={styles.loading}>Cargando perfil…</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <TouchableOpacity
        onPress={() => router.push("/")}
        style={styles.backBtn}
        activeOpacity={0.7}
      >
        <Text style={styles.backArrow}>←</Text>
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Perfil docente</Text>
        <Text style={styles.hint}>
          Lo que guardes aquí lo verán los alumnos en el apartado Docente.
        </Text>

        {email ? (
          <Text style={styles.emailLine}>Correo: {email}</Text>
        ) : null}

        <Label text="Nombre" />
        <TextInput
          value={nombre}
          onChangeText={setNombre}
          style={styles.input}
          placeholderTextColor="#78716c"
        />

        <Label text="Apellidos" />
        <TextInput
          value={apellidos}
          onChangeText={setApellidos}
          style={styles.input}
          placeholderTextColor="#78716c"
        />

        <Label text="Teléfono" />
        <TextInput
          value={telefono}
          onChangeText={setTelefono}
          keyboardType="phone-pad"
          style={styles.input}
          placeholderTextColor="#78716c"
        />

        <Label text="Materias (separadas por coma)" />
        <TextInput
          value={materiasText}
          onChangeText={setMateriasText}
          style={styles.input}
          placeholder="Ej. Matemáticas, Física"
          placeholderTextColor="#78716c"
        />

        <Label text="URL de foto (opcional)" />
        <TextInput
          value={fotoUrl}
          onChangeText={setFotoUrl}
          autoCapitalize="none"
          style={styles.input}
          placeholder="https://…"
          placeholderTextColor="#78716c"
        />
        {fotoUrl ? (
          <Image
            source={{ uri: fotoUrl }}
            style={styles.preview}
            resizeMode="cover"
            accessibilityLabel="Vista previa de foto"
          />
        ) : null}

        {escuelasText ? (
          <>
            <Label text="Escuelas (registro)" />
            <Text style={styles.readonly}>{escuelasText}</Text>
          </>
        ) : null}

        {msg ? <Text style={styles.msg}>{msg}</Text> : null}

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveDisabled]}
          onPress={() => void guardar()}
          disabled={saving}
          activeOpacity={0.85}
        >
          <Text style={styles.saveText}>
            {saving ? "Guardando…" : "Guardar perfil"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function Label({ text }: { text: string }) {
  return <Text style={styles.label}>{text}</Text>;
}

const styles = RNStyleSheet.create({
  root: {
    width: "100%",
    minHeight: "100vh",
    backgroundColor: "#FFFBDB",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  backBtn: { alignSelf: "flex-start", padding: 8, marginBottom: 8 },
  backArrow: { fontSize: 28, color: "#806b63", fontWeight: "600" },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#806b63",
    marginBottom: 8,
  },
  hint: { fontSize: 14, color: "#57534e", marginBottom: 16, lineHeight: 20 },
  emailLine: { fontSize: 14, color: "#44403c", marginBottom: 16 },
  label: {
    fontSize: 15,
    fontWeight: "700",
    color: "#292524",
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e7e5e4",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 4,
    outlineStyle: "none",
  },
  readonly: {
    fontSize: 15,
    color: "#57534e",
    marginBottom: 12,
  },
  preview: {
    width: 96,
    height: 96,
    borderRadius: 8,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: "#e7e5e4",
  },
  msg: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "600",
    color: "#166534",
    textAlign: "center",
  },
  saveBtn: {
    marginTop: 24,
    backgroundColor: "#B6F0FF",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  saveDisabled: { opacity: 0.6 },
  saveText: { fontSize: 16, fontWeight: "700", color: "#1c1917" },
  loading: { textAlign: "center", marginTop: 40, color: "#57534e" },
});
