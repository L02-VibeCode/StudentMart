import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { ListingGateway, PublicListing } from "../business/listing-gateway";
import { AuthButton, AuthField, AuthLayout, styles } from "../../auth/presentation/auth-components";

export function BrowseScreen({ gateway, onListing, onCreate, onProfile, onLogin, signedIn, message }: {
  gateway: ListingGateway; onListing: (id: string) => void; onCreate: () => void; onProfile: () => void;
  onLogin: () => void; signedIn: boolean; message: string;
}) {
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState({ query: "", attempt: 0 });
  const [result, setResult] = useState<{ loading: boolean; items: PublicListing[]; failed: boolean }>({ loading: true, items: [], failed: false });
  useEffect(() => {
    let active = true;
    setResult({ loading: true, items: [], failed: false });
    void gateway.list(search.query).then(items => { if (active) setResult({ loading: false, items, failed: false }); })
      .catch(() => { if (active) setResult({ loading: false, items: [], failed: true }); });
    return () => { active = false; };
  }, [gateway, search]);
  const header = <View style={{ gap: 18, marginBottom: 18 }}>
    <Text style={styles.brand} accessibilityRole="header">StudentMart</Text>
    <Text style={styles.title} accessibilityRole="header">Khám phá StudentMart</Text>
    <Text style={styles.subtitle}>Tìm đồ dùng, mua bán và trao đổi trong cộng đồng sinh viên. Bạn có thể khám phá mà không cần đăng nhập.</Text>
    {!!message && <Text style={styles.error} accessibilityLiveRegion="polite">{message}</Text>}
    <AuthField label="Tìm kiếm tin" placeholder="Bạn đang tìm món đồ nào?" value={query} onChangeText={setQuery} returnKeyType="search" onSubmitEditing={() => setSearch({ query, attempt: search.attempt + 1 })} />
    <AuthButton label="Tìm kiếm" onPress={() => setSearch({ query, attempt: search.attempt + 1 })} loading={result.loading} />
    <AuthButton label="Đăng tin" onPress={onCreate} />
    <AuthButton label="Cá nhân" onPress={onProfile} />
    {!signedIn && <AuthButton label="Đăng nhập" onPress={onLogin} />}
  </View>;
  return <SafeAreaView style={styles.safe}><KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
    <FlatList data={result.items} keyExtractor={item => item.id} keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ padding: 20, width: "100%", maxWidth: 520, alignSelf: "center" }} ListHeaderComponent={header}
      ListEmptyComponent={result.failed ? <View style={styles.errorPanel} accessibilityRole="alert"><Text style={styles.error}>Chưa tải được tin đăng. Vui lòng thử lại sau.</Text></View>
        : result.loading ? <ActivityIndicator /> : <Text style={styles.hint}>Chưa tìm thấy tin phù hợp.</Text>}
      renderItem={({ item }) => <Pressable accessibilityRole="button" accessibilityLabel={`Xem tin ${item.title}`} style={[styles.notice, { marginBottom: 12 }]} onPress={() => onListing(item.id)}><Text style={styles.label}>{item.title}</Text></Pressable>} />
  </KeyboardAvoidingView></SafeAreaView>;
}

export function ListingScreen({ id, gateway, onContact, onBrowse, contactReady, message }: {
  id: string; gateway: ListingGateway; onContact: () => void; onBrowse: () => void; contactReady?: boolean; message: string;
}) {
  const [listing, setListing] = useState<PublicListing | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    void gateway.get(id).then(value => { if (active && value.id === id) setListing(value); else if (active) setFailed(true); })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [id, gateway]);
  return <AuthLayout title={listing?.title ?? "Chi tiết tin"} subtitle="Xem thông tin công khai trước khi liên hệ người đăng.">
    {failed ? <Text style={styles.error}>Không tải được tin này. Vui lòng thử lại sau.</Text> : !listing ? <ActivityIndicator /> : <>
      <Text style={styles.subtitle}>{listing.description}</Text>
      {!listing.open && <Text style={styles.hint}>Tin không còn mở để liên hệ.</Text>}
      <AuthButton label="Liên hệ người đăng" disabled={!listing.open} onPress={onContact} />
      {contactReady && <Text style={styles.noticeText}>Đã xác nhận quyền truy cập. Chưa có tin nhắn nào được gửi.</Text>}
    </>}
    {!!message && <Text style={styles.error} accessibilityRole="alert">{message}</Text>}
    <AuthButton label="Quay lại khám phá" onPress={onBrowse} />
  </AuthLayout>;
}
