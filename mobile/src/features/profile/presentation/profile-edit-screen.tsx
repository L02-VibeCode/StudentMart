import { useEffect, useSyncExternalStore } from "react";
import { Alert, BackHandler, Image, Pressable, Text, View } from "react-native";
import type { AvatarModel } from "../business/avatar-model";
import { AuthButton, AuthField, AuthLayout, styles } from "../../auth/presentation/auth-components";
import type { ProfileEditModel } from "../business/profile-edit-model";
export function ProfileEditScreen({ model, avatar, onBack }: { model: ProfileEditModel; avatar: AvatarModel; onBack(): void }) {
  const state = useSyncExternalStore(model.subscribe, model.getSnapshot);
  const image = useSyncExternalStore(avatar.subscribe, avatar.getSnapshot);
  function leave() { if (state.busy || image.busy) return; if (model.dirty() || image.pending) Alert.alert("Bỏ thay đổi chưa lưu?", "Nội dung chưa lưu sẽ bị bỏ.", [{ text: "Tiếp tục sửa", style: "cancel" }, { text: "Bỏ thay đổi", style: "destructive", onPress: onBack }]); else onBack(); }
  useEffect(() => { avatar.reset(); void model.load().then(() => model.loadCatalog()); return () => { model.reset(); avatar.reset(); }; }, [model, avatar]);
  useEffect(() => { const back = BackHandler.addEventListener("hardwareBackPress", () => { leave(); return true; }); return () => back.remove(); });
  const errors = model.errors();
  return <AuthLayout title="Chỉnh sửa hồ sơ" subtitle="Thông tin tự khai không phải thông tin đã xác thực.">
    <View style={{ gap: 10 }}>
      {image.avatarUrl ? <Image source={{ uri: image.avatarUrl }} accessibilityLabel="Ảnh đại diện hiện tại" style={{ width: 80, height: 80, borderRadius: 40 }} /> : <Text>Chưa có ảnh đại diện</Text>}
      <AuthButton label="Chọn ảnh từ thư viện" disabled={state.busy || image.busy} onPress={() => { void avatar.choose(); }} />
      {image.pending && <><Text>Đã chọn ảnh mới, chưa tải lên.</Text><AuthButton label="Tải ảnh đã chọn lên" loading={image.busy} disabled={state.busy} onPress={() => { void avatar.upload(); }} /></>}
      {!!image.avatarUrl && <AuthButton label="Xóa ảnh đại diện" disabled={state.busy || image.busy} onPress={() => Alert.alert("Xóa ảnh đại diện?", "Tài khoản và thông tin khác vẫn được giữ nguyên.", [{ text: "Hủy", style: "cancel" }, { text: "Xóa ảnh", style: "destructive", onPress: () => { void avatar.remove(); } }])} />}
      {!!image.message && <Text accessibilityLiveRegion="polite">{image.message}</Text>}
    </View>
    {state.status === "loading" || state.status === "idle" ? <Text>Đang tải hồ sơ…</Text> : state.status === "error" ? <><Text>{state.message}</Text><AuthButton label="Thử lại" onPress={() => { void model.load().then(() => model.loadCatalog()); }} /></> : <>
      <AuthField label="Tên hiển thị" value={state.draft.displayName} error={errors.displayName} editable={!state.busy} onChangeText={v => model.change("displayName", v)} />
      <AuthField label="Giới thiệu" value={state.draft.bio} error={errors.bio} multiline editable={!state.busy} onChangeText={v => model.change("bio", v)} />
      {([['schools', 'declaredSchoolId', 'Trường tự khai'], ['areas', 'areaId', 'Khu vực']] as const).map(([list, field, label]) => <View key={field} style={{ gap: 8 }}><Text style={styles.label}>{label}</Text>
        <Text>{state.draft[field] === null ? "Chưa chọn" : state[list].find(i => i.id === state.draft[field])?.name ?? (field === 'declaredSchoolId' ? state.original?.declaredSchool?.name : state.original?.area?.name) ?? "Chưa chọn"}</Text>
        {!state[list].length && <Text>Chưa có lựa chọn từ danh mục được cung cấp.</Text>}
        {state[list].map(item => <Pressable key={item.id} accessibilityRole="radio" accessibilityState={{ selected: state.draft[field] === item.id, disabled: state.busy }} disabled={state.busy} onPress={() => model.change(field, item.id)} style={{ minHeight: 48, justifyContent: "center" }}><Text style={styles.link}>{state.draft[field] === item.id ? "● " : "○ "}{item.name}</Text></Pressable>)}
        {!!state.draft[field] && <AuthButton label={`Bỏ chọn ${label.toLowerCase()}`} disabled={state.busy} onPress={() => model.change(field, null)} />}
      </View>)}
      {state.catalogError && <><Text>Danh sách trường/khu vực chưa tải được. Bạn vẫn có thể sửa tên và giới thiệu.</Text><AuthButton label="Thử tải lại danh mục" disabled={state.busy} onPress={() => { void model.loadCatalog(); }} /></>}
      {!!state.message && <Text accessibilityLiveRegion="polite">{state.message}</Text>}
      <AuthButton label="Lưu thay đổi" loading={state.busy} disabled={image.busy || !model.dirty() || Object.keys(errors).length > 0} onPress={() => { void model.save(); }} />
    </>}
    <AuthButton label="Quay về hồ sơ" disabled={state.busy} onPress={leave} />
  </AuthLayout>;
}
