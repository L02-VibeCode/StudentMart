import { useState, type ReactNode } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return <SafeAreaView style={styles.safe}>
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
        <View style={styles.content}>
          <Text style={styles.brand} accessibilityRole="header">StudentMart</Text>
          <Text style={styles.title} accessibilityRole="header">{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
          <View style={styles.form}>{children}</View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

export function AuthField({ label, error, password, ...props }: TextInputProps & { label: string; error?: string; password?: boolean }) {
  const [visible, setVisible] = useState(false);
  return <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <View style={[styles.inputRow, error ? styles.inputError : undefined]}>
      <TextInput {...props} accessibilityLabel={label} accessibilityHint={error || props.accessibilityHint}
        placeholderTextColor="#767676" style={styles.input} secureTextEntry={password && !visible} />
      {password && <Pressable onPress={() => setVisible(!visible)} accessibilityRole="button"
        accessibilityLabel={`${visible ? "Ẩn" : "Hiện"} ${label.toLowerCase()}`} hitSlop={4} style={styles.reveal}>
        <Text style={styles.link}>{visible ? "Ẩn" : "Hiện"}</Text>
      </Pressable>}
    </View>
    {!!error && <Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text>}
  </View>;
}

export function AuthButton({ label, loading, onPress }: { label: string; loading?: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled: !!loading, busy: !!loading }}
    disabled={loading} onPress={onPress} style={({ pressed }) => [styles.button, loading && styles.disabled, pressed && styles.pressed]}>
    {loading && <ActivityIndicator color="#252525" />}
    <Text style={styles.buttonText}>{label}</Text>
  </Pressable>;
}

export const styles = StyleSheet.create({
  flex: { flex: 1 }, safe: { flex: 1, backgroundColor: "#FFFFFF" },
  page: { flexGrow: 1, paddingHorizontal: 20, paddingVertical: 28, alignItems: "center" },
  content: { width: "100%", maxWidth: 480 },
  brand: { fontSize: 30, fontWeight: "800", color: "#AD4709", marginBottom: 24 },
  title: { fontSize: 26, fontWeight: "700", color: "#252525", lineHeight: 34 },
  subtitle: { fontSize: 16, color: "#616161", lineHeight: 24, marginTop: 10 },
  form: { marginTop: 28, gap: 18 }, field: { gap: 8 },
  label: { fontSize: 15, color: "#252525", fontWeight: "500" },
  inputRow: { borderWidth: 1, borderColor: "#C8C8C8", borderRadius: 10, flexDirection: "row", alignItems: "center", minHeight: 52 },
  input: { flex: 1, minWidth: 0, minHeight: 52, paddingHorizontal: 14, paddingVertical: 12, color: "#252525", fontSize: 16 },
  inputError: { borderColor: "#AD2424", borderWidth: 2 },
  reveal: { minWidth: 52, minHeight: 48, alignItems: "center", justifyContent: "center", paddingHorizontal: 10 },
  link: { color: "#9E4006", fontSize: 15, fontWeight: "600" },
  error: { color: "#AD2424", fontSize: 14, lineHeight: 21 },
  errorPanel: { borderRadius: 10, padding: 14, backgroundColor: "#FFF0ED", borderWidth: 1, borderColor: "#E6BDB5" },
  notice: { borderRadius: 10, padding: 16, backgroundColor: "#EFF8EF", gap: 8 },
  noticeText: { color: "#24582B", lineHeight: 23, fontSize: 15 },
  hint: { color: "#616161", fontSize: 13, lineHeight: 20 },
  button: { minHeight: 52, borderRadius: 10, backgroundColor: "#F07824", justifyContent: "center", alignItems: "center", flexDirection: "row", gap: 10, padding: 14 },
  buttonText: { fontSize: 17, fontWeight: "700", color: "#252525", textAlign: "center" },
  disabled: { opacity: 0.6 }, pressed: { opacity: 0.85 },
  footer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: 4 },
  footerText: { color: "#616161", fontSize: 15 },
  textButton: { minHeight: 48, justifyContent: "center", paddingHorizontal: 6 },
});
