import { ActivityIndicator, Text, View } from "react-native";
import { AuthButton, AuthLayout, styles } from "./auth-components";
import type { AuthCoordinator, AuthState } from "../business/auth-coordinator";

export function AuthRecoveryScreen({ state, auth }: { state: AuthState; auth: AuthCoordinator }) {
  return <AuthLayout title="Xác nhận phiên đăng nhập" subtitle="Chỉ mở dữ liệu cá nhân sau khi máy chủ xác nhận tài khoản.">
    {state.busy && <ActivityIndicator size="large" color="#9E4006" accessibilityLabel="Đang xác nhận phiên" />}
    {!!state.message && <View style={styles.errorPanel} accessibilityRole="alert"><Text style={styles.error}>{state.message}</Text></View>}
    {!state.busy && <>
      <AuthButton label="Thử xác nhận lại" onPress={() => { void auth.restore(); }} />
      <AuthButton label="Xóa phiên trên thiết bị và đăng nhập lại" onPress={() => { void auth.endSession(); }} />
    </>}
  </AuthLayout>;
}
