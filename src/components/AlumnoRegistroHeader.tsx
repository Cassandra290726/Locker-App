"use client";

import {
  Image,
  StyleSheet as RNStyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native-web";

type Props = {
  onBack: () => void;
  title?: string;
  logoSize?: "small" | "large";
};

export default function AlumnoRegistroHeader({
  onBack,
  title = "Registro",
  logoSize = "small",
}: Props) {
  return (
    <>
      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          accessibilityLabel="Volver"
          activeOpacity={0.7}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
        <Image
          accessibilityLabel="Logo Locker"
          alt="Logo Locker"
          source={{ uri: "/logo.png" }}
          style={logoSize === "small" ? styles.logoSmall : styles.logoMed}
          resizeMode="contain"
        />
      </View>
      {logoSize === "large" ? (
        <View style={styles.logoCenterWrap}>
          <Image
            accessibilityLabel="Logo Locker"
            alt="Logo Locker"
            source={{ uri: "/logo.png" }}
            style={styles.logoLarge}
            resizeMode="contain"
          />
        </View>
      ) : null}
    </>
  );
}

const styles = RNStyleSheet.create({
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  backBtn: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    width: 44,
  },
  backArrow: {
    fontSize: 28,
    color: "#806b63",
    fontWeight: "600",
  },
  title: {
    flex: 1,
    fontSize: 22,
    fontWeight: "800",
    color: "#806b63",
    textAlign: "center",
  },
  logoSmall: {
    width: 52,
    height: 52,
  },
  logoMed: {
    width: 64,
    height: 64,
  },
  logoCenterWrap: {
    alignItems: "center",
    marginBottom: 32,
    marginTop: 8,
  },
  logoLarge: {
    width: "72%",
    maxWidth: 280,
    height: 180,
  },
});
