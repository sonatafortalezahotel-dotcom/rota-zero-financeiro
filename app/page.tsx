"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { ApiData, BankEntry, Debt, Draft, Editor, Entity, Goal, Movement, RecordItem, Settings, Tab } from "@/lib/finance/types";
import {
  allAccounts, computeStats, currentMonth, debtIsActive, defaultEntryDate,
  greeting, hasMonth, isDebt, isEntry, isRecord, isVariableBudget,
  money, monthLabel, normalize, number, openingBalanceForMonth, parseObject,
  recordForMonth, recordIsActive, referenceDay, shiftMonth, toggleMonth, variableUsed,
} from "@/lib/finance/utils";
import { CATEGORY_COLORS } from "@/lib/finance/constants";
import { Dashboard } from "@/components/finance/Dashboard";
import { LedgerScreen } from "@/components/finance/LedgerScreen";
import { MonthScreen } from "@/components/finance/MonthScreen";
import { DebtsScreen } from "@/components/finance/DebtsScreen";
import { GoalsScreen } from "@/components/finance/GoalsScreen";
import { GuideScreen } from "@/components/finance/GuideScreen";
import { EditorModal } from "@/components/finance/EditorModal";
import { MovementModal } from "@/components/finance/MovementModal";

const NAV: { id: Tab; label: string; icon: string; hint: string }[] = [
  { id: "dashboard", label: "Visão geral", icon: "⌂", hint: "Seu mês" },
  { id: "ledger", label: "Extrato real", icon: "↕", hint: "O que aconteceu" },
  { id: "records", label: "Meu mês", icon: "▤", hint: "Planejar e conferir" },
  { id: "debts", label: "Dívidas", icon: "◎", hint: "Rota até o zero" },
  { id: "goals", label: "Metas", icon: "◆", hint: "Próximas vitórias" },
  { id: "guide", label: "Aprender", icon: "?", hint: "Do zero" },
];


