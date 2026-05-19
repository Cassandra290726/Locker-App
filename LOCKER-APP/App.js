import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { WebView } from "react-native-webview";

const DEFAULT_URL =
  process.env.EXPO_PUBLIC_LOCKER_URL ?? "http://localhost:3000";

export default function App() {
  const [urlDraft, setUrlDraft] = useState(DEFAULT_URL);
  const [activeUrl, setActiveUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  if (!activeUrl) {
    return (
      <KeyboardAvoidingView
        style={styles.setup}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <StatusBar style="dark" />
        <Text style={styles.setupTitle}>Locker en tu celular</Text>
        <Text style={styles.setupHint}>
          1. En la PC ejecuta{" "}
          <Text style={styles.mono}>npm run dev</Text> en la carpeta raíz del
          proyecto.{"\n"}
          2. PC y celular en la misma Wi‑Fi.{"\n"}
          3. Escribe la URL de tu PC (ipconfig en Windows).
        </Text>
        <TextInput
          value={urlDraft}
          onChangeText={setUrlDraft}
          placeholder="http://192.168.1.42:3000"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          style={styles.input}
        />
        <TouchableOpacity
          style={styles.btn}
          onPress={() => setActiveUrl(urlDraft.trim())}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>Abrir Locker</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.flex}>
      <StatusBar style="dark" />
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#806b63" />
          <Text style={styles.loaderText}>Cargando Locker…</Text>
        </View>
      ) : null}
      <WebView
        source={{ uri: activeUrl }}
        style={styles.flex}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={() => setLoading(false)}
        startInLoadingState
        allowsBackForwardNavigationGestures
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled
      />
      <TouchableOpacity
        style={styles.changeUrl}
        onPress={() => {
          setActiveUrl(null);
          setLoading(true);
        }}
      >
        <Text style={styles.changeUrlText}>Cambiar URL</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#FFFBDB" },
  setup: {
    flex: 1,
    backgroundColor: "#FFFBDB",
    padding: 24,
    justifyContent: "center",
  },
  setupTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#806b63",
    marginBottom: 12,
    textAlign: "center",
  },
  setupHint: {
    fontSize: 14,
    color: "#44403c",
    lineHeight: 22,
    marginBottom: 20,
  },
  mono: { fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e7e5e4",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 16,
  },
  btn: {
    backgroundColor: "#B6F0FF",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  btnText: { fontSize: 16, fontWeight: "700", color: "#1c1917" },
  loader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
    backgroundColor: "#FFFBDB",
  },
  loaderText: { marginTop: 12, color: "#57534e", fontSize: 15 },
  changeUrl: {
    position: "absolute",
    bottom: 24,
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e7e5e4",
  },
  changeUrlText: { fontSize: 13, fontWeight: "600", color: "#806b63" },
});
