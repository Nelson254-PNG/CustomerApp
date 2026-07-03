export const Colors = {
  primary:       "#16a34a",
  primaryDark:   "#14532d",
  primaryLight:  "#f0fdf4",
  primaryBorder: "#bbf7d0",
  success:       "#16a34a",
  successLight:  "#dcfce7",
  danger:        "#dc2626",
  dangerLight:   "#fee2e2",
  text:          "#0f172a",
  textSecondary: "#64748b",
  textMuted:     "#94a3b8",
  border:        "#e2e8f0",
  background:    "#f0fdf4",
  surface:       "#ffffff",
};
export const Spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
export const Radius = { sm: 8, md: 12, lg: 16, full: 999 };
export const Shadow = {
  sm: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  md: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 },
  lg: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 6 },
};
export const Typography = {
  h1: { fontSize: 26, fontWeight: "700" as const, color: "#0f172a" },
  h2: { fontSize: 20, fontWeight: "700" as const, color: "#0f172a" },
  h3: { fontSize: 16, fontWeight: "600" as const, color: "#0f172a" },
  body: { fontSize: 15, fontWeight: "400" as const, color: "#0f172a" },
  label: { fontSize: 13, fontWeight: "600" as const, color: "#64748b" },
  caption: { fontSize: 12, fontWeight: "400" as const, color: "#94a3b8" },
};