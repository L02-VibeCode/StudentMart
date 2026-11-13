export function resolveApiOrigin(options: {
  configuredUrl?: string;
  metroHost?: string | null;
  platform: string;
  development: boolean;
}): string {
  if (options.configuredUrl?.trim()) return options.configuredUrl.trim().replace(/\/+$/, "");
  if (options.development && options.metroHost) {
    try {
      const host = new URL(`http://${options.metroHost}`).hostname;
      // An Expo tunnel forwards Metro only; port 3000 is not forwarded by it.
      if (!host.endsWith(".exp.direct") && !host.endsWith(".expo.dev")) return `http://${host}:3000`;
    } catch { /* Fall back to the local simulator address. */ }
  }
  return options.platform === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000";
}
