import React, { useState, useCallback } from "react";
import {
  View, Text, FlatList, StyleSheet,
  ActivityIndicator, RefreshControl, TouchableOpacity,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { getMyPayments, getMyBills } from "../api/clients";
import { useAuth } from "../context/AuthContext";
import { Payment, Bill } from "../types";
import { Colors, Spacing, Radius, Shadow } from "../theme";

const METHOD_ICONS: Record<string, string> = {
  "M-Pesa": "📱",
  "Cash": "💵",
  "Bank Transfer": "🏦",
};

export default function PaymentsScreen() {
  const navigation = useNavigation<any>();
  const { token, userId } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!token || !userId) return;
    try {
      setError(null);
      const [paymentsData, billsData] = await Promise.all([
        getMyPayments(token, userId),
        getMyBills(token, userId),
      ]);
      const reversed = paymentsData.payments.slice().reverse();
      setPayments(reversed);
      setBills(billsData.bills);
      setTotalPaid(paymentsData.payments.reduce((s, p) => s + p.amountPaid, 0));
    } catch (e: any) {
      setError(e.message ?? "Failed to load payments");
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

  const hasUnpaidBills = bills.some(b => !b.paid);

  return (
    <View style={styles.container}>
      {/* ── HEADER ─────────────────────────────── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Payments</Text>
          <Text style={styles.headerSub}>Total paid: KES {totalPaid.toFixed(2)}</Text>
        </View>
        {hasUnpaidBills && (
          <TouchableOpacity
            style={styles.payNowBtn}
            onPress={() => navigation.navigate("MakePayment", { bills })}
            activeOpacity={0.85}
          >
            <Text style={styles.payNowText}>Pay Now</Text>
          </TouchableOpacity>
        )}
      </View>

      {error && <View style={styles.errorBox}><Text style={styles.errorText}>⚠ {error}</Text></View>}

      <FlatList
        data={payments}
        keyExtractor={(_, i) => i.toString()}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={Colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>💳</Text>
            <Text style={styles.emptyTitle}>No payments yet</Text>
            {hasUnpaidBills && (
              <TouchableOpacity
                style={styles.emptyPayBtn}
                onPress={() => navigation.navigate("MakePayment", { bills })}
              >
                <Text style={styles.emptyPayBtnText}>Make Your First Payment →</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        renderItem={({ item: p }) => (
          <View style={styles.card}>
            <View style={styles.cardIcon}>
              <Text style={styles.cardIconText}>{METHOD_ICONS[p.method] ?? "💳"}</Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardMethod}>{p.method}</Text>
              <Text style={styles.cardDate}>{p.date}</Text>
              {p.reference !== "N/A" && (
                <Text style={styles.cardRef}>{p.reference}</Text>
              )}
            </View>
            <View style={styles.cardRight}>
              <Text style={styles.cardAmount}>KES {p.amountPaid.toFixed(2)}</Text>
              <Text style={styles.cardBalance}>Bal: {p.balanceAfter.toFixed(2)}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    backgroundColor: Colors.primaryDark, paddingTop: 56,
    paddingBottom: Spacing.lg, paddingHorizontal: Spacing.md,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#fff" },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 2 },
  payNowBtn: {
    backgroundColor: "#fff", paddingVertical: 8,
    paddingHorizontal: Spacing.md, borderRadius: Radius.full,
  },
  payNowText: { color: Colors.primaryDark, fontWeight: "700", fontSize: 13 },
  errorBox: { backgroundColor: Colors.dangerLight, borderRadius: Radius.sm, padding: Spacing.sm, margin: Spacing.md },
  errorText: { color: Colors.danger, fontSize: 13 },
  list: { padding: Spacing.md, paddingBottom: 40 },
  empty: { alignItems: "center", paddingTop: 60 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 16, color: Colors.textMuted, marginTop: Spacing.sm, marginBottom: Spacing.lg },
  emptyPayBtn: { backgroundColor: Colors.primary, paddingVertical: 12, paddingHorizontal: Spacing.xl, borderRadius: Radius.full },
  emptyPayBtnText: { color: "#fff", fontWeight: "700" },
  card: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: Spacing.sm, ...Shadow.sm,
  },
  cardIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    justifyContent: "center", alignItems: "center", marginRight: Spacing.sm,
  },
  cardIconText: { fontSize: 20 },
  cardBody: { flex: 1 },
  cardMethod: { fontSize: 14, fontWeight: "600", color: Colors.text },
  cardDate: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  cardRef: { fontSize: 11, color: Colors.textMuted, fontFamily: "monospace" },
  cardRight: { alignItems: "flex-end" },
  cardAmount: { fontSize: 15, fontWeight: "700", color: Colors.success },
  cardBalance: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
});