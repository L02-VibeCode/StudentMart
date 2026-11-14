import { AuthError } from "../../auth/business/auth";
import type { AuthCoordinator } from "../../auth/business/auth-coordinator";
import type { ProfileRepository } from "../business/profile";

export function createProfileRepository(auth: AuthCoordinator): ProfileRepository {
  return {
    load: () => auth.runPrivate(async () => {
      // runPrivate has just fetched GET /accounts/me and checked the session identity.
      // Reuse that projection rather than issuing a second identical HTTP request.
      const account = auth.getSnapshot().account;
      if (!account) throw new AuthError("UNAUTHENTICATED", "Vui lòng đăng nhập để xem hồ sơ.");
      return account;
    }),
  };
}
