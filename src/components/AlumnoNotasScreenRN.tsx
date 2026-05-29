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

import DocenteNotaEditorScreenRN from "@/components/DocenteNotaEditorScreenRN";
import NotasCategoriasScrollRN from "@/components/NotasCategoriasScrollRN";
import { GRADIENTS } from "@/lib/lockerTheme";
import {
  eliminarNotaAlumnoApi,
  fetchAlumnoNotas,
  guardarCategoriasAlumnoApi,
} from "@/lib/alumnoNotasClient";
import {
  FILTRO_TODAS_ID,
  formatoFechaNota,
  previewNota,
  type DocenteNotasData,
  type NotaCategoria,
  type NotaDocente,
  type TipoNotaDocente,
} from "@/lib/notasShared";

type EditorOpen =
  | { mode: "new"; tipo: TipoNotaDocente }
  | { mode: "edit"; nota: NotaDocente };

type Props = {
  onBack: () => void;
};

export default function AlumnoNotasScreenRN({ onBack }: Props) {
  const [data, setData] = useState<DocenteNotasData | null>(null);
  const [filterId, setFilterId] = useState<string>(FILTRO_TODAS_ID);
  const [catModal, setCatModal] = useState(false);
  const [draftCats, setDraftCats] = useState<NotaCategoria[]>([]);
  const [editor, setEditor] = useState<EditorOpen | null>(null);
  const [agregarModal, setAgregarModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [savingCats, setSavingCats] = useState(false);

  const reload = useCallback(async () => {
    const d = await fetchAlumnoNotas();
    setData(d);
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => void reload(), 0);
    return () => window.clearTimeout(id);
  }, [reload]);

  function abrirEditorCategorias() {
    if (!data) return;
    setDraftCats(JSON.parse(JSON.stringify(data.categorias)) as NotaCategoria[]);
    setCatModal(true);
  }

  async function hechoCategorias() {
    setSavingCats(true);
    const ok = await guardarCategoriasAlumnoApi(draftCats);
    setSavingCats(false);
    if (ok) {
      await reload();
      setCatModal(false);
    }
  }

  if (editor !== null && data) {
    const defaultCat =
      filterId !== FILTRO_TODAS_ID
        ? filterId
        : data.categorias[0]?.id ?? "";
    const key =
      editor.mode === "edit" ? editor.nota.id : `new-${editor.tipo}`;
    const tipoInicial: TipoNotaDocente =
      editor.mode === "edit" ? editor.nota.tipo : editor.tipo;
    return (
      <DocenteNotaEditorScreenRN
        key={key}
        categorias={data.categorias}
        nota={editor.mode === "edit" ? editor.nota : null}
        tipoInicial={tipoInicial}
        defaultCategoriaId={
          editor.mode === "edit" ? editor.nota.categoriaId : defaultCat
        }
        onClose={() => setEditor(null)}
        onSaved={() => void reload()}
        apiMode="alumno"
      />
    );
  }

  if (!data) {
    return (
      <View style={styles.root}>
        <Text style={styles.loadingText}>Cargando…</Text>
      </View>
    );
  }

  const notasOrdenadas = [...data.notas].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  const notasVisibles =
    filterId === FILTRO_TODAS_ID
      ? notasOrdenadas
      : notasOrdenadas.filter((n) => n.categoriaId === filterId);

  return (
    <View style={styles.root}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onBack} style={styles.backWrap} activeOpacity={0.7}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.titleCenter}>Notas</Text>
        <Image
          accessibilityLabel="Logo Locker"
          alt="Logo Locker"
          source={{ uri: "/logo.png" }}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <NotasCategoriasScrollRN
        categorias={data.categorias}
        filterId={filterId}
        onFilterChange={setFilterId}
        onEditCategorias={abrirEditorCategorias}
      />

      <Text style={styles.sectionLabel}>Notas</Text>

      <ScrollView style={styles.listScroll} contentContainerStyle={styles.listContent}>
        {notasVisibles.length === 0 ? (
          <Text style={styles.empty}>No hay notas en esta categoría.</Text>
        ) : (
          notasVisibles.map((n) => {
            const cat = data.categorias.find((c) => c.id === n.categoriaId);
            const accent = cat?.color ?? "#78716c";
            return (
              <View key={n.id} style={[styles.card, { borderLeftColor: accent }]}>
                <TouchableOpacity
                  style={styles.cardTap}
                  onPress={() => setEditor({ mode: "edit", nota: n })}
                  activeOpacity={0.9}
                >
                  <Text style={styles.cardTitle}>{n.titulo || "Sin título"}</Text>
                  {n.tipo === "lista" || n.contenido.trim() || n.itemsLista.length ? (
                    <Text style={styles.cardPreview} numberOfLines={3}>
                      {previewNota(n)}
                    </Text>
                  ) : null}
                  <View style={styles.cardFooter}>
                    <Text style={styles.cardDate}>📅 {formatoFechaNota(n.updatedAt)}</Text>
                    {n.tipo === "lista" ? (
                      <Text style={styles.cardListaMark}> ✓ Lista</Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => void (async () => {
                    if (deletingId) return;
                    setDeletingId(n.id);
                    const { ok } = await eliminarNotaAlumnoApi(n.id);
                    setDeletingId(null);
                    if (ok) await reload();
                  })()}
                  disabled={deletingId === n.id}
                  activeOpacity={0.8}
                  accessibilityLabel="Eliminar nota"
                >
                  <Text style={styles.deleteBtnTxt}>
                    {deletingId === n.id ? "…" : "Eliminar"}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setAgregarModal(true)}
        activeOpacity={0.88}
        accessibilityLabel="Nueva nota"
      >
        <Text style={styles.fabIcon}>✏️</Text>
      </TouchableOpacity>

      {agregarModal ? (
        <View style={[styles.modalBackdrop, styles.modalBackdropStack]}>
          <TouchableOpacity
            style={styles.agregarBackdropTap}
            activeOpacity={1}
            onPress={() => setAgregarModal(false)}
            accessibilityLabel="Cerrar"
          />
          <View style={styles.agregarSheet}>
            <Text style={styles.agregarTitle}>Agregar</Text>
            <View style={styles.agregarRow}>
              <TouchableOpacity
                style={styles.agregarChoice}
                onPress={() => {
                  setAgregarModal(false);
                  setEditor({ mode: "new", tipo: "texto" });
                }}
                activeOpacity={0.88}
              >
                <Text style={styles.agregarChoiceIcon}>📄</Text>
                <Text style={styles.agregarChoiceLabel}>TXT</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.agregarChoice}
                onPress={() => {
                  setAgregarModal(false);
                  setEditor({ mode: "new", tipo: "lista" });
                }}
                activeOpacity={0.88}
              >
                <Text style={styles.agregarChoiceIcon}>☑</Text>
                <Text style={[styles.agregarChoiceLabel, styles.agregarChoiceLabelSmall]}>
                  Lista de verificación
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : null}

      {catModal ? (
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar</Text>
              <TouchableOpacity onPress={() => void hechoCategorias()} disabled={savingCats}>
                <Text style={styles.modalHecho}>{savingCats ? "…" : "Hecho"}</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalHint}>
              Personaliza el nombre de cada categoría (los colores son fijos).
            </Text>
            <ScrollView style={styles.modalList}>
              {draftCats.map((c, idx) => (
                <View key={c.id} style={styles.catEditRow}>
                  <Text style={styles.dragHandle}>≡</Text>
                  <View style={[styles.colorDot, { backgroundColor: c.color }]} />
                  <TextInput
                    value={c.nombre}
                    onChangeText={(t: string) => {
                      setDraftCats((prev) =>
                        prev.map((row, i) => (i === idx ? { ...row, nombre: t } : row)),
                      );
                    }}
                    placeholder="Sin título"
                    placeholderTextColor="#a8a29e"
                    style={styles.catNameInput}
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = RNStyleSheet.create({
  root: {
    flex: 1,
    width: "100%",
    minHeight: "100vh",
    backgroundColor: "#FFFBDB",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 100,
  },
  loadingText: {
    textAlign: "center",
    marginTop: 48,
    color: "#806b63",
    fontSize: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: 8,
  },
  backWrap: {
    paddingVertical: 8,
    width: 44,
  },
  backArrow: {
    fontSize: 28,
    color: "#806b63",
    fontWeight: "600",
  },
  titleCenter: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "800",
    color: "#806b63",
  },
  logo: {
    width: 52,
    height: 52,
  },
  catRowOuter: {
    marginBottom: 10,
  },
  catScroll: {
    maxHeight: 48,
  },
  catScrollContent: {
    alignItems: "center",
    gap: 10,
    paddingRight: 8,
  },
  pill: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 22,
    maxWidth: 140,
  },
  pillTodas: {
    backgroundColor: "#e7e5e4",
  },
  pillSelected: {
    borderWidth: 2,
    borderColor: "#292524",
  },
  pillRing: {
    borderWidth: 2,
    borderColor: "#292524",
  },
  pillText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1c1917",
  },
  pillTextSelected: {
    color: "#1c1917",
  },
  pencilBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d6d3d1",
    alignItems: "center",
    justifyContent: "center",
  },
  pencilIcon: {
    fontSize: 18,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#78716c",
    marginBottom: 10,
    marginTop: 4,
  },
  listScroll: {
    flex: 1,
  },
  listContent: {
    gap: 12,
    paddingBottom: 24,
  },
  empty: {
    color: "#78716c",
    textAlign: "center",
    marginTop: 24,
    fontSize: 15,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 5,
    borderWidth: 1,
    borderColor: "#e7e5e4",
    gap: 8,
  },
  cardTap: { flex: 1 },
  deleteBtn: {
    alignSelf: "flex-end",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#FE7F96",
    backgroundImage: GRADIENTS.pinkCancel,
  },
  deleteBtnTxt: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1c1917",
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1c1917",
    marginBottom: 6,
  },
  cardPreview: {
    fontSize: 14,
    color: "#57534e",
    lineHeight: 20,
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  cardListaMark: {
    fontSize: 12,
    color: "#78716c",
    fontWeight: "600",
  },
  cardDate: {
    fontSize: 12,
    color: "#78716c",
  },
  fab: {
    position: "fixed",
    right: 24,
    bottom: 28,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
  },
  fabIcon: {
    fontSize: 24,
  },
  agregarBackdropTap: {
    flex: 1,
    width: "100%",
    minHeight: 48,
  },
  agregarSheet: {
    backgroundColor: "#292524",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
  },
  agregarTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fafaf9",
    textAlign: "center",
    marginBottom: 20,
  },
  agregarRow: {
    flexDirection: "row",
    gap: 16,
    justifyContent: "center",
  },
  agregarChoice: {
    flex: 1,
    maxWidth: 160,
    aspectRatio: 1,
    backgroundColor: "#2563eb",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    gap: 8,
  },
  agregarChoiceIcon: {
    fontSize: 36,
  },
  agregarChoiceLabel: {
    fontSize: 16,
    fontWeight: "800",
    color: "#ffffff",
  },
  agregarChoiceLabelSmall: {
    fontSize: 13,
    textAlign: "center",
  },
  modalBackdrop: {
    position: "fixed",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
    zIndex: 50,
  },
  modalBackdropStack: {
    flexDirection: "column",
    height: "100%",
  },
  modalSheet: {
    backgroundColor: "#FFFBDB",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "88%",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderColor: "#e7e5e4",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#292524",
  },
  modalHecho: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2563eb",
  },
  modalHint: {
    fontSize: 13,
    color: "#57534e",
    marginBottom: 14,
  },
  modalList: {
    maxHeight: 400,
  },
  catEditRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e7e5e4",
  },
  dragHandle: {
    fontSize: 18,
    color: "#a8a29e",
    width: 24,
    textAlign: "center",
  },
  colorDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.15)",
  },
  catNameInput: {
    flex: 1,
    fontSize: 16,
    color: "#1c1917",
    paddingVertical: 6,
    outlineStyle: "none",
  },
});
