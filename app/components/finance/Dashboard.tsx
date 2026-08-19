"use client";

import type { BankEntry, Debt, Goal, RecordItem, Stats, Tab } from "@/lib/finance/types";
import { CATEGORY_COLORS } from "@/lib/finance/constants";
import { hasMonth, money, monthLabel } from "@/lib/finance/utils";

type CashPoint = { month: string; income: number; expense: number; balance: number; actual: boolean };

type Props = {
  selectedMonth: string;
  stats: Stats;
  payableRecords: RecordItem[];
  cashProjection: CashPoint[];
  categoryData: { name: string; value: number; color: string }[];
  goals: Goal[];
  reserveGoal?: Goal;
  reserveProgress: number;
  debtProgress: number;
  debts: Debt[];
  currentDay: number;
  knownAccountsBalance: number;
  freeOperatingBalance: number;
  assignedBalance: number;
  monthEntries: BankEntry[];
  displayName: string;
  setTab: (tab: Tab) => void;
  setRecordFilter: (v: "all" | "income" | "expense") => void;
  setEntryFilter: (v: "all" | "expense" | "income" | "transfer" | "pending") => void;
  toggleRecordStatus: (item: RecordItem) => void;
  openRecord: () => void;
};

export function Dashboard({
  selectedMonth, stats, payableRecords, cashProjection, categoryData,
  goals, reserveGoal, reserveProgress, debtProgress, debts, currentDay,
  knownAccountsBalance, freeOperatingBalance, assignedBalance, monthEntries,
  displayName, setTab, setRecordFilter, setEntryFilter, toggleRecordStatus, openRecord,
}: Props) {
  const totalCategories = categoryData.reduce((sum, item) => sum + item.value, 0) || 1;
  const donut = categoryData
    .reduce((parts, item, index) => {
      const start = (categoryData.slice(0, index).reduce((s, e) => s + e.value, 0) / totalCategories) * 100;
      const end = start + (item.value / totalCategories) * 100;
      return [...parts, `${item.color} ${start}% ${end}%`];
    }, [] as string[])
    .join(",");
  const maxChart = Math.max(...cashProjection.flatMap((e) => [e.income, e.expense]), 1);

  const coraCount = monthEntries.filter((e) => e.account === "Open Dreams · Cora").length;
  const hasLedger = monthEntries.length > 0;
  const classifiedPct = Math.round(stats.classifiedRatio * 100);
  const currentMonthLabel = monthLabel(selectedMonth, true).toUpperCase();

  const VARIABLE_BUDGET_IDS_COMPAT = new Set(
    payableRecords.filter((r) => r.dueDay === null && r.recurring).map((r) => r.id),
  );

  return (
    <section className="screen dashboard-screen">
      <div className="screen-title">
        <div>
          <span>VISÃO GERAL</span>
          <h1>{displayName ? `Olá, ${displayName}.` : "Visão geral"}</h1>
          <p>Um passo de cada vez. Hoje você só precisa cuidar do que está em destaque.</p>
        </div>
        <button className="mobile-add" onClick={openRecord}>＋ Lançar</button>
      </div>

      {hasLedger ? (
        <div className="coach-card">
          <div className="coach-copy">
            <span className="coach-kicker">{currentMonthLabel} CONCILIADO · +{Math.min(250, Math.round(stats.classifiedRatio * 250))} XP</span>
            <h2>Agora o saldo do banco não se mistura com a projeção.</h2>
            <p>Há {money(knownAccountsBalance)} conhecidos nas contas. Descontando {money(assignedBalance)} já destinados, ficam {money(freeOperatingBalance)} sem destino.</p>
            <div className="coach-actions">
              <button className="lime-button" onClick={() => setTab("ledger")}>Ver extrato real</button>
              <button onClick={() => setTab("goals")}>Ver dinheiro protegido →</button>
            </div>
          </div>
          <div className="coach-score">
            <div className="score-ring" style={{ "--progress": `${Math.round(stats.classifiedRatio * 360)}deg` } as React.CSSProperties}>
              <span><strong>{classifiedPct}%</strong><small>extratos<br />classificados</small></span>
            </div>
            {classifiedPct >= 100 && <p>Primeira vitória desbloqueada.</p>}
          </div>
        </div>
      ) : (
        <div className="coach-card">
          <div className="coach-copy">
            <span className="coach-kicker">PLANEJAMENTO ATIVO</span>
            <h2>Você está no controle do planejamento.</h2>
            <p>Importe os extratos para comparar o previsto com o realizado e descobrir sua sobra real.</p>
            <div className="coach-actions">
              <button className="lime-button" onClick={() => setTab("ledger")}>Lançar no extrato</button>
              <button onClick={() => setTab("records")}>Ver planejamento →</button>
            </div>
          </div>
          <div className="coach-score">
            <div className="score-ring" style={{ "--progress": `${Math.round((stats.completion / 100) * 360)}deg` } as React.CSSProperties}>
              <span><strong>{Math.round(stats.completion)}%</strong><small>lançamentos<br />confirmados</small></span>
            </div>
          </div>
        </div>
      )}

      <div className="kpi-grid">
        <article className="kpi-card income">
          <div><span>ENTRADAS REAIS</span><i>↗</i></div>
          <strong>{money(stats.actualIncome)}</strong>
          <small>Clientes confirmados nas duas contas</small>
          <div className="kpi-track"><i style={{ width: `${stats.incomeExpected ? Math.min(100, (stats.actualIncome / stats.incomeExpected) * 100) : 0}%` }} /></div>
        </article>
        <article className="kpi-card expense">
          <div><span>CUSTOS DA EMPRESA</span><i>↘</i></div>
          <strong>{money(stats.businessExpense)}</strong>
          <small>Trabalho, fornecedores e custos bancários</small>
          <div className="kpi-track"><i style={{ width: `${stats.actualIncome ? Math.min(100, (stats.businessExpense / stats.actualIncome) * 100) : 0}%` }} /></div>
        </article>
        <article className="kpi-card now">
          <div><span>GASTOS PESSOAIS</span><i>◉</i></div>
          <strong>{money(stats.personalExpense)}</strong>
          <small>{stats.reviewExpense > 0 ? `${money(stats.reviewExpense)} ainda precisam de contexto` : "Tudo classificado"}</small>
          <div className="balance-message">Santander será sua carteira pessoal.</div>
        </article>
        <article className={`kpi-card balance ${freeOperatingBalance < 0 ? "negative" : ""}`}>
          <div><span>LIVRE SEM DESTINO</span><i>●</i></div>
          <strong>{money(freeOperatingBalance)}</strong>
          <small>Bradesco + Cora, sem contar valores separados</small>
          <div className="balance-message">
            {freeOperatingBalance >= 0 ? `${money(assignedBalance)} já têm destino.` : "As contas operacionais estão negativas."}
          </div>
        </article>
      </div>

      <div className="dashboard-grid charts-row">
        <article className="panel cash-chart-panel">
          <div className="panel-head">
            <div><span>FLUXO DE CAIXA</span><h3>Entradas x saídas</h3><p>{monthLabel(selectedMonth, true)} realizado; meses seguintes projetados.</p></div>
            <div className="legend"><span><i className="green" /> Entradas</span><span><i className="purple" /> Saídas</span></div>
          </div>
          <div className="cash-chart">
            {cashProjection.map((item) => (
              <div className={`chart-column ${item.month === selectedMonth ? "current" : ""}`} key={item.month}>
                <div className="bars">
                  <i className="income-bar" style={{ height: `${Math.max(5, (item.income / maxChart) * 100)}%` }} title={money(item.income)} />
                  <i className="expense-bar" style={{ height: `${Math.max(5, (item.expense / maxChart) * 100)}%` }} title={money(item.expense)} />
                </div>
                <span>{monthLabel(item.month, true)}</span>
                <em>{item.actual ? "real" : "prev."}</em>
                <small className={item.balance < 0 ? "bad" : ""}>{item.balance < 0 ? "−" : "+"}{money(Math.abs(item.balance)).replace("R$ ", "")}</small>
              </div>
            ))}
          </div>
        </article>
        <article className="panel category-panel">
          <div className="panel-head"><div><span>PARA ONDE FOI</span><h3>Mapa dos gastos reais</h3><p>Extratos das duas contas, sem transferências.</p></div></div>
          <div className="category-content">
            <div className="donut" style={{ background: `conic-gradient(${donut})` }}>
              <span><small>TOTAL</small><strong>{money(stats.actualExpense)}</strong></span>
            </div>
            <div className="category-list">
              {categoryData.slice(0, 6).map((item) => (
                <div key={item.name}><i style={{ background: item.color }} /><span>{item.name}</span><strong>{money(item.value)}</strong></div>
              ))}
            </div>
          </div>
        </article>
      </div>

      <div className="dashboard-grid action-row">
        <article className="panel action-panel">
          <div className="panel-head">
            <div><span>FAÇA NESTA ORDEM</span><h3>Próximos passos</h3></div>
            <b>{[stats.unknown > 0, stats.late > 0, stats.receivable > 0].filter(Boolean).length}</b>
          </div>
          {stats.unknown > 0 && (
            <button onClick={() => { setRecordFilter("expense"); setTab("records"); }}>
              <span className="task-number">01</span>
              <div><strong>Preencher {stats.unknown} valores faltantes</strong><small>Assinaturas sem valor distorcem sua sobra.</small></div>
              <b>Começar →</b>
            </button>
          )}
          {stats.late > 0 && (
            <button onClick={() => setTab("debts")}>
              <span className="task-number warning">02</span>
              <div><strong>Zerar {money(stats.late)} em atrasos</strong><small>{stats.lateCount} parcelas precisam de atenção imediata.</small></div>
              <b>Resolver →</b>
            </button>
          )}
          {stats.receivable > 0 && (
            <button onClick={() => setTab("records")}>
              <span className="task-number blue">03</span>
              <div><strong>Conferir {money(stats.receivable)} a receber</strong><small>Marque somente quando cair na conta.</small></div>
              <b>Conferir →</b>
            </button>
          )}
          {stats.pendingReview > 0 && (
            <button onClick={() => { setEntryFilter("pending"); setTab("ledger"); }}>
              <span className="task-number">04</span>
              <div><strong>{money(stats.pendingReview)} aguardando classificação</strong><small>Confirme o contexto de cada lançamento.</small></div>
              <b>Classificar →</b>
            </button>
          )}
        </article>
        <article className="panel reserve-panel">
          <div className="panel-head"><div><span>PROTEÇÃO</span><h3>Reserva de segurança</h3></div><button onClick={() => setTab("goals")}>Ver meta</button></div>
          <div className="reserve-visual">
            <div className="reserve-ring" style={{ "--progress": `${Math.min(360, reserveProgress * 3.6)}deg` } as React.CSSProperties}>
              <span><strong>{reserveProgress.toFixed(0)}%</strong><small>guardado</small></span>
            </div>
            <div>
              <span>ATUAL</span>
              <strong>{money(reserveGoal?.current ?? 0)}</strong>
              <small>Meta: {money(reserveGoal?.target ?? 0)}</small>
              <p>Regra Rota Zero: recebeu, separe primeiro; depois gaste.</p>
            </div>
          </div>
        </article>
      </div>

      <div className="dashboard-grid bottom-row">
        <article className="panel due-panel">
          <div className="panel-head"><div><span>AGENDA FINANCEIRA</span><h3>Próximos vencimentos</h3></div><button onClick={() => setTab("records")}>Ver todos</button></div>
          {[...payableRecords]
            .filter((item) => !VARIABLE_BUDGET_IDS_COMPAT.has(item.id) && !hasMonth(item.statusMonths, selectedMonth) && item.amount > 0)
            .slice(0, 5)
            .map((item) => (
              <button className="due-item" key={item.id} onClick={() => toggleRecordStatus(item)}>
                <span className={(item.dueDay ?? 99) < currentDay ? "late" : ""}>
                  {item.dueDay ? String(item.dueDay).padStart(2, "0") : "—"}
                  <small>{monthLabel(selectedMonth, true)}</small>
                </span>
                <div><strong>{item.title}</strong><small>{item.category} · {item.recurring ? "recorrente" : "única"}</small></div>
                <b>{money(item.amount)}</b>
                <i>Marcar pago</i>
              </button>
            ))}
        </article>
        <article className="panel debt-summary">
          <div className="panel-head"><div><span>ROTA ATÉ O ZERO</span><h3>Dívida total</h3></div><button onClick={() => setTab("debts")}>Abrir plano</button></div>
          <div className="debt-total"><strong>{money(stats.debtBalance)}</strong><span>faltam para zerar</span></div>
          <div className="debt-progress"><i style={{ width: `${debtProgress}%` }} /></div>
          <div className="debt-meta">
            <span><b>{money(stats.debtPaid)}</b> eliminados</span>
            <span><b>{debtProgress.toFixed(1).replace(".", ",")}%</b> concluído</span>
          </div>
          <p>Foque primeiro em regularizar atrasos; depois ataque o menor saldo.</p>
        </article>
      </div>
    </section>
  );
}
