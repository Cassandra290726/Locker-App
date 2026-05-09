"use client";

import { Image, StyleSheet as RNStyleSheet, View } from "react-native-web";

export default function SplashScreenRN() {
  return (
    <View style={styles.root}>
      <Image
        accessibilityLabel="Logo Locker"
        source={{ uri: "/logo.png" }}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = RNStyleSheet.create({
  root: {
    position: "fixed",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "#FFFBDB",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: "72%",
    maxWidth: 320,
    height: 280,
  },
});
