import React, { useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { getMyProfile, getMyUsage, getMyBills, getMyPayments } from "../api/clients";
import { useAuth } from "../context/AuthContext";
import { UsageRecord, Bill, Payment } from "../types";
import { Colors, Spacing, Radius, Shadow, Typography } from "../theme";

export default function MyAccountScreen() {
  const navigation = useNavigation<any>();
  const { token, userId, logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [meterNumber, setMeterNumber] = useState("");
  const [balance, setBalance] = useState(0);
  const [usage, setUsage] = useState<UsageRecord[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  const loadData = useCallback(async () => {
    if (!token || !userId) return;
    try {
      setError(null);
      const [profile, usageData, billsData, paymentsData] = await Promise.all([
        getMyProfile(token, userId),
        getMyUsage(token, userId),
        getMyBills(token, userId),
        getMyPayments(token, userId),
      ]);
      setName(profile.name);
      setMeterNumber(profile.meterNumber);
      setUsage(usageData.records);
      setBills(billsData.bills);
      setBalance(billsData.balance);
      setPayments(paymentsData.payments);
    } catch (e: any) { setError(e.message ?? "Failed to load"); }
    finally { setLoading(false); setRefreshing(false); }
  }, [token, userId]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  if (loading) return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );

  const unpaidBills = bills.filter(b => !b.paid);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={Colors.primary} />}
    >
      {/* ── HEADER ─────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
          </View>
          <View>
            <Text style={styles.greeting}>Hello, {name.split(" ")[0]} 👋</Text>
            <Text style={styles.meter}>Meter: {meterNumber}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      {/* ── BALANCE CARD ─────────────────────────── */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Current Balance</Text>
        <Text style={[styles.balanceAmount, balance > 0 ? styles.owing : balance < 0 ? styles.credit : styles.clear]}>
          KES {Math.abs(balance).toFixed(2)}
        </Text>
        <Text style={styles.balanceStatus}>
          {balance > 0 ? "⚠ PAYMENT DUE" : balance < 0 ? "✦ CREDIT ON ACCOUNT" : "✔ ACCOUNT CLEAR"}
        </Text>
        {unpaidBills.length > 0 && (
          <TouchableOpacity style={styles.payNowBtn}
            onPress={() => navigation.navigate("MakePayment", { bills })} activeOpacity={0.85}>
            <Text style={styles.payNowText}>Pay Now →</Text>
          </TouchableOpacity>
        )}
      </View>

      {error && <View style={styles.errorBox}><Text style={styles.errorText}>⚠ {error}</Text></View>}

      {/* ── USAGE ────────────────────────────────── */}
      <SectionHeader title="My Usage" count={usage.length} />
      {usage.length === 0
        ? <Empty message="No usage recorded yet — your admin will update this." />
        : usage.slice(-3).reverse().map((r, i) => (
          <View key={i} style={styles.row}>
            <Text style={styles.rowDate}>{r.date}</Text>
            <Text style={styles.rowMain}>{r.previousReading} → {r.currentReading} m³</Text>
            <Text style={[styles.rowValue, { color: Colors.primary }]}>{r.unitsUsed.toFixed(1)} m³</Text>
          </View>
        ))
      }

      {/* ── BILLS ────────────────────────────────── */}
      <SectionHeader title="My Bills" count={bills.length} />
      {bills.length === 0
        ? <Empty message="No bills generated yet." />
        : bills.slice().reverse().map((b) => (
          <View key={b.id} style={styles.row}>
            <Text style={styles.rowDate}>{b.issueDate}</Text>
            <Text style={styles.rowMain}>KES {b.totalAmount.toFixed(2)}</Text>
            <View style={[styles.badge, b.paid ? styles.paidBadge : styles.unpaidBadge]}>
              <Text style={[styles.badgeText, b.paid ? styles.paidText : styles.unpaidText]}>
                {b.paid ? "PAID" : "UNPAID"}
              </Text>
            </View>
          </View>
        ))
      }

      {/* ── PAYMENTS ─────────────────────────────── */}
      <SectionHeader title="My Payments" count={payments.length} />
      {payments.length === 0
        ? <Empty message="No payments made yet." />
        : payments.slice().reverse().map((p, i) => (
          <View key={i} style={styles.row}>
            <Text style={styles.rowDate}>{p.date}</Text>
            <Text style={styles.rowMain}>{p.method}</Text>
            <Text style={[styles.rowValue, { color: Colors.success }]}>KES {p.amountPaid.toFixed(2)}</Text>
          </View>
        ))
      }

      <View style={{ height: 48 }} />
    </ScrollView>
  );
}

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionBadge}>{count}</Text>
    </View>
  );
}

function Empty({ message }: { message: string }) {
  return <Text style={styles.emptyText}>{message}</Text>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: Colors.primaryDark, padding: Spacing.md, paddingTop: 52,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 20, fontWeight: "700", color: "#fff" },
  greeting: { fontSize: 16, fontWeight: "700", color: "#fff" },
  meter: { fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 2 },
  logoutBtn: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: Radius.full },
  logoutText: { color: "#fff", fontSize: 12, fontWeight: "600" },

  balanceCard: {
    backgroundColor: Colors.primaryDark, alignItems: "center",
    paddingBottom: Spacing.xl, paddingHorizontal: Spacing.lg, paddingTop: Spacing.md,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  balanceLabel: { fontSize: 13, color: "rgba(255,255,255,0.6)" },
  balanceAmount: { fontSize: 40, fontWeight: "700", marginTop: 4 },
  balanceStatus: { fontSize: 12, marginTop: 4, letterSpacing: 0.5, color: "rgba(255,255,255,0.7)" },
  owing: { color: "#fca5a5" },
  credit: { color: "#86efac" },
  clear: { color: "#fff" },
  payNowBtn: {
    marginTop: Spacing.md, backgroundColor: "#fff",
    paddingVertical: 10, paddingHorizontal: Spacing.xl,
    borderRadius: Radius.full,
  },
  payNowText: { color: Colors.primaryDark, fontWeight: "700", fontSize: 15 },

  errorBox: { backgroundColor: Colors.dangerLight, borderRadius: Radius.sm, padding: Spacing.sm, margin: Spacing.md },
  errorText: { color: Colors.danger, fontSize: 13 },

  sectionRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginHorizontal: Spacing.md, marginTop: Spacing.lg, marginBottom: Spacing.sm,
  },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: Colors.text },
  sectionBadge: {
    fontSize: 12, color: Colors.primary, fontWeight: "700",
    backgroundColor: Colors.primaryLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.full,
  },
  emptyText: { color: Colors.textMuted, marginHorizontal: Spacing.md, fontSize: 13, marginBottom: Spacing.sm },

  row: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.surface, marginHorizontal: Spacing.md,
    marginBottom: 6, padding: Spacing.md, borderRadius: Radius.md, ...Shadow.sm,
  },
  rowDate: { fontSize: 12, color: Colors.textMuted, width: 78 },
  rowMain: { flex: 1, fontSize: 13, color: Colors.text },
  rowValue: { fontSize: 13, fontWeight: "700" },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  paidBadge: { backgroundColor: Colors.successLight },
  unpaidBadge: { backgroundColor: Colors.dangerLight },
  badgeText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  paidText: { color: Colors.success },
  unpaidText: { color: Colors.danger },
});