import type { ApiData, BankEntry, Debt, Goal, MonthAdjustment, Payment, RecordItem, Settings } from "./types";

// ─── Formatação ──────────────────────────────────────────────────────────────

export const money = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);

export const number = (value: unknown) => Number(value ?? 0) || 0;

export const parseArray = <T>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[];
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const parseObject = (value: unknown): Record<string, number> => {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, number>;
  if (typeof value !== "string") return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, number>) : {};
  } catch {
    return {};
  }
};

// ─── Mês ─────────────────────────────────────────────────────────────────────

/** Mês atual no formato YYYY-MM */
export const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

/** Dia do calendário (hoje se for o mês atual, último dia caso contrário) */
export const referenceDay = (month: string) => {
  const today = new Date();
  const todayMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  if (month === todayMonth) return today.getDate();
  // último dia do mês
  const [year, idx] = month.split("-").map(Number);
  return new Date(year, idx, 0).getDate();
};

export const monthLabel = (month: string, short = false) => {
  const [year, index] = month.split("-").map(Number);
  const value = new Intl.DateTimeFormat("pt-BR", {
    month: short ? "short" : "long",
    year: short ? undefined : "numeric",
  }).format(new Date(year, index - 1, 1));
  return value.charAt(0).toUpperCase() + value.slice(1).replace(".", "");
};

export const shiftMonth = (month: string, amount: number) => {
  const [year, index] = month.split("-").map(Number);
  const date = new Date(year, index - 1 + amount, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

export const dueDateLabel = (day: number | null, month: string) => {
  if (!day) return "Sem vencimento";
  const [year, index] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" })
    .format(new Date(year, index - 1, Math.min(day, 28)))
    .replace(".", "");
};

export const dateLabel = (value: string) =>
  value
    ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" })
        .format(new Date(`${value}T12:00:00`))
        .replace(".", "")
    : "—";

/** Saudação pelo horário do browser */
export const greeting = (name: string) => {
  const h = new Date().getHours();
  const part = h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
  return `${part}, ${name}.`;
};

/** Data padrão para novos lançamentos: hoje se for mês atual, senão dia 1 */
export const defaultEntryDate = (month: string) => {
  const today = new Date();
  const todayMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  if (month === todayMonth) return today.toISOString().slice(0, 10);
  return `${month}-01`;
};

// ─── Helpers de record ───────────────────────────────────────────────────────

export const hasMonth = (months: string[], month: string) => months.includes(month);

export const toggleMonth = (months: string[], month: string) =>
  hasMonth(months, month) ? months.filter((m) => m !== month) : [...months, month];

export const recordIsActive = (item: RecordItem, month: string) =>
  item.recurring ? !item.monthKey || month >= item.monthKey : item.monthKey === month;

export const recordForMonth = (item: RecordItem, month: string): RecordItem => {
  const exact = item.adjustments.find((e) => e.startMonth === month && e.endMonth === month);
  const future = item.adjustments
    .filter((e) => !e.endMonth && e.startMonth <= month)
    .sort((a, b) => b.startMonth.localeCompare(a.startMonth))[0];
  const adjustment = exact ?? future;
  return adjustment ? { ...item, amount: adjustment.amount, dueDay: adjustment.dueDay } : item;
};

export const debtIsActive = (debt: Debt, month: string) => {
  const match = debt.starts.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!match) return true;
  return month >= `${match[3]}-${match[2]}`;
};

// ─── Type guards ─────────────────────────────────────────────────────────────

export const isRecord = (item: RecordItem | Debt | Goal | BankEntry): item is RecordItem =>
  "type" in item && !("entryDate" in item);

export const isDebt = (item: RecordItem | Debt | Goal | BankEntry): item is Debt => "balance" in item;

export const isEntry = (item: RecordItem | Debt | Goal | BankEntry): item is BankEntry => "entryDate" in item;

// ─── Normalizar dados da API ──────────────────────────────────────────────────

export function normalize(data: ApiData) {
  return {
    records: (data.records ?? []).map((item) => ({
      id: String(item.id),
      type: item.type === "income" ? ("income" as const) : ("expense" as const),
      title: String(item.title ?? ""),
      category: String(item.category ?? "Outros"),
      amount: number(item.amount),
      dueDay: item.due_day === null ? null : number(item.due_day),
      monthKey: item.month_key ? String(item.month_key) : null,
      recurring: Boolean(item.recurring),
      statusMonths: parseArray<string>(item.status_months),
      adjustments: parseArray<MonthAdjustment>(item.month_adjustments),
      notes: String(item.notes ?? ""),
    })),
    debts: (data.debts ?? []).map((item) => ({
      id: String(item.id),
      name: String(item.name ?? ""),
      detail: String(item.detail ?? ""),
      original: number(item.original),
      balance: number(item.balance),
      installment: number(item.installment),
      dueDay: number(item.due_day),
      totalInstallments: number(item.total_installments),
      paidInstallments: number(item.paid_installments),
      lateAmount: number(item.late_amount),
      lateCount: number(item.late_count),
      color: String(item.color ?? "#b8f23d"),
      entryPending: number(item.entry_pending),
      starts: String(item.starts ?? ""),
      paymentHistory: parseArray<Payment>(item.payment_history),
    })),
    goals: (data.goals ?? []).map((item) => ({
      id: String(item.id),
      title: String(item.title ?? ""),
      target: number(item.target),
      current: number(item.current),
      dueDate: String(item.due_date ?? ""),
      kind: String(item.kind ?? "save"),
      color: String(item.color ?? "#b8f23d"),
      monthlyPlans: parseObject(item.monthly_plans),
    })),
    entries: (data.entries ?? []).map((item) => ({
      id: String(item.id),
      entryDate: String(item.entry_date ?? ""),
      monthKey: String(item.month_key ?? ""),
      account: String(item.account ?? "Bradesco"),
      destinationAccount: String(item.destination_account ?? ""),
      context: (["empresa", "pessoal", "reserva", "transferencia"] as const).includes(item.context as never)
        ? (item.context as BankEntry["context"])
        : "revisar",
      description: String(item.description ?? ""),
      counterparty: String(item.counterparty ?? ""),
      amount: number(item.amount),
      flow:
        item.flow === "income" ? ("income" as const) : item.flow === "transfer" ? ("transfer" as const) : ("expense" as const),
      direction: item.direction === "in" ? ("in" as const) : ("out" as const),
      category: String(item.category ?? "Outros"),
      status: item.status === "pending" ? ("pending" as const) : ("confirmed" as const),
      notes: String(item.notes ?? ""),
      document: String(item.document ?? ""),
      source: String(item.source ?? "manual"),
    })),
    settings: data.settings ?? {
      displayName: "você",
      initials: "?",
      primaryAccount: "Bradesco",
      openingBalances: {},
    },
  };
}

// ─── Saldo de abertura ────────────────────────────────────────────────────────

/**
 * Calcula o saldo de abertura de uma conta em um mês,
 * encadeando meses anteriores se não houver registro explícito.
 */
export function openingBalanceForMonth(
  month: string,
  account: string,
  entries: BankEntry[],
  openingBalances: Record<string, Record<string, number>>,
  depth = 0,
): number {
  if (depth > 24) return 0;
  const explicit = openingBalances[month]?.[account];
  if (explicit !== undefined) return explicit;
  const prev = shiftMonth(month, -1);
  const prevOpening = openingBalanceForMonth(prev, account, entries, openingBalances, depth + 1);
  const prevMovement = entries
    .filter((e) => e.monthKey === prev && e.account === account && e.status === "confirmed")
    .reduce((sum, e) => sum + (e.direction === "in" ? e.amount : -e.amount), 0);
  return prevOpening + prevMovement;
}

// ─── Orçamentos variáveis dinâmicos ──────────────────────────────────────────

/**
 * Identifica registros de orçamento variável:
 * recorrentes, sem vencimento fixo, nas categorias Transporte / Pessoal / Lazer.
 */
export const VARIABLE_CATEGORIES = new Set(["Transporte", "Pessoal", "Lazer"]);

export const isVariableBudget = (item: RecordItem) =>
  item.recurring && item.dueDay === null && VARIABLE_CATEGORIES.has(item.category);

/** Quanto foi gasto de um orçamento variável no extrato */
export const variableUsed = (item: RecordItem, entries: BankEntry[]) => {
  if (item.category === "Transporte")
    return entries
      .filter((e) => e.flow === "expense" && e.status === "confirmed" && e.category === "Combustível")
      .reduce((s, e) => s + e.amount, 0);
  if (item.category === "Pessoal")
    return entries
      .filter((e) => e.flow === "transfer" && e.destinationAccount?.includes("Santander · Pessoal"))
      .reduce((s, e) => s + e.amount, 0);
  // Lazer
  return entries
    .filter((e) => e.flow === "expense" && e.status === "confirmed" && e.category === "Lazer")
    .reduce((s, e) => s + e.amount, 0);
};

// ─── Contas únicas do extrato ─────────────────────────────────────────────────

export const DEFAULT_ACCOUNTS = [
  "Bradesco",
  "Open Dreams · Cora",
  "Cora · Cartão pré-pago",
  "Santander · Pessoal",
  "Santander · Caixinhas",
];

export const allAccounts = (entries: BankEntry[]) => {
  const extra = entries.flatMap((e) => [e.account, e.destinationAccount]).filter(Boolean);
  return [...new Set([...DEFAULT_ACCOUNTS, ...extra])];
};

// ─── Calcular stats ──────────────────────────────────────────────────────────

export function computeStats(
  monthRecords: RecordItem[],
  monthEntries: BankEntry[],
  debts: Debt[],
  selectedMonth: string,
  openingBalance: number,
) {
  const income = monthRecords.filter((item) => item.type === "income");
  const expense = monthRecords.filter((item) => item.type === "expense");

  const incomeExpected = income.reduce((sum, item) => sum + item.amount, 0);
  const plannedIncomeReceived = income
    .filter((item) => hasMonth(item.statusMonths, selectedMonth))
    .reduce((sum, item) => sum + item.amount, 0);
  const receivableByPlan = income
    .filter((item) => !hasMonth(item.statusMonths, selectedMonth))
    .reduce((sum, item) => sum + item.amount, 0);

  const expenseBase = expense.reduce((sum, item) => sum + item.amount, 0);
  const expensePaid = expense
    .filter((item) => hasMonth(item.statusMonths, selectedMonth))
    .reduce((sum, item) => sum + item.amount, 0);

  const debtMonthly = debts
    .filter((item) => item.balance > 0 && debtIsActive(item, selectedMonth))
    .reduce((sum, item) => sum + item.installment, 0);
  const debtPaidMonth = debts
    .flatMap((item) => item.paymentHistory)
    .filter((item) => item.month === selectedMonth)
    .reduce((sum, item) => sum + item.amount, 0);

  const debtOriginal = debts.reduce((sum, item) => sum + item.original, 0);
  const debtBalance = debts.reduce((sum, item) => sum + item.balance, 0);
  const late = debts.reduce((sum, item) => sum + item.lateAmount, 0);

  const plannedExpense = expenseBase + debtMonthly;

  const actualIncome = monthEntries
    .filter((item) => item.flow === "income" && item.status === "confirmed")
    .reduce((sum, item) => sum + item.amount, 0);
  const ledgerExpense = monthEntries
    .filter((item) => item.flow === "expense" && item.status === "confirmed")
    .reduce((sum, item) => sum + item.amount, 0);
  const transferIn = monthEntries
    .filter((item) => item.flow === "transfer" && item.direction === "in" && item.status === "confirmed")
    .reduce((sum, item) => sum + item.amount, 0);
  const transferOut = monthEntries
    .filter((item) => item.flow === "transfer" && item.direction === "out" && item.status === "confirmed")
    .reduce((sum, item) => sum + item.amount, 0);

  const businessExpense = monthEntries
    .filter((item) => item.flow === "expense" && item.status === "confirmed" && item.context === "empresa")
    .reduce((sum, item) => sum + item.amount, 0);
  const personalExpense = monthEntries
    .filter((item) => item.flow === "expense" && item.status === "confirmed" && item.context === "pessoal")
    .reduce((sum, item) => sum + item.amount, 0);
  const reviewExpense = monthEntries
    .filter((item) => item.flow === "expense" && item.status === "confirmed" && item.context === "revisar")
    .reduce((sum, item) => sum + item.amount, 0);
  const protectedAmount = monthEntries
    .filter((item) => item.flow === "transfer" && item.context === "reserva" && item.status === "confirmed")
    .reduce((sum, item) => sum + item.amount, 0);

  const primaryEntries = monthEntries.filter((item) => item.account === "Bradesco");
  const primaryMovement = primaryEntries.reduce(
    (sum, item) => sum + (item.direction === "in" ? item.amount : -item.amount),
    0,
  );

  const hasLedger = monthEntries.length > 0;
  const incomeReceived = hasLedger ? actualIncome : plannedIncomeReceived;
  const actualExpense = hasLedger ? ledgerExpense : expensePaid + debtPaidMonth;

  const settled = monthRecords.filter((item) => hasMonth(item.statusMonths, selectedMonth)).length;

  const totalClassifiable = monthEntries.length;
  const classifiedCount = monthEntries.filter(
    (e) => e.status === "confirmed" && e.context !== "revisar",
  ).length;
  const classifiedRatio = totalClassifiable > 0 ? classifiedCount / totalClassifiable : 0;

  return {
    incomeExpected,
    incomeReceived,
    expenseBase,
    expensePaid,
    debtMonthly,
    debtPaidMonth,
    debtOriginal,
    debtBalance,
    debtPaid: debtOriginal - debtBalance,
    late,
    lateCount: debts.reduce((sum, item) => sum + item.lateCount, 0),
    plannedExpense,
    actualExpense,
    plannedBalance: incomeExpected - plannedExpense,
    currentBalance: incomeReceived - actualExpense,
    receivable: receivableByPlan,
    payable: Math.max(0, plannedExpense - actualExpense),
    unknown: expense.filter((item) => item.amount === 0).length,
    completion: monthRecords.length ? (settled / monthRecords.length) * 100 : 0,
    actualIncome,
    transferIn,
    transferOut,
    bankBalance: openingBalance + primaryMovement,
    pendingReview: monthEntries
      .filter((item) => item.status === "pending" || item.context === "revisar")
      .reduce((sum, item) => sum + item.amount, 0),
    businessExpense,
    personalExpense,
    reviewExpense,
    protectedAmount,
    classifiedRatio,
  };
}
