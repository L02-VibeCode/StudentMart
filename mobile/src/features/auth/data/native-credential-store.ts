import * as SecureStore from "expo-secure-store";
import { createCredentialStore } from "./credential-store";

const options: SecureStore.SecureStoreOptions = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };
export const credentialStore = createCredentialStore({
  getItemAsync: key => SecureStore.getItemAsync(key, options),
  setItemAsync: (key, value) => SecureStore.setItemAsync(key, value, options),
  deleteItemAsync: key => SecureStore.deleteItemAsync(key, options),
});