export default function Home() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [entries, setEntries] = useState<BankEntry[]>([]);
  const [settings, setSettings] = useState<Settings>({ displayName: "você", initials: "?", primaryAccount: "Bradesco", openingBalances: {} });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editor, setEditor] = useState<Editor>(null);
  const [movement, setMovement] = useState<Movement | null>(null);
  const [draft, setDraft] = useState<Draft>({});
  const [recordFilter, setRecordFilter] = useState<"all" | "income" | "expense">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "settled">("all");
  const [search, setSearch] = useState("");
  const [entryFilter, setEntryFilter] = useState<"all" | "expense" | "income" | "transfer" | "pending">("expense");
  const [entrySearch, setEntrySearch] = useState("");
  const [paymentDraft, setPaymentDraft] = useState<Record<string, string>>({});
  const [goalDraft, setGoalDraft] = useState<Record<string, string>>({});
  const [toast, setToast] = useState("");

  const applyData = (data: ApiData) => {
    if (data.error) throw new Error(data.error);
    const normalized = normalize(data);
    setRecords(normalized.records);
    setDebts(normalized.debts);
    setGoals(normalized.goals);
    setEntries(normalized.entries);
    setSettings(normalized.settings);
  };

  useEffect(() => {
    let active = true;
    fetch("/api/finance", { cache: "no-store" })
      .then(async (res) => { const data = await res.json() as ApiData; if (!res.ok) throw new Error(data.error ?? "Não foi possível carregar"); return data; })
      .then((data) => { if (active) applyData(data); })
      .catch((err) => { if (active) setError(err instanceof Error ? err.message : "Erro ao carregar"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const mutate = async (method: "POST" | "PATCH" | "DELETE", body: object, message: string) => {
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/finance", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json() as ApiData;
      if (!res.ok) throw new Error(data.error ?? "Não foi possível salvar");
      applyData(data); setToast(message); window.setTimeout(() => setToast(""), 2800);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar"); return false;
    } finally { setSaving(false); }
  };

  // ─── Memos ─────────────────────────────────────────────────────────────────

  const monthRecords = useMemo(() => {
    const active = records.filter((r) => recordIsActive(r, selectedMonth)).map((r) => recordForMonth(r, selectedMonth));
    // Nota fiscal 3%: se há um registro de Impostos com amount=0, calcula sobre receita prevista
    const nfIdx = active.findIndex((r) => r.type === "expense" && r.category === "Impostos" && r.amount === 0);
    if (nfIdx >= 0) {
      const expectedIncome = active.filter((r) => r.type === "income").reduce((s, r) => s + r.amount, 0);
      const nfAmount = Math.round(expectedIncome * 0.03 * 100) / 100;
      const updated = [...active];
      updated[nfIdx] = { ...updated[nfIdx], amount: nfAmount };
      return updated;
    }
    return active;
  }, [records, selectedMonth]);

  const monthEntries = useMemo(() =>
    entries.filter((e) => e.monthKey === selectedMonth),
    [entries, selectedMonth]);

  const primaryAccount = settings.primaryAccount || "Bradesco";

  const openingBalance = useMemo(() =>
    openingBalanceForMonth(selectedMonth, primaryAccount, entries, settings.openingBalances),
    [selectedMonth, primaryAccount, entries, settings.openingBalances]);

  const stats = useMemo(() =>
    computeStats(monthRecords, monthEntries, debts, selectedMonth, openingBalance),
    [monthRecords, monthEntries, debts, selectedMonth, openingBalance]);

  const categoryData = useMemo(() => {
    const values = new Map<string, number>();
    if (monthEntries.length)
      monthEntries.filter((e) => e.flow === "expense" && e.status === "confirmed").forEach((e) => values.set(e.category, (values.get(e.category) ?? 0) + e.amount));
    else {
      monthRecords.filter((r) => r.type === "expense" && r.amount > 0).forEach((r) => values.set(r.category, (values.get(r.category) ?? 0) + r.amount));
      values.set("Dívidas", stats.debtMonthly);
    }
    return [...values.entries()]
      .map(([name, value]) => ({ name, value, color: CATEGORY_COLORS[name] ?? CATEGORY_COLORS.Outros }))
      .sort((a, b) => b.value - a.value);
  }, [monthRecords, monthEntries, stats.debtMonthly]);

  const accountSummary = useMemo(() => {
    const movement = (account: string) =>
      monthEntries.filter((e) => e.account === account).reduce((s, e) => s + (e.direction === "in" ? e.amount : -e.amount), 0);
    const destined = (account: string) =>
      monthEntries.filter((e) => e.destinationAccount === account).reduce((s, e) => s + e.amount, 0);
    const prepaidEntries = monthEntries.filter((e) => e.account === "Cora · Cartão pré-pago");
    const prepaidLoaded = destined("Cora · Cartão pré-pago");
    const prepaidSpent = prepaidEntries.filter((e) => e.flow === "expense" && e.status === "confirmed").reduce((s, e) => s + e.amount, 0);
    const prepaidOpening = prepaidEntries.filter((e) => e.flow === "transfer" && e.direction === "in").reduce((s, e) => s + e.amount, 0);

    // orçamento de gasolina = valor do record de Transporte sem vencimento fixo do mês
    const fuelRecord = monthRecords.find((r) => r.type === "expense" && r.category === "Transporte" && r.dueDay === null);
    const fuelBudget = fuelRecord?.amount ?? 0;
    const fuelSpent = monthEntries.filter((e) => e.category === "Combustível" && e.flow === "expense").reduce((s, e) => s + e.amount, 0);

    return {
      coraMovement: movement("Open Dreams · Cora"),
      prepaid: prepaidLoaded + movement("Cora · Cartão pré-pago"),
      prepaidLoaded, prepaidSpent, prepaidOpening,
      santanderPersonal: destined("Santander · Pessoal") + movement("Santander · Pessoal"),
      santanderGoals: destined("Santander · Caixinhas") + movement("Santander · Caixinhas"),
      fuelSpent, fuelBudget,
    };
  }, [monthEntries, monthRecords]);

  const chartMonths = useMemo(() => [0, 1, 2, 3, 4, 5].map((o) => shiftMonth(selectedMonth, o)), [selectedMonth]);

  const cashProjection = useMemo(() =>
    chartMonths.map((month) => {
      const ledger = entries.filter((e) => e.monthKey === month && e.status === "confirmed");
      if (ledger.length) {
        const income = ledger.filter((e) => e.flow === "income").reduce((s, e) => s + e.amount, 0);
        const expense = ledger.filter((e) => e.flow === "expense").reduce((s, e) => s + e.amount, 0);
        return { month, income, expense, balance: income - expense, actual: true };
      }
      const items = records.filter((r) => recordIsActive(r, month)).map((r) => recordForMonth(r, month));
      const income = items.filter((r) => r.type === "income").reduce((s, r) => s + r.amount, 0);
      const expense = items.filter((r) => r.type === "expense").reduce((s, r) => s + r.amount, 0) + stats.debtMonthly;
      return { month, income, expense, balance: income - expense, actual: false };
    }),
    [chartMonths, entries, records, stats.debtMonthly]);

  const debtProgress = stats.debtOriginal ? (stats.debtPaid / stats.debtOriginal) * 100 : 0;

  // primeira meta do tipo save = reserva de segurança
  const reserveGoal = goals.find((g) => g.kind === "save") ?? goals[0];
  const reserveProgress = reserveGoal?.target ? (reserveGoal.current / reserveGoal.target) * 100 : 0;

  const xp = Math.floor(stats.debtPaid / 10) + Math.round(stats.completion * 4);
  const level = xp >= 1000 ? 3 : xp >= 500 ? 2 : 1;
  const levelName = level === 1 ? "Começando o controle" : level === 2 ? "Criando consistência" : "Assumindo o comando";

  // dia de referência (real se mês atual, senão último dia do mês)
  const currentDay = referenceDay(selectedMonth);

  // accounts dinâmico
  const accounts = useMemo(() => allAccounts(entries), [entries]);

  // orçamentos variáveis: recorrentes, sem dueDay, nas categorias variáveis
  const variableBudgets = useMemo(() =>
    monthRecords
      .filter(isVariableBudget)
      .map((item) => {
        const used = variableUsed(item, monthEntries);
        return { item, used: Math.min(item.amount, used), remaining: Math.max(0, item.amount - used) };
      }),
    [monthRecords, monthEntries]);

  const payableRecords = useMemo(() =>
    monthRecords.filter((r) => r.type === "expense").sort((a, b) => (a.dueDay ?? 99) - (b.dueDay ?? 99)),
    [monthRecords]);
  const receivableRecords = monthRecords.filter((r) => r.type === "income");

  const activeDebts = debts.filter((d) => d.balance > 0 && debtIsActive(d, selectedMonth)).sort((a, b) => a.dueDay - b.dueDay);
  const upcomingDebts = debts.filter((d) => d.balance > 0 && !debtIsActive(d, selectedMonth)).sort((a, b) => a.dueDay - b.dueDay);

  // pagamentos de dívida no extrato sem vínculo com payment_history (ex-"aug-18-nu")
  const debtEntryIds = new Set(debts.flatMap((d) => d.paymentHistory.map((p) => p.id)));
  const extraDebtPayments = monthEntries.filter(
    (e) => e.category === "Dívidas" && e.flow === "expense" && e.status === "confirmed" && !debtEntryIds.has(e.id),
  );

  // metas do mês = todas com plan > 0 para o mês selecionado
  const monthlyGoalPlans = goals.filter((g) => (g.monthlyPlans[selectedMonth] ?? 0) > 0);
  const monthlyGoalPlannedTotal = monthlyGoalPlans.reduce((s, g) => s + number(g.monthlyPlans[selectedMonth]), 0);

  const assignedBalance = accountSummary.santanderPersonal + accountSummary.santanderGoals + accountSummary.prepaid;
  const knownAccountsBalance = stats.bankBalance + accountSummary.coraMovement + assignedBalance;
  const freeOperatingBalance = stats.bankBalance + accountSummary.coraMovement;

  const pendingReceivables = receivableRecords.filter((r) => !hasMonth(r.statusMonths, selectedMonth));
  const pendingBillItems = payableRecords.filter((r) => r.amount > 0 && !variableBudgets.some((v) => v.item.id === r.id) && !hasMonth(r.statusMonths, selectedMonth));
  const pendingDebtItems = activeDebts.filter((d) => !d.paymentHistory.some((p) => p.month === selectedMonth));
  const pendingEntryItems = debts.filter((d) => d.entryPending > 0 && debtIsActive(d, selectedMonth));

  const pendingBills = pendingBillItems.reduce((s, r) => s + r.amount, 0);
  const pendingDebtInstallments = pendingDebtItems.reduce((s, d) => s + d.installment, 0);
  const pendingEntries = pendingEntryItems.reduce((s, d) => s + d.entryPending, 0);
  const pendingOutflows = pendingBills + pendingDebtInstallments + pendingEntries;
  const variableBudgetRemaining = variableBudgets.reduce((s, b) => s + b.remaining, 0);
  const pendingGoalAllocation = Math.max(0, monthlyGoalPlannedTotal - accountSummary.santanderGoals);
  const monthEndForecast = freeOperatingBalance + stats.receivable - pendingOutflows;
  const conservativeForecast = monthEndForecast - variableBudgetRemaining - pendingGoalAllocation;

  const filteredRecords = monthRecords.filter((r) => {
    if (recordFilter !== "all" && r.type !== recordFilter) return false;
    const isVariable = variableBudgets.some((v) => v.item.id === r.id);
    const settled = hasMonth(r.statusMonths, selectedMonth);
    if (isVariable && statusFilter !== "all") return false;
    if (statusFilter === "pending" && settled) return false;
    if (statusFilter === "settled" && !settled) return false;
    return `${r.title} ${r.category}`.toLowerCase().includes(search.toLowerCase());
  });

  const filteredEntries = monthEntries.filter((e) => {
    if (entryFilter === "pending" && e.status !== "pending" && e.context !== "revisar") return false;
    if (entryFilter !== "all" && entryFilter !== "pending" && e.flow !== entryFilter) return false;
    return `${e.description} ${e.category} ${e.notes}`.toLowerCase().includes(entrySearch.toLowerCase());
  });

  // ─── Actions ───────────────────────────────────────────────────────────────

  const todayDate = defaultEntryDate(selectedMonth);

  const setDataFromItem = (entity: Entity, item?: RecordItem | Debt | Goal | BankEntry) => {
    if (entity === "record") {
      const v = item && isRecord(item) ? item : undefined;
      setDraft({ type: v?.type ?? "expense", title: v?.title ?? "", category: v?.category ?? "Outros", amount: v?.amount ?? "", dueDay: v?.dueDay ?? "", monthKey: v?.monthKey ?? selectedMonth, recurring: v?.recurring ?? false, statusMonths: v?.statusMonths ?? [], adjustments: v?.adjustments ?? [], editScope: v?.recurring ? "month" : "all", editMonth: selectedMonth, notes: v?.notes ?? "" });
    } else if (entity === "debt") {
      const v = item && isDebt(item) ? item : undefined;
      setDraft({ name: v?.name ?? "", detail: v?.detail ?? "", original: v?.original ?? "", balance: v?.balance ?? "", installment: v?.installment ?? "", dueDay: v?.dueDay ?? "", totalInstallments: v?.totalInstallments ?? "", paidInstallments: v?.paidInstallments ?? 0, lateAmount: v?.lateAmount ?? 0, lateCount: v?.lateCount ?? 0, color: v?.color ?? "#b8f23d", entryPending: v?.entryPending ?? 0, starts: v?.starts ?? "", paymentHistory: v?.paymentHistory ?? [] });
    } else if (entity === "goal") {
      const v = item && !isRecord(item) && !isDebt(item) && !isEntry(item) ? item : undefined;
      setDraft({ title: v?.title ?? "", target: v?.target ?? "", current: v?.current ?? 0, dueDate: v?.dueDate ?? "", kind: v?.kind ?? "save", color: v?.color ?? "#b8f23d", monthlyPlans: v?.monthlyPlans ?? {}, monthlyAmount: v?.monthlyPlans?.[selectedMonth] ?? 0, planMonth: selectedMonth });
    } else {
      const v = item && isEntry(item) ? item : undefined;
      setDraft({ entryDate: v?.entryDate ?? todayDate, monthKey: v?.monthKey ?? selectedMonth, account: v?.account ?? primaryAccount, destinationAccount: v?.destinationAccount ?? "", context: v?.context ?? "revisar", description: v?.description ?? "", counterparty: v?.counterparty ?? "", amount: v?.amount ?? "", flow: v?.flow ?? "expense", direction: v?.direction ?? "out", category: v?.category ?? "Outros", status: v?.status ?? "confirmed", notes: v?.notes ?? "", document: v?.document ?? "" });
    }
    setEditor({ entity, item });
  };

  const saveEditor = async (event: FormEvent) => {
    event.preventDefault();
    if (!editor) return;
    const data = { ...draft };
    if (editor.entity === "record") {
      const scope = String(data.editScope ?? "all");
      delete data.editScope; delete data.editMonth;
      const edited = editor.item && isRecord(editor.item) ? records.find((r) => r.id === editor.item?.id) : undefined;
      if (edited?.recurring && data.recurring === true && scope !== "all") {
        const amount = number(data.amount);
        const dueDay = data.dueDay === "" || data.dueDay === null ? null : number(data.dueDay);
        let adjustments = [...edited.adjustments];
        if (scope === "month") {
          adjustments = adjustments.filter((e) => !(e.startMonth === selectedMonth && e.endMonth === selectedMonth));
          adjustments.push({ startMonth: selectedMonth, endMonth: selectedMonth, amount, dueDay });
        } else {
          adjustments = adjustments.filter((e) => e.endMonth || e.startMonth < selectedMonth);
          adjustments.push({ startMonth: selectedMonth, endMonth: "", amount, dueDay });
        }
        data.amount = edited.amount; data.dueDay = edited.dueDay; data.monthKey = edited.monthKey;
        data.statusMonths = edited.statusMonths; data.adjustments = adjustments;
      } else if (scope === "all") { data.adjustments = []; }
    }
    if (editor.entity === "goal") {
      const goal = editor.item && !isRecord(editor.item) && !isDebt(editor.item) && !isEntry(editor.item) ? editor.item : undefined;
      const monthlyPlans = { ...(goal?.monthlyPlans ?? parseObject(data.monthlyPlans)) };
      monthlyPlans[selectedMonth] = number(data.monthlyAmount);
      data.monthlyPlans = monthlyPlans; delete data.monthlyAmount; delete data.planMonth;
    }
    const ok = await mutate(editor.item ? "PATCH" : "POST", { entity: editor.entity, id: editor.item?.id, data }, editor.item ? "Cadastro atualizado" : "Cadastro criado");
    if (ok) setEditor(null);
  };

  const deleteItem = async (entity: Entity, item: RecordItem | Debt | Goal | BankEntry) => {
    const label = isRecord(item) ? item.title : isDebt(item) ? item.name : isEntry(item) ? item.description : item.title;
    if (!window.confirm(`Excluir "${label}"? Essa ação não pode ser desfeita.`)) return;
    const ok = await mutate("DELETE", { entity, id: item.id }, "Cadastro excluído");
    if (ok) setEditor(null);
  };

  const toggleRecordStatus = (item: RecordItem) => {
    const settled = hasMonth(item.statusMonths, selectedMonth);
    const statusMonths = toggleMonth(item.statusMonths, selectedMonth);
    if (settled) {
      return mutate("POST", { entity: "settlement-reverse", id: item.id, data: { statusMonths, document: `record:${item.id}:${selectedMonth}` } }, item.type === "income" ? "Recebimento desfeito" : "Pagamento desfeito");
    }
    setMovement({ kind: "record", id: item.id, title: item.title, amount: item.amount, category: item.category, flow: item.type, account: primaryAccount, destinationAccount: "", date: todayDate, patch: { statusMonths }, note: item.type === "income" ? "Recebimento confirmado pelo planejamento" : "Pagamento confirmado pelo planejamento" });
  };

  const payDebt = (debt: Debt, amount: number, label = "Parcela") => {
    if (amount <= 0) return;
    const paid = Math.min(amount, debt.balance);
    const history = [...debt.paymentHistory, { id: crypto.randomUUID(), month: selectedMonth, amount: paid, label, date: new Date().toISOString() }];
    const data = { balance: Math.max(0, debt.balance - paid), paidInstallments: label === "Parcela" ? Math.min(debt.totalInstallments, debt.paidInstallments + 1) : debt.paidInstallments, lateAmount: Math.max(0, debt.lateAmount - paid), lateCount: label === "Parcela" && debt.lateCount > 0 ? debt.lateCount - 1 : debt.lateCount, entryPending: label === "Entrada" ? 0 : debt.entryPending, paymentHistory: history, detail: label === "Entrada" ? debt.detail.replace("entrada pendente", "acordo ativado") : debt.detail };
    setMovement({ kind: "debt", id: debt.id, title: `${debt.name} · ${label.toLowerCase()}`, amount: paid, category: "Dívidas", flow: "expense", account: primaryAccount, destinationAccount: "", date: todayDate, patch: data, note: `${label} da dívida ${debt.name}` });
  };

  const advanceGoal = (goal: Goal) => {
    const amount = number(String(goalDraft[goal.id] ?? "").replace(",", "."));
    if (amount <= 0) return;
    setMovement({ kind: "goal", id: goal.id, title: `Aporte · ${goal.title}`, amount, category: "Metas", flow: "transfer", account: primaryAccount, destinationAccount: "Santander · Caixinhas", date: todayDate, patch: { current: Math.min(goal.target, goal.current + amount) }, note: `Dinheiro separado para ${goal.title}` });
  };

  const confirmMovement = async (event: FormEvent) => {
    event.preventDefault();
    if (!movement) return;
    const context = movement.kind === "goal" ? "reserva" : movement.flow === "income" || ["Negócio", "Impostos", "Comunicação"].includes(movement.category) ? "empresa" : "pessoal";
    const ok = await mutate("POST", { entity: "settlement", id: movement.id, data: { action: movement.kind, ...movement.patch, entryDate: movement.date, monthKey: movement.date.slice(0, 7), account: movement.account, destinationAccount: movement.flow === "transfer" ? movement.destinationAccount : "", context, description: movement.title, counterparty: movement.title, amount: movement.amount, flow: movement.flow, direction: movement.flow === "income" ? "in" : "out", category: movement.category, status: "confirmed", notes: movement.note, document: `${movement.kind}:${movement.id}:${selectedMonth}` } }, movement.flow === "income" ? "Recebimento registrado na conta" : movement.flow === "transfer" ? "Transferência registrada" : "Pagamento registrado na conta");
    if (ok) {
      if (movement.kind === "debt") setPaymentDraft((c) => ({ ...c, [movement.id]: "" }));
      if (movement.kind === "goal") setGoalDraft((c) => ({ ...c, [movement.id]: "" }));
      setMovement(null);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  if (loading) return <div className="boot"><span className="boot-logo">0</span><strong>Organizando seus números…</strong><i /></div>;

  const initials = settings.initials || "?";
  const displayName = settings.displayName || "você";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="brand" onClick={() => setTab("dashboard")}>
          <span>0</span>
          <div><strong>ROTA ZERO</strong><small>dinheiro sob controle</small></div>
        </button>
        <nav aria-label="Navegação principal">
          {NAV.map((item) => (
            <button key={item.id} className={tab === item.id ? "active" : ""} onClick={() => setTab(item.id)}>
              <i>{item.icon}</i>
              <span><strong>{item.label}</strong><small>{item.hint}</small></span>
            </button>
          ))}
        </nav>
        <div className="sidebar-level">
          <div className="level-top"><span>NÍVEL {level}</span><b>{xp} XP</b></div>
          <strong>{levelName}</strong>
          <div className="mini-track"><i style={{ width: `${Math.min(100, (xp % 500) / 5)}%` }} /></div>
          <small>Você não precisa ser perfeito. Precisa registrar.</small>
        </div>
        <div className="sync-state"><i /> Dados protegidos na sua conta</div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div className="mobile-brand"><span>0</span><strong>ROTA ZERO</strong></div>
          <div className="month-picker">
            <button onClick={() => setSelectedMonth(shiftMonth(selectedMonth, -1))} aria-label="Mês anterior">‹</button>
            <div><small>COMPETÊNCIA</small><strong>{monthLabel(selectedMonth)}</strong></div>
            <button onClick={() => setSelectedMonth(shiftMonth(selectedMonth, 1))} aria-label="Próximo mês">›</button>
          </div>
          <div className="top-actions">
            <button className="ghost-button" onClick={() => setSelectedMonth(currentMonth())}>Mês atual</button>
            <button className="lime-button" onClick={() => setDataFromItem(tab === "ledger" ? "entry" : "record")}><span>＋</span> {tab === "ledger" ? "Nova movimentação" : "Novo planejamento"}</button>
            <div className="avatar" title={displayName}>{initials}</div>
          </div>
        </header>

        {error && (
          <div className="error-banner">
            <span>!</span>
            <div><strong>Não consegui concluir esta ação</strong><small>{error}</small></div>
            <button onClick={() => setError("")}>×</button>
          </div>
        )}
        {toast && <div className="toast"><span>✓</span>{toast}</div>}

        {tab === "dashboard" && (
          <Dashboard
            selectedMonth={selectedMonth}
            stats={stats}
            payableRecords={payableRecords}
            cashProjection={cashProjection}
            categoryData={categoryData}
            goals={goals}
            reserveGoal={reserveGoal}
            reserveProgress={reserveProgress}
            debtProgress={debtProgress}
            debts={debts}
            currentDay={currentDay}
            knownAccountsBalance={knownAccountsBalance}
            freeOperatingBalance={freeOperatingBalance}
            assignedBalance={assignedBalance}
            monthEntries={monthEntries}
            displayName={greeting(displayName)}
            setTab={setTab}
            setRecordFilter={setRecordFilter}
            setEntryFilter={setEntryFilter}
            toggleRecordStatus={toggleRecordStatus}
            openRecord={() => setDataFromItem("record")}
          />
        )}

        {tab === "ledger" && (
          <LedgerScreen
            stats={stats}
            accountSummary={accountSummary}
            filteredEntries={filteredEntries}
            monthEntries={monthEntries}
            entryFilter={entryFilter}
            setEntryFilter={setEntryFilter}
            entrySearch={entrySearch}
            setEntrySearch={setEntrySearch}
            onNew={() => setDataFromItem("entry")}
            onEdit={(item) => setDataFromItem("entry", item)}
            onDelete={(item) => deleteItem("entry", item)}
          />
        )}

        {tab === "records" && (
          <MonthScreen
            selectedMonth={selectedMonth}
            stats={stats}
            knownAccountsBalance={knownAccountsBalance}
            freeOperatingBalance={freeOperatingBalance}
            assignedBalance={assignedBalance}
            conservativeForecast={conservativeForecast}
            monthEndForecast={monthEndForecast}
            variableBudgetRemaining={variableBudgetRemaining}
            pendingGoalAllocation={pendingGoalAllocation}
            pendingReceivables={pendingReceivables}
            pendingBillItems={pendingBillItems}
            pendingDebtItems={pendingDebtItems}
            pendingEntryItems={pendingEntryItems}
            pendingOutflows={pendingOutflows}
            variableBudgets={variableBudgets}
            receivableRecords={receivableRecords}
            payableRecords={payableRecords}
            activeDebts={activeDebts}
            extraDebtPayments={extraDebtPayments}
            monthlyGoalPlans={monthlyGoalPlans}
            monthlyGoalPlannedTotal={monthlyGoalPlannedTotal}
            accountSummary={accountSummary}
            recordFilter={recordFilter}
            statusFilter={statusFilter}
            search={search}
            filteredRecords={filteredRecords}
            setRecordFilter={setRecordFilter}
            setStatusFilter={setStatusFilter}
            setSearch={setSearch}
            toggleRecordStatus={toggleRecordStatus}
            payDebt={payDebt}
            onNewRecord={() => setDataFromItem("record")}
            onEditRecord={(item) => setDataFromItem("record", item)}
            onEditGoal={(item) => setDataFromItem("goal", item)}
            onDeleteRecord={(item) => deleteItem("record", item)}
            setTab={setTab}
          />
        )}

        {tab === "debts" && (
          <DebtsScreen
            selectedMonth={selectedMonth}
            stats={stats}
            debts={debts}
            activeDebts={activeDebts}
            upcomingDebts={upcomingDebts}
            debtProgress={debtProgress}
            paymentDraft={paymentDraft}
            setPaymentDraft={setPaymentDraft}
            payDebt={payDebt}
            onNew={() => setDataFromItem("debt")}
            onEdit={(item) => setDataFromItem("debt", item)}
            onDelete={(item) => deleteItem("debt", item)}
          />
        )}

        {tab === "goals" && (
          <GoalsScreen
            goals={goals}
            goalDraft={goalDraft}
            setGoalDraft={setGoalDraft}
            advanceGoal={advanceGoal}
            onNew={() => setDataFromItem("goal")}
            onEdit={(item) => setDataFromItem("goal", item)}
            onDelete={(item) => deleteItem("goal", item)}
          />
        )}

        {tab === "guide" && <GuideScreen level={level} levelName={levelName} setTab={setTab} />}
      </main>

      <nav className="mobile-nav" aria-label="Navegação móvel">
        {NAV.filter((item) => ["dashboard", "records", "ledger", "debts", "goals"].includes(item.id)).map((item) => (
          <button key={item.id} className={tab === item.id ? "active" : ""} onClick={() => setTab(item.id)}>
            <i>{item.icon}</i><span>{item.label}</span>
          </button>
        ))}
      </nav>

      {editor && (
        <EditorModal
          editor={editor}
          draft={draft}
          setDraft={setDraft}
          saving={saving}
          accounts={accounts}
          selectedMonth={selectedMonth}
          onClose={() => setEditor(null)}
          onSave={saveEditor}
          onDelete={() => editor.item && deleteItem(editor.entity, editor.item)}
        />
      )}

      {movement && (
        <MovementModal
          movement={movement}
          setMovement={setMovement}
          saving={saving}
          accounts={accounts}
          onClose={() => setMovement(null)}
          onConfirm={confirmMovement}
        />
      )}
    </div>
  );
}
