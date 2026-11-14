import type { privateAccountDto } from "../../accounts/business/account-projection";

/** Resolved from the session and current Account rows, never client claims. */
export type SessionActor = {
  account: ReturnType<typeof privateAccountDto>;
  sessionId: string;
};
