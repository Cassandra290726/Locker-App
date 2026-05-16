"use client";

import { useState } from "react";
import {
  ScrollView,
  StyleSheet as RNStyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native-web";

import { actualizarNotaApi, crearNotaApi } from "@/lib/notasClient";
import type {
  ItemListaNota,
  NotaCategoria,
  NotaDocente,
  TipoNotaDocente,
} from "@/lib/notasShared";

type Props = {
  categorias: NotaCategoria[];
  nota: NotaDocente | null;
  /** Solo para notas nuevas: define si es texto o lista. */
  tipoInicial: TipoNotaDocente;
  defaultCategoriaId: string;
  onClose: () => void;
  onSaved: () => void;
};

function newItem(): ItemListaNota {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `it-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return { id, texto: "", hecho: false };
}

function textoEditado(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const s = d.toLocaleString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return `Editado: ${s}`;
  } catch {
    return "";
  }
}

export default function DocenteNotaEditorScreenRN({
  categorias,
  nota,
  tipoInicial,
  defaultCategoriaId,
  onClose,
  onSaved,
}: Props) {
  const tipoFijo: TipoNotaDocente = nota ? nota.tipo : tipoInicial;

  const [titulo, setTitulo] = useState(() => nota?.titulo ?? "");
  const [contenido, setContenido] = useState(() =>
    nota?.tipo === "texto" ? nota.contenido : "",
  );
  const [items, setItems] = useState<ItemListaNota[]>(() =>
    nota?.tipo === "lista" && nota.itemsLista.length > 0
      ? nota.itemsLista.map((i) => ({ ...i }))
      : [newItem()],
  );
  const [categoriaId, setCategoriaId] = useState(
    () => nota?.categoriaId ?? defaultCategoriaId,
  );
  const [saving, setSaving] = useState(false);

  async function guardar() {
    setSaving(true);
    const cat = categorias.some((c) => c.id === categoriaId)
      ? categoriaId
      : categorias[0].id;

    if (nota) {
      const res = await actualizarNotaApi(nota.id, {
        titulo,
        categoriaId: cat,
        tipo: tipoFijo,
        contenido: tipoFijo === "texto" ? contenido : "",
        itemsLista:
          tipoFijo === "lista" ? items.map((i) => ({ ...i })) : undefined,
      });
      setSaving(false);
      if (res.ok) {
        onSaved();
        onClose();
      }
    } else {
      const res = await crearNotaApi({
        titulo: titulo.trim() || "Sin título",
        categoriaId: cat,
        tipo: tipoFijo,
        contenido: tipoFijo === "texto" ? contenido : "",
        itemsLista: tipoFijo === "lista" ? items : undefined,
      });
      setSaving(false);
      if (res.ok) {
        onSaved();
        onClose();
      }
    }
  }

  const catActiva =
    categorias.find((c) => c.id === categoriaId) ?? categorias[0];

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onClose} style={styles.iconBtn} activeOpacity={0.7}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => void guardar()}
          style={styles.iconBtn}
          disabled={saving}
          activeOpacity={0.75}
          accessibilityLabel="Guardar"
        >
          <Text style={styles.checkMark}>{saving ? "…" : "✓"}</Text>
        </TouchableOpacity>
      </View>

      {nota ? (
        <Text style={styles.metaEdit}>{textoEditado(nota.updatedAt)}</Text>
      ) : (
        <Text style={styles.metaEdit}>Nueva nota</Text>
      )}

      <Text style={styles.tipoBadge}>
        {tipoFijo === "lista" ? "Lista de verificación" : "Nota de texto"}
      </Text>

      <Text style={styles.catLabel}>Categoría</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.catScroll}
        contentContainerStyle={styles.catScrollInner}
      >
        {categorias.map((c) => {
          const on = c.id === categoriaId;
          return (
            <TouchableOpacity
              key={c.id}
              onPress={() => setCategoriaId(c.id)}
              style={[
                styles.catChipSmall,
                { backgroundColor: c.color },
                on && styles.catChipSmallOn,
              ]}
              activeOpacity={0.85}
            >
              <Text
                style={[styles.catChipSmallText, on && styles.catChipSmallTextOn]}
                numberOfLines={1}
              >
                {c.nombre}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.dotRow}>
        <View style={[styles.dot, { backgroundColor: catActiva.color }]} />
        <Text style={styles.dotLabel}>{catActiva.nombre}</Text>
      </View>

      <TextInput
        value={titulo}
        onChangeText={setTitulo}
        placeholder="Título"
        placeholderTextColor="#78716c"
        style={styles.titleInput}
      />
      <View style={styles.sep} />

      {tipoFijo === "texto" ? (
        <TextInput
          value={contenido}
          onChangeText={setContenido}
          placeholder="Ingresa el contenido aquí…"
          placeholderTextColor="#78716c"
          multiline
          style={styles.bodyInput}
        />
      ) : (
        <ScrollView style={styles.listaScroll} contentContainerStyle={styles.listaInner}>
          {items.map((row, idx) => (
            <View key={row.id} style={styles.listaRow}>
              <TouchableOpacity
                style={styles.checkTap}
                onPress={() =>
                  setItems((prev) =>
                    prev.map((r, i) =>
                      i === idx ? { ...r, hecho: !r.hecho } : r,
                    ),
                  )
                }
                activeOpacity={0.75}
                accessibilityLabel={row.hecho ? "Marcar pendiente" : "Marcar hecho"}
              >
                <Text style={styles.checkBox}>{row.hecho ? "☑" : "☐"}</Text>
              </TouchableOpacity>
              <TextInput
                value={row.texto}
                onChangeText={(t: string) =>
                  setItems((prev) =>
                    prev.map((r, i) => (i === idx ? { ...r, texto: t } : r)),
                  )
                }
                placeholder="Ítem"
                placeholderTextColor="#a8a29e"
                style={styles.listaInput}
              />
              <TouchableOpacity
                onPress={() =>
                  setItems((prev) =>
                    prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx),
                  )
                }
                style={styles.listaQuitar}
                activeOpacity={0.7}
                accessibilityLabel="Quitar ítem"
              >
                <Text style={styles.listaQuitarText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            style={styles.agregarItem}
            onPress={() => setItems((prev) => [...prev, newItem()])}
            activeOpacity={0.75}
          >
            <Text style={styles.agregarItemPlus}>+</Text>
            <Text style={styles.agregarItemText}>Agregar</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = RNStyleSheet.create({
  root: {
    flex: 1,
    width: "100%",
    minHeight: "100vh",
    backgroundColor: "#FFFBDB",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  iconBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    minWidth: 44,
  },
  backArrow: {
    fontSize: 28,
    color: "#806b63",
    fontWeight: "600",
  },
  checkMark: {
    fontSize: 22,
    fontWeight: "800",
    color: "#806b63",
  },
  metaEdit: {
    fontSize: 13,
    color: "#57534e",
    marginBottom: 8,
  },
  tipoBadge: {
    alignSelf: "flex-start",
    fontSize: 12,
    fontWeight: "700",
    color: "#806b63",
    backgroundColor: "rgba(128, 107, 99, 0.12)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  catLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#806b63",
    marginBottom: 6,
  },
  catScroll: {
    marginBottom: 10,
    maxHeight: 44,
  },
  catScrollInner: {
    gap: 8,
    paddingRight: 8,
  },
  catChipSmall: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    maxWidth: 160,
    borderWidth: 2,
    borderColor: "transparent",
  },
  catChipSmallOn: {
    borderColor: "#292524",
  },
  catChipSmallText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1c1917",
  },
  catChipSmallTextOn: {
    color: "#1c1917",
  },
  dotRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#44403c",
  },
  titleInput: {
    fontSize: 22,
    fontWeight: "800",
    color: "#292524",
    paddingVertical: 8,
    outlineStyle: "none",
  },
  sep: {
    height: 1,
    backgroundColor: "#d6d3d1",
    marginBottom: 12,
  },
  bodyInput: {
    flex: 1,
    minHeight: 320,
    fontSize: 16,
    lineHeight: 24,
    color: "#1c1917",
    outlineStyle: "none",
    textAlignVertical: "top",
  },
  listaScroll: {
    maxHeight: 420,
  },
  listaInner: {
    gap: 8,
    paddingBottom: 24,
  },
  listaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ffffff",
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "#e7e5e4",
  },
  checkTap: {
    padding: 4,
  },
  checkBox: {
    fontSize: 18,
    color: "#292524",
  },
  listaInput: {
    flex: 1,
    fontSize: 16,
    color: "#1c1917",
    paddingVertical: 6,
    outlineStyle: "none",
  },
  listaQuitar: {
    padding: 8,
  },
  listaQuitarText: {
    fontSize: 16,
    color: "#b91c1c",
    fontWeight: "700",
  },
  agregarItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  agregarItemPlus: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2563eb",
  },
  agregarItemText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2563eb",
  },
});
