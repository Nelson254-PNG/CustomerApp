// ============================================================
//  screens/MyAccountScreen.tsx
//  The customer's home screen: their balance, usage history,
//  bills, and payment history — all fetched using THEIR OWN
//  token + userId, never anyone else's.
// ============================================================

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { getMyProfile, getMyUsage, getMyBills, getMyPayments } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { UsageRecord, Bill, Payment } from "../types";

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
      // Promise.all runs all four requests concurrently — same
      // pattern as the admin app's CustomerDetailScreen.
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
    } catch (e: any) {
      setError(e.message ?? "Failed to load your account");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, userId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* ── HEADER ───────────────────────────────────────── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {name.split(" ")[0]}</Text>
          <Text style={styles.meterText}>{meterNumber}</Text>
        </View>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      {/* ── BALANCE CARD ─────────────────────────────────── */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Current Balance</Text>
        <Text
          style={[
            styles.balanceAmount,
            balance > 0 ? styles.owing : balance < 0 ? styles.credit : styles.clear,
          ]}
        >
          KES {balance.toFixed(2)}
        </Text>
        <Text style={styles.balanceStatus}>
          {balance > 0 ? "PAYMENT DUE" : balance < 0 ? "CREDIT ON ACCOUNT" : "ALL CLEAR"}
        </Text>
      </View>

      {error && <Text style={styles.errorText}>⚠ {error}</Text>}

      {/* ── PAY BUTTON ───────────────────────────────────── */}
      {bills.some((b) => !b.paid) && (
        <TouchableOpacity
          style={styles.payButton}
          onPress={() => navigation.navigate("MakePayment", { bills })}
        >
          <Text style={styles.payButtonText}>Make a Payment</Text>
        </TouchableOpacity>
      )}

      {/* ── USAGE HISTORY ────────────────────────────────── */}
      <Text style={styles.sectionTitle}>My Usage History ({usage.length})</Text>
      {usage.length === 0 ? (
        <Text style={styles.emptyText}>No usage recorded yet.</Text>
      ) : (
        usage.map((r, i) => (
          <View key={i} style={styles.row}>
            <Text style={styles.rowDate}>{r.date}</Text>
            <Text style={styles.rowDetail}>
              {r.previousReading} → {r.currentReading} m³
            </Text>
            <Text style={styles.rowValue}>{r.unitsUsed} m³</Text>
          </View>
        ))
      )}

      {/* ── BILLS ────────────────────────────────────────── */}
      <Text style={styles.sectionTitle}>My Bills ({bills.length})</Text>
      {bills.length === 0 ? (
        <Text style={styles.emptyText}>No bills yet.</Text>
      ) : (
        bills.map((b) => (
          <View key={b.id} style={styles.row}>
            <Text style={styles.rowDate}>{b.issueDate}</Text>
            <Text style={styles.rowDetail}>
              {b.totalUnits} m³ · KES {b.totalAmount.toFixed(2)}
            </Text>
            <Text style={[styles.badge, b.paid ? styles.paidBadge : styles.unpaidBadge]}>
              {b.paid ? "PAID" : "UNPAID"}
            </Text>
          </View>
        ))
      )}

      {/* ── PAYMENT HISTORY ──────────────────────────────── */}
      <Text style={styles.sectionTitle}>My Payments ({payments.length})</Text>
      {payments.length === 0 ? (
        <Text style={styles.emptyText}>No payments yet.</Text>
      ) : (
        payments.map((p, i) => (
          <View key={i} style={styles.row}>
            <Text style={styles.rowDate}>{p.date}</Text>
            <Text style={styles.rowDetail}>{p.method}</Text>
            <Text style={styles.rowValue}>KES {p.amountPaid.toFixed(2)}</Text>
          </View>
        ))
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0fdf4" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    padding: 20, paddingTop: 50,
  },
  greeting: { fontSize: 20, fontWeight: "700", color: "#1e293b" },
  meterText: { fontSize: 13, color: "#64748b", marginTop: 2 },
  logoutText: { color: "#dc2626", fontSize: 13, fontWeight: "600" },
  balanceCard: {
    backgroundColor: "white", margin: 16, marginTop: 0, padding: 20,
    borderRadius: 14, alignItems: "center",
  },
  balanceLabel: { fontSize: 13, color: "#64748b" },
  balanceAmount: { fontSize: 32, fontWeight: "700", marginTop: 4 },
  balanceStatus: { fontSize: 12, color: "#94a3b8", marginTop: 4, letterSpacing: 1 },
  owing: { color: "#dc2626" },
  credit: { color: "#16a34a" },
  clear: { color: "#64748b" },
  errorText: { color: "#dc2626", textAlign: "center", marginBottom: 8 },
  payButton: {
    margin: 16, marginTop: 0, backgroundColor: "#16a34a",
    borderRadius: 10, paddingVertical: 14, alignItems: "center",
  },
  payButtonText: { color: "white", fontWeight: "700", fontSize: 16 },
  sectionTitle: {
    fontSize: 15, fontWeight: "700", color: "#1e293b",
    marginTop: 20, marginHorizontal: 16, marginBottom: 8,
  },
  emptyText: { color: "#94a3b8", marginHorizontal: 16, fontSize: 13 },
  row: {
    backgroundColor: "white", marginHorizontal: 16, marginBottom: 8,
    padding: 12, borderRadius: 10, flexDirection: "row",
    justifyContent: "space-between", alignItems: "center",
  },
  rowDate: { fontSize: 12, color: "#64748b", width: 80 },
  rowDetail: { fontSize: 13, color: "#1e293b", flex: 1 },
  rowValue: { fontSize: 13, fontWeight: "700", color: "#1e293b" },
  badge: { fontSize: 11, fontWeight: "700", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  paidBadge: { backgroundColor: "#dcfce7", color: "#16a34a" },
  unpaidBadge: { backgroundColor: "#fee2e2", color: "#dc2626" },
});