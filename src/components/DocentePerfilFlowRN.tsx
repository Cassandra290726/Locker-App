"use client";

import type { ChangeEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet as RNStyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native-web";

import type { DocentePerfilPublico } from "@/lib/authShared";
import { GRADIENTS } from "@/lib/lockerTheme";
import {
  hayErroresPerfilPublico,
  validarPerfilPublico,
  type ErroresPerfilPublico,
} from "@/lib/authShared";

type Screen =
  | "intro"
  | "form"
  | "fotoConfirm"
  | "cancelConfirm"
  | "success"
  | "main"
  | "deleteConfirm";

type FormOrigin = "intro" | "main";

const gradAgregar = {
  backgroundImage:
    "linear-gradient(165deg, #e5ffd8 0%, #CEFFB4 42%, #a8e890 100%)",
} as const;

const gradGuardar = {
  backgroundImage:
    "linear-gradient(165deg, #d8f8ff 0%, #B6F0FF 42%, #7dd4ed 100%)",
} as const;

const gradSiNo = {
  backgroundImage:
    "linear-gradient(165deg, #e5ffd8 0%, #CEFFB4 42%, #a8e890 100%)",
} as const;

const gradEliminar = {
  backgroundImage: GRADIENTS.pinkCancel,
} as const;

const gradEditar = {
  backgroundImage:
    "linear-gradient(165deg, #d8f8ff 0%, #B6F0FF 42%, #7dd4ed 100%)",
} as const;

const gradAgregarPerfil = {
  backgroundImage: GRADIENTS.purpleSave,
} as const;

type Props = {
  onClose: () => void;
};

const Header = ({
  onBack,
  showLogoRight = true,
  centerTitle,
}: {
  onBack: () => void;
  showLogoRight?: boolean;
  centerTitle?: string;
}) => (
  <View style={hdrStyles.wrap}>
    <View style={hdrStyles.row}>
      <TouchableOpacity
        style={hdrStyles.back}
        onPress={onBack}
        accessibilityLabel="Volver"
      >
        <Text style={hdrStyles.backTxt}>←</Text>
      </TouchableOpacity>
      {centerTitle ? (
        <Text style={hdrStyles.centerTitle}>{centerTitle}</Text>
      ) : (
        <View style={hdrStyles.spacer} />
      )}
      {showLogoRight ? (
        <Image
          accessibilityLabel="Logo Locker"
          alt=""
          source={{ uri: "/logo.png" }}
          style={hdrStyles.logo}
          resizeMode="contain"
        />
      ) : (
        <View style={hdrStyles.logoPlaceholder} />
      )}
    </View>
  </View>
);

export default function DocentePerfilFlowRN({ onClose }: Props) {
  const [screen, setScreen] = useState<Screen>("intro");
  const [formOrigin, setFormOrigin] = useState<FormOrigin>("intro");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cuentaEmail, setCuentaEmail] = useState("");

  const [apellidoPaterno, setApellidoPaterno] = useState("");
  const [apellidoMaterno, setApellidoMaterno] = useState("");
  const [nombres, setNombres] = useState("");
  const [escuelas, setEscuelas] = useState<string[]>([]);
  const [escuelaDraft, setEscuelaDraft] = useState("");
  const [materias, setMaterias] = useState<string[]>([]);
  const [materiaDraft, setMateriaDraft] = useState("");
  const [correos, setCorreos] = useState<string[]>([""]);
  const [telefonos, setTelefonos] = useState<string[]>([""]);
  const [escuelasRegistro, setEscuelasRegistro] = useState<string[]>([]);
  const [fotoUrl, setFotoUrl] = useState("");
  const [errs, setErrs] = useState<ErroresPerfilPublico>({});

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const aplicarPerfil = useCallback((p: DocentePerfilPublico) => {
    setApellidoPaterno(p.apellidoPaterno);
    setApellidoMaterno(p.apellidoMaterno);
    setNombres(p.nombres);
    setEscuelas([...(p.escuelas ?? [])]);
    setMaterias([...p.materias]);
    setCorreos(p.correos?.length ? [...p.correos] : [""]);
    setTelefonos(p.telefonos?.length ? [...p.telefonos] : [""]);
    setFotoUrl(p.fotoUrl ?? "");
  }, []);

  const recargarEstado = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/docente/perfil?estado=1", {
      credentials: "include",
    });
    if (!res.ok) {
      setLoading(false);
      setScreen("intro");
      return;
    }
    const data = (await res.json()) as {
      tienePerfil?: boolean;
      perfil?: DocentePerfilPublico | null;
      email?: string;
      escuelasRegistro?: string[];
    };
    setCuentaEmail(data.email ?? "");
    setEscuelasRegistro(data.escuelasRegistro ?? []);
    if (data.tienePerfil && data.perfil) {
      aplicarPerfil(data.perfil);
      setScreen("main");
    } else {
      setScreen("intro");
    }
    setLoading(false);
  }, [aplicarPerfil]);

  useEffect(() => {
    void recargarEstado();
  }, [recargarEstado]);

  function irFormulario(desde: FormOrigin) {
    setFormOrigin(desde);
    setErrs({});
    if (desde === "intro") {
      setApellidoPaterno("");
      setApellidoMaterno("");
      setNombres("");
      const fromReg = escuelasRegistro.filter(Boolean);
      setEscuelas(fromReg.length ? [...fromReg] : []);
      setEscuelaDraft("");
      setMaterias([]);
      setMateriaDraft("");
      setCorreos([cuentaEmail || ""]);
      setTelefonos([""]);
      setFotoUrl("");
    }
    setScreen("form");
  }

  function pickFoto() {
    fileInputRef.current?.click();
  }

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f || !f.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const r = reader.result;
      if (typeof r === "string") setFotoUrl(r);
    };
    reader.readAsDataURL(f);
    e.target.value = "";
  }

  function agregarMateria() {
    const t = materiaDraft.trim();
    if (!t) return;
    setMaterias((m) => [...m, t]);
    setMateriaDraft("");
  }

  function agregarEscuela() {
    const t = escuelaDraft.trim();
    if (!t) return;
    setEscuelas((e) => (e.includes(t) ? e : [...e, t]));
    setEscuelaDraft("");
    setErrs((er) => ({ ...er, escuelas: undefined }));
  }

  function quitarEscuela(idx: number) {
    setEscuelas((e) => e.filter((_, i) => i !== idx));
  }

  function agregarCorreo() {
    if (correos.length >= 3) return;
    setCorreos((c) => [...c, ""]);
  }

  function agregarTelefono() {
    if (telefonos.length >= 3) return;
    setTelefonos((t) => [...t, ""]);
  }

  function intentarGuardar() {
    const input = {
      apellidoPaterno,
      apellidoMaterno,
      nombres,
      escuelas,
      materias,
      correos: correos.map((c) => c.trim()).filter(Boolean),
      telefonos: telefonos.map((t) => t.trim()).filter(Boolean),
    };
    const v = validarPerfilPublico(input);
    setErrs(v);
    if (hayErroresPerfilPublico(v)) return;
    if (!fotoUrl.trim()) {
      setScreen("fotoConfirm");
      return;
    }
    void guardar();
  }

  async function guardar() {
    const input = {
      apellidoPaterno,
      apellidoMaterno,
      nombres,
      escuelas,
      materias,
      correos: correos.map((c) => c.trim()).filter(Boolean),
      telefonos: telefonos.map((t) => t.trim()).filter(Boolean),
      fotoUrl: fotoUrl.trim() || undefined,
    };
    const v = validarPerfilPublico(input);
    setErrs(v);
    if (hayErroresPerfilPublico(v)) return;

    setSaving(true);
    const res = await fetch("/api/docente/perfil", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    setSaving(false);
    if (!res.ok) {
      const data = (await res.json()) as { errors?: ErroresPerfilPublico };
      if (data.errors) setErrs(data.errors);
      return;
    }
    setScreen("success");
  }

  async function eliminarPerfil() {
    setSaving(true);
    const res = await fetch("/api/docente/perfil", {
      method: "DELETE",
      credentials: "include",
    });
    setSaving(false);
    if (res.ok) {
      setScreen("intro");
    }
  }


  const hiddenFileInput = (
    <input
      ref={(el: HTMLInputElement | null) => {
        fileInputRef.current = el;
      }}
      type="file"
      accept="image/*"
      style={{ display: "none" }}
      onChange={onFileChange}
    />
  );

  if (loading) {
    return (
      <View style={styles.root}>
        {hiddenFileInput}
        <Text style={styles.loadingTxt}>Cargando…</Text>
      </View>
    );
  }

  /** Intro — Agrega los datos… */
  if (screen === "intro") {
    return (
      <View style={styles.root}>
        {hiddenFileInput}
        <Header onBack={onClose} showLogoRight={false} />
        <View style={styles.introLogoWrap}>
          <Image
            source={{ uri: "/logo.png" }}
            style={styles.introLogo}
            resizeMode="contain"
            accessibilityLabel="Logo Locker"
          />
        </View>
        <Text style={styles.introTitle}>Agrega los datos de tu perfil</Text>
        <Text style={styles.introSub}>
          Estos datos serán registrados con la intención de que sus alumnos puedan
          saber cómo contactarlo y pueda haber mejor comunicación entre docente y
          alumno
        </Text>
        <View style={{ height: 28 }} />
        <TouchableOpacity
          style={[styles.bigBtnIntro, gradAgregar]}
          onPress={() => irFormulario("intro")}
          activeOpacity={0.9}
        >
          <Text style={styles.introBtnTxt}>Agregar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  /** Formulario */
  if (screen === "form") {
    return (
      <View style={styles.root}>
        {hiddenFileInput}
        <Header onBack={() => setScreen(formOrigin === "intro" ? "intro" : "main")} />
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.formTop}>
            <View style={styles.fotoColumn}>
              <TouchableOpacity style={styles.fotoBox} onPress={pickFoto} activeOpacity={0.85}>
                {fotoUrl ? (
                  <Image
                    source={{ uri: fotoUrl }}
                    style={styles.fotoImg}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.fotoInner}>
                    <Text style={styles.fotoPlus}>＋</Text>
                    <Text style={styles.fotoLbl}>Añadir foto</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
            <View style={styles.namesCol}>
              <FieldLabel text="Apellido Paterno" />
              <TextInput
                value={apellidoPaterno}
                onChangeText={(t: string) => {
                  setApellidoPaterno(t);
                  setErrs((e) => ({ ...e, apellidoPaterno: undefined }));
                }}
                placeholder="Apellido paterno"
                placeholderTextColor="#786660"
                style={[styles.fieldGreen, errs.apellidoPaterno && styles.fieldErrBd]}
              />
              {errs.apellidoPaterno ? (
                <Text style={styles.fieldErr}>{errs.apellidoPaterno}</Text>
              ) : null}

              <FieldLabel text="Apellido Materno" />
              <TextInput
                value={apellidoMaterno}
                onChangeText={(t: string) => {
                  setApellidoMaterno(t);
                  setErrs((e) => ({ ...e, apellidoMaterno: undefined }));
                }}
                placeholder="Apellido materno"
                placeholderTextColor="#786660"
                style={[styles.fieldGreen, errs.apellidoMaterno && styles.fieldErrBd]}
              />
              {errs.apellidoMaterno ? (
                <Text style={styles.fieldErr}>{errs.apellidoMaterno}</Text>
              ) : null}

              <FieldLabel text="Nombre (s)" />
              <TextInput
                value={nombres}
                onChangeText={(t: string) => {
                  setNombres(t);
                  setErrs((e) => ({ ...e, nombres: undefined }));
                }}
                placeholder="Nombre(s)"
                placeholderTextColor="#786660"
                style={[styles.fieldGreen, errs.nombres && styles.fieldErrBd]}
              />
              {errs.nombres ? <Text style={styles.fieldErr}>{errs.nombres}</Text> : null}
            </View>
          </View>

          <FieldLabel text="Escuela" />
          <View style={[styles.fieldGreenArea, errs.escuelas && styles.fieldErrBd]}>
            {escuelas.map((e, i) => (
              <View key={`${e}-${i}`} style={styles.chipRow}>
                <Text style={styles.materiaItem}>• {e}</Text>
                <TouchableOpacity onPress={() => quitarEscuela(i)} activeOpacity={0.8}>
                  <Text style={styles.chipRemove}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            <View style={styles.materiaRow}>
              <TextInput
                value={escuelaDraft}
                onChangeText={setEscuelaDraft}
                placeholder="Agregar escuela"
                placeholderTextColor="#786660"
                style={styles.materiaInputInner}
              />
              <TouchableOpacity
                style={[styles.materiaAdd, gradAgregarPerfil]}
                onPress={agregarEscuela}
              >
                <Text style={styles.materiaAddTxt}>Agregar</Text>
              </TouchableOpacity>
            </View>
          </View>
          {errs.escuelas ? <Text style={styles.fieldErr}>{errs.escuelas}</Text> : null}

          <FieldLabel text="Materias" />
          <View style={[styles.fieldGreenArea, errs.materias && styles.fieldErrBd]}>
            {materias.map((m, i) => (
              <Text key={`${m}-${i}`} style={styles.materiaItem}>
                • {m}
              </Text>
            ))}
            <View style={styles.materiaRow}>
              <TextInput
                value={materiaDraft}
                onChangeText={setMateriaDraft}
                placeholder="Agregar materia"
                placeholderTextColor="#786660"
                style={styles.materiaInputInner}
              />
              <TouchableOpacity
                style={[styles.materiaAdd, gradAgregarPerfil]}
                onPress={agregarMateria}
              >
                <Text style={styles.materiaAddTxt}>Agregar</Text>
              </TouchableOpacity>
            </View>
          </View>
          {errs.materias ? <Text style={styles.fieldErr}>{errs.materias}</Text> : null}

          <FieldLabel text="Correo electrónico" showPlus onPlus={agregarCorreo} />
          {correos.map((c, i) => (
            <TextInput
              key={`cor-${i}`}
              value={c}
              onChangeText={(t: string) => {
                setCorreos((arr) => arr.map((v, j) => (j === i ? t : v)));
                setErrs((e) => ({ ...e, correos: undefined }));
              }}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="correo@ejemplo.com"
              placeholderTextColor="#786660"
              style={[
                styles.fieldGreen,
                errs.correos && styles.fieldErrBd,
                i > 0 && { marginTop: 8 },
              ]}
            />
          ))}
          {errs.correos ? <Text style={styles.fieldErr}>{errs.correos}</Text> : null}

          <FieldLabel text="Teléfono" showPlus onPlus={agregarTelefono} />
          {telefonos.map((t, i) => (
            <TextInput
              key={`tel-${i}`}
              value={t}
              onChangeText={(txt: string) => {
                const only = txt.replace(/\D/g, "");
                setTelefonos((arr) => arr.map((v, j) => (j === i ? only : v)));
                setErrs((e) => ({ ...e, telefonos: undefined }));
              }}
              keyboardType="phone-pad"
              placeholder="6641234567"
              placeholderTextColor="#786660"
              style={[
                styles.fieldGreen,
                errs.telefonos && styles.fieldErrBd,
                i > 0 && { marginTop: 8 },
              ]}
            />
          ))}
          {errs.telefonos ? <Text style={styles.fieldErr}>{errs.telefonos}</Text> : null}

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={styles.formFooter}>
          <TouchableOpacity
            onPress={() => setScreen("cancelConfirm")}
            style={styles.btnCancelTxt}
          >
            <Text style={styles.btnCancelLbl}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btnGuardar, gradGuardar, saving && { opacity: 0.65 }]}
            onPress={intentarGuardar}
            disabled={saving}
            activeOpacity={0.85}
          >
            <Text style={styles.btnGuardarTxt}>Guardar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  /** Sin foto — confirmar */
  if (screen === "fotoConfirm") {
    return (
      <View style={styles.root}>
        {hiddenFileInput}
        <Header onBack={() => setScreen("form")} showLogoRight />
        <View style={styles.centerBox}>
          <Text style={styles.confirmMsg}>¿Desea continuar sin foto de Perfil?</Text>
          <View style={{ height: 28 }} />
          <TouchableOpacity
            style={[styles.choiceBtn, gradSiNo]}
            onPress={() => void guardar()}
            disabled={saving}
            activeOpacity={0.9}
          >
            <Text style={styles.choiceTxt}>Sí</Text>
          </TouchableOpacity>
          <View style={{ height: 16 }} />
          <TouchableOpacity
            style={[styles.choiceBtn, gradSiNo]}
            onPress={() => setScreen("form")}
            activeOpacity={0.9}
          >
            <Text style={styles.choiceTxt}>No</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  /** Cancelar confirmación */
  if (screen === "cancelConfirm") {
    return (
      <View style={styles.root}>
        {hiddenFileInput}
        <Header onBack={() => setScreen("form")} showLogoRight />
        <View style={styles.centerBox}>
          <Text style={styles.confirmMsg}>¿Seguro que deseas cancelar?</Text>
          <View style={{ height: 28 }} />
          <TouchableOpacity
            style={[styles.choiceBtn, gradSiNo]}
            onPress={() => {
              if (formOrigin === "intro") {
                setScreen("intro");
              } else {
                void recargarEstado().then(() => setScreen("main"));
              }
            }}
            activeOpacity={0.9}
          >
            <Text style={styles.choiceTxt}>Sí</Text>
          </TouchableOpacity>
          <View style={{ height: 16 }} />
          <TouchableOpacity
            style={[styles.choiceBtn, gradSiNo]}
            onPress={() => setScreen("form")}
            activeOpacity={0.9}
          >
            <Text style={styles.choiceTxt}>No</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  /** Éxito tras guardar */
  if (screen === "success") {
    return (
      <View style={styles.root}>
        {hiddenFileInput}
        <Header
          onBack={() => setScreen("form")}
          showLogoRight
        />
        <View style={styles.centerBox}>
          <Text style={styles.successMsg}>
            ¡Felicidades! Tus datos se guardaron correctamente.
          </Text>
          <View style={{ height: 32 }} />
          <TouchableOpacity
            style={[styles.bigBtnIntro, gradAgregar]}
            onPress={() => {
              void recargarEstado();
              setScreen("main");
            }}
            activeOpacity={0.9}
          >
            <Text style={styles.introBtnTxt}>Siguiente</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  /** Eliminar confirmación */
  if (screen === "deleteConfirm") {
    return (
      <View style={styles.root}>
        {hiddenFileInput}
        <Header onBack={() => setScreen("main")} showLogoRight />
        <View style={styles.centerBox}>
          <Text style={styles.confirmMsg}>
            ¿Estás seguro de querer eliminar tu perfil?
          </Text>
          <View style={{ height: 28 }} />
          <TouchableOpacity
            style={[styles.choiceBtnWide, gradSiNo]}
            onPress={() => void eliminarPerfil()}
            disabled={saving}
            activeOpacity={0.9}
          >
            <Text style={styles.eliminarTxt}>Sí</Text>
          </TouchableOpacity>
          <View style={{ height: 16 }} />
          <TouchableOpacity
            style={[styles.choiceBtnWide, gradSiNo]}
            onPress={() => setScreen("main")}
            activeOpacity={0.9}
          >
            <Text style={styles.eliminarTxt}>No</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {hiddenFileInput}
      <Header onBack={onClose} showLogoRight />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.mainRow}>
          <View style={styles.avatarWrap}>
            {fotoUrl ? (
              <Image source={{ uri: fotoUrl }} style={styles.avatar} resizeMode="cover" />
            ) : (
              <Text style={styles.avatarPh}>👤</Text>
            )}
          </View>
          <View style={styles.mainNames}>
            <Text style={styles.nameMain}>{apellidoPaterno}</Text>
            <Text style={styles.nameMain}>{apellidoMaterno}</Text>
            <Text style={styles.nameMain}>{nombres}</Text>
          </View>
        </View>
        <SectionMultiline label="Escuela" items={escuelas} />
        <SectionMultiline label="Materias" items={materias} />
        <SectionMultiline label="Correo" items={correos} />
        <SectionMultiline label="Número" items={telefonos} />

        <View style={{ height: 24 }} />
        <View style={styles.twoBtns}>
          <TouchableOpacity
            style={[styles.halfBtn, gradEliminar]}
            onPress={() => setScreen("deleteConfirm")}
            activeOpacity={0.88}
          >
            <Text style={styles.eliminarTxt}>Eliminar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.halfBtn, gradEditar]}
            onPress={() => {
              aplicarPerfil({
                apellidoPaterno,
                apellidoMaterno,
                nombres,
                escuelas,
                materias,
                correos,
                telefonos,
                fotoUrl: fotoUrl || undefined,
              });
              irFormulario("main");
            }}
            activeOpacity={0.88}
          >
            <Text style={styles.eliminarTxt}>Editar</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function FieldLabel({
  text,
  showPlus,
  onPlus,
}: {
  text: string;
  showPlus?: boolean;
  onPlus?: () => void;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
      {showPlus ? (
        <TouchableOpacity onPress={onPlus} activeOpacity={0.75} accessibilityLabel={`Agregar ${text}`}>
          <Text style={styles.plusMark}>⊕</Text>
        </TouchableOpacity>
      ) : null}
      <Text style={styles.lbl}>{text}</Text>
    </View>
  );
}

function Section({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={styles.secLbl}>{label}</Text>
      <Text style={styles.secVal}>{value || "—"}</Text>
      <View style={styles.secLine} />
      <View style={[styles.secLine, { marginTop: 8 }]} />
    </View>
  );
}

function SectionMultiline({ label, items }: { label: string; items: string[] }) {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={styles.secLbl}>{label}</Text>
      {items.length > 0 ? (
        items.map((m, i) => (
          <Text key={i} style={styles.secVal}>
            • {m}
          </Text>
        ))
      ) : (
        <Text style={styles.secVal}>—</Text>
      )}
      <View style={styles.secLine} />
      <View style={[styles.secLine, { marginTop: 8 }]} />
    </View>
  );
}

const hdrStyles = RNStyleSheet.create({
  wrap: { marginBottom: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  back: { padding: 10, width: 48 },
  backTxt: { fontSize: 28, color: "#806b63", fontWeight: "700" },
  spacer: { flex: 1 },
  centerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "800",
    color: "#806b63",
  },
  logo: { width: 56, height: 56 },
  logoPlaceholder: { width: 56, height: 56 },
});

const styles = RNStyleSheet.create({
  root: {
    flex: 1,
    width: "100%",
    minHeight: "100vh",
    backgroundColor: "#FFFBDB",
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 28,
    maxWidth: 480,
    alignSelf: "center",
  },
  loadingTxt: { textAlign: "center", marginTop: 60, color: "#806b63", fontSize: 16 },

  introLogoWrap: { alignItems: "center", marginVertical: 20 },
  introLogo: { width: 180, height: 120 },
  introTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#806b63",
    textAlign: "center",
    marginBottom: 14,
    lineHeight: 30,
    fontFamily: "system-ui, 'Segoe UI', Roboto, sans-serif",
  },
  introSub: {
    fontSize: 14,
    color: "#806b63",
    lineHeight: 22,
    textAlign: "center",
    opacity: 0.95,
    marginHorizontal: 4,
  },
  bigBtnIntro: {
    borderRadius: 18,
    paddingVertical: 20,
    alignItems: "center",
    marginHorizontal: 8,
    marginTop: 8,
  },
  introBtnTxt: { fontSize: 18, fontWeight: "800", color: "#806b63" },

  formTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 8,
  },
  fotoColumn: { width: 110 },
  fotoBox: {
    width: 100,
    height: 112,
    borderWidth: 2,
    borderColor: "#806b63",
    borderRadius: 10,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  fotoImg: { width: 100, height: 112 },
  fotoInner: { alignItems: "center", paddingHorizontal: 4 },
  fotoPlus: {
    fontSize: 36,
    color: "#806b63",
    fontWeight: "300",
    lineHeight: 40,
    marginBottom: 4,
  },
  fotoLbl: { fontSize: 13, fontWeight: "700", color: "#806b63", textAlign: "center" },
  namesCol: { flex: 1 },

  lbl: { fontSize: 14, fontWeight: "700", color: "#806b63", marginBottom: 4 },
  plusMark: { fontSize: 16, color: "#806b63", marginRight: 4 },

  fieldGreen: {
    backgroundColor: "#CEFFB4",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: "#806b63",
    borderWidth: 1,
    borderColor: "#b8e89a",
    outlineStyle: "none",
    marginBottom: 4,
    fontFamily: "system-ui, sans-serif",
  },
  fieldGreenArea: {
    backgroundColor: "#CEFFB4",
    borderRadius: 14,
    padding: 12,
    minHeight: 100,
    borderWidth: 1,
    borderColor: "#b8e89a",
    marginBottom: 4,
  },
  fieldErrBd: {
    borderColor: "#dc2626",
    borderWidth: 2,
  },
  fieldErr: { fontSize: 12, color: "#b91c1c", marginBottom: 6 },

  materiaItem: {
    fontSize: 14,
    color: "#806b63",
    fontWeight: "600",
    marginBottom: 6,
  },
  materiaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  materiaInputInner: {
    flex: 1,
    backgroundColor: "#e8fad8",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: "#806b63",
    outlineStyle: "none",
  },
  materiaAdd: {
    backgroundColor: "#C8A8EB",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  materiaAddTxt: { color: "#1c1917", fontWeight: "700", fontSize: 13 },
  chipRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  chipRemove: { fontSize: 16, color: "#806b63", fontWeight: "800", padding: 4 },

  formFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: "#ecdcc8",
  },
  btnCancelTxt: {
    flex: 1,
    alignItems: "flex-start",
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  btnCancelLbl: { fontSize: 17, fontWeight: "700", color: "#806b63" },
  btnGuardar: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  btnGuardarTxt: { fontSize: 17, fontWeight: "800", color: "#806b63" },

  centerBox: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 8,
    minHeight: 320,
  },
  confirmMsg: {
    fontSize: 20,
    fontWeight: "700",
    color: "#806b63",
    textAlign: "center",
    lineHeight: 28,
  },
  successMsg: {
    fontSize: 20,
    fontWeight: "700",
    color: "#806b63",
    textAlign: "center",
    lineHeight: 30,
    paddingHorizontal: 8,
  },
  choiceBtn: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
  },
  choiceBtnWide: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    alignSelf: "stretch",
  },
  choiceTxt: { fontSize: 17, fontWeight: "800", color: "#806b63" },

  mainRow: { flexDirection: "row", gap: 14, marginBottom: 28, marginTop: 8 },
  avatarWrap: {
    width: 96,
    height: 96,
    borderWidth: 2,
    borderColor: "#806b63",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: { width: "100%", height: "100%" },
  avatarPh: { fontSize: 42 },
  mainNames: { flex: 1, justifyContent: "center", gap: 8 },
  nameMain: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1c1917",
    borderBottomWidth: 2,
    borderBottomColor: "#806b63",
    paddingBottom: 4,
  },

  secLbl: {
    fontSize: 18,
    fontWeight: "800",
    color: "#806b63",
    marginBottom: 8,
  },
  secVal: { fontSize: 15, color: "#44403c", marginBottom: 4 },
  secLine: { height: 2, backgroundColor: "#806b63", opacity: 0.45 },

  twoBtns: {
    flexDirection: "row",
    gap: 14,
    justifyContent: "center",
    marginTop: 8,
  },
  halfBtn: {
    flex: 1,
    maxWidth: 160,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  eliminarTxt: { fontSize: 16, fontWeight: "800", color: "#806b63" },
});
