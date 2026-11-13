import { useState } from "react";
import { Button, Text, View } from "react-native";
import { API_URL } from "../config/env";
import { checkBackendHealth } from "../data/api";

export function ConnectionCheck() {
  const [expanded, setExpanded] = useState(false);
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState("");
  async function check() {
    if (checking) return;
    setChecking(true);
    try { await checkBackendHealth(); setStatus("Backend kết nối thành công."); }
    catch { setStatus("Không kết nối được backend. Kiểm tra IP LAN, cùng Wi-Fi, cổng 3000 và quyền mạng cục bộ."); }
    finally { setChecking(false); }
  }
  return <View style={{ gap: 8 }}>
    <Button title={expanded ? "Ẩn kiểm tra kết nối" : "Kiểm tra kết nối (dev)"} onPress={() => setExpanded(!expanded)} />
    {expanded && <>
      <Text selectable style={{ color: "#616161" }}>{API_URL}</Text>
      <Button title={checking ? "Đang kiểm tra…" : "Kiểm tra backend"} onPress={() => { void check(); }} disabled={checking} />
      {!!status && <Text accessibilityLiveRegion="polite" style={{ color: "#252525", lineHeight: 22 }}>{status}</Text>}
    </>}
  </View>;
}
