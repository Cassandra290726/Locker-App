export const FILTRO_TODAS_ID = "__todas__";

/** Paleta fija (orden importa; cada categoría ocupa un índice). */
export const COLORES_CATEGORIA = [
  "#EF5B5B",
  "#FF7F96",
  "#CEFFB4",
  "#B6F0FF",
  "#C9A7EB",
] as const;

export type NotaCategoria = {
  id: string;
  nombre: string;
  color: string;
};

export type TipoNotaDocente = "texto" | "lista";

export type ItemListaNota = {
  id: string;
  texto: string;
  hecho: boolean;
};

export type NotaDocente = {
  id: string;
  categoriaId: string;
  tipo: TipoNotaDocente;
  titulo: string;
  contenido: string;
  itemsLista: ItemListaNota[];
  updatedAt: string;
  createdAt: string;
};

export type DocenteNotasData = {
  categorias: NotaCategoria[];
  notas: NotaDocente[];
};

export function categoriasPorDefecto(): NotaCategoria[] {
  return COLORES_CATEGORIA.map((color, i) => ({
    id: `cat-${i + 1}`,
    nombre: `Categoría ${i + 1}`,
    color,
  }));
}

export function asegurarEstructuraNotas(data: Partial<DocenteNotasData>): DocenteNotasData {
  const defaults = categoriasPorDefecto();
  let categorias = Array.isArray(data.categorias) ? [...data.categorias] : [];

  if (categorias.length !== 5) {
    categorias = defaults.map((d, i) => ({
      id: categorias[i]?.id ?? d.id,
      nombre: (categorias[i]?.nombre ?? d.nombre).trim() || d.nombre,
      color: d.color,
    }));
  } else {
    categorias = categorias.map((c, i) => ({
      id: c.id || defaults[i].id,
      nombre: (c.nombre ?? "").trim() || defaults[i].nombre,
      color: COLORES_CATEGORIA[i] ?? c.color,
    }));
  }

  const notasRaw = Array.isArray(data.notas) ? data.notas : [];
  const notas: NotaDocente[] = notasRaw.map((raw) => {
    const n = raw as Partial<NotaDocente>;
    const tipo: TipoNotaDocente = n.tipo === "lista" ? "lista" : "texto";
    const itemsSrc: unknown[] = Array.isArray(n.itemsLista)
      ? (n.itemsLista as unknown[])
      : [];
    const itemsLista: ItemListaNota[] = itemsSrc
      .filter(
        (it): it is Record<string, unknown> =>
          typeof it === "object" && it !== null,
      )
      .map((it) => ({
        id: typeof it.id === "string" && it.id ? it.id : `it-${Math.random().toString(36).slice(2)}`,
        texto: typeof it.texto === "string" ? it.texto : "",
        hecho: Boolean(it.hecho),
      }));
    return {
      id: typeof n.id === "string" ? n.id : "",
      categoriaId: typeof n.categoriaId === "string" ? n.categoriaId : categorias[0]?.id ?? "",
      tipo,
      titulo: typeof n.titulo === "string" ? n.titulo : "Sin título",
      contenido: typeof n.contenido === "string" ? n.contenido : "",
      itemsLista: tipo === "lista" ? itemsLista : [],
      createdAt: typeof n.createdAt === "string" ? n.createdAt : new Date().toISOString(),
      updatedAt: typeof n.updatedAt === "string" ? n.updatedAt : new Date().toISOString(),
    };
  }).filter((n) => n.id.length > 0);
  return { categorias, notas };
}

export function formatoFechaNota(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}-${mm}`;
}

export function previewTextoPlano(text: string, max = 120): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).trim()}…`;
}

export function previewNota(nota: NotaDocente, max = 120): string {
  if (nota.tipo === "lista" && nota.itemsLista.length > 0) {
    const linea = nota.itemsLista
      .map((i) => (i.hecho ? `☑ ${i.texto}` : `☐ ${i.texto}`))
      .filter((s) => s.replace(/[☐☑]\s*/, "").length > 0)
      .join(" · ");
    return previewTextoPlano(linea || "Lista", max);
  }
  return previewTextoPlano(nota.contenido, max);
}
