/** Local account-owned storage/chat/TASK-19 cleanup only. No token/global clear or network wait; server unlink belongs to logout API. */
export type AccountLogoutResource = {
  clearPrivate(accountId: string): Promise<void>;
  disconnectRealtime?(accountId: string): void | Promise<void>;
  releasePush?(accountId: string): void | Promise<void>;
};

export function createAccountLogoutResources() {
  const resources = new Set<AccountLogoutResource>();
  return {
    register(resource: AccountLogoutResource) { resources.add(resource); return () => { resources.delete(resource); }; },
    async clear(accountId: string) {
      const operations = [...resources].flatMap(resource => [
        () => resource.disconnectRealtime?.(accountId),
        () => resource.releasePush?.(accountId),
        () => resource.clearPrivate(accountId),
      ]);
      const results = await Promise.allSettled(operations.map(operation => Promise.resolve().then(operation)));
      if (results.some(result => result.status === "rejected")) throw new Error("Account resource cleanup incomplete");
    },
  };
}
export type AccountLogoutResources = ReturnType<typeof createAccountLogoutResources>;
