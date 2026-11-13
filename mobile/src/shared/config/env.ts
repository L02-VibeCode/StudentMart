import { Platform } from "react-native";
import Constants from "expo-constants";
import { resolveApiOrigin } from "./api-origin";

export const API_URL = resolveApiOrigin({
  configuredUrl: process.env.EXPO_PUBLIC_API_URL,
  metroHost: Constants.expoConfig?.hostUri,
  platform: Platform.OS,
  development: __DEV__,
});
