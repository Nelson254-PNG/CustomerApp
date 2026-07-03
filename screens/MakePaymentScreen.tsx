import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { makePayment, payByMpesa, payByTill } from "../api/clients";
import { useAuth } from "../context/AuthContext";
import { Bill } from "../types";
import { Colors, Spacing, Radius, Shadow } from "../theme";

function todayISO() { return new Date().toISOString().split("T")[0]; }
type Method = "M-Pesa" | "M-Pesa Till" | "Cash" | "Bank Transfer";

export default function MakePaymentScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { bills } = route.params as { bills: Bill[] };
  const { token, userId } = useAuth();

  const unpaid = bills.filter(b => !b.paid);
  const [selectedId, setSelectedId] = useState<string | null>(unpaid.length > 0 ? unpaid[0].id : null);
  const [method, setMethod] = useState<Method>("M-Pesa");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [date, setDate] = useState(todayISO());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const selectedBill = unpaid.find(b => b.id === selectedId);
  const isMpesa = method === "M-Pesa" || method === "M-Pesa Till";

  const handleSubmit = async () => {
    if (!selectedId) { setError("Select a bill."); return; }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) { setError("Enter a valid amount."); return; }
    if (isMpesa && reference.trim().length !== 10) { setError("M-Pesa code must be 10 characters."); return; }
    setSubmitting(true); setError(null);
    try {
      if (method === "M-Pesa") await payByMpesa(token!, userId!, selectedId, reference.trim().toUpperCase(), amt, date);
      else if (method === "M-Pesa Till") await payByTill(token!, userId!, selectedId, reference.trim().toUpperCase(), amt, date);
      else await makePayment(token!, userId!, selectedId, method, reference || "N/A", amt, date);
      setSuccess(true);
      setTimeout(() => navigation.goBack(), 1500);
    } catch (e: any) { setError(e.message ?? "Payment failed"); }
    finally { setSubmitting(false); }
  };

  if (unpaid.length === 0) return (
    <View style={styles.centered}>
      <Text style={styles.clearIcon}>🎉</Text>
      <Text style={styles.clearTitle}>You're all paid up!</Text>
      <Text style={styles.clearSub}>No outstanding bills.</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        {/* Bill selection */}
        <Text style={styles.sectionLabel}>CHOOSE BILL TO PAY</Text>
        {unpaid.map(b => {
          const rem = b.totalAmount - b.amountPaid;
          const sel = b.id === selectedId;
          return (
            <TouchableOpacity key={b.id}
              style={[styles.billCard, sel && styles.billCardSelected]}
              onPress={() => setSelectedId(b.id)} activeOpacity={0.7}
            >
              <View>
                <Text style={styles.billDate}>Issued: {b.issueDate}</Text>
                <Text style={styles.billDue}>Due: {b.dueDate}</Text>
              </View>
              <View style={styles.billRight}>
                <Text style={[styles.billAmount, sel && { color: Colors.primary }]}>
                  KES {rem.toFixed(2)}
                </Text>
                <Text style={styles.billLabel}>remaining</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Method */}
        <Text style={styles.sectionLabel}>PAYMENT METHOD</Text>
        <View style={styles.methodGrid}>
          {([
            { id: "M-Pesa", icon: "📱" },
            { id: "M-Pesa Till", icon: "🏪" },
            { id: "Cash", icon: "💵" },
            { id: "Bank Transfer", icon: "🏦" },
          ] as { id: Method; icon: string }[]).map(m => (
            <TouchableOpacity key={m.id}
              style={[styles.methodChip, method === m.id && styles.methodChipSelected]}
              onPress={() => { setMethod(m.id); setReference(""); }} activeOpacity={0.7}
            >
              <Text style={styles.methodIcon}>{m.icon}</Text>
              <Text style={[styles.methodText, method === m.id && styles.methodTextSelected]}>{m.id}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Amount */}
        <Text style={styles.sectionLabel}>AMOUNT (KES)</Text>
        <TextInput
          style={styles.input} value={amount} onChangeText={setAmount}
          placeholder={selectedBill ? (selectedBill.totalAmount - selectedBill.amountPaid).toFixed(2) : "0.00"}
          keyboardType="numeric" placeholderTextColor={Colors.textMuted}
        />

        {/* Reference (if not cash) */}
        {method !== "Cash" && (
          <>
            <Text style={styles.sectionLabel}>
              {isMpesa ? "M-PESA TRANSACTION CODE" : "REFERENCE NUMBER"}
            </Text>
            <TextInput
              style={styles.input} value={reference} onChangeText={setReference}
              placeholder={isMpesa ? "e.g. QGR7XYZ123" : "Reference"}
              autoCapitalize="characters"
              maxLength={isMpesa ? 10 : undefined}
              placeholderTextColor={Colors.textMuted}
            />
            {isMpesa && (
              <Text style={[styles.codeHint, reference.length === 10 && { color: Colors.success }]}>
                {reference.length}/10 {reference.length === 10 ? "✔" : ""}
              </Text>
            )}
          </>
        )}

        {/* Date */}
        <Text style={styles.sectionLabel}>PAYMENT DATE</Text>
        <TextInput style={styles.input} value={date} onChangeText={setDate}
          placeholder="YYYY-MM-DD" placeholderTextColor={Colors.textMuted} />

        {/* Feedback */}
        {error && <View style={styles.errorBox}><Text style={styles.errorText}>⚠ {error}</Text></View>}
        {success && <View style={styles.successBox}><Text style={styles.successText}>✔ Payment submitted successfully!</Text></View>}

        <TouchableOpacity
          style={[styles.button, submitting && styles.buttonDisabled]}
          onPress={handleSubmit} disabled={submitting} activeOpacity={0.85}
        >
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Submit Payment</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingBottom: 48 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", gap: Spacing.sm },
  clearIcon: { fontSize: 56 },
  clearTitle: { fontSize: 20, fontWeight: "700", color: Colors.success },
  clearSub: { fontSize: 14, color: Colors.textSecondary },

  sectionLabel: {
    fontSize: 11, fontWeight: "700", color: Colors.textMuted,
    letterSpacing: 0.8, marginTop: Spacing.lg, marginBottom: Spacing.sm,
  },

  billCard: {
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    ...Shadow.sm,
  },
  billCardSelected: { borderColor: Colors.primary, backgroundColor: "#f0fdf4" },
  billDate: { fontSize: 13, fontWeight: "600", color: Colors.text },
  billDue: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  billRight: { alignItems: "flex-end" },
  billAmount: { fontSize: 18, fontWeight: "700", color: Colors.text },
  billLabel: { fontSize: 10, color: Colors.textMuted },

  methodGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  methodChip: {
    width: "47%", borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radius.md, paddingVertical: Spacing.sm, alignItems: "center",
    backgroundColor: Colors.surface, ...Shadow.sm,
  },
  methodChipSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  methodIcon: { fontSize: 22, marginBottom: 4 },
  methodText: { fontSize: 12, fontWeight: "600", color: Colors.text },
  methodTextSelected: { color: "#fff" },

  input: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: 12,
    fontSize: 15, color: Colors.text, backgroundColor: Colors.surface,
  },
  codeHint: { fontSize: 11, color: Colors.textMuted, marginTop: 4, textAlign: "right" },

  errorBox: { backgroundColor: Colors.dangerLight, borderRadius: Radius.sm, padding: Spacing.sm, marginTop: Spacing.md },
  errorText: { color: Colors.danger, fontSize: 13 },
  successBox: { backgroundColor: Colors.successLight, borderRadius: Radius.sm, padding: Spacing.sm, marginTop: Spacing.md },
  successText: { color: Colors.success, fontSize: 13, fontWeight: "600" },

  button: {
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    paddingVertical: 14, alignItems: "center", marginTop: Spacing.xl,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});