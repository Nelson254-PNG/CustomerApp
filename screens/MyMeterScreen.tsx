// ============================================================
//  screens/MyMeterScreen.tsx
//  "My Meter" tab — live IoT status for the customer's meter.
// ============================================================

import React, { useState, useCallback, useRef } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, TextInput, Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { Colors, Spacing, Radius, Shadow } from "../theme";
// BASE_URL isn't exported from ../api/clients; provide a fallback here.
 export const BASE_URL = "https://unsidereal-justine-ovational.ngrok-free.dev";


async function apiGet(path: string, token: string) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Authorization": `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data;
}

async function apiPost(path: string, token: string, body: object = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data;
}

interface MeterStatus {
  valveOpen: boolean;
  prepaidCredit: number;
  meterMode: string;
  latestReading: number;
  flowRate: number;
  signalStrength: number;
  batteryLevel: number;
  lastSeen: string;
  alerts: {
    alertType: string;
    message: string;
    severity: string;
    createdAt: string;
  }[];
}

export default function MyMeterScreen() {
  const { token, userId } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState<MeterStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [topupAmount, setTopupAmount] = useState("");
  const [toppingUp, setToppingUp] = useState(false);
  const [topupSuccess, setTopupSuccess] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadStatus = useCallback(async () => {
    if (!token || !userId) return;
    try {
      setError(null);
      const data = await apiGet(`/customers/${userId}/iot`, token);
      setStatus(data);
    } catch (e: any) {
      setError(e.message ?? "Failed to load meter status");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, userId]);

  useFocusEffect(
    useCallback(() => {
      loadStatus();
      intervalRef.current = setInterval(loadStatus, 30000);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }, [loadStatus])
  );

  const handleTopup = async () => {
    const amount = parseFloat(topupAmount);
    if (isNaN(amount) || amount < 50) {
      Alert.alert("Invalid Amount", "Minimum top-up is KES 50.");
      return;
    }
    setToppingUp(true);
    try {
      const result = await apiPost(`/iot/prepaid/${userId}/topup`, token!, { amountKes: amount });
      setTopupSuccess(`✔ Token: ${result.tokenCode} · ${result.unitsM3.toFixed(2)} m³ added`);
      setTopupAmount("");
      setTimeout(loadStatus, 1000);
    } catch (e: any) {
      Alert.alert("Top-up Failed", e.message);
    } finally {
      setToppingUp(false);
    }
  };

  if (loading) return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );

  const severityColor = (s: string) =>
    s === "critical" ? Colors.danger : s === "warning" ? "#d97706" : Colors.primary;
  const severityBg = (s: string) =>
    s === "critical" ? Colors.dangerLight : s === "warning" ? "#fef9c3" : Colors.primaryLight;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); loadStatus(); }}
          tintColor={Colors.primary}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Meter</Text>
        <Text style={styles.headerSub}>Live status · updates every 30s</Text>
      </View>

      {error && <View style={styles.errorBox}><Text style={styles.errorText}>⚠ {error}</Text></View>}

      {status && (
        <>
          {/* Valve status */}
          <View style={[styles.valveCard, status.valveOpen ? styles.valveOpen : styles.valveClosed]}>
            <Text style={styles.valveIcon}>{status.valveOpen ? "💧" : "🔒"}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.valveTitle}>
                Water Supply: {status.valveOpen ? "ACTIVE" : "SUSPENDED"}
              </Text>
              <Text style={styles.valveSub}>
                {status.valveOpen
                  ? "Water is flowing normally"
                  : "Contact your administrator to restore supply"}
              </Text>
            </View>
          </View>

          {/* Live stats */}
          <Text style={styles.sectionLabel}>LIVE METER DATA</Text>
          <View style={styles.statsGrid}>
            <StatCard icon="📊" label="Reading" value={`${status.latestReading.toFixed(2)} m³`} color={Colors.primary} />
            <StatCard icon="🌊" label="Flow Rate" value={`${status.flowRate.toFixed(1)} L/min`} color={status.flowRate > 20 ? Colors.danger : Colors.success} />
            <StatCard icon="🔋" label="Battery" value={`${status.batteryLevel}%`} color={status.batteryLevel < 20 ? Colors.danger : Colors.success} />
            <StatCard icon="📶" label="Signal" value={`${status.signalStrength} dBm`} color={status.signalStrength < -80 ? Colors.danger : Colors.success} />
          </View>
          <Text style={styles.lastSeen}>Last seen: {status.lastSeen.slice(0, 19).replace("T", " ")}</Text>

          {/* Prepaid top-up */}
          {status.meterMode === "prepaid" && (
            <>
              <Text style={styles.sectionLabel}>PREPAID CREDIT</Text>
              <View style={styles.creditCard}>
                <Text style={styles.creditLabel}>Available Credit</Text>
                <Text style={[styles.creditValue, { color: status.prepaidCredit < 50 ? Colors.danger : Colors.success }]}>
                  KES {status.prepaidCredit.toFixed(2)}
                </Text>
                <View style={styles.topupRow}>
                  <TextInput
                    style={styles.topupInput}
                    value={topupAmount}
                    onChangeText={setTopupAmount}
                    placeholder="KES 200"
                    keyboardType="numeric"
                    placeholderTextColor={Colors.textMuted}
                  />
                  <TouchableOpacity
                    style={[styles.topupBtn, toppingUp && { opacity: 0.6 }]}
                    onPress={handleTopup}
                    disabled={toppingUp}
                    activeOpacity={0.85}
                  >
                    {toppingUp
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Text style={styles.topupBtnText}>Top Up</Text>
                    }
                  </TouchableOpacity>
                </View>
                {topupSuccess && <Text style={styles.topupSuccess}>{topupSuccess}</Text>}
              </View>
            </>
          )}

          {/* Alerts */}
          {status.alerts.length > 0 ? (
            <>
              <Text style={styles.sectionLabel}>ACTIVE ALERTS ({status.alerts.length})</Text>
              {status.alerts.map((a, i) => (
                <View key={i} style={[styles.alertCard, { backgroundColor: severityBg(a.severity) }]}>
                  <View style={styles.alertHeader}>
                    <Text style={[styles.alertType, { color: severityColor(a.severity) }]}>
                      {a.severity === "critical" ? "🚨" : "⚠️"} {a.alertType.replace(/_/g, " ").toUpperCase()}
                    </Text>
                    <Text style={styles.alertTime}>{a.createdAt.slice(0, 10)}</Text>
                  </View>
                  <Text style={styles.alertMessage}>{a.message}</Text>
                </View>
              ))}
            </>
          ) : (
            <View style={styles.noAlerts}>
              <Text style={styles.noAlertsIcon}>✅</Text>
              <Text style={styles.noAlertsText}>No active alerts</Text>
            </View>
          )}
        </>
      )}
      <View style={{ height: 48 }} />
    </ScrollView>
  );
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    backgroundColor: Colors.primaryDark, paddingTop: 56,
    paddingBottom: Spacing.lg, paddingHorizontal: Spacing.md,
  },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#fff" },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 2 },
  errorBox: { backgroundColor: Colors.dangerLight, borderRadius: Radius.sm, padding: Spacing.sm, margin: Spacing.md },
  errorText: { color: Colors.danger, fontSize: 13 },
  valveCard: {
    flexDirection: "row", alignItems: "center", gap: Spacing.md,
    margin: Spacing.md, padding: Spacing.md, borderRadius: Radius.md, ...Shadow.md,
  },
  valveOpen: { backgroundColor: Colors.successLight, borderLeftWidth: 4, borderLeftColor: Colors.success },
  valveClosed: { backgroundColor: Colors.dangerLight, borderLeftWidth: 4, borderLeftColor: Colors.danger },
  valveIcon: { fontSize: 36 },
  valveTitle: { fontSize: 15, fontWeight: "700", color: Colors.text },
  valveSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  sectionLabel: {
    fontSize: 11, fontWeight: "700", color: Colors.textMuted,
    marginHorizontal: Spacing.md, marginTop: Spacing.lg,
    marginBottom: Spacing.sm, letterSpacing: 0.8,
  },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: Spacing.md, gap: Spacing.sm },
  statCard: {
    width: "47%", backgroundColor: Colors.surface, borderRadius: Radius.md,
    padding: Spacing.md, alignItems: "center", ...Shadow.sm,
  },
  statIcon: { fontSize: 24, marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: "700" },
  statLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  lastSeen: { fontSize: 11, color: Colors.textMuted, textAlign: "center", marginTop: Spacing.sm },
  creditCard: {
    backgroundColor: Colors.surface, marginHorizontal: Spacing.md,
    borderRadius: Radius.md, padding: Spacing.md, ...Shadow.sm,
  },
  creditLabel: { fontSize: 13, color: Colors.textSecondary },
  creditValue: { fontSize: 28, fontWeight: "700", marginTop: 4 },
  topupRow: { flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.md },
  topupInput: {
    flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: 10, fontSize: 15, color: Colors.text,
  },
  topupBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg, justifyContent: "center",
  },
  topupBtnText: { color: "#fff", fontWeight: "700" },
  topupSuccess: { color: Colors.success, fontSize: 12, marginTop: Spacing.sm, fontWeight: "600" },
  alertCard: { marginHorizontal: Spacing.md, marginBottom: Spacing.sm, borderRadius: Radius.md, padding: Spacing.md },
  alertHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  alertType: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  alertTime: { fontSize: 11, color: Colors.textMuted },
  alertMessage: { fontSize: 13, color: Colors.text, lineHeight: 18 },
  noAlerts: { alignItems: "center", padding: Spacing.xl },
  noAlertsIcon: { fontSize: 36 },
  noAlertsText: { fontSize: 14, color: Colors.textMuted, marginTop: Spacing.sm },
});