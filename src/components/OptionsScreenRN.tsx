"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  StyleSheet as RNStyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native-web";

import {
  fetchSession,
  type SessionUser,
} from "@/lib/lockerAuth";

type Props = {
  user: SessionUser | null;
  onSignOut: () => void | Promise<void>;
};

export default function OptionsScreenRN({ user: initialUser, onSignOut }: Props) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(initialUser);

  useEffect(() => {
    if (initialUser) return;
    void fetchSession().then(setUser);
  }, [initialUser]);

  const roleLabel =
    user?.role === "docente" ? "Docente" : user?.role === "alumno" ? "Alumno/a" : "—";

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Opciones</Text>
      {user ? (
        <View style={styles.userBox}>
          <Text style={styles.userEmail}>{user.email}</Text>
          <Text style={styles.userRole}>{roleLabel}</Text>
        </View>
      ) : null}
      <Text style={styles.sub}>Agenda, perfil y más.</Text>

      <View style={styles.card}>
        <TouchableOpacity onPress={() => router.push("/agenda")} activeOpacity={0.7}>
          <Text style={styles.item}>· Agenda</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/perfil")} activeOpacity={0.7}>
          <Text style={styles.item}>· Perfil</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.out}
        onPress={() => void onSignOut()}
        activeOpacity={0.8}
      >
        <Text style={styles.outText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = RNStyleSheet.create({
  root: {
    width: "100%",
    minHeight: "100vh",
    backgroundColor: "#FFFBDB",
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#292524",
    marginBottom: 8,
  },
  userBox: {
    marginBottom: 12,
    gap: 4,
  },
  userEmail: {
    fontSize: 15,
    color: "#44403c",
    fontWeight: "600",
  },
  userRole: {
    fontSize: 14,
    color: "#57534e",
  },
  sub: {
    fontSize: 16,
    color: "#57534e",
    marginBottom: 28,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e7e5e4",
    gap: 12,
    marginBottom: 32,
  },
  item: {
    fontSize: 17,
    color: "#44403c",
  },
  out: {
    alignSelf: "flex-start",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: "#e7e5e4",
  },
  outText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1c1917",
  },
});
