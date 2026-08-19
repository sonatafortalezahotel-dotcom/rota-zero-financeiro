"use client";

import type { BankEntry, Stats } from "@/lib/finance/types";
import { dateLabel, money } from "@/lib/finance/utils";

type AccountSummary = {
  coraMovement: number;
  prepaid: number;
  prepaidLoaded: number;
  prepaidSpent: number;
  prepaidOpening: number;
  santanderPersonal: number;
  santanderGoals: number;
  fuelSpent: number;
  fuelBudget: number;
};

type Props = {
  stats: Stats;
  accountSummary: AccountSummary;
  filteredEntries: BankEntry[];
  monthEntries: BankEntry[];
  entryFilter: "all" | "expense" | "income" | "transfer" | "pending";
  setEntryFilter: (v: "all" | "expense" | "income" | "transfer" | "pending") => void;
  entrySearch: string;
  setEntrySearch: (v: string) => void;
  onNew: () => void;
  onEdit: (item: BankEntry) => void;
  onDelete: (item: BankEntry) => void;
};

export function LedgerScreen({
  stats, accountSummary, filteredEntries, monthEntries,
  entryFilter, setEntryFilter, entrySearch, setEntrySearch,
  onNew, onEdit, onDelete,
}: Props) {
  return (
    <section className="screen ledger-screen">
      <div className="screen-title">
        <div><span>REALIZADO · TODAS AS CONTAS</span><h1>Extrato real</h1><p>O que realmente entrou, saiu ou apenas mudou de lugar.</p></div>
        <button className="lime-button" onClick={onNew}>＋ Nova movimentação</button>
      </div>

      <div className="ledger-hero">
        <article className="actual-in"><span>ENTROU DE CLIENTES</span><strong>{money(stats.actualIncome)}</strong><small>Receita confirmada, sem transferências</small></article>
        <article className="actual-out"><span>GASTO REAL</span><strong>{money(stats.actualExpense)}</strong><small>Despesas confirmadas nas duas contas</small></article>
        <article className={stats.currentBalance >= 0 ? "actual-result" : "actual-out"}><span>RESULTADO DO MÊS</span><strong>{money(stats.currentBalance)}</strong><small>Receitas menos gastos; não é saldo bancário</small></article>
        <article><span>SALDO BRADESCO</span><strong>{money(stats.bankBalance)}</strong><small>Conta principal de recebimentos</small></article>
      </div>

      <div className="account-landscape">
        <article><i>BR</i><div><span>BRADESCO</span><strong>{money(stats.bankBalance)}</strong><small>Maioria dos clientes + pagamentos principais</small></div><b>PRINCIPAL</b></article>
        <article><i>CO</i><div><span>CORA</span><strong>{accountSummary.coraMovement >= 0 ? "+" : ""}{money(accountSummary.coraMovement)}</strong><small>Movimento no período · alguns clientes</small></div><b>EMPRESA</b></article>
        <article><i>CC</i><div><span>CARTÃO PRÉ-PAGO CORA</span><strong>{money(accountSummary.prepaid)}</strong><small>{money(accountSummary.prepaidLoaded)} carregados · {money(accountSummary.prepaidSpent)} usados</small></div><b>SALDO ATUAL</b></article>
        <article><i>SA</i><div><span>SANTANDER</span><strong>{money(accountSummary.santanderPersonal + accountSummary.santanderGoals)}</strong><small>{money(accountSummary.santanderPersonal)} pessoal + {money(accountSummary.santanderGoals)} caixinhas</small></div><b>PESSOAL</b></article>
      </div>

      <div className="budget-grid">
        <article>
          <div><span>ORÇAMENTO PESSOAL</span><strong>{money(accountSummary.santanderPersonal)}</strong></div>
          <small>Disponibilizado no Santander. O gasto real será lido pelo extrato da conta.</small>
          <div className="budget-track"><i style={{ width: "0%" }} /></div>
          <b>Aguardando extrato Santander</b>
        </article>
        {accountSummary.fuelBudget > 0 && (
          <article>
            <div><span>GASOLINA</span><strong>{money(accountSummary.fuelSpent)}</strong></div>
            <small>de {money(accountSummary.fuelBudget)} previstos para o mês</small>
            <div className="budget-track"><i style={{ width: `${Math.min(100, (accountSummary.fuelSpent / accountSummary.fuelBudget) * 100)}%` }} /></div>
            <b>{money(Math.max(0, accountSummary.fuelBudget - accountSummary.fuelSpent))} disponíveis</b>
          </article>
        )}
        <article>
          <div><span>SALDO NO CARTÃO CORA</span><strong>{money(accountSummary.prepaid)}</strong></div>
          <small>Saldo anterior {money(accountSummary.prepaidOpening)} + cargas {money(accountSummary.prepaidLoaded)} − compras {money(accountSummary.prepaidSpent)}.</small>
          <div className="budget-track"><i style={{ width: `${Math.max(0, Math.min(100, (accountSummary.prepaid / Math.max(1, accountSummary.prepaidOpening + accountSummary.prepaidLoaded)) * 100))}%` }} /></div>
          <b>{money(accountSummary.prepaid)} disponíveis</b>
        </article>
        <article>
          <div><span>CAIXINHAS</span><strong>{money(accountSummary.santanderGoals)}</strong></div>
          <small>Metas e reservas já separadas.</small>
          <div className="budget-track"><i style={{ width: "100%" }} /></div>
          <b>Patrimônio protegido</b>
        </article>
      </div>

      <div className="transfer-strip">
        <div>
          <i>↔</i>
          <span>
            <strong>{money(stats.transferOut)} movidos, não gastos</strong>
            <small>Inclui metas, orçamento pessoal e reservas do cartão.</small>
          </span>
        </div>
        <div>
          <span>
            <strong>{monthEntries.filter((e) => e.account === "Open Dreams · Cora").length} lançamentos na Cora</strong>
            <small>Verifique contexto de cada movimentação.</small>
          </span>
        </div>
        {stats.pendingReview > 0 && (
          <button onClick={() => setEntryFilter("pending")}>
            <strong>{money(stats.pendingReview)}</strong>
            <small>para confirmar</small>
          </button>
        )}
      </div>

      <div className="toolbar">
        <div className="segmented">
          {(["expense", "income", "transfer", "pending", "all"] as const).map((f) => (
            <button key={f} className={entryFilter === f ? "active" : ""} onClick={() => setEntryFilter(f)}>
              {f === "expense" ? "Gastos" : f === "income" ? "Receitas" : f === "transfer" ? "Transferências" : f === "pending" ? "Revisar" : "Todos"}
            </button>
          ))}
        </div>
        <span />
        <label className="search">
          <span>⌕</span>
          <input value={entrySearch} onChange={(e) => setEntrySearch(e.target.value)} placeholder="Buscar no extrato" />
        </label>
      </div>

      <div className="ledger-table">
        <div className="ledger-head">
          <span>DATA</span><span>MOVIMENTAÇÃO</span><span>CONTA / DESTINO</span><span>CONTEXTO</span><span>VALOR</span><span>AÇÕES</span>
        </div>
        {filteredEntries.map((item) => (
          <div className="ledger-row" key={item.id}>
            <span>{dateLabel(item.entryDate)}</span>
            <div className="ledger-name">
              <i className={`${item.flow} ${item.direction}`} />
              <span>
                <strong>{item.description}</strong>
                <small>{item.status === "pending" ? "⚠ Aguardando classificação" : item.flow === "transfer" ? "Não altera gasto x sobra" : item.notes || item.category}</small>
              </span>
            </div>
            <span className="account-tag">{item.account}{item.destinationAccount ? ` → ${item.destinationAccount}` : ""}</span>
            <span className={`context-pill ${item.context}`}>
              {item.context === "empresa" ? "Empresa" : item.context === "pessoal" ? "Pessoal" : item.context === "reserva" ? "Reserva" : item.context === "transferencia" ? "Transferência" : "Revisar"}
            </span>
            <strong className={item.direction === "in" ? "income" : item.flow === "transfer" ? "transfer" : "expense"}>
              {item.direction === "in" ? "+" : "−"}{money(item.amount)}
            </strong>
            <div className="row-actions">
              <button onClick={() => onEdit(item)}>Editar</button>
              <button className="delete" onClick={() => onDelete(item)}>Excluir</button>
            </div>
          </div>
        ))}
        {!filteredEntries.length && (
          <div className="empty"><span>⌕</span><strong>Nenhuma movimentação</strong><small>Altere o filtro ou cadastre um lançamento.</small></div>
        )}
      </div>
    </section>
  );
}
