// ============================================================
//  screens/SignupScreen.tsx
//  Self-service signup — creates a brand new customer record
//  with credentials, matching customerSignupLogic() in your
//  C++ auth.cpp. No admin involvement needed.
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
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { signup } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function SignupScreen() {
  const navigation = useNavigation<any>();
  const { login } = useAuth();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async () => {
    if (!name.trim() || !phone.trim() || !email.trim() || !password) {
      setError("All fields are required.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const result = await signup(name.trim(), phone.trim(), email.trim(), password);
      // Signup ALSO returns a token immediately — the customer
      // doesn't have to log in separately right after signing up.
      await login(result.token, result.userId);
    } catch (e: any) {
      // "An account with this email already exists" comes
      // straight from customerSignupLogic()'s duplicate check.
      setError(e.message ?? "Signup failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Create Your Account</Text>
          <Text style={styles.subtitle}>Sign up to manage your water account</Text>

          <Text style={styles.label}>Full Name</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Jane Wanjiru" autoCapitalize="words" />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="e.g. 0712345678" keyboardType="phone-pad" />

          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" />

          <Text style={styles.label}>Password</Text>
          <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="At least 6 characters" secureTextEntry />

          <Text style={styles.label}>Confirm Password</Text>
          <TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Re-enter password" secureTextEntry />

          {error && <Text style={styles.errorText}>⚠ {error}</Text>}

          <TouchableOpacity
            style={[styles.button, submitting && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={submitting}
          >
            {submitting ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Sign Up</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkButton} onPress={() => navigation.navigate("Login")}>
            <Text style={styles.linkText}>Already have an account? Log In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: "center", padding: 24, backgroundColor: "#f0fdf4" },
  card: { backgroundColor: "white", borderRadius: 16, padding: 24 },
  title: { fontSize: 22, fontWeight: "700", color: "#1e293b", textAlign: "center" },
  subtitle: { fontSize: 13, color: "#64748b", textAlign: "center", marginTop: 4, marginBottom: 20 },
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