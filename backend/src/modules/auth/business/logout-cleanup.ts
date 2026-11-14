/** Server-resolved scope only: adapters must never accept a client account/device ID. */
export type RevokedSessionScope = Readonly<{ sessionId: string; accountId: string }>;

/** TASK-19/chat adapters must be idempotent and detach only this session's resources. */
export interface LogoutCleanupHook {
  onSessionRevoked(scope: RevokedSessionScope): Promise<void>;
}

export const LOGOUT_CLEANUP_HOOKS = Symbol("studentmart.logout-cleanup-hooks");
