import { createClient } from "@supabase/supabase-js";

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy.supabase.co";
if (!supabaseUrl.startsWith("http")) supabaseUrl = "https://dummy.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "dummy";

// Creamos el cliente de Supabase usando la service role key en el servidor
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
  },
});

// Tipos compartidos para base de datos
export type DBAccount = {
  email: string;
  password_hash: string;
  role: "docente" | "alumno";
  verified: boolean;
  docente_profile: Record<string, unknown> | null;
  alumno_profile: Record<string, unknown> | null;
};

export type DBClase = {
  id: string;
  email: string;
  materia: string;
  dia: string;
  hora_inicio: string;
  hora_final: string;
  salon: string;
};

export type DBNota = {
  id: string;
  email: string;
  titulo: string;
  contenido: string;
  categoria_id: string;
  tipo: "texto" | "lista";
  items_lista: Record<string, unknown>[] | null;
  created_at: string;
  updated_at: string;
};

export type DBVerification = {
  email: string;
  code: string;
  role: string;
  created_at: string;
};

// Cliente de base de datos abstracta para facilitar cambios de motor de BD en el futuro
export const db = {
  // --- ACCOUNTS & PROFILES ---
  async getAccount(email: string): Promise<DBAccount | null> {
    const { data, error } = await supabase
      .from("accounts")
      .select("*")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    if (error) {
      console.error("Error getAccount:", error);
      return null;
    }
    return data;
  },

  async createAccount(
    email: string,
    passwordHash: string,
    role: "docente" | "alumno",
    docenteProfile: Record<string, unknown> | null = null,
    alumnoProfile: Record<string, unknown> | null = null,
  ): Promise<void> {
    const { error } = await supabase.from("accounts").insert({
      email: email.toLowerCase().trim(),
      password_hash: passwordHash,
      role,
      verified: false,
      docente_profile: docenteProfile,
      alumno_profile: alumnoProfile,
    });

    if (error) {
      console.error("Error createAccount:", error);
      throw error;
    }
  },

  async updateAccount(email: string, patch: Partial<DBAccount>): Promise<void> {
    const { error } = await supabase
      .from("accounts")
      .update(patch)
      .eq("email", email.toLowerCase().trim());

    if (error) {
      console.error("Error updateAccount:", error);
      throw error;
    }
  },

  async verifyAccount(email: string): Promise<void> {
    await this.updateAccount(email, { verified: true });
  },

  async listDocentes(): Promise<DBAccount[]> {
    const { data, error } = await supabase
      .from("accounts")
      .select("*")
      .eq("role", "docente");

    if (error) {
      console.error("Error listDocentes:", error);
      return [];
    }
    return data || [];
  },

  async getDocenteCategorias(email: string): Promise<Record<string, unknown>[]> {
    const acc = await this.getAccount(email);
    return (acc?.docente_profile?.notas_categorias as Record<string, unknown>[]) || [];
  },

  async saveDocenteCategorias(email: string, categorias: Record<string, unknown>[]): Promise<void> {
    const acc = await this.getAccount(email);
    if (!acc) return;
    const docente_profile = { ...(acc.docente_profile || {}), notas_categorias: categorias };
    await this.updateAccount(email, { docente_profile });
  },

  // --- HORARIOS (ALUMNO) ---
  async listClasesAlumno(email: string): Promise<DBClase[]> {
    const { data, error } = await supabase
      .from("alumno_horarios")
      .select("*")
      .eq("email", email.toLowerCase().trim());

    if (error) {
      console.error("Error listClasesAlumno:", error);
      return [];
    }
    return data || [];
  },

  async addClaseAlumno(clase: DBClase): Promise<void> {
    const { error } = await supabase.from("alumno_horarios").insert(clase);
    if (error) {
      console.error("Error addClaseAlumno:", error);
      throw error;
    }
  },

  async updateClaseAlumno(id: string, email: string, patch: Omit<DBClase, "id" | "email">): Promise<void> {
    const { error } = await supabase
      .from("alumno_horarios")
      .update(patch)
      .eq("id", id)
      .eq("email", email.toLowerCase().trim());

    if (error) {
      console.error("Error updateClaseAlumno:", error);
      throw error;
    }
  },

  async deleteClaseAlumno(id: string, email: string): Promise<boolean> {
    const { error, count } = await supabase
      .from("alumno_horarios")
      .delete({ count: "exact" })
      .eq("id", id)
      .eq("email", email.toLowerCase().trim());

    if (error) {
      console.error("Error deleteClaseAlumno:", error);
      return false;
    }
    return true;
  },

  // --- HORARIOS (DOCENTE) ---
  async listClasesDocente(email: string): Promise<DBClase[]> {
    const { data, error } = await supabase
      .from("docente_horarios")
      .select("*")
      .eq("email", email.toLowerCase().trim());

    if (error) {
      console.error("Error listClasesDocente:", error);
      return [];
    }
    return data || [];
  },

  async addClaseDocente(clase: DBClase): Promise<void> {
    const { error } = await supabase.from("docente_horarios").insert(clase);
    if (error) {
      console.error("Error addClaseDocente:", error);
      throw error;
    }
  },

  async updateClaseDocente(id: string, email: string, patch: Omit<DBClase, "id" | "email">): Promise<void> {
    const { error } = await supabase
      .from("docente_horarios")
      .update(patch)
      .eq("id", id)
      .eq("email", email.toLowerCase().trim());

    if (error) {
      console.error("Error updateClaseDocente:", error);
      throw error;
    }
  },

  async deleteClaseDocente(id: string, email: string): Promise<boolean> {
    const { error } = await supabase
      .from("docente_horarios")
      .delete()
      .eq("id", id)
      .eq("email", email.toLowerCase().trim());

    if (error) {
      console.error("Error deleteClaseDocente:", error);
      return false;
    }
    return true;
  },

  // --- NOTAS (ALUMNO) ---
  async listNotasAlumno(email: string): Promise<DBNota[]> {
    const { data, error } = await supabase
      .from("alumno_notas")
      .select("*")
      .eq("email", email.toLowerCase().trim())
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error listNotasAlumno:", error);
      return [];
    }
    return data || [];
  },

  async saveNotasAlumnoList(email: string, notas: DBNota[]): Promise<void> {
    // Para simplificar, insertamos/actualizamos una a una o en lote
    if (notas.length === 0) return;
    const { error } = await supabase.from("alumno_notas").upsert(notas);
    if (error) {
      console.error("Error saveNotasAlumnoList:", error);
      throw error;
    }
  },

  async addNotaAlumno(nota: DBNota): Promise<void> {
    const { error } = await supabase.from("alumno_notas").insert(nota);
    if (error) {
      console.error("Error addNotaAlumno:", error);
      throw error;
    }
  },

  async updateNotaAlumno(id: string, email: string, patch: Partial<DBNota>): Promise<void> {
    const { error } = await supabase
      .from("alumno_notas")
      .update(patch)
      .eq("id", id)
      .eq("email", email.toLowerCase().trim());

    if (error) {
      console.error("Error updateNotaAlumno:", error);
      throw error;
    }
  },

  async deleteNotaAlumno(id: string, email: string): Promise<boolean> {
    const { error } = await supabase
      .from("alumno_notas")
      .delete()
      .eq("id", id)
      .eq("email", email.toLowerCase().trim());

    if (error) {
      console.error("Error deleteNotaAlumno:", error);
      return false;
    }
    return true;
  },

  // --- NOTAS (DOCENTE) ---
  async listNotasDocente(email: string): Promise<DBNota[]> {
    const { data, error } = await supabase
      .from("docente_notas")
      .select("*")
      .eq("email", email.toLowerCase().trim())
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error listNotasDocente:", error);
      return [];
    }
    return data || [];
  },

  async saveNotasDocenteList(email: string, notas: DBNota[]): Promise<void> {
    if (notas.length === 0) return;
    const { error } = await supabase.from("docente_notas").upsert(notas);
    if (error) {
      console.error("Error saveNotasDocenteList:", error);
      throw error;
    }
  },

  async addNotaDocente(nota: DBNota): Promise<void> {
    const { error } = await supabase.from("docente_notas").insert(nota);
    if (error) {
      console.error("Error addNotaDocente:", error);
      throw error;
    }
  },

  async updateNotaDocente(id: string, email: string, patch: Partial<DBNota>): Promise<void> {
    const { error } = await supabase
      .from("docente_notas")
      .update(patch)
      .eq("id", id)
      .eq("email", email.toLowerCase().trim());

    if (error) {
      console.error("Error updateNotaDocente:", error);
      throw error;
    }
  },

  async deleteNotaDocente(id: string, email: string): Promise<boolean> {
    const { error } = await supabase
      .from("docente_notas")
      .delete()
      .eq("id", id)
      .eq("email", email.toLowerCase().trim());

    if (error) {
      console.error("Error deleteNotaDocente:", error);
      return false;
    }
    return true;
  },

  // --- EMAIL VERIFICATIONS ---
  async getVerification(email: string): Promise<DBVerification | null> {
    const { data, error } = await supabase
      .from("email_verifications")
      .select("*")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    if (error) {
      console.error("Error getVerification:", error);
      return null;
    }
    return data;
  },

  async saveVerification(email: string, code: string, role: string): Promise<void> {
    const { error } = await supabase.from("email_verifications").upsert({
      email: email.toLowerCase().trim(),
      code,
      role,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Error saveVerification:", error);
      throw error;
    }
  },

  async deleteVerification(email: string): Promise<void> {
    const { error } = await supabase
      .from("email_verifications")
      .delete()
      .eq("email", email.toLowerCase().trim());

    if (error) {
      console.error("Error deleteVerification:", error);
      throw error;
    }
  },
};
