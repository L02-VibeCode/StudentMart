import { AuthError } from "../features/auth/business/auth";
import type { AuthCoordinator } from "../features/auth/business/auth-coordinator";
import type { ListingGateway } from "../features/listings/business/listing-gateway";

export type ReturnIntent = { action: "contactListing"; listingId: string } | { action: "createListing" } | { action: "openPrivateProfile" };
export type Route = { name: "browse" } | { name: "listing"; listingId: string; contactReady?: boolean }
  | { name: "compose" } | { name: "profile" } | { name: "recovery" }
  | { name: "login"; email: string; created: boolean } | { name: "register" };
const publicOrigin = (route: Route): Route => route.name === "listing" ? { name: "listing", listingId: route.listingId } : { name: "browse" };

export function parseIntent(value: unknown): ReturnIntent | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const intent = value as Record<string, unknown>;
  if (intent.action === "contactListing" && typeof intent.listingId === "string"
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(intent.listingId)
    && Object.keys(intent).length === 2) return { action: "contactListing", listingId: intent.listingId };
  if (typeof intent.action === "string" && ["createListing", "openPrivateProfile"].includes(intent.action) && Object.keys(intent).length === 1) return { action: intent.action as "createListing" | "openPrivateProfile" };
  return null;
}

export function createSessionNavigation(auth: AuthCoordinator, listings: ListingGateway) {
  let state: { route: Route; intent: ReturnIntent | null; resuming: boolean; message: string } = { route: { name: "browse" }, intent: null, resuming: false, message: "" };
  let origin: Route = { name: "browse" };
  let generation = 0;
  let contactLease: { epoch: number; accountId: string } | null = null;
  let observedAuthEpoch = auth.getSnapshot().epoch;
  const listeners = new Set<() => void>();
  function update(next: Partial<typeof state>) { state = { ...state, ...next }; listeners.forEach(listener => listener()); }
  async function resume() {
    const intent = state.intent;
    if (!intent || state.resuming || auth.getSnapshot().status !== "authenticated" || auth.getSnapshot().busy) return;
    const attempt = ++generation;
    update({ resuming: true, message: "" });
    try {
      await auth.runPrivate(async (token, signal) => {
        if (intent.action === "contactListing") {
          const listing = await listings.get(intent.listingId);
          if (signal.aborted) throw new AuthError("STALE_SESSION", "Phiên sử dụng đã thay đổi.");
          if (listing.id !== intent.listingId || !listing.open) throw new AuthError("LISTING_UNAVAILABLE", "Tin không còn mở để liên hệ.");
          await listings.checkContact(intent.listingId, token, signal);
        } else if (intent.action === "createListing") await listings.checkCreate(token, signal);
      });
      if (attempt !== generation) return;
      const route: Route = intent.action === "contactListing" ? { name: "listing", listingId: intent.listingId, contactReady: true }
        : intent.action === "createListing" ? { name: "compose" } : { name: "profile" };
      const actor = auth.getSnapshot();
      contactLease = route.name === "listing" && actor.account ? { epoch: actor.epoch, accountId: actor.account.id } : null;
      update({ route, intent: null });
    } catch (error) {
      if (attempt !== generation) return;
      const code = error instanceof AuthError ? error.code : "UNAVAILABLE";
      const status = auth.getSnapshot().status;
      if (status === "guest" && ["UNAUTHENTICATED", "SESSION_EXPIRED"].includes(code)) {
        update({ route: { name: "login", email: "", created: false }, message: "Vui lòng đăng nhập lại để tiếp tục." });
      } else if (["restricted", "blocked", "offline"].includes(status)) {
        update({ route: { name: "recovery" }, message: error instanceof AuthError ? error.message : "Chưa thể xác nhận quyền." });
      } else {
        update({ route: origin, intent: null, message: error instanceof AuthError ? error.message : "Chưa thể tiếp tục thao tác. Vui lòng thử lại." });
      }
    } finally { if (attempt === generation) update({ resuming: false }); }
  }
  const unsubscribe = auth.subscribe(() => {
    const current = auth.getSnapshot();
    if (current.epoch !== observedAuthEpoch) {
      observedAuthEpoch = current.epoch;
      if (state.resuming) { generation++; update({ resuming: false }); }
    }
    if (state.route.name === "listing" && state.route.contactReady
      && (current.status !== "authenticated" || current.epoch !== contactLease?.epoch || current.account?.id !== contactLease?.accountId)) {
      contactLease = null;
      update({ route: { name: "listing", listingId: state.route.listingId } });
    }
    if (current.status === "authenticated") {
      if (state.intent && !current.busy) void resume();
    } else if (current.status === "guest" && !current.busy && state.route.name !== "login" && state.intent) {
      update({ route: { name: "login", email: "", created: false } });
    } else if (["restricted", "offline", "blocked"].includes(current.status) && !current.busy && state.intent) {
      update({ route: { name: "recovery" } });
    } else if (["profile", "compose"].includes(state.route.name)) {
      generation++;
      update({ intent: state.route.name === "profile" ? { action: "openPrivateProfile" } : { action: "createListing" },
        route: current.status === "guest" ? { name: "login", email: "", created: false } : { name: "recovery" }, resuming: false });
    }
  });
  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    async request(value: unknown) {
      if (state.resuming) return;
      const intent = parseIntent(value);
      if (!intent) { update({ message: "Không thể tiếp tục hành động này." }); return; }
      origin = intent.action === "contactListing" ? { name: "listing", listingId: intent.listingId } : publicOrigin(state.route);
      const current = auth.getSnapshot();
      update({ intent, message: "", route: current.status === "authenticated" ? state.route : current.status === "guest"
        ? { name: "login", email: "", created: false } : { name: "recovery" } });
      await resume();
    },
    openListing(id: string) { if (!parseIntent({ action: "contactListing", listingId: id })) return; generation++; update({ route: { name: "listing", listingId: id }, intent: null, resuming: false, message: "" }); },
    browse() { generation++; update({ route: { name: "browse" }, intent: null, resuming: false, message: "" }); },
    resetForLogout() { generation++; origin = { name: "browse" }; contactLease = null; update({ route: { name: "browse" }, intent: null, resuming: false, message: "" }); },
    login(email = "", created = false) { if (!state.intent) origin = publicOrigin(state.route); update({ route: { name: "login", email, created }, message: "" }); },
    register() { update({ route: { name: "register" }, message: "" }); },
    cancelLogin() { generation++; update({ route: origin, intent: null, resuming: false, message: "" }); },
    recovery() { update({ route: { name: "recovery" } }); },
    dispose() { generation++; unsubscribe(); listeners.clear(); },
  };
}

export type SessionNavigation = ReturnType<typeof createSessionNavigation>;
