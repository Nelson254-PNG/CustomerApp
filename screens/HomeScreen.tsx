import React, { useState, useCallback } from "react";
import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, RefreshControl, TouchableOpacity,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { getMyProfile, getMyBills } from "../api/clients";
import { useAuth } from "../context/AuthContext";
import { Bill } from "../types";
import { Colors, Spacing, Radius, Shadow } from "../theme";

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { token, userId } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [name, setName] = useState("");
  const [meterNumber, setMeterNumber] = useState("");
  const [balance, setBalance] = useState(0);
  const [bills, setBills] = useState<Bill[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!token || !userId) return;
    try {
      setError(null);
      const [profile, billsData] = await Promise.all([
        getMyProfile(token, userId),
        getMyBills(token, userId),
      ]);
      setName(profile.name);
      setMeterNumber(profile.meterNumber);
      setBalance(billsData.balance);
      setBills(billsData.bills);
    } catch (e: any) {
      setError(e.message ?? "Failed to load");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, userId]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  if (loading) return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );

  const unpaidBills = bills.filter(b => !b.paid);
  const unpaidTotal = unpaidBills.reduce((s, b) => s + (b.totalAmount - b.amountPaid), 0);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={Colors.primary} />}
    >
      {/* ── HERO ─────────────────────────────────── */}
      <View style={styles.hero}>
        <Text style={styles.greeting}>Hello, {name.split(" ")[0]} 👋</Text>
        <Text style={styles.meter}>Meter: {meterNumber}</Text>
        <Text style={[styles.balance, balance > 0 ? styles.owing : balance < 0 ? styles.credit : styles.clear]}>
          KES {Math.abs(balance).toFixed(2)}
        </Text>
        <Text style={styles.balanceLabel}>
          {balance > 0 ? "OUTSTANDING" : balance < 0 ? "CREDIT" : "ALL CLEAR"}
        </Text>

        {unpaidBills.length > 0 && (
          <TouchableOpacity
            style={styles.payBtn}
            onPress={() => navigation.navigate("PaymentTab", { screen: "MakePayment", params: { bills } })}
            activeOpacity={0.85}
          >
            <Text style={styles.payBtnText}>Pay KES {unpaidTotal.toFixed(2)} →</Text>
          </TouchableOpacity>
        )}
      </View>

      {error && <View style={styles.errorBox}><Text style={styles.errorText}>⚠ {error}</Text></View>}

      {/* ── QUICK STATS ──────────────────────────── */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{bills.length}</Text>
          <Text style={styles.statLabel}>Total Bills</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: Colors.danger }]}>{unpaidBills.length}</Text>
          <Text style={styles.statLabel}>Unpaid</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: Colors.success }]}>{bills.filter(b => b.paid).length}</Text>
          <Text style={styles.statLabel}>Paid</Text>
        </View>
      </View>

      {/* ── UNPAID BILLS PREVIEW ─────────────────── */}
      {unpaidBills.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Outstanding Bills</Text>
          {unpaidBills.map(b => (
            <View key={b.id} style={styles.billCard}>
              <View>
                <Text style={styles.billDate}>Issued: {b.issueDate}</Text>
                <Text style={styles.billDue}>Due: {b.dueDate}</Text>
              </View>
              <Text style={styles.billAmount}>KES {(b.totalAmount - b.amountPaid).toFixed(2)}</Text>
            </View>
          ))}
        </>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  hero: {
    backgroundColor: Colors.primaryDark, alignItems: "center",
    paddingTop: 56, paddingBottom: Spacing.xl, paddingHorizontal: Spacing.lg,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  greeting: { fontSize: 18, fontWeight: "700", color: "#fff" },
  meter: { fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 2 },
  balance: { fontSize: 42, fontWeight: "700", marginTop: Spacing.md },
  balanceLabel: { fontSize: 11, color: "rgba(255,255,255,0.6)", letterSpacing: 1, marginTop: 4 },
  owing: { color: "#fca5a5" },
  credit: { color: "#86efac" },
  clear: { color: "#fff" },
  payBtn: {
    marginTop: Spacing.lg, backgroundColor: "#fff",
    paddingVertical: 12, paddingHorizontal: Spacing.xl,
    borderRadius: Radius.full,
  },
  payBtnText: { color: Colors.primaryDark, fontWeight: "700", fontSize: 15 },
  errorBox: { backgroundColor: Colors.dangerLight, borderRadius: Radius.sm, padding: Spacing.sm, margin: Spacing.md },
  errorText: { color: Colors.danger, fontSize: 13 },
  statsRow: { flexDirection: "row", margin: Spacing.md, gap: Spacing.sm },
  statCard: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.md,
    padding: Spacing.md, alignItems: "center", ...Shadow.sm,
  },
  statValue: { fontSize: 24, fontWeight: "700", color: Colors.text },
  statLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 4 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: Colors.text, marginHorizontal: Spacing.md, marginBottom: Spacing.sm },
  billCard: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: Colors.surface, marginHorizontal: Spacing.md,
    marginBottom: 8, padding: Spacing.md, borderRadius: Radius.md,
    borderLeftWidth: 3, borderLeftColor: Colors.danger, ...Shadow.sm,
  },
  billDate: { fontSize: 13, fontWeight: "600", color: Colors.text },
  billDue: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  billAmount: { fontSize: 16, fontWeight: "700", color: Colors.danger },
});