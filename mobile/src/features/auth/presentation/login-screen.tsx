import { useEffect, useState, useSyncExternalStore } from "react";
import { Pressable, Text, View } from "react-native";
import { AuthButton, AuthField, AuthLayout, styles } from "./auth-components";
import { createLoginModel } from "./login-model";
import type { LoginInput } from "../business/auth";
import { ConnectionCheck } from "../../../shared/presentation/connection-check";

export function LoginScreen({ email, created, login, onRegister, onCancel, notice = "" }: { email: string; created: boolean; login: (input: LoginInput) => Promise<void>; onRegister: () => void; onCancel?: () => void; notice?: string }) {
  const [model] = useState(() => createLoginModel(login, email));
  const state = useSyncExternalStore(model.subscribe, model.getSnapshot);
  const [clock, setClock] = useState(Date.now);
  useEffect(() => { model.activate(); return () => model.dispose(); }, [model]);
  useEffect(() => {
    if (state.retryUntil <= Date.now()) return;
    setClock(Date.now());
    const timer = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [state.retryUntil]);
  const retrySeconds = Math.max(0, Math.ceil((state.retryUntil - clock) / 1000));
  return <AuthLayout title="Chào mừng bạn quay trở lại!" subtitle="Đăng nhập để tiếp tục khám phá, mua bán và trao đổi.">
    {created && <View style={styles.notice} accessibilityRole="alert"><Text style={styles.noticeText}>Tạo tài khoản thành công. Email: {email}</Text><Text style={styles.noticeText}>Tài khoản chưa xác thực email trường.</Text></View>}
    {!!(state.message || notice) && <View style={styles.errorPanel} accessibilityRole="alert"><Text style={styles.error}>{state.message || notice}</Text></View>}
    <AuthField label="Email" placeholder="Nhập email của bạn" value={state.email} error={state.fields.email} editable={!state.submitting}
      onChangeText={value => model.setField("email", value)} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" textContentType="emailAddress" />
    <AuthField label="Mật khẩu" placeholder="Nhập mật khẩu" password value={state.password} error={state.fields.password} editable={!state.submitting}
      onChangeText={value => model.setField("password", value)} autoCapitalize="none" autoCorrect={false} autoComplete="current-password" textContentType="password"
      returnKeyType="go" onSubmitEditing={() => { void model.submit(); }} />
    <Text style={styles.hint}>Bạn vẫn đăng nhập được khi chưa xác thực email trường.</Text>
    <AuthButton label={state.submitting ? "Đang đăng nhập…" : retrySeconds ? `Thử lại sau ${retrySeconds}s` : "Đăng nhập"} loading={state.submitting} disabled={retrySeconds > 0} onPress={() => { void model.submit(); }} />
    <View style={styles.footer}><Text style={styles.footerText}>Chưa có tài khoản?</Text><Pressable onPress={onRegister} disabled={state.submitting} accessibilityRole="button" accessibilityState={{ disabled: state.submitting }} style={styles.textButton}><Text style={styles.link}>Đăng ký ngay</Text></Pressable></View>
    {onCancel && <AuthButton label="Hủy đăng nhập, quay lại" onPress={onCancel} />}
    {__DEV__ && <ConnectionCheck />}
  </AuthLayout>;
}
