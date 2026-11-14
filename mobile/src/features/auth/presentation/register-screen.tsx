import { useEffect, useState, useSyncExternalStore } from "react";
import { Pressable, Text, View } from "react-native";
import type { RegisterAccount } from "../business/registration";
import { createRegistrationModel } from "./registration-model";
import { AuthButton, AuthField, AuthLayout, styles } from "./auth-components";
import { ConnectionCheck } from "../../../shared/presentation/connection-check";

export function RegisterScreen({ register, onRegistered, onLogin }: { register: RegisterAccount; onRegistered: (email: string) => void; onLogin: () => void }) {
  const [model] = useState(() => createRegistrationModel(register, onRegistered));
  const { form, fields, submitting, message } = useSyncExternalStore(model.subscribe, model.getSnapshot);
  useEffect(() => { model.activate(); return () => model.dispose(); }, [model]);
  return <AuthLayout title="Tạo tài khoản StudentMart" subtitle="Tham gia cộng đồng mua bán, trao đổi đồ dùng dành cho sinh viên Làng Đại học.">
    {!!message && <View style={styles.errorPanel} accessibilityRole="alert"><Text style={styles.error}>{message}</Text></View>}
    <AuthField label="Họ và tên" placeholder="Tên hiển thị của bạn" value={form.displayName} error={fields.displayName}
      onChangeText={value => model.setField("displayName", value)} editable={!submitting} autoComplete="name" textContentType="name" autoCapitalize="words" />
    <AuthField label="Email" placeholder="Nhập email của bạn" value={form.email} error={fields.email}
      onChangeText={value => model.setField("email", value)} editable={!submitting} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" textContentType="emailAddress" />
    <AuthField label="Mật khẩu" placeholder="Từ 8 đến 128 ký tự" password value={form.password} error={fields.password}
      onChangeText={value => model.setField("password", value)} editable={!submitting} autoCapitalize="none" autoCorrect={false} autoComplete="new-password" textContentType="newPassword" />
    <AuthField label="Xác nhận mật khẩu" placeholder="Nhập lại mật khẩu" password value={form.confirmPassword} error={fields.confirmPassword}
      onChangeText={value => model.setField("confirmPassword", value)} editable={!submitting} autoCapitalize="none" autoCorrect={false} autoComplete="new-password" textContentType="newPassword"
      returnKeyType="done" onSubmitEditing={() => { void model.submit(); }} />
    <Text style={styles.hint}>Bạn có thể dùng email thông thường. Xác thực email trường là tùy chọn và thực hiện sau.</Text>
    <AuthButton label={submitting ? "Đang tạo tài khoản…" : "Tạo tài khoản"} loading={submitting} onPress={() => { void model.submit(); }} />
    <View style={styles.footer}>
      <Text style={styles.footerText}>Đã có tài khoản?</Text>
      <Pressable onPress={onLogin} disabled={submitting} accessibilityRole="button" accessibilityState={{ disabled: submitting }} style={styles.textButton}><Text style={styles.link}>Đăng nhập</Text></Pressable>
    </View>
    {__DEV__ && <ConnectionCheck />}
  </AuthLayout>;
}
