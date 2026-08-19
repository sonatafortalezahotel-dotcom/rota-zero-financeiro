"use client";

import type { BankEntry, Debt, Goal, RecordItem, Stats } from "@/lib/finance/types";
import { dueDateLabel, hasMonth, money, monthLabel, number } from "@/lib/finance/utils";
import { CATEGORY_COLORS } from "@/lib/finance/constants";

type VariableBudget = { item: RecordItem; used: number; remaining: number };

type Props = {
  selectedMonth: string;
  stats: Stats;
  knownAccountsBalance: number;
  freeOperatingBalance: number;
  assignedBalance: number;
  conservativeForecast: number;
  monthEndForecast: number;
  variableBudgetRemaining: number;
  pendingGoalAllocation: number;
  pendingReceivables: RecordItem[];
  pendingBillItems: RecordItem[];
  pendingDebtItems: Debt[];
  pendingEntryItems: Debt[];
  pendingOutflows: number;
  variableBudgets: VariableBudget[];
  receivableRecords: RecordItem[];
  payableRecords: RecordItem[];
  activeDebts: Debt[];
  extraDebtPayments: BankEntry[];
  monthlyGoalPlans: Goal[];
  monthlyGoalPlannedTotal: number;
  accountSummary: { santanderPersonal: number; santanderGoals: number; prepaid: number; prepaidLoaded: number; prepaidSpent: number };
  recordFilter: "all" | "income" | "expense";
  statusFilter: "all" | "pending" | "settled";
  search: string;
  filteredRecords: RecordItem[];
  setRecordFilter: (v: "all" | "income" | "expense") => void;
  setStatusFilter: (v: "all" | "pending" | "settled") => void;
  setSearch: (v: string) => void;
  toggleRecordStatus: (item: RecordItem) => void;
  payDebt: (debt: Debt, amount: number, label?: string) => void;
  onNewRecord: () => void;
  onEditRecord: (item: RecordItem) => void;
  onEditGoal: (item: Goal) => void;
  onDeleteRecord: (item: RecordItem) => void;
  setTab: (tab: string) => void;
};

