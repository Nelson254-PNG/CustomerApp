import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { login as loginApi } from "../api/clients";
import { useAuth } from "../context/AuthContext";
import { Colors, Spacing, Radius, Shadow } from "../theme";

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password) { setError("Enter both email and password."); return; }
    setSubmitting(true); setError(null);
    try {
      const result = await loginApi(email.trim(), password);
      await login(result.token, result.userId);
    } catch (e: any) { setError(e.message ?? "Login failed"); }
    finally { setSubmitting(false); }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.brand}>
        <Text style={styles.brandIcon}>💧</Text>
        <Text style={styles.brandTitle}>My Water Account</Text>
        <Text style={styles.brandSub}>View usage, bills & make payments</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Welcome Back</Text>

        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail}
          placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address"
          placeholderTextColor={Colors.textMuted} />

        <Text style={styles.label}>Password</Text>
        <TextInput style={styles.input} value={password} onChangeText={setPassword}
          placeholder="••••••••" secureTextEntry placeholderTextColor={Colors.textMuted} />

        {error && <View style={styles.errorBox}><Text style={styles.errorText}>⚠ {error}</Text></View>}

        <TouchableOpacity style={[styles.button, submitting && styles.buttonDisabled]}
          onPress={handleLogin} disabled={submitting} activeOpacity={0.85}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Log In</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.link} onPress={() => navigation.navigate("Signup")}>
          <Text style={styles.linkText}>Don't have an account? <Text style={styles.linkBold}>Sign Up</Text></Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primaryDark, justifyContent: "center", padding: Spacing.lg },
  brand: { alignItems: "center", marginBottom: Spacing.xl },
  brandIcon: { fontSize: 52 },
  brandTitle: { fontSize: 24, fontWeight: "700", color: "#fff", marginTop: Spacing.sm },
  brandSub: { fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 4, textAlign: "center" },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, ...Shadow.lg },
  cardTitle: { fontSize: 17, fontWeight: "700", color: Colors.text, marginBottom: Spacing.lg },
  label: { fontSize: 13, fontWeight: "600", color: Colors.textSecondary, marginTop: Spacing.sm, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 12, fontSize: 15, color: Colors.text, backgroundColor: Colors.background },
  errorBox: { backgroundColor: Colors.dangerLight, borderRadius: Radius.sm, padding: Spacing.sm, marginTop: Spacing.md },
  errorText: { color: Colors.danger, fontSize: 13 },
  button: { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: 14, alignItems: "center", marginTop: Spacing.lg },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  link: { marginTop: Spacing.md, alignItems: "center" },
  linkText: { color: Colors.textSecondary, fontSize: 14 },
  linkBold: { color: Colors.primary, fontWeight: "700" },
});