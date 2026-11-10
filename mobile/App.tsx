import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import { API_URL } from "./src/shared/config/env";
import { checkBackendHealth } from "./src/shared/data/api";

export default function App() {
  const [status, setStatus] = useState("Ready to connect");
  const [checking, setChecking] = useState(false);

  async function checkConnection() {
    setChecking(true);
    setStatus("Connecting...");
    try {
      await checkBackendHealth();
      setStatus("Backend connected");
    } catch {
      setStatus("Cannot reach backend. Check the API URL and network connection.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>StudentMart</Text>
      <Text style={styles.subtitle}>React Native + Expo</Text>
      <Text style={styles.subtitle}>{API_URL}</Text>
      <Text style={styles.subtitle} accessibilityLiveRegion="polite">{status}</Text>
      <Button title={checking ? "Checking..." : "Check backend connection"} disabled={checking} onPress={checkConnection} />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
  },
  subtitle: {
    marginTop: 8,
  },
});
