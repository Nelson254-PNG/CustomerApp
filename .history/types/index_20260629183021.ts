// ============================================================
//  types/index.ts
//  Same shapes as the admin app's types — both apps talk to
//  the SAME backend, so the JSON contracts are identical.
// ============================================================

export interface MyProfile {
  id: string;
  name: string;
  meterNumber: string;
  phone: string;
  lastReading: number;
  balance: number;
}

export interface UsageRecord {
  date: string;
  previousReading: number;
  currentReading: number;
  unitsUsed: number;
  billed: boolean;
}

export interface Bill {
  id: string;
  issueDate: string;
  dueDate: string;
  totalUnits: number;
  totalAmount: number;
  amountPaid: number;
  paid: boolean;
}

export interface Payment {
  date: string;
  method: string;
  reference: string;
  amountPaid: number;
  balanceAfter: number;
}