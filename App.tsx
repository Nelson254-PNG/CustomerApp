// ============================================================
//  App.tsx — CustomerApp
//  Root navigator with bottom tab bar for logged-in customers.
//  Auth-gated: shows Login/Signup stack when not logged in,
//  switches to the tab bar immediately on successful login.
// ============================================================

import React from "react";
import { View, ActivityIndicator, StyleSheet, Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { Colors } from "./theme";

// Auth screens
import LoginScreen from "./screens/LoginScreen";
import SignupScreen from "./screens/SignupScreen";

// Tab screens
import HomeScreen from "./screens/HomeScreen";
import BillsScreen from "./screens/BillsScreen";
import PaymentsScreen from "./screens/PaymentsScreen";
import ProfileScreen from "./screens/ProfileScreen";

// Action screen (pushed on top of tab bar)
import MakePaymentScreen from "./screens/MakePaymentScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ── TAB ICON HELPER ─────────────────────────────────────────
function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: focused ? 24 : 20, opacity: focused ? 1 : 0.5 }}>
      {emoji}
    </Text>
  );
}

// ── PAYMENT STACK (tab + payment screen stacked) ─────────────
// We nest a stack inside the tab so MakePayment slides over
// the tab bar without hiding it on other screens.
function PaymentStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="PaymentHistory" component={PaymentsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="MakePayment" component={MakePaymentScreen} options={{ title: "Make Payment", headerStyle: { backgroundColor: Colors.primaryDark }, headerTintColor: "#fff" }} />
    </Stack.Navigator>
  );
}

// ── MAIN TAB NAVIGATOR ───────────────────────────────────────
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          paddingBottom: 3,
          paddingTop: 6,
          height: 128,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
          tabBarLabel: "Home",
        }}
      />
      <Tab.Screen
        name="Bills"
        component={BillsScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="📄" focused={focused} />,
          tabBarLabel: "Bills",
        }}
      />
      <Tab.Screen
        name="PaymentTab"
        component={PaymentStack}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="💳" focused={focused} />,
          tabBarLabel: "Payments",
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
          tabBarLabel: "Profile",
        }}
      />
    </Tab.Navigator>
  );
}

// ── AUTH STACK (shown when not logged in) ────────────────────
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  );
}

// ── ROOT DECIDER ─────────────────────────────────────────────
function RootNavigator() {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {token ? <MainTabs /> : <AuthStack />}
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
  loading: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.primaryDark },
});