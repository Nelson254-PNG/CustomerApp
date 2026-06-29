// ============================================================
//  screens/MakePaymentScreen.tsx
//  Same UI pattern as the admin app's payment screen, but
//  scoped entirely to the LOGGED-IN customer — no customerId
//  selection, since there's only ever "my own" account here.
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
import { useNavigation, useRoute } from "@react-navigation/native";
import { makePayment, payByMpesa, payByTill } from "../api/clients";
import { useAuth } from "../context/AuthContext";
import { Bill } from "../types";

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

type Method = "Cash" | "M-Pesa" | "M-Pesa Till" | "Bank Transfer";

export default function MakePaymentScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { bills } = route.params as { bills: Bill[] };
  const { token, userId } = useAuth();

  const unpaidBills = bills.filter((b) => !b.paid);

  const [selectedBillId, setSelectedBillId] = useState<string | null>(
    unpaidBills.length > 0 ? unpaidBills[0].id : null
  );
  const [method, setMethod] = useState<Method>("M-Pesa");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [date, setDate] = useState(todayISO());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const selectedBill = unpaidBills.find((b) => b.id === selectedBillId);

  const handleSubmit = async () => {
    if (!selectedBillId) {
      setError("Select a bill to pay.");
      return;
    }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    if ((method === "M-Pesa" || method === "M-Pesa Till") && reference.trim().length !== 10) {
      setError("M-Pesa code must be exactly 10 characters.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (method === "M-Pesa") {
        await payByMpesa(token!, userId!, selectedBillId, reference.trim().toUpperCase(), amt, date);
      } else if (method === "M-Pesa Till") {
        await payByTill(token!, userId!, selectedBillId, reference.trim().toUpperCase(), amt, date);
      } else {
        await makePayment(token!, userId!, selectedBillId, method, reference || "N/A", amt, date);
      }
      setSuccess(true);
      setTimeout(() => navigation.goBack(), 1200);
    } catch (e: any) {
      // A duplicate M-Pesa code surfaces here as a 409, with
      // the message "This M-Pesa code has already been used"
      // straight from your Crow route's catch block.
      setError(e.message ?? "Payment failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (unpaidBills.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>✔ You have no unpaid bills.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.label}>Select Bill to Pay</Text>
        {unpaidBills.map((b) => {
          const remaining = b.totalAmount - b.amountPaid;
          const isSelected = b.id === selectedBillId;
          return (
            <TouchableOpacity
              key={b.id}
              style={[styles.billOption, isSelected && styles.billOptionSelected]}
              onPress={() => setSelectedBillId(b.id)}
            >
              <Text style={styles.billOptionText}>{b.issueDate}</Text>
              <Text style={styles.billOptionAmount}>KES {remaining.toFixed(2)} remaining</Text>
            </TouchableOpacity>
          );
        })}

        <Text style={styles.label}>Payment Method</Text>
        <View style={styles.methodRow}>
          {(["M-Pesa", "M-Pesa Till", "Cash", "Bank Transfer"] as Method[]).map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.methodChip, method === m && styles.methodChipSelected]}
              onPress={() => setMethod(m)}
            >
              <Text style={[styles.methodChipText, method === m && styles.methodChipTextSelected]}>
                {m}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Amount (KES)</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          placeholder={selectedBill ? (selectedBill.totalAmount - selectedBill.amountPaid).toFixed(2) : "0.00"}
          keyboardType="numeric"
        />

        {method !== "Cash" && (
          <>
            <Text style={styles.label}>
              {method === "M-Pesa" || method === "M-Pesa Till" ? "M-Pesa Transaction Code" : "Reference"}
            </Text>
            <TextInput
              style={styles.input}
              value={reference}
              onChangeText={setReference}
              placeholder={method === "M-Pesa" || method === "M-Pesa Till" ? "e.g. QGR7XYZ123" : "Reference number"}
              autoCapitalize="characters"
              maxLength={method === "M-Pesa" || method === "M-Pesa Till" ? 10 : undefined}
            />
          </>
        )}

        <Text style={styles.label}>Payment Date</Text>
        <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />

        {error && <Text style={styles.errorText}>⚠ {error}</Text>}
        {success && <Text style={styles.successText}>✔ Payment recorded!</Text>}

        <TouchableOpacity
          style={[styles.button, submitting && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Submit Payment</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  emptyText: { color: "#16a34a", fontSize: 16, fontWeight: "600" },
  label: { fontSize: 14, fontWeight: "600", color: "#374151", marginTop: 16, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: "#d1d5db", borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, backgroundColor: "white",
  },
  billOption: {
    borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 10,
    padding: 12, marginBottom: 8, backgroundColor: "white",
  },
  billOptionSelected: { borderColor: "#16a34a", backgroundColor: "#f0fdf4" },
  billOptionText: { fontSize: 13, color: "#64748b" },
  billOptionAmount: { fontSize: 15, fontWeight: "700", color: "#1e293b", marginTop: 2 },
  methodRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  methodChip: {
    flexGrow: 1, borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8,
    paddingVertical: 10, paddingHorizontal: 8, alignItems: "center", backgroundColor: "white",
  },
  methodChipSelected: { backgroundColor: "#16a34a", borderColor: "#16a34a" },
  methodChipText: { fontSize: 12, color: "#374151" },
  methodChipTextSelected: { color: "white", fontWeight: "600" },
  errorText: { color: "#dc2626", marginTop: 16, fontSize: 14 },
  successText: { color: "#16a34a", marginTop: 16, fontSize: 14, fontWeight: "600" },
  button: { backgroundColor: "#16a34a", borderRadius: 10, paddingVertical: 14, alignItems: "center", marginTop: 28 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "white", fontSize: 16, fontWeight: "700" },
});