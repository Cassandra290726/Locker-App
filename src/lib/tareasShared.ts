import type { DiaCalendarioKey } from "@/lib/horarioShared";

/** Tarea pendiente ligada a una clase del horario del alumno. */
export type AlumnoTareaPendiente = {
  id: string;
  claseId: string;
  claseMateria: string;
  claseDia: DiaCalendarioKey;
  claseHoraInicio: string;
  claseHoraFinal: string;
  claseSalon: string;
  nombre: string;
  descripcion: string;
  entregaHoraInicio: string;
  entregaHoraFinal: string;
  createdAt: string;
  updatedAt: string;
};

export type AlumnoTareaInput = {
  claseId: string;
  claseMateria: string;
  claseDia: DiaCalendarioKey;
  claseHoraInicio: string;
  claseHoraFinal: string;
  claseSalon: string;
  nombre: string;
  descripcion: string;
  entregaHoraInicio: string;
  entregaHoraFinal: string;
};
