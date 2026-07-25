import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { initiateStkPush, checkStkStatus, makePayment } from "../api/clients";
import { useAuth } from "../context/AuthContext";
import { Bill } from "../types";
import { Colors, Spacing, Radius, Shadow } from "../theme";

function todayISO() { return new Date().toISOString().split("T")[0]; }
type Method = "M-Pesa STK Push" | "Cash" | "Bank Transfer";

export default function MakePaymentScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { bills } = route.params as { bills: Bill[] };
  const { token, userId } = useAuth();

  const unpaid = bills.filter(b => !b.paid);
  const [selectedId, setSelectedId] = useState<string | null>(
    unpaid.length > 0 ? unpaid[0].id : null
  );
  const [method, setMethod] = useState<Method>("M-Pesa STK Push");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [date, setDate] = useState(todayISO());

  // STK Push specific state
  const [stkPending, setStkPending] = useState(false);
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const selectedBill = unpaid.find(b => b.id === selectedId);

  // ── POLLING FOR STK CONFIRMATION ─────────────────────────────
  // After initiating STK Push, poll the server every 3 seconds
  // to check if Safaricom's callback has confirmed or failed.
  // Stop after 30 polls (90 seconds) to avoid infinite polling.
  useEffect(() => {
    if (!checkoutRequestId || !stkPending) return;

    pollIntervalRef.current = setInterval(async () => {
      setPollCount(prev => {
        if (prev >= 30) {
          clearInterval(pollIntervalRef.current!);
          setStkPending(false);
          setError("Payment timed out. Please check your M-Pesa messages and try again.");
          return 0;
        }
        return prev + 1;
      });

      try {
        const result = await checkStkStatus(token!, userId!, checkoutRequestId);
        if (result.status === "completed") {
          clearInterval(pollIntervalRef.current!);
          setStkPending(false);
          setSuccess(true);
          setSuccessMessage(`✔ Payment of KES ${result.amount.toFixed(2)} confirmed!`);
          setTimeout(() => navigation.goBack(), 2000);
        } else if (result.status === "failed") {
          clearInterval(pollIntervalRef.current!);
          setStkPending(false);
          setError("Payment was cancelled or failed. Please try again.");
        }
      } catch (e) {
        // Network error during polling — keep trying
      }
    }, 3000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [checkoutRequestId, stkPending]);

  const handleSubmit = async () => {
    if (!selectedId) { setError("Select a bill."); return; }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) { setError("Enter a valid amount."); return; }

    if (method === "M-Pesa STK Push") {
      if (!phone.trim()) { setError("Enter your M-Pesa phone number."); return; }
      setSubmitting(true); setError(null);
      try {
        const result = await initiateStkPush(token!, userId!, selectedId, phone.trim(), amt);
        setCheckoutRequestId(String(result.checkoutRequestId));
        setStkPending(true);
        setPollCount(0);
      } catch (e: any) {
        setError(e.message ?? "Failed to initiate M-Pesa payment");
      } finally {
        setSubmitting(false);
      }
    } else {
      // Cash or Bank Transfer — same as before
      setSubmitting(true); setError(null);
      try {
        await makePayment(token!, userId!, selectedId, method, reference || "N/A", amt, date);
        setSuccess(true);
        setSuccessMessage("✔ Payment recorded!");
        setTimeout(() => navigation.goBack(), 1200);
      } catch (e: any) {
        setError(e.message ?? "Payment failed");
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleCancelSTK = () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    setStkPending(false);
    setCheckoutRequestId(null);
    setPollCount(0);
    setError("Payment cancelled.");
  };

  if (unpaid.length === 0) return (
    <View style={styles.centered}>
      <Text style={styles.clearIcon}>🎉</Text>
      <Text style={styles.clearTitle}>You're all paid up!</Text>
      <Text style={styles.clearSub}>No outstanding bills.</Text>
    </View>
  );

  // ── STK PUSH WAITING SCREEN ──────────────────────────────────
  if (stkPending) return (
    <View style={styles.waitingContainer}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.waitingTitle}>Waiting for Payment</Text>
      <Text style={styles.waitingPhone}>M-Pesa prompt sent to</Text>
      <Text style={styles.waitingPhoneNumber}>{phone}</Text>
      <Text style={styles.waitingInstructions}>
        Enter your M-Pesa PIN on your phone to complete the payment.
      </Text>
      <Text style={styles.waitingTimer}>
        Checking... ({pollCount}/30)
      </Text>
      <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelSTK}>
        <Text style={styles.cancelBtnText}>Cancel</Text>
      </TouchableOpacity>
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
              onPress={() => { setSelectedId(b.id); setAmount(rem.toFixed(2)); }}
              activeOpacity={0.7}
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

        {/* Payment method */}
        <Text style={styles.sectionLabel}>PAYMENT METHOD</Text>
        <View style={styles.methodGrid}>
          {([
            { id: "M-Pesa STK Push", icon: "📱", desc: "Instant PIN prompt" },
            { id: "Cash", icon: "💵", desc: "Manual entry" },
            { id: "Bank Transfer", icon: "🏦", desc: "Manual entry" },
          ] as { id: Method; icon: string; desc: string }[]).map(m => (
            <TouchableOpacity key={m.id}
              style={[styles.methodCard, method === m.id && styles.methodCardSelected]}
              onPress={() => setMethod(m.id)} activeOpacity={0.7}
            >
              <Text style={styles.methodIcon}>{m.icon}</Text>
              <Text style={[styles.methodText, method === m.id && styles.methodTextSelected]}>
                {m.id}
              </Text>
              <Text style={styles.methodDesc}>{m.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Amount */}
        <Text style={styles.sectionLabel}>AMOUNT (KES)</Text>
        <TextInput style={styles.input} value={amount} onChangeText={setAmount}
          placeholder="0.00" keyboardType="numeric" placeholderTextColor={Colors.textMuted} />

        {/* Phone (STK Push only) */}
        {method === "M-Pesa STK Push" && (
          <>
            <Text style={styles.sectionLabel}>YOUR M-PESA PHONE NUMBER</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="e.g. 0712345678"
              keyboardType="phone-pad"
              placeholderTextColor={Colors.textMuted}
            />
            <Text style={styles.hint}>
              💡 You'll receive a PIN prompt on this number. Make sure it matches your M-Pesa registered line.
            </Text>
          </>
        )}

        {/* Reference (Cash/Bank only) */}
        {method !== "M-Pesa STK Push" && (
          <>
            <Text style={styles.sectionLabel}>REFERENCE (OPTIONAL)</Text>
            <TextInput style={styles.input} value={reference} onChangeText={setReference}
              placeholder="Reference number" placeholderTextColor={Colors.textMuted} />
            <Text style={styles.sectionLabel}>PAYMENT DATE</Text>
            <TextInput style={styles.input} value={date} onChangeText={setDate}
              placeholder="YYYY-MM-DD" placeholderTextColor={Colors.textMuted} />
          </>
        )}

        {error && <View style={styles.errorBox}><Text style={styles.errorText}>⚠ {error}</Text></View>}
        {success && <View style={styles.successBox}><Text style={styles.successText}>{successMessage}</Text></View>}

        <TouchableOpacity
          style={[styles.button, submitting && styles.buttonDisabled]}
          onPress={handleSubmit} disabled={submitting} activeOpacity={0.85}
        >
          {submitting
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>
                {method === "M-Pesa STK Push" ? "📱 Send M-Pesa Prompt" : "Submit Payment"}
              </Text>
          }
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

  // ── Waiting screen ──────────────────────────────────────────
  waitingContainer: {
    flex: 1, backgroundColor: Colors.background,
    justifyContent: "center", alignItems: "center", padding: Spacing.xl,
  },
  waitingTitle: { fontSize: 22, fontWeight: "700", color: Colors.text, marginTop: Spacing.lg },
  waitingPhone: { fontSize: 14, color: Colors.textSecondary, marginTop: Spacing.md },
  waitingPhoneNumber: { fontSize: 20, fontWeight: "700", color: Colors.primary, marginTop: 4 },
  waitingInstructions: {
    fontSize: 14, color: Colors.textSecondary, textAlign: "center",
    marginTop: Spacing.lg, lineHeight: 22,
  },
  waitingTimer: { fontSize: 12, color: Colors.textMuted, marginTop: Spacing.md },
  cancelBtn: {
    marginTop: Spacing.xl, paddingVertical: 12, paddingHorizontal: Spacing.xl,
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.full,
  },
  cancelBtnText: { color: Colors.textSecondary, fontWeight: "600" },

  // ── Form ────────────────────────────────────────────────────
  sectionLabel: {
    fontSize: 11, fontWeight: "700", color: Colors.textMuted,
    letterSpacing: 0.8, marginTop: Spacing.lg, marginBottom: Spacing.sm,
  },
  billCard: {
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center", ...Shadow.sm,
  },
  billCardSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  billDate: { fontSize: 13, fontWeight: "600", color: Colors.text },
  billDue: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  billRight: { alignItems: "flex-end" },
  billAmount: { fontSize: 18, fontWeight: "700", color: Colors.text },
  billLabel: { fontSize: 10, color: Colors.textMuted },

  methodGrid: { gap: Spacing.sm },
  methodCard: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md,
    padding: Spacing.md, backgroundColor: Colors.surface, ...Shadow.sm,
  },
  methodCardSelected: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  methodIcon: { fontSize: 24, marginRight: Spacing.sm },
  methodText: { fontSize: 14, fontWeight: "700", color: Colors.text, flex: 1 },
  methodTextSelected: { color: Colors.primary },
  methodDesc: { fontSize: 11, color: Colors.textMuted },

  input: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: 12,
    fontSize: 15, color: Colors.text, backgroundColor: Colors.surface,
  },
  hint: {
    fontSize: 12, color: Colors.textSecondary, marginTop: Spacing.xs,
    backgroundColor: Colors.primaryLight, padding: Spacing.sm, borderRadius: Radius.sm,
  },
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