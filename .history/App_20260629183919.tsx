// ============================================================
//  App.tsx
//  Same pattern as the admin app's root: AuthProvider wraps
//  everything, and the navigator shown depends on login state.
//    - Not logged in -> Login / Signup screens
//    - Logged in     -> My Account / Make Payment
// ============================================================

import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { AuthProvider, useAuth } from "./context/AuthContext";

import LoginScreen from "./screens/LoginScreen";
import SignupScreen from "./screens/SignupScreen";
import MyAccountScreen from "./screens/MyAccountScreen";
import MakePaymentScreen from "./screens/MakePaymentScreen";

const Stack = createNativeStackNavigator();

// ── LOGGED-OUT STACK ────────────────────────────────────────────
function AuthStack() {
  return (
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Signup" component={SignupScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

// ── LOGGED-IN STACK ─────────────────────────────────────────────
function MainStack() {
  return (
    <Stack.Navigator initialRouteName="MyAccount">
      <Stack.Screen name="MyAccount" component={MyAccountScreen} options={{ headerShown: false }} />
      <Stack.Screen name="MakePayment" component={MakePaymentScreen} options={{ title: "Make Payment" }} />
    </Stack.Navigator>
  );
}

function RootNavigator() {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {token ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
});