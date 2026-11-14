import { useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthButton } from "../../auth/presentation/auth-components";
import { profileDetails, profileInitials } from "../business/profile";
import type { ProfileModel } from "../business/profile-model";
import { useProfileViewModel } from "./use-profile-view-model";

type Props = { model: ProfileModel; onEndSession: () => Promise<void>; onBrowse: () => void; onEdit: () => void; onVerify: () => void };

function Avatar({ name, url }: { name: string; url: string | null }) {
  const [failed, setFailed] = useState(false);
  return url && !failed
    ? <Image source={{ uri: url }} accessibilityLabel={`Ảnh đại diện của ${name}`} style={styles.avatar} onError={() => setFailed(true)} />
    : <View style={[styles.avatar, styles.avatarFallback]} accessibilityLabel="Ảnh đại diện mặc định"><Text style={styles.initials}>{profileInitials(name)}</Text></View>;
}

export function AccountScreen({ model, onEndSession, onBrowse, onEdit, onVerify }: Props) {
  const { state, retry } = useProfileViewModel(model);
  function confirm() {
    Alert.alert("Đăng xuất?", "Thông tin đăng nhập và dữ liệu riêng sẽ được dọn trên thiết bị này. Dữ liệu tài khoản trên máy chủ được giữ nguyên.", [
      { text: "Hủy", style: "cancel" }, { text: "Đăng xuất", style: "destructive", onPress: () => { void onEndSession(); } },
    ]);
  }
  const account = state.account;
  const details = account ? profileDetails(account) : null;
  return <SafeAreaView style={styles.safe}>
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.content}>
        <View style={styles.header}><Text accessibilityRole="header" style={styles.title}>Cá nhân</Text><Text style={styles.brand}>StudentMart</Text></View>
        {(state.status === "loading" || state.status === "idle") && <View style={styles.panel} accessibilityLiveRegion="polite"><ActivityIndicator color="#AD4709" /><Text style={styles.muted}>Đang tải hồ sơ của bạn…</Text></View>}
        {state.status === "error" && <View style={styles.panel} accessibilityLiveRegion="polite"><Text style={styles.body}>{state.message}</Text><AuthButton label="Thử lại" onPress={retry} /></View>}
        {account && details && <>
          <View style={styles.identity}>
            <Avatar key={account.avatarUrl ?? "default"} name={account.displayName} url={account.avatarUrl} />
            <View style={styles.identityText}><Text style={styles.name} accessibilityRole="header">{account.displayName}</Text><Text style={styles.body}>{details.school}</Text><Text style={styles.muted}>Trường tự khai</Text></View>
          </View>
          <View style={styles.summary}>
            <View style={[styles.badge, details.verified && styles.verified]}><Text style={[styles.badgeText, details.verified && styles.verifiedText]}>{details.verified ? "Đã xác thực email trường" : "Chưa xác thực email trường"}</Text></View>
            <Text style={styles.body}>{details.area}</Text>
          </View>
          <Text style={styles.muted}>Xác thực email trường là tùy chọn. Nhãn chỉ xác nhận quyền truy cập email trường tại thời điểm xác thực, không bảo đảm uy tín hoặc chất lượng hàng.</Text>
          <View style={styles.section}><Text style={styles.label}>Giới thiệu</Text><Text style={[styles.body, !account.bio?.trim() && styles.muted]}>{details.bio}</Text></View>
          <AuthButton label="Chỉnh sửa hồ sơ" onPress={onEdit} />
          <Text style={styles.sectionTitle}>Tài khoản & cài đặt</Text>
          <View style={styles.card}>
            <View style={styles.row}><Text style={styles.label}>Email đăng nhập</Text><Text selectable style={styles.body}>{account.email}</Text></View>
            <Pressable accessibilityRole="button" accessibilityLabel="Xác thực email trường" onPress={onVerify} style={({ pressed }) => [styles.row, styles.divider, pressed && styles.pressed]}>
              <Text style={styles.label}>Xác thực email trường</Text><Text style={styles.link}>{details.verified ? "Xem trạng thái →" : "Tìm hiểu thêm →"}</Text>
            </Pressable>
          </View>
          <Pressable accessibilityRole="button" onPress={retry} style={styles.secondary}><Text style={styles.link}>Tải lại hồ sơ</Text></Pressable>
        </>}
        <Pressable accessibilityRole="button" onPress={confirm} style={({ pressed }) => [styles.secondary, styles.outline, pressed && styles.pressed]}><Text style={styles.label}>Đăng xuất</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={onBrowse} style={styles.secondary}><Text style={styles.link}>Quay lại khám phá</Text></Pressable>
      </View>
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F5F5F5" }, page: { flexGrow: 1, alignItems: "center", padding: 20, paddingBottom: 32 },
  content: { width: "100%", maxWidth: 480, gap: 20 }, header: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, paddingVertical: 8 },
  title: { fontSize: 28, fontWeight: "700", color: "#252525" }, brand: { fontSize: 17, fontWeight: "700", color: "#AD4709" },
  identity: { flexDirection: "row", alignItems: "center", gap: 16, paddingTop: 12 }, identityText: { flex: 1, gap: 6 },
  avatar: { width: 80, height: 80, borderRadius: 40 }, avatarFallback: { backgroundColor: "#FCE4D0", justifyContent: "center", alignItems: "center" }, initials: { color: "#8E3906", fontSize: 26, fontWeight: "700" },
  name: { fontSize: 24, lineHeight: 32, fontWeight: "700", color: "#252525" }, body: { color: "#363636", fontSize: 16, lineHeight: 24 }, muted: { color: "#616161", fontSize: 14, lineHeight: 22 },
  label: { fontSize: 16, fontWeight: "600", color: "#252525", lineHeight: 24 }, section: { gap: 8 }, summary: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 },
  badge: { backgroundColor: "#EAEAEA", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8 }, badgeText: { color: "#4F4F4F", fontSize: 14, fontWeight: "500" }, verified: { backgroundColor: "#E8F5EE" }, verifiedText: { color: "#246341" },
  sectionTitle: { fontSize: 15, color: "#616161", marginTop: 8 }, card: { borderRadius: 14, backgroundColor: "#FFFFFF", overflow: "hidden" }, row: { minHeight: 64, padding: 16, gap: 8 }, divider: { borderTopWidth: 1, borderTopColor: "#E2E2E2" },
  panel: { backgroundColor: "#FFFFFF", padding: 24, borderRadius: 14, gap: 18 }, link: { color: "#9E4006", fontSize: 15, fontWeight: "600", lineHeight: 22 }, secondary: { minHeight: 52, padding: 14, justifyContent: "center", alignItems: "center" }, outline: { borderWidth: 1, borderColor: "#C8C8C8", borderRadius: 10, backgroundColor: "#FFFFFF" }, pressed: { opacity: 0.75 },
});
