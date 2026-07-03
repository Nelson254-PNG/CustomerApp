import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { signup } from "../api/clients";
import { useAuth } from "../context/AuthContext";
import { Colors, Spacing, Radius, Shadow } from "../theme";

export default function SignupScreen() {
  const navigation = useNavigation<any>();
  const { login } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async () => {
    if (!name.trim() || !phone.trim() || !email.trim() || !password) { setError("All fields are required."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setSubmitting(true); setError(null);
    try {
      const result = await signup(name.trim(), phone.trim(), email.trim(), password);
      await login(result.token, result.userId);
    } catch (e: any) { setError(e.message ?? "Signup failed"); }
    finally { setSubmitting(false); }
  };

  const fields = [
    { label: "Full Name", value: name, set: setName, placeholder: "Jane Wanjiru", cap: "words" as const, keyboard: "default" as const, secure: false },
    { label: "Phone", value: phone, set: setPhone, placeholder: "0712345678", cap: "none" as const, keyboard: "phone-pad" as const, secure: false },
    { label: "Email", value: email, set: setEmail, placeholder: "you@example.com", cap: "none" as const, keyboard: "email-address" as const, secure: false },
    { label: "Password", value: password, set: setPassword, placeholder: "At least 6 characters", cap: "none" as const, keyboard: "default" as const, secure: true },
    { label: "Confirm Password", value: confirm, set: setConfirm, placeholder: "Re-enter password", cap: "none" as const, keyboard: "default" as const, secure: true },
  ];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Create Account</Text>
          <Text style={styles.headerSub}>Set up your water account</Text>
        </View>
        <View style={styles.card}>
          {fields.map(f => (
            <View key={f.label}>
              <Text style={styles.label}>{f.label}</Text>
              <TextInput style={styles.input} value={f.value} onChangeText={f.set}
                placeholder={f.placeholder} autoCapitalize={f.cap}
                keyboardType={f.keyboard} secureTextEntry={f.secure && !showPassword}
                placeholderTextColor={Colors.textMuted} />{f.secure && (<TouchableOpacity onPress={() => setShowPassword(!showPassword)}><Text>{showPassword ? "Hide" : "Show"}</Text>
              </TouchableOpacity> )}
            </View>   
          ))}
      
          {error && <View style={styles.errorBox}><Text style={styles.errorText}>⚠ {error}</Text></View>}
          <TouchableOpacity style={[styles.button, submitting && styles.buttonDisabled]}
            onPress={handleSignup} disabled={submitting} activeOpacity={0.85}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Account</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.link} onPress={() => navigation.navigate("Login")}>
            <Text style={styles.linkText}>Already have an account? <Text style={styles.linkBold}>Log In</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primaryDark },
  content: { padding: Spacing.lg, paddingTop: 60 },
  header: { alignItems: "center", marginBottom: Spacing.lg },
  headerTitle: { fontSize: 24, fontWeight: "700", color: "#fff" },
  headerSub: { fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 4 },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, ...Shadow.lg },
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