// ============================================================
//  api/client.ts
//  Same BASE_URL pattern as the admin app — this MUST point to
//  the SAME backend, since both apps share one API and one
//  database.
// ============================================================

const BASE_URL = "https://unsidereal-justine-ovational.ngrok-free.dev";   // <-- your IP/ngrok URL, port 8090

async function apiRequest<T>(
  path: string,
  options: { method?: string; body?: object; token?: string | null } = {}
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (options.token) {
    headers["Authorization"] = `Bearer ${options.token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? `Request failed with status ${response.status}`);
  }

  return data as T;
}

import { MyProfile, UsageRecord, Bill, Payment } from "../types";

// ── AUTH ─────────────────────────────────────────────────────
export function signup(name: string, phone: string, email: string, password: string) {
  return apiRequest<{ token: string; role: string; userId: string }>("/auth/signup", {
    method: "POST",
    body: { name, phone, email, password },
  });
}

export function login(email: string, password: string) {
  return apiRequest<{ token: string; role: string; userId: string }>("/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

// ── MY ACCOUNT (always scoped to the logged-in customer) ─────
// Every function below takes token + the customer's OWN
// userId (stored from login) — the server's requireOwnerOrAdmin
// check confirms the token's userId matches this id, so a
// customer literally cannot fetch anyone else's data even if
// they tried to alter the URL.

export function getMyProfile(token: string, myId: string) {
  return apiRequest<MyProfile>(`/customers/${myId}`, { token });
}

export function getMyUsage(token: string, myId: string) {
  return apiRequest<{ customerName: string; records: UsageRecord[] }>(
    `/customers/${myId}/usage`,
    { token }
  );
}

export function getMyBills(token: string, myId: string) {
  return apiRequest<{ customerName: string; balance: number; bills: Bill[] }>(
    `/customers/${myId}/bills`,
    { token }
  );
}

export function getMyPayments(token: string, myId: string) {
  return apiRequest<{ customerName: string; balance: number; payments: Payment[] }>(
    `/customers/${myId}/payments`,
    { token }
  );
}

export function makePayment(
  token: string,
  myId: string,
  billId: string,
  method: string,
  reference: string,
  amount: number,
  date: string
) {
  return apiRequest<{ status: string }>(`/customers/${myId}/payments`, {
    method: "POST",
    body: { billId, method, reference, amount, date },
    token,
  });
}

export function payByMpesa(
  token: string,
  myId: string,
  billId: string,
  code: string,
  amount: number,
  date: string
) {
  return apiRequest<{ status: string }>(`/customers/${myId}/payments/mpesa`, {
    method: "POST",
    body: { billId, code, amount, date },
    token,
  });
}

export function payByTill(
  token: string,
  myId: string,
  billId: string,
  code: string,
  amount: number,
  date: string
) {
  return apiRequest<{ status: string }>(`/customers/${myId}/payments/mpesa-till`, {
    method: "POST",
    body: { billId, code, amount, date },
    token,
  });
}

//stk push
export function initiateStkPush(
  token: string,
  myId: string,
  billId: string,
  phone: string,
  amount: number
){
  return apiRequest<{status: String; checkoutRequestId: String; Message: string}>(
    `/customers/${myId}/payments/stk-push`,
    { method: "POST", body: { billId, phone, amount }, token }
  );
}

export function checkStkStatus(
  token: string,
  myId: string,
  checkoutRequestId: string
){
  return apiRequest<{status: String; amount: number}>(
    `/customers/${myId}/payments/stk-status/${checkoutRequestId}`,
    {token} 
  );
}