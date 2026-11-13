import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { AuthField, AuthLayout, styles } from "./auth-components";

// Destination for registration. Login API/session is TASK-16.03, not TASK-16.02.
export function LoginScreen({ email, created, onRegister }: { email: string; created: boolean; onRegister: () => void }) {
  const [value, setValue] = useState(email);
  return <AuthLayout title="Chào mừng bạn quay trở lại!" subtitle="Đăng nhập để tiếp tục khám phá, mua bán và trao đổi.">
    {created && <View style={styles.notice} accessibilityRole="alert"><Text style={styles.noticeText}>Tạo tài khoản thành công. Email: {email}</Text><Text style={styles.noticeText}>Tài khoản chưa xác thực email trường.</Text></View>}
    <AuthField label="Email" value={value} onChangeText={setValue} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" />
    <Text style={styles.hint}>Chức năng đăng nhập đang được phát triển trong TASK-16.03. Bạn chưa đăng nhập và chưa có phiên truy cập.</Text>
    <View style={styles.footer}><Text style={styles.footerText}>Chưa có tài khoản?</Text><Pressable onPress={onRegister} accessibilityRole="button" style={styles.textButton}><Text style={styles.link}>Đăng ký ngay</Text></Pressable></View>
  </AuthLayout>;
}
