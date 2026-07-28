import React from "react";
import { View, ActivityIndicator, StyleSheet, Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Colors } from "./theme";

import LoginScreen from "./screens/LoginScreen";
import SignupScreen from "./screens/SignupScreen";
import HomeScreen from "./screens/HomeScreen";
import BillsScreen from "./screens/BillsScreen";
import PaymentsScreen from "./screens/PaymentsScreen";
import ProfileScreen from "./screens/ProfileScreen";
import MyMeterScreen from "./screens/MyMeterScreen";
import MakePaymentScreen from "./screens/MakePaymentScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: focused ? 22 : 18, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>;
}

function PaymentStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="PaymentHistory" component={PaymentsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="MakePayment" component={MakePaymentScreen}
        options={{ title: "Make Payment", headerStyle: { backgroundColor: Colors.primaryDark }, headerTintColor: "#fff" }} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: { backgroundColor: "#fff", borderTopColor: Colors.border, paddingBottom: 8, paddingTop: 6, height: 128 },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600", marginTop: 2 },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />, tabBarLabel: "Home" }} />
      <Tab.Screen name="Bills" component={BillsScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📄" focused={focused} />, tabBarLabel: "Bills" }} />
      <Tab.Screen name="PaymentTab" component={PaymentStack}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="💳" focused={focused} />, tabBarLabel: "Payments" }} />
      <Tab.Screen name="Meter" component={MyMeterScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="💧" focused={focused} />, tabBarLabel: "My Meter" }} />
      <Tab.Screen name="Profile" component={ProfileScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />, tabBarLabel: "Profile" }} />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  );
}

function RootNavigator() {
  const { token, loading } = useAuth();
  if (loading) return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
  return (
    <NavigationContainer>
      {token ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}

export default function App() {
  return <AuthProvider><RootNavigator /></AuthProvider>;
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.primaryDark },
});