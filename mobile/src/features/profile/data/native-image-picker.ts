import * as ImagePicker from "expo-image-picker";
import type { AvatarAsset } from "../business/avatar-model";
import { avatarAssetFromPicker } from "../business/avatar-asset";
export async function pickAvatar(): Promise<AvatarAsset | null> {
  // System image picker grants access only to the selected image; no camera/audio permission.
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: false, quality: 1 });
  if (result.canceled) return null;
  const asset = result.assets[0];
  return avatarAssetFromPicker(asset);
}
