import { StatusBar } from "expo-status-bar";
import { useEffect, useState, useSyncExternalStore } from "react";
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

const register = createRegistrationApi(API_URL);
const auth = createAuthCoordinator(createAuthApi(API_URL), credentialStore);
type Route = { name: "register" } | { name: "login"; email: string; created: boolean };

export default function App() {
  const [route, setRoute] = useState<Route>({ name: "login", email: "", created: false });
  const state = useSyncExternalStore(auth.subscribe, auth.getSnapshot);
  useEffect(() => { void auth.restore(); }, []);
  useEffect(() => {
    if (state.status === "authenticated") setRoute({ name: "login", email: "", created: false });
  }, [state.status]);
  let screen;
  if (state.status === "authenticated" && state.account) screen = <AccountScreen key={state.account.id} account={state.account} onEndSession={auth.endSession} />;
  else if (["checking", "offline", "blocked"].includes(state.status)) screen = <AuthRecoveryScreen state={state} auth={auth} />;
  else screen = route.name === "register"
    ? <RegisterScreen register={register} onRegistered={email => setRoute({ name: "login", email, created: true })} onLogin={() => setRoute({ name: "login", email: "", created: false })} />
    : <LoginScreen key={`${route.email}:${route.created}`} email={route.email} created={route.created} login={auth.login} notice={state.message} onRegister={() => setRoute({ name: "register" })} />;
  return <SafeAreaProvider>
    <StatusBar style="dark" />
    {screen}
  </SafeAreaProvider>;
}
