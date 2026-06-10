import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AuthScreen } from "@/screens/AuthScreen";
import { HomeScreen } from "@/screens/HomeScreen";
import { LoadingScreen } from "@/screens/LoadingScreen";

function AppRoot() {
  const { isReady, user } = useAuth();

  if (!isReady) {
    return <LoadingScreen />;
  }

  return (
    <>
      <StatusBar style={user ? "dark" : "light"} />
      {user ? <HomeScreen /> : <AuthScreen />}
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppRoot />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
