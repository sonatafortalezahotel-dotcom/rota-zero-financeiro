"use client";

import type { Debt, Stats } from "@/lib/finance/types";
import { money, monthLabel } from "@/lib/finance/utils";

type Props = {
  selectedMonth: string;
  stats: Stats;
  debts: Debt[];
  activeDebts: Debt[];
  upcomingDebts: Debt[];
  debtProgress: number;
  paymentDraft: Record<string, string>;
  setPaymentDraft: (draft: Record<string, string>) => void;
  payDebt: (debt: Debt, amount: number, label?: string) => void;
  onNew: () => void;
  onEdit: (debt: Debt) => void;
  onDelete: (debt: Debt) => void;
};

export function DebtsScreen({
  selectedMonth, stats, debts, activeDebts, upcomingDebts, debtProgress,
  paymentDraft, setPaymentDraft, payDebt, onNew, onEdit, onDelete,
}: Props) {
  const settledDebts = debts.filter((d) => d.balance <= 0);

  return (
    <section className="screen">
      <div className="screen-title">
        <div><span>PLANO DE QUITAÇÃO</span><h1>Dívidas</h1><p>Saldos, parcelas e pagamentos extras sem perder o histórico.</p></div>
        <button className="lime-button" onClick={onNew}>＋ Nova dívida</button>
      </div>

      <div className="debt-hero">
        <div>
          <span>SALDO TOTAL DAS DÍVIDAS</span>
          <strong>{money(stats.debtBalance)}</strong>
          <p>Você já eliminou {money(stats.debtPaid)} do total original.</p>
        </div>
        <div className="debt-hero-ring" style={{ "--progress": `${debtProgress * 3.6}deg` } as React.CSSProperties}>
          <span><strong>{debtProgress.toFixed(1).replace(".", ",")}%</strong><small>quitado</small></span>
        </div>
        <div>
          <span>PARCELAS DE {monthLabel(selectedMonth, true).toUpperCase()}</span>
          <strong>{money(stats.debtMonthly)}</strong>
          <p className="warning-text">{activeDebts.length} {activeDebts.length === 1 ? "dívida entra" : "dívidas entram"} neste mês</p>
        </div>
      </div>

      <details className="debt-monthly-breakdown">
        <summary>
          <span>COMPOSIÇÃO DAS PARCELAS</span>
          <strong>Ver como chegou em {money(stats.debtMonthly)}</strong>
          <i>⌄</i>
        </summary>
        <div className="debt-monthly-content">
          <div className="debt-monthly-list">
            {activeDebts.length
              ? activeDebts.map((debt) => (
                  <div key={debt.id}>
                    <span>
                      <i style={{ background: debt.color }} />
                      <b>{debt.name}</b>
                      <small>Vence dia {debt.dueDay}{debt.paymentHistory.some((p) => p.month === selectedMonth) ? " · pago neste mês" : ""}</small>
                    </span>
                    <strong>{money(debt.installment)}</strong>
                  </div>
                ))
              : <p>Nenhuma parcela ativa nesta competência.</p>
            }
            <div className="debt-monthly-total">
              <span>TOTAL DE {monthLabel(selectedMonth, true).toUpperCase()}</span>
              <strong>{money(stats.debtMonthly)}</strong>
            </div>
          </div>
          {upcomingDebts.length > 0 && (
            <div className="upcoming-debts">
              <span>COMEÇAM DEPOIS</span>
              {upcomingDebts.map((debt) => (
                <p key={debt.id}><b>{debt.name}</b> · {money(debt.installment)} · {debt.starts || "início ainda não informado"}</p>
              ))}
            </div>
          )}
          {settledDebts.length > 0 && (
            <small className="settled-note">
              {settledDebts.map((d) => d.name).join(", ")} {settledDebts.length === 1 ? "está quitada" : "estão quitadas"} e não {settledDebts.length === 1 ? "entra" : "entram"} mais nas parcelas mensais.
            </small>
          )}
        </div>
      </details>

      <div className="debt-list">
        {[...debts]
          .sort((a, b) => Number(a.balance <= 0) - Number(b.balance <= 0) || a.balance - b.balance)
          .map((debt, index) => {
            const settled = debt.balance <= 0;
            const progress = debt.original ? ((debt.original - debt.balance) / debt.original) * 100 : 0;
            const paidMonth = debt.paymentHistory.filter((p) => p.month === selectedMonth).reduce((s, p) => s + p.amount, 0);
            return (
              <article className={`debt-card ${settled ? "settled" : ""}`} key={debt.id} style={{ "--accent": debt.color } as React.CSSProperties}>
                <div className="debt-order">
                  <span>{settled ? "✓" : String(index + 1).padStart(2, "0")}</span>
                  <small>{settled ? "finalizada" : "ordem sugerida"}</small>
                </div>
                <div className="debt-main">
                  <div className="debt-title">
                    <i />
                    <div><strong>{debt.name}</strong><small>{debt.detail}</small></div>
                    <span className={settled ? "settled" : debt.lateAmount ? "late" : debt.entryPending ? "entry" : "ok"}>
                      {settled ? "QUITADA" : debt.lateAmount ? "EM ATRASO" : debt.entryPending ? "ENTRADA PENDENTE" : "EM DIA"}
                    </span>
                  </div>
                  <div className="debt-numbers">
                    <div><span>SALDO</span><strong>{money(debt.balance)}</strong></div>
                    <div><span>PARCELA</span><strong>{settled ? "—" : money(debt.installment)}</strong></div>
                    <div><span>VENCIMENTO</span><strong>{settled ? "Finalizada" : `Dia ${debt.dueDay}`}</strong></div>
                    <div><span>PARCELAS</span><strong>{debt.paidInstallments}/{debt.totalInstallments}</strong></div>
                  </div>
                  <div className="debt-bar"><i style={{ width: `${progress}%` }} /></div>
                  <div className="debt-foot">
                    <span>{progress.toFixed(1).replace(".", ",")}% concluído</span>
                    {paidMonth > 0 && <b>✓ {money(paidMonth)} pagos em {monthLabel(selectedMonth, true)}</b>}
                    {debt.starts && !settled && <span>{debt.starts}</span>}
                  </div>
                </div>
                <div className="debt-controls">
                  {settled ? (
                    <>
                      <div className="debt-settled-block"><i>✓</i><strong>Dívida encerrada</strong><small>Não entra no saldo nem nas parcelas mensais.</small></div>
                      <div className="crud-links"><button onClick={() => onEdit(debt)}>Ver ou editar</button><button onClick={() => onDelete(debt)}>Excluir</button></div>
                    </>
                  ) : (
                    <>
                      {debt.entryPending > 0
                        ? <button className="lime-button" onClick={() => payDebt(debt, debt.entryPending, "Entrada")}>Registrar entrada<br /><strong>{money(debt.entryPending)}</strong></button>
                        : <button className="lime-button" onClick={() => payDebt(debt, debt.installment)}>Pagar parcela<br /><strong>{money(debt.installment)}</strong></button>
                      }
                      <label>
                        <span>Pagamento extra</span>
                        <div>
                          <b>R$</b>
                          <input
                            value={paymentDraft[debt.id] ?? ""}
                            inputMode="decimal"
                            placeholder="0,00"
                            onChange={(e) => setPaymentDraft({ ...paymentDraft, [debt.id]: e.target.value })}
                          />
                          <button onClick={() => payDebt(debt, Number((paymentDraft[debt.id] ?? "").replace(",", ".")), "Extra")}>＋</button>
                        </div>
                      </label>
                      <div className="crud-links"><button onClick={() => onEdit(debt)}>Editar</button><button onClick={() => onDelete(debt)}>Excluir</button></div>
                    </>
                  )}
                </div>
              </article>
            );
          })}
      </div>
    </section>
  );
}
