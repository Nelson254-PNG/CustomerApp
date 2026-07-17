import React, { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, ScrollView, Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { getMyProfile, getMyUsage } from "../api/clients";
import { useAuth } from "../context/AuthContext";
import { Colors, Spacing, Radius, Shadow } from "../theme";

export default function ProfileScreen() {
  const { token, userId, logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [meterNumber, setMeterNumber] = useState("");
  const [lastReading, setLastReading] = useState(0);
  const [totalUsage, setTotalUsage] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!token || !userId) return;
    try {
      setError(null);
      const [profile, usageData] = await Promise.all([
        getMyProfile(token, userId),
        getMyUsage(token, userId),
      ]);
      setName(profile.name);
      setPhone(profile.phone);
      setMeterNumber(profile.meterNumber);
      setLastReading(profile.lastReading);
      setTotalUsage(usageData.records.reduce((s, r) => s + r.unitsUsed, 0));
    } catch (e: any) {
      setError(e.message ?? "Failed to load profile");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, userId]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Log Out", style: "destructive", onPress: logout },
      ]
    );
  };

  if (loading) return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={Colors.primary} />}
    >
      {/* ── AVATAR HEADER ────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.meter}>{meterNumber}</Text>
      </View>

      {error && <View style={styles.errorBox}><Text style={styles.errorText}>⚠ {error}</Text></View>}

      {/* ── ACCOUNT DETAILS ──────────────────────── */}
      <Text style={styles.sectionTitle}>Account Details</Text>
      <View style={styles.card}>
        {[
          { label: "Full Name", value: name },
          { label: "Phone Number", value: phone },
          { label: "Meter Number", value: meterNumber },
          { label: "Last Reading", value: `${lastReading} m³` },
        ].map(({ label, value }) => (
          <View key={label} style={styles.detailRow}>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text style={styles.detailValue}>{value}</Text>
          </View>
        ))}
      </View>

      {/* ── USAGE SUMMARY ────────────────────────── */}
      <Text style={styles.sectionTitle}>Usage Summary</Text>
      <View style={styles.usageCard}>
        <Text style={styles.usageValue}>{totalUsage.toFixed(1)}</Text>
        <Text style={styles.usageUnit}>m³ total consumed</Text>
      </View>

      {/* ── LOGOUT ───────────────────────────────── */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
        <Text style={styles.logoutText}>🚪 Log Out</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Smart Water Meter & Payment System</Text>
        <Text style={styles.footerVersion}>v1.0.0</Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    backgroundColor: Colors.primaryDark, alignItems: "center",
    paddingTop: 56, paddingBottom: Spacing.xl,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center", alignItems: "center", marginBottom: Spacing.sm,
  },
  avatarText: { fontSize: 34, fontWeight: "700", color: "#fff" },
  name: { fontSize: 20, fontWeight: "700", color: "#fff" },
  meter: { fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 4 },
  errorBox: { backgroundColor: Colors.dangerLight, borderRadius: Radius.sm, padding: Spacing.sm, margin: Spacing.md },
  errorText: { color: Colors.danger, fontSize: 13 },
  sectionTitle: {
    fontSize: 13, fontWeight: "700", color: Colors.textMuted,
    marginHorizontal: Spacing.md, marginTop: Spacing.lg,
    marginBottom: Spacing.sm, textTransform: "uppercase", letterSpacing: 0.5,
  },
  card: {
    backgroundColor: Colors.surface, marginHorizontal: Spacing.md,
    borderRadius: Radius.md, overflow: "hidden", ...Shadow.sm,
  },
  detailRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  detailLabel: { fontSize: 14, color: Colors.textSecondary },
  detailValue: { fontSize: 14, fontWeight: "600", color: Colors.text },
  usageCard: {
    backgroundColor: Colors.surface, marginHorizontal: Spacing.md,
    borderRadius: Radius.md, padding: Spacing.lg, alignItems: "center", ...Shadow.sm,
  },
  usageValue: { fontSize: 48, fontWeight: "700", color: Colors.primary },
  usageUnit: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  logoutBtn: {
    marginHorizontal: Spacing.md, marginTop: Spacing.xl,
    backgroundColor: Colors.dangerLight, borderRadius: Radius.md,
    paddingVertical: 14, alignItems: "center",
  },
  logoutText: { color: Colors.danger, fontSize: 16, fontWeight: "700" },
  footer: { alignItems: "center", marginTop: Spacing.xl },
  footerText: { fontSize: 12, color: Colors.textMuted },
  footerVersion: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
});