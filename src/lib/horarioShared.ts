/** Franjas horarias del calendario (referencia diseño Locker). */
export type FranjaHoraria = {
  label: string;
  horaInicio: string;
  horaFinal: string;
};

export const FRANJAS_DOCENTE: FranjaHoraria[] = [
  { label: "1:30 - 2:20", horaInicio: "13:30", horaFinal: "14:20" },
  { label: "2:20 - 3:10", horaInicio: "14:20", horaFinal: "15:10" },
  { label: "3:10 - 4:00", horaInicio: "15:10", horaFinal: "16:00" },
  { label: "4:00 - 4:30", horaInicio: "16:00", horaFinal: "16:30" },
  { label: "4:30 - 5:20", horaInicio: "16:30", horaFinal: "17:20" },
  { label: "5:20 - 6:10", horaInicio: "17:20", horaFinal: "18:10" },
  { label: "6:10 - 7:00", horaInicio: "18:10", horaFinal: "19:00" },
  { label: "7:00 - 7:30", horaInicio: "19:00", horaFinal: "19:30" },
];

export const COLUMNAS_DIA = [
  { key: "L", nombre: "Lunes" },
  { key: "M", nombre: "Martes" },
  { key: "Mi", nombre: "Miércoles" },
  { key: "J", nombre: "Jueves" },
  { key: "V", nombre: "Viernes" },
  { key: "S", nombre: "Sábado" },
  { key: "D", nombre: "Domingo" },
] as const;

export type DiaCalendarioKey = (typeof COLUMNAS_DIA)[number]["key"];

export type DocenteClaseGuardada = {
  id: string;
  materia: string;
  dia: DiaCalendarioKey;
  horaInicio: string;
  horaFinal: string;
  salon: string;
};

function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/** Nombres de día aceptados tal como los escribe el usuario (con o sin acentos / mayúsculas). */
export const NOMBRES_DIA_VALIDOS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
] as const;

/** Interpreta día: Lunes…Domingo (cualquier capitalización) o clave de columna L, M, Mi… */
export function normalizarDiaEntrada(raw: string): DiaCalendarioKey | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const porClave = COLUMNAS_DIA.find(
    (c) => c.key.toLowerCase() === trimmed.toLowerCase(),
  );
  if (porClave) return porClave.key;

  const t = stripAccents(trimmed.toLowerCase());

  const nombreCompleto: Partial<Record<string, DiaCalendarioKey>> = {
    lunes: "L",
    martes: "M",
    miercoles: "Mi",
    jueves: "J",
    viernes: "V",
    sabado: "S",
    sabados: "S",
    domingo: "D",
  };
  const porNombre = nombreCompleto[t];
  if (porNombre) return porNombre;

  const porNombreColumna = COLUMNAS_DIA.find(
    (c) => stripAccents(c.nombre.toLowerCase()) === t,
  );
  if (porNombreColumna) return porNombreColumna.key;

  if (t === "m") return "M";
  if (t === "mi") return "Mi";

  if (t.startsWith("lun")) return "L";
  if (t.startsWith("mar")) return "M";
  if (t.startsWith("mie")) return "Mi";
  if (t.startsWith("jue")) return "J";
  if (t.startsWith("vie")) return "V";
  if (t.startsWith("sab")) return "S";
  if (t.startsWith("dom")) return "D";

  return null;
}

/** Todos los días de la semana son válidos para registrar clases. */
export function esDiaHabilDocente(_d: DiaCalendarioKey): boolean {
  return true;
}

export const DIAS_VALIDOS_AYUDA =
  'Lunes, lunes, Martes, martes, Miércoles, miércoles, Jueves, jueves, Viernes, viernes, Sábado, sábado, Domingo o domingo.';

/** HH:mm 24 h */
export function parseHoraAMinutos(raw: string): number | null {
  const s = raw.trim().replace(/\s/g, "");
  const m = /^(\d{1,2}):(\d{2})$/.exec(s);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59 || h < 0 || min < 0) return null;
  return h * 60 + min;
}

export function formatoHoraValido(raw: string): boolean {
  return parseHoraAMinutos(raw) !== null;
}

export function claseSolapaFranja(
  horaInicio: string,
  horaFinal: string,
  franja: FranjaHoraria,
): boolean {
  const c0 = parseHoraAMinutos(horaInicio);
  const c1 = parseHoraAMinutos(horaFinal);
  const f0 = parseHoraAMinutos(franja.horaInicio);
  const f1 = parseHoraAMinutos(franja.horaFinal);
  if (c0 === null || c1 === null || f0 === null || f1 === null) return false;
  if (c1 <= c0) return false;
  return c0 < f1 && c1 > f0;
}

export type ErroresClaseCampos = {
  materia?: string;
  dia?: string;
  horaInicio?: string;
  horaFinal?: string;
  salon?: string;
};

/** Mensajes por campo para el formulario de clase (UI). */
export function validarFormularioClase(input: {
  materia: string;
  diaRaw: string;
  horaInicio: string;
  horaFinal: string;
  salon: string;
}): ErroresClaseCampos {
  const err: ErroresClaseCampos = {};

  if (!input.materia.trim()) {
    err.materia = "Escribe la materia.";
  }

  const diaNorm = normalizarDiaEntrada(input.diaRaw);
  if (!diaNorm) {
    err.dia = !input.diaRaw.trim()
      ? "Indica el día."
      : `Día no reconocido. Usa: ${DIAS_VALIDOS_AYUDA}`;
  } else if (!esDiaHabilDocente(diaNorm)) {
    err.dia = `Día no válido. Usa: ${DIAS_VALIDOS_AYUDA}`;
  }

  if (!formatoHoraValido(input.horaInicio)) {
    err.horaInicio =
      !input.horaInicio.trim()
        ? "Indica la hora de inicio."
        : "Usa formato HH:mm en 24 h (ej. 13:30).";
  }

  if (!formatoHoraValido(input.horaFinal)) {
    err.horaFinal =
      !input.horaFinal.trim()
        ? "Indica la hora final."
        : "Usa formato HH:mm en 24 h (ej. 14:20).";
  }

  const i0 = parseHoraAMinutos(input.horaInicio);
  const i1 = parseHoraAMinutos(input.horaFinal);
  if (
    i0 !== null &&
    i1 !== null &&
    i1 <= i0 &&
    !err.horaInicio &&
    !err.horaFinal
  ) {
    err.horaFinal = "La hora final debe ser después de la hora de inicio.";
  }

  if (!input.salon.trim()) {
    err.salon = "Indica salón y edificio cuando aplique.";
  }

  return err;
}

export function hayErroresClase(err: ErroresClaseCampos): boolean {
  return Object.keys(err).length > 0;
}
