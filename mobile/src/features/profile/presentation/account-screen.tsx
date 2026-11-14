import { Alert, Text, View } from "react-native";
import type { PrivateAccount } from "../../auth/business/auth";
import { AuthButton, AuthLayout, styles } from "../../auth/presentation/auth-components";

export function AccountScreen({ account, onEndSession }: { account: PrivateAccount; onEndSession: () => Promise<void> }) {
  function confirm() {
    Alert.alert("Đăng xuất?", "Thông tin đăng nhập và dữ liệu riêng sẽ được dọn trên thiết bị này. Dữ liệu tài khoản trên máy chủ được giữ nguyên.", [
      { text: "Hủy", style: "cancel" }, { text: "Đăng xuất", style: "destructive", onPress: () => { void onEndSession(); } },
    ]);
  }
  return <AuthLayout title="Cá nhân" subtitle="Thông tin tài khoản đang đăng nhập, được xác nhận từ máy chủ.">
    <Text style={styles.title}>{account.displayName}</Text>
    <View style={styles.field}><Text style={styles.label}>Email</Text><Text selectable style={styles.subtitle}>{account.email}</Text></View>
    <View style={styles.field}><Text style={styles.label}>Quyền tài khoản</Text><Text style={styles.hint}>{account.role === "ADMIN" ? "Quản trị viên" : "Thành viên"}</Text></View>
    <View style={styles.notice}><Text style={styles.noticeText}>{account.schoolVerification.status === "VERIFIED" ? "Đã xác thực email trường" : "Chưa xác thực email trường"}</Text>
      <Text style={styles.hint}>Xác thực email trường là tùy chọn, không bảo đảm danh tính hay chất lượng món đồ.</Text></View>
    <AuthButton label="Đăng xuất" onPress={confirm} />
  </AuthLayout>;
}