export function MonthScreen({
  selectedMonth, stats, knownAccountsBalance, freeOperatingBalance, assignedBalance,
  conservativeForecast, monthEndForecast, variableBudgetRemaining, pendingGoalAllocation,
  pendingReceivables, pendingBillItems, pendingDebtItems, pendingEntryItems, pendingOutflows,
  variableBudgets, receivableRecords, payableRecords, activeDebts, extraDebtPayments,
  monthlyGoalPlans, monthlyGoalPlannedTotal, accountSummary,
  recordFilter, statusFilter, search, filteredRecords,
  setRecordFilter, setStatusFilter, setSearch,
  toggleRecordStatus, payDebt, onNewRecord, onEditRecord, onEditGoal, onDeleteRecord, setTab,
}: Props) {
  return (
    <section className="screen">
      <div className="screen-title">
        <div><span>TUDO DO MÊS EM UM SÓ LUGAR</span><h1>Meu mês</h1><p>Receber, pagar e separar sem duplicar contas ou parcelas.</p></div>
        <button className="lime-button" onClick={onNewRecord}>＋ Novo item</button>
      </div>

      <div className="month-summary">
        <article><span>RECEBIDO ATÉ AGORA</span><strong>{money(stats.incomeReceived)}</strong><small>{money(stats.receivable)} ainda a receber de {money(stats.incomeExpected)}</small></article>
        <article><span>GASTO REAL ATÉ AGORA</span><strong>{money(stats.actualExpense)}</strong><small>Saídas confirmadas nos extratos</small></article>
        <article className={knownAccountsBalance < 0 ? "negative" : "positive"}><span>SALDO CONHECIDO NAS CONTAS</span><strong>{money(knownAccountsBalance)}</strong><small>Bradesco + Cora + cartão + Santander</small></article>
        <article className={freeOperatingBalance < 0 ? "negative" : "positive"}><span>LIVRE SEM VALORES DESTINADOS</span><strong>{money(freeOperatingBalance)}</strong><small>Não inclui pessoal, caixinhas nem cartão</small></article>
      </div>

      <div className="reconciliation-note">
        <i>✓</i>
        <div>
          <strong>{money(knownAccountsBalance)} nas contas − {money(assignedBalance)} já destinados = {money(freeOperatingBalance)} realmente livres.</strong>
          <small>Os {money(stats.receivable)} que ainda não entraram não são tratados como dinheiro disponível.</small>
        </div>
      </div>

      <div className={`forecast-panel ${conservativeForecast < 0 ? "negative" : "positive"}`}>
        <div className="forecast-title">
          <span>PREVISÃO REALISTA DE SOBRA</span>
          <strong>{money(conservativeForecast)}</strong>
          <small>Depois das contas obrigatórias, orçamentos variáveis e metas que ainda precisam ser separadas.</small>
        </div>
        <div className="forecast-equation">
          <div><span>LIVRE AGORA</span><strong>{money(freeOperatingBalance)}</strong></div>
          <i>＋</i>
          <div><span>A RECEBER</span><strong>{money(stats.receivable)}</strong></div>
          <i>−</i>
          <div><span>A PAGAR</span><strong>{money(pendingOutflows)}</strong></div>
          <i>＝</i>
          <div className="forecast-result"><span>APÓS CONTAS</span><strong>{money(monthEndForecast)}</strong></div>
        </div>
        <div className="budget-impact">
          <span>DEPOIS DAS CONTAS</span><strong>{money(monthEndForecast)}</strong>
          <i>−</i>
          <span>ORÇAMENTOS + METAS A SEPARAR</span><strong>{money(variableBudgetRemaining + pendingGoalAllocation)}</strong>
          <i>＝</i>
          <span className="budget-impact-result">SOBRA REALISTA <b>{money(conservativeForecast)}</b></span>
        </div>
        <div className="forecast-breakdown">
          <div>
            <span>A RECEBER · {pendingReceivables.length} clientes</span>
            <strong>{pendingReceivables.length ? pendingReceivables.map((i) => `${i.title} ${money(i.amount)}`).join(" · ") : "Nada pendente"}</strong>
          </div>
          <div>
            <span>A PAGAR · {pendingBillItems.length + pendingDebtItems.length + pendingEntryItems.length} itens</span>
            <strong>{[...pendingBillItems.map((i) => `${i.title} ${money(i.amount)}`), ...pendingDebtItems.map((d) => `${d.name} ${money(d.installment)}`), ...pendingEntryItems.map((d) => `${d.name} · entrada ${money(d.entryPending)}`)].join(" · ") || "Nada pendente"}</strong>
          </div>
          <div>
            <span>SEPARAR · planejado x realizado</span>
            <strong>Planejado {money(monthlyGoalPlannedTotal)} · Já separado {money(accountSummary.santanderGoals)} · Falta {money(pendingGoalAllocation)}</strong>
          </div>
        </div>
        <p>
          {stats.unknown > 0 ? `Atenção: ${stats.unknown} contas ainda estão sem valor e não entram nesta previsão.` : "Todas as contas cadastradas têm valor informado."} Orçamentos variáveis são limites de uso, não boletos.
        </p>
      </div>

      <section className="variable-budget-section">
        <div className="variable-budget-head">
          <div><span>ORÇAMENTOS VARIÁVEIS</span><h2>Quanto ainda pode gastar</h2><p>Não são contas pendentes. São limites para controlar o mês.</p></div>
          <strong>{money(variableBudgetRemaining)}<small>ainda disponíveis</small></strong>
        </div>
        <div className="variable-budget-grid">
          {variableBudgets.map(({ item, used, remaining }) => (
            <article key={item.id}>
              <div><span>{item.title}</span><button onClick={() => onEditRecord(item)}>Editar</button></div>
              <strong>{money(remaining)}</strong>
              <small>restantes de {money(item.amount)}</small>
              <div className="budget-track"><i style={{ width: `${item.amount ? Math.min(100, (used / item.amount) * 100) : 0}%` }} /></div>
              <footer><span>{item.category === "Pessoal" ? "Separado" : "Utilizado"}: {money(used)}</span><b>{item.amount ? Math.min(100, (used / item.amount) * 100).toFixed(0) : "0"}%</b></footer>
            </article>
          ))}
        </div>
      </section>

      <div className="month-columns">
        <article className="month-column receive">
          <div className="month-column-head"><div><i>↓</i><span><strong>Receber</strong><small>Clientes e entradas previstas</small></span></div><b>{receivableRecords.length}</b></div>
          {receivableRecords.map((item) => {
            const settled = hasMonth(item.statusMonths, selectedMonth);
            return (
              <button className={`month-item ${settled ? "done" : ""}`} key={item.id} onClick={() => toggleRecordStatus(item)}>
                <span className={`status-check ${settled ? "checked" : ""}`}>{settled ? "✓" : ""}</span>
                <div><strong>{item.title}</strong><small>{settled ? "Recebido" : "A receber"}</small></div>
                <b>{money(item.amount)}</b>
              </button>
            );
          })}
        </article>

        <article className="month-column pay">
          <div className="month-column-head"><div><i>↑</i><span><strong>Pagar</strong><small>Somente obrigações reais</small></span></div>
            <b>{payableRecords.filter((i) => i.amount > 0 && !variableBudgets.some((v) => v.item.id === i.id)).length + activeDebts.length + extraDebtPayments.length + pendingEntryItems.length}</b>
          </div>
          <div className="month-subhead debts"><span>DÍVIDAS E ENTRADAS</span><b>{activeDebts.length + extraDebtPayments.length + pendingEntryItems.length} itens</b></div>
          {extraDebtPayments.map((item) => (
            <button className="month-item debt done" key={item.id} onClick={() => { setTab("ledger"); }}>
              <span className="status-check checked">✓</span>
              <div><strong>{item.description}</strong><small>Pago neste mês · sem vínculo de parcela regular</small></div>
              <b>{money(item.amount)}</b>
            </button>
          ))}
          {pendingEntryItems.map((debt) => (
            <button className="month-item debt entry-due" key={`${debt.id}-entry`} onClick={() => payDebt(debt, debt.entryPending, "Entrada")}>
              <span className="status-check">!</span>
              <div><strong>{debt.name} · entrada</strong><small>Entrada pendente da negociação · registrar pagamento</small></div>
              <b>{money(debt.entryPending)}</b>
            </button>
          ))}
          {activeDebts.map((debt) => {
            const paid = debt.paymentHistory.some((p) => p.month === selectedMonth);
            return (
              <button className={`month-item debt ${paid ? "done" : ""}`} key={debt.id} onClick={() => setTab("debts")}>
                <span className={`status-check ${paid ? "checked" : ""}`}>{paid ? "✓" : ""}</span>
                <div><strong>{debt.name}</strong><small>{paid ? "Dívida paga neste mês" : `Dívida · vence dia ${debt.dueDay}`}</small></div>
                <b>{money(debt.installment)}</b>
              </button>
            );
          })}
          <div className="month-subhead"><span>CONTAS FIXAS</span><b>{payableRecords.filter((i) => i.amount > 0 && !variableBudgets.some((v) => v.item.id === i.id)).length} itens</b></div>
          {payableRecords.filter((i) => i.amount > 0 && !variableBudgets.some((v) => v.item.id === i.id)).map((item) => {
            const settled = hasMonth(item.statusMonths, selectedMonth);
            return (
              <button className={`month-item ${settled ? "done" : ""}`} key={item.id} onClick={() => toggleRecordStatus(item)}>
                <span className={`status-check ${settled ? "checked" : ""}`}>{settled ? "✓" : ""}</span>
                <div><strong>{item.title}</strong><small>{item.dueDay ? `Conta · dia ${item.dueDay}` : "Conta planejada"}</small></div>
                <b>{money(item.amount)}</b>
              </button>
            );
          })}
        </article>

        <article className="month-column allocate">
          <div className="month-column-head"><div><i>◆</i><span><strong>Separar</strong><small>Planejamento desta competência</small></span></div><b>{monthlyGoalPlans.length + 2}</b></div>
          <div className="month-item static">
            <span className="allocation-icon">P</span>
            <div><strong>Orçamento pessoal</strong><small>Santander · Pessoal</small></div>
            <b>{money(accountSummary.santanderPersonal)}</b>
          </div>
          <div className="month-item static">
            <span className="allocation-icon">C</span>
            <div><strong>Cartão pré-pago</strong><small>{money(accountSummary.prepaidLoaded)} carregados · {money(accountSummary.prepaidSpent)} usados</small></div>
            <b>{money(accountSummary.prepaid)}</b>
          </div>
          {monthlyGoalPlans.map((goal) => (
            <button className="month-item" key={goal.id} onClick={() => onEditGoal(goal)}>
              <span className="allocation-icon" style={{ color: goal.color }}>◆</span>
              <div><strong>{goal.title}</strong><small>Planejado para {monthLabel(selectedMonth, true)} · guardado {money(goal.current)}</small></div>
              <b>{money(goal.monthlyPlans[selectedMonth] ?? 0)}</b>
            </button>
          ))}
        </article>
      </div>

      <div className="section-divider">
        <div><span>CADASTROS DO MÊS</span><strong>Editar previsões</strong></div>
        <small>As parcelas vêm automaticamente da tela Dívidas.</small>
      </div>

      <div className="toolbar">
        <div className="segmented">
          <button className={recordFilter === "all" ? "active" : ""} onClick={() => setRecordFilter("all")}>Todos</button>
          <button className={recordFilter === "income" ? "active" : ""} onClick={() => setRecordFilter("income")}>Receitas</button>
          <button className={recordFilter === "expense" ? "active" : ""} onClick={() => setRecordFilter("expense")}>Despesas</button>
        </div>
        <div className="segmented subtle">
          <button className={statusFilter === "all" ? "active" : ""} onClick={() => setStatusFilter("all")}>Qualquer status</button>
          <button className={statusFilter === "pending" ? "active" : ""} onClick={() => setStatusFilter("pending")}>Pendentes</button>
          <button className={statusFilter === "settled" ? "active" : ""} onClick={() => setStatusFilter("settled")}>Concluídos</button>
        </div>
        <label className="search"><span>⌕</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar lançamento" /></label>
      </div>

      <div className="table-card">
        <div className="table-head"><span>STATUS</span><span>LANÇAMENTO</span><span>CATEGORIA</span><span>VENCIMENTO</span><span>VALOR</span><span>AÇÕES</span></div>
        {filteredRecords.map((item) => {
          const settled = hasMonth(item.statusMonths, selectedMonth);
          const isVariable = variableBudgets.some((v) => v.item.id === item.id);
          return (
            <div className={`table-row ${isVariable ? "budget-row" : ""}`} key={item.id}>
              {isVariable
                ? <span className="budget-status">≈</span>
                : <button className={`status-check ${settled ? "checked" : ""}`} onClick={() => toggleRecordStatus(item)} aria-label={settled ? "Marcar como pendente" : "Marcar como concluído"}>{settled ? "✓" : ""}</button>
              }
              <div className="record-name">
                <i className={item.type} />
                <span>
                  <strong>{item.title}</strong>
                  <small>{isVariable ? "Orçamento variável" : item.recurring ? "↻ Recorrente" : monthLabel(item.monthKey ?? selectedMonth)}</small>
                </span>
              </div>
              <span className="category-pill"><i style={{ background: CATEGORY_COLORS[item.category] ?? CATEGORY_COLORS.Outros }} />{item.category}</span>
              <span>{isVariable ? "Sem boleto" : dueDateLabel(item.dueDay, selectedMonth)}</span>
              <strong className={isVariable ? "budget-value" : item.type}>{isVariable ? "Limite " : item.type === "income" ? "+" : "−"}{money(item.amount)}</strong>
              <div className="row-actions">
                <button onClick={() => onEditRecord(item)}>Editar</button>
                <button className="delete" onClick={() => onDeleteRecord(item)}>Excluir</button>
              </div>
            </div>
          );
        })}
        {!filteredRecords.length && (
          <div className="empty"><span>⌕</span><strong>Nenhum lançamento encontrado</strong><small>Altere os filtros ou cadastre um novo item.</small></div>
        )}
      </div>
    </section>
  );
}
