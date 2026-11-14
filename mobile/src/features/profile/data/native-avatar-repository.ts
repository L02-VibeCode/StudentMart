import { File } from "expo-file-system";
import { fetch as expoFetch } from "expo/fetch";
import { AuthError } from "../../auth/business/auth";
import type { AuthCoordinator } from "../../auth/business/auth-coordinator";
import { createAvatarRepository } from "./avatar-repository";

export function createNativeAvatarRepository(origin: string, auth: AuthCoordinator) {
  return createAvatarRepository(origin, auth, expoFetch, asset => {
    // Use an actual native File with Expo's streaming fetch. A plain {uri,name,type}
    // cast to Blob depends on the legacy React Native multipart bridge.
    let file: File;
    try {
      file = new File(asset.uri);
      if (!file.exists || file.size <= 0) throw new Error("Unavailable picker file");
    } catch {
      throw new AuthError("LOCAL_FILE_UNAVAILABLE", "Không đọc được ảnh đã chọn trên thiết bị. Vui lòng chọn lại ảnh từ thư viện.");
    }
    if (file.size > 5242880) throw new AuthError("PAYLOAD_TOO_LARGE", "Ảnh vượt quá 5 MiB. Vui lòng chọn ảnh nhỏ hơn.");
    const body = new FormData();
    body.append("file", file, asset.name);
    return body;
  });
}
