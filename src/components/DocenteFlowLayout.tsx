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
  children: React.ReactNode;
};

export default function DocenteFlowLayout({ onBack, children }: Props) {
  return (
    <View style={styles.root}>
      <TouchableOpacity
        style={styles.backBtn}
        onPress={onBack}
        activeOpacity={0.7}
        accessibilityLabel="Volver"
      >
        <Text style={styles.backArrow}>←</Text>
      </TouchableOpacity>

      <View style={styles.logoWrap}>
        <Image
          accessibilityLabel="Logo Locker"
          alt="Logo Locker"
          source={{ uri: "/logo.png" }}
          style={styles.logoLarge}
          resizeMode="contain"
        />
      </View>

      {children}
    </View>
  );
}

const styles = RNStyleSheet.create({
  root: {
    width: "100%",
    minHeight: "100vh",
    backgroundColor: "#FFFBDB",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  backBtn: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  backArrow: {
    fontSize: 28,
    color: "#806b63",
    fontWeight: "600",
    lineHeight: 32,
  },
  logoWrap: {
    alignItems: "center",
    marginBottom: 28,
  },
  logoLarge: {
    width: "72%",
    maxWidth: 280,
    height: 200,
  },
});
