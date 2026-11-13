import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { API_URL } from "./src/shared/config/env";
import { createRegistrationApi } from "./src/features/auth/data/registration-api";
import { RegisterScreen } from "./src/features/auth/presentation/register-screen";
import { LoginScreen } from "./src/features/auth/presentation/login-screen";

const register = createRegistrationApi(API_URL);
type Route = { name: "register" } | { name: "login"; email: string; created: boolean };

export default function App() {
  const [route, setRoute] = useState<Route>({ name: "register" });
  return <SafeAreaProvider>
    <StatusBar style="dark" />
    {route.name === "register"
      ? <RegisterScreen register={register} onRegistered={email => setRoute({ name: "login", email, created: true })} onLogin={() => setRoute({ name: "login", email: "", created: false })} />
      : <LoginScreen email={route.email} created={route.created} onRegister={() => setRoute({ name: "register" })} />}
  </SafeAreaProvider>;
}
