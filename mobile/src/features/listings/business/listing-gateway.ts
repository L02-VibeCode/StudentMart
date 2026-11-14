import { AuthError } from "../../auth/business/auth";

// Internal ports for TASK-04/06/22 integration, not an invented public API contract.
export type PublicListing = { id: string; title: string; description: string; open: boolean };
export type ListingGateway = {
  list(query: string): Promise<PublicListing[]>;
  get(id: string): Promise<PublicListing>;
  checkContact(id: string, token: string, signal: AbortSignal): Promise<void>;
  checkCreate(token: string, signal: AbortSignal): Promise<void>;
};

// Those domain APIs do not exist yet. Fail closed instead of supplying demo listings/permissions.
export const unavailableListings: ListingGateway = {
  async list() { throw unavailable(); },
  async get() { throw unavailable(); },
  async checkContact() { throw unavailable(); },
  async checkCreate() { throw unavailable(); },
};
export function unavailable() { return new AuthError("DOMAIN_UNAVAILABLE", "Chức năng tin đăng chưa sẵn sàng. Vui lòng thử lại sau."); }
