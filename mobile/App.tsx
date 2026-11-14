import { StatusBar } from "expo-status-bar";
import { useEffect, useSyncExternalStore } from "react";
import { ActivityIndicator, AppState, BackHandler } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { API_URL } from "./src/shared/config/env";
import { createRegistrationApi } from "./src/features/auth/data/registration-api";
import { RegisterScreen } from "./src/features/auth/presentation/register-screen";
import { LoginScreen } from "./src/features/auth/presentation/login-screen";
import { createAuthApi } from "./src/features/auth/data/auth-api";
import { credentialStore } from "./src/features/auth/data/native-credential-store";
import { createAuthCoordinator } from "./src/features/auth/business/auth-coordinator";
import { AccountScreen } from "./src/features/profile/presentation/account-screen";
import { AuthRecoveryScreen } from "./src/features/auth/presentation/auth-recovery-screen";
import { AuthButton, AuthLayout } from "./src/features/auth/presentation/auth-components";
import { createSessionNavigation } from "./src/navigation/session-navigation";
import { unavailableListings } from "./src/features/listings/business/listing-gateway";
import { BrowseScreen, ListingScreen } from "./src/features/listings/presentation/listing-screens";
import type { LoginInput } from "./src/features/auth/business/auth";
import { createAccountLogoutResources } from "./src/features/auth/business/account-logout-resources";

const register = createRegistrationApi(API_URL);
// Future account-scoped cache/chat/push adapters register here; public data stays outside this registry.
const accountResources = createAccountLogoutResources();
const auth = createAuthCoordinator(createAuthApi(API_URL), credentialStore, Date.now, accountResources);
const navigation = createSessionNavigation(auth, unavailableListings);

async function cancelLogin() {
  const pendingLogin = auth.getSnapshot().status === "guest" && auth.getSnapshot().busy;
  navigation.cancelLogin();
  if (pendingLogin) await auth.endSession();
}
async function login(input: LoginInput) {
  const hadIntent = navigation.getSnapshot().intent !== null;
  const loginEpoch = auth.getSnapshot().epoch + 1;
  await auth.login(input);
  if (!hadIntent && auth.getSnapshot().status === "authenticated" && auth.getSnapshot().epoch === loginEpoch) await navigation.request({ action: "openPrivateProfile" });
}

export default function App() {
  const state = useSyncExternalStore(auth.subscribe, auth.getSnapshot);
  const nav = useSyncExternalStore(navigation.subscribe, navigation.getSnapshot);
  useEffect(() => { void auth.restore(); }, []);
  useEffect(() => {
    const subscription = AppState.addEventListener("change", next => {
      // Guest forms have no credential to revalidate; keep autofill/background transitions from discarding them.
      if (next === "active" && auth.getSnapshot().status !== "guest") void auth.restore({ force: true });
    });
    const back = BackHandler.addEventListener("hardwareBackPress", () => {
      const route = navigation.getSnapshot().route.name;
      if (["login", "register"].includes(route)) { void cancelLogin(); return true; }
      if (route !== "browse") { navigation.browse(); return true; }
      return false;
    });
    return () => { subscription.remove(); back.remove(); };
  }, []);
  const route = nav.route;
  let screen;
  if (state.status === "checking" || (route.name === "recovery" && state.status !== "guest" && state.status !== "authenticated")) {
    screen = <AuthRecoveryScreen state={state} auth={auth} onBrowse={navigation.browse} />;
  } else if (nav.resuming) {
    screen = <AuthLayout title="Đang xác nhận quyền truy cập" subtitle="Kiểm tra lại phiên và ngữ cảnh trước khi tiếp tục."><ActivityIndicator /><AuthButton label="Hủy, quay lại" onPress={navigation.cancelLogin} /></AuthLayout>;
  } else if (route.name === "profile" && state.status === "authenticated" && state.account) {
    screen = <AccountScreen key={state.account.id} account={state.account} onEndSession={async () => { navigation.resetForLogout(); await auth.endSession(); }} />;
  } else if (route.name === "compose" && state.status === "authenticated") {
    screen = <AuthLayout title="Đăng tin" subtitle="Chức năng đang hoàn thiện. Bạn có thể quay về khám phá."><AuthButton label="Quay lại" onPress={navigation.browse} /></AuthLayout>;
  } else if (route.name === "register") {
    screen = <RegisterScreen register={register} onRegistered={email => navigation.login(email, true)} onLogin={() => navigation.login()} />;
  } else if (route.name === "login") {
    screen = <LoginScreen key={`${route.email}:${route.created}`} email={route.email} created={route.created} login={login} notice={nav.message || state.message} onRegister={navigation.register} onCancel={() => { void cancelLogin(); }} />;
  } else if (route.name === "listing") {
    screen = <ListingScreen key={route.listingId} id={route.listingId} gateway={unavailableListings} onContact={() => { void navigation.request({ action: "contactListing", listingId: route.listingId }); }} onBrowse={navigation.browse} contactReady={route.contactReady} message={nav.message} />;
  } else {
    screen = <BrowseScreen gateway={unavailableListings} onListing={navigation.openListing} onCreate={() => { void navigation.request({ action: "createListing" }); }} onProfile={() => { void navigation.request({ action: "openPrivateProfile" }); }} onLogin={() => navigation.login()} signedIn={state.status === "authenticated"} message={nav.message || state.message} />;
  }
  return <SafeAreaProvider>
    <StatusBar style="dark" />
    {screen}
  </SafeAreaProvider>;
}
