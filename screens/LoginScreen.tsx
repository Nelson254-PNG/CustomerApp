// ============================================================
//  screens/LoginScreen.tsx
// ============================================================

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { login as loginApi } from "../api/clients";
import { useAuth } from "../context/AuthContext";

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError("Enter both email and password.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const result = await loginApi(email.trim(), password);
      // Saving the token + userId flips App.tsx's navigator
      // from "show login/signup" to "show My Account".
      await login(result.token, result.userId);
    } catch (e: any) {
      // customerLoginLogic() deliberately returns the SAME
      // message whether the email doesn't exist or the
      // password is wrong — we just display it as-is.
      setError(e.message ?? "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Log in to your water account</Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
        />

        {error && <Text style={styles.errorText}>⚠ {error}</Text>}

        <TouchableOpacity
          style={[styles.button, submitting && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={submitting}
        >
          {submitting ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Log In</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkButton} onPress={() => navigation.navigate("Signup")}>
          <Text style={styles.linkText}>Don't have an account? Sign Up</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#f0fdf4" },
  card: { backgroundColor: "white", borderRadius: 16, padding: 24 },
  title: { fontSize: 22, fontWeight: "700", color: "#1e293b", textAlign: "center" },
  subtitle: { fontSize: 13, color: "#64748b", textAlign: "center", marginTop: 4, marginBottom: 24 },
  label: { fontSize: 14, fontWeight: "600", color: "#374151", marginTop: 12, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: "#d1d5db", borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, backgroundColor: "white",
  },
  errorText: { color: "#dc2626", marginTop: 16, fontSize: 14, textAlign: "center" },
  button: { backgroundColor: "#16a34a", borderRadius: 10, paddingVertical: 14, alignItems: "center", marginTop: 24 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "white", fontSize: 16, fontWeight: "600" },
  linkButton: { marginTop: 16, alignItems: "center" },
  linkText: { color: "#16a34a", fontSize: 14, fontWeight: "600" },
});