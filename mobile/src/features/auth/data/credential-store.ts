import { parseCredential, type CredentialStore } from "../business/auth";

export const CREDENTIAL_KEY = "studentmart.auth.session.v1";
export type SecureStorage = {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
  deleteItemAsync(key: string): Promise<void>;
};

export function createCredentialStore(storage: SecureStorage): CredentialStore {
  return {
    async read() {
      const raw = await storage.getItemAsync(CREDENTIAL_KEY);
      return raw === null ? null : parseCredential(JSON.parse(raw));
    },
    async write(value) { await storage.setItemAsync(CREDENTIAL_KEY, JSON.stringify(parseCredential(value))); },
    async clear() { await storage.deleteItemAsync(CREDENTIAL_KEY); },
  };
}
