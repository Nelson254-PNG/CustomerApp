import React, { useState, useCallback } from "react";
import {
  View, Text, FlatList, StyleSheet,
  ActivityIndicator, RefreshControl, TouchableOpacity,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { getMyBills } from "../api/clients";
import { useAuth } from "../context/AuthContext";
import { Bill } from "../types";
import { Colors, Spacing, Radius, Shadow } from "../theme";

export default function BillsScreen() {
  const navigation = useNavigation<any>();
  const { token, userId } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bills, setBills] = useState<Bill[]>([]);
  const [balance, setBalance] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!token || !userId) return;
    try {
      setError(null);
      const data = await getMyBills(token, userId);
      setBills(data.bills.slice().reverse());
      setBalance(data.balance);
    } catch (e: any) {
      setError(e.message ?? "Failed to load bills");
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

  return (
    <View style={styles.container}>
      {/* ── HEADER ─────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bills</Text>
        <View style={[styles.balancePill, balance > 0 ? styles.owingPill : styles.clearPill]}>
          <Text style={[styles.balancePillText, balance > 0 ? styles.owingText : styles.clearText]}>
            {balance > 0 ? `KES ${balance.toFixed(2)} due` : "Account clear"}
          </Text>
        </View>
      </View>

      {error && <View style={styles.errorBox}><Text style={styles.errorText}>⚠ {error}</Text></View>}

      <FlatList
        data={bills}
        keyExtractor={b => b.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={Colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📄</Text>
            <Text style={styles.emptyText}>No bills yet</Text>
          </View>
        }
        renderItem={({ item: b }) => (
          <View style={[styles.card, !b.paid && styles.cardUnpaid]}>
            <View style={styles.cardTop}>
              <View>
                <Text style={styles.cardDate}>Issued: {b.issueDate}</Text>
                <Text style={styles.cardDue}>Due: {b.dueDate}</Text>
              </View>
              <View style={[styles.badge, b.paid ? styles.paidBadge : styles.unpaidBadge]}>
                <Text style={[styles.badgeText, b.paid ? styles.paidText : styles.unpaidText]}>
                  {b.paid ? "PAID" : "UNPAID"}
                </Text>
              </View>
            </View>
            <View style={styles.cardBottom}>
              <View>
                <Text style={styles.cardUnits}>{b.totalUnits} m³</Text>
                <Text style={styles.cardUnitsLabel}>Units used</Text>
              </View>
              <View style={styles.cardAmounts}>
                <Text style={styles.cardTotal}>KES {b.totalAmount.toFixed(2)}</Text>
                {b.amountPaid > 0 && (
                  <Text style={styles.cardPaid}>Paid: KES {b.amountPaid.toFixed(2)}</Text>
                )}
                {!b.paid && (
                  <Text style={styles.cardRemaining}>
                    Remaining: KES {(b.totalAmount - b.amountPaid).toFixed(2)}
                  </Text>
                )}
              </View>
            </View>

            {!b.paid && (
              <TouchableOpacity
                style={styles.payBtn}
                onPress={() => navigation.navigate("PaymentTab", {
                  screen: "MakePayment",
                  params: { bills: [b] }
                })}
                activeOpacity={0.85}
              >
                <Text style={styles.payBtnText}>Pay This Bill →</Text>
              </TouchableOpacity>
            )}
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
  balancePill: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: Radius.full },
  owingPill: { backgroundColor: Colors.dangerLight },
  clearPill: { backgroundColor: Colors.successLight },
  balancePillText: { fontSize: 12, fontWeight: "700" },
  owingText: { color: Colors.danger },
  clearText: { color: Colors.success },
  errorBox: { backgroundColor: Colors.dangerLight, borderRadius: Radius.sm, padding: Spacing.sm, margin: Spacing.md },
  errorText: { color: Colors.danger, fontSize: 13 },
  list: { padding: Spacing.md, paddingBottom: 40 },
  empty: { alignItems: "center", paddingTop: 60 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 16, color: Colors.textMuted, marginTop: Spacing.sm },
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: Spacing.sm, ...Shadow.sm,
  },
  cardUnpaid: { borderLeftWidth: 3, borderLeftColor: Colors.danger },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: Spacing.sm },
  cardDate: { fontSize: 13, fontWeight: "600", color: Colors.text },
  cardDue: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  paidBadge: { backgroundColor: Colors.successLight },
  unpaidBadge: { backgroundColor: Colors.dangerLight },
  badgeText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  paidText: { color: Colors.success },
  unpaidText: { color: Colors.danger },
  cardBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  cardUnits: { fontSize: 22, fontWeight: "700", color: Colors.primary },
  cardUnitsLabel: { fontSize: 11, color: Colors.textMuted },
  cardAmounts: { alignItems: "flex-end" },
  cardTotal: { fontSize: 16, fontWeight: "700", color: Colors.text },
  cardPaid: { fontSize: 11, color: Colors.success, marginTop: 2 },
  cardRemaining: { fontSize: 11, color: Colors.danger, marginTop: 2 },
  payBtn: {
    marginTop: Spacing.sm, backgroundColor: Colors.primary,
    borderRadius: Radius.md, paddingVertical: 10, alignItems: "center",
  },
  payBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});