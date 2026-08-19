export type Tab = "dashboard" | "ledger" | "records" | "debts" | "goals" | "guide";
export type Entity = "record" | "debt" | "goal" | "entry";
export type Payment = { id: string; month: string; amount: number; label: string; date: string };
export type MonthAdjustment = { startMonth: string; endMonth: string; amount: number; dueDay: number | null };

export type RecordItem = {
  id: string;
  type: "income" | "expense";
  title: string;
  category: string;
  amount: number;
  dueDay: number | null;
  monthKey: string | null;
  recurring: boolean;
  statusMonths: string[];
  adjustments: MonthAdjustment[];
  notes: string;
};

export type Debt = {
  id: string;
  name: string;
  detail: string;
  original: number;
  balance: number;
  installment: number;
  dueDay: number;
  totalInstallments: number;
  paidInstallments: number;
  lateAmount: number;
  lateCount: number;
  color: string;
  entryPending: number;
  starts: string;
  paymentHistory: Payment[];
};

export type Goal = {
  id: string;
  title: string;
  target: number;
  current: number;
  dueDate: string;
  kind: string;
  color: string;
  monthlyPlans: Record<string, number>;
};

export type BankEntry = {
  id: string;
  entryDate: string;
  monthKey: string;
  account: string;
  destinationAccount: string;
  context: "empresa" | "pessoal" | "reserva" | "transferencia" | "revisar";
  description: string;
  counterparty: string;
  amount: number;
  flow: "income" | "expense" | "transfer";
  direction: "in" | "out";
  category: string;
  status: "confirmed" | "pending";
  notes: string;
  document: string;
  source: string;
};

export type Settings = {
  displayName: string;
  initials: string;
  primaryAccount: string;
  openingBalances: Record<string, Record<string, number>>;
};

export type ApiData = {
  records: Record<string, unknown>[];
  debts: Record<string, unknown>[];
  goals: Record<string, unknown>[];
  entries: Record<string, unknown>[];
  settings?: Settings;
  error?: string;
};

export type Editor = { entity: Entity; item?: RecordItem | Debt | Goal | BankEntry } | null;
export type Draft = Record<string, string | number | boolean | string[] | null | Payment[] | MonthAdjustment[] | Record<string, number>>;

export type Movement = {
  kind: "record" | "debt" | "goal";
  id: string;
  title: string;
  amount: number;
  category: string;
  flow: "income" | "expense" | "transfer";
  account: string;
  destinationAccount: string;
  date: string;
  patch: Draft;
  note: string;
};

export type Stats = {
  incomeExpected: number;
  incomeReceived: number;
  expenseBase: number;
  expensePaid: number;
  debtMonthly: number;
  debtPaidMonth: number;
  debtOriginal: number;
  debtBalance: number;
  debtPaid: number;
  late: number;
  lateCount: number;
  plannedExpense: number;
  actualExpense: number;
  plannedBalance: number;
  currentBalance: number;
  receivable: number;
  payable: number;
  unknown: number;
  completion: number;
  actualIncome: number;
  transferIn: number;
  transferOut: number;
  bankBalance: number;
  pendingReview: number;
  businessExpense: number;
  personalExpense: number;
  reviewExpense: number;
  protectedAmount: number;
  classifiedRatio: number;
};
