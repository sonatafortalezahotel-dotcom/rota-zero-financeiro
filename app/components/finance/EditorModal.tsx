"use client";

import type { BankEntry, Debt, Draft, Editor, Goal, RecordItem } from "@/lib/finance/types";
import { monthLabel } from "@/lib/finance/utils";

const RECORD_CATEGORIES = ["Clientes", "Negócio", "Moradia", "Família", "Pessoal", "Lazer", "Transporte", "Impostos", "Comunicação", "Outros"];
const ENTRY_CATEGORIES = ["Clientes", "Trabalho", "Ferramentas", "Dívidas", "Moradia", "Alimentação", "Combustível", "Transporte", "Saúde", "Pessoal", "Bancos", "Metas", "Transferência", "Orçamento pessoal", "Reserva do cartão", "A confirmar", "Outros"];

type Props = {
  editor: NonNullable<Editor>;
  draft: Draft;
  setDraft: (draft: Draft) => void;
  saving: boolean;
  accounts: string[];
  selectedMonth: string;
  onClose: () => void;
  onSave: (event: React.FormEvent) => void;
  onDelete: () => void;
};

export function EditorModal({ editor, draft, setDraft, saving, accounts, selectedMonth, onClose, onSave, onDelete }: Props) {
  const number = (v: unknown) => Number(v ?? 0) || 0;
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.currentTarget === e.target) onClose(); }}>
      <form className="modal" onSubmit={onSave}>
        <div className="modal-head">
          <div>
            <span>{editor.item ? "EDITAR CADASTRO" : "NOVO CADASTRO"}</span>
            <h2>{editor.entity === "record" ? "Planejamento" : editor.entity === "debt" ? "Dívida" : editor.entity === "entry" ? "Movimentação real" : "Meta financeira"}</h2>
          </div>
          <button type="button" onClick={onClose}>×</button>
        </div>

        {editor.entity === "record" && (
          <div className="form-grid">
            {editor.item && draft.recurring && (
              <div className="recurrence-scope wide">
                <div><span>ALTERAR RECORRÊNCIA</span><strong>Onde este novo valor deve valer?</strong></div>
                <label>
                  <select value={String(draft.editScope)} onChange={(e) => setDraft({ ...draft, editScope: e.target.value })}>
                    <option value="month">Somente {monthLabel(String(draft.editMonth), true)}</option>
                    <option value="future">Este mês e os próximos</option>
                    <option value="all">Todos os meses</option>
                  </select>
                </label>
                <small>{draft.editScope === "month" ? "Os outros meses continuam com os valores atuais." : draft.editScope === "future" ? "O histórico anterior fica preservado." : "Substitui o valor-base e remove exceções mensais."}</small>
              </div>
            )}
            <label><span>Tipo</span>
              <select value={String(draft.type)} onChange={(e) => setDraft({ ...draft, type: e.target.value })}>
                <option value="income">Receita</option>
                <option value="expense">Despesa</option>
              </select>
            </label>
            <label className="wide"><span>Nome do lançamento</span>
              <input required value={String(draft.title)} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Ex.: Aluguel, cliente, assinatura" />
            </label>
            <label><span>Categoria</span>
              <select value={String(draft.category)} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
                {RECORD_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label><span>Valor</span>
              <div className="money-field"><b>R$</b><input required type="number" min="0" step="0.01" value={String(draft.amount)} onChange={(e) => setDraft({ ...draft, amount: number(e.target.value) })} /></div>
            </label>
            <label><span>Dia do vencimento</span>
              <input type="number" min="1" max="31" value={String(draft.dueDay)} onChange={(e) => setDraft({ ...draft, dueDay: e.target.value ? number(e.target.value) : null })} placeholder="Opcional" />
            </label>
            <label className="check-label">
              <input type="checkbox" checked={Boolean(draft.recurring)} onChange={(e) => setDraft({ ...draft, recurring: e.target.checked })} />
              <span><strong>Repetir todos os meses</strong><small>Ideal para mensalidades e contratos</small></span>
            </label>
            <label><span>{draft.recurring ? "Começa no mês" : "Mês do lançamento"}</span>
              <input type="month" value={String(draft.monthKey ?? "")} onChange={(e) => setDraft({ ...draft, monthKey: e.target.value })} />
            </label>
            <label className="wide"><span>Observações</span>
              <textarea value={String(draft.notes)} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} placeholder="Detalhes que ajudam você a lembrar" />
            </label>
          </div>
        )}

        {editor.entity === "debt" && (
          <div className="form-grid">
            <label className="wide"><span>Nome da dívida</span><input required value={String(draft.name)} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Ex.: Bradesco, carro" /></label>
            <label className="wide"><span>Descrição</span><input value={String(draft.detail)} onChange={(e) => setDraft({ ...draft, detail: e.target.value })} placeholder="Número do acordo ou finalidade" /></label>
            <label><span>Valor original</span><input required type="number" step="0.01" value={String(draft.original)} onChange={(e) => setDraft({ ...draft, original: number(e.target.value) })} /></label>
            <label><span>Saldo atual</span><input required type="number" step="0.01" value={String(draft.balance)} onChange={(e) => setDraft({ ...draft, balance: number(e.target.value) })} /></label>
            <label><span>Valor da parcela</span><input required type="number" step="0.01" value={String(draft.installment)} onChange={(e) => setDraft({ ...draft, installment: number(e.target.value) })} /></label>
            <label><span>Vence todo dia</span><input required type="number" min="1" max="31" value={String(draft.dueDay)} onChange={(e) => setDraft({ ...draft, dueDay: number(e.target.value) })} /></label>
            <label><span>Total de parcelas</span><input required type="number" min="1" value={String(draft.totalInstallments)} onChange={(e) => setDraft({ ...draft, totalInstallments: number(e.target.value) })} /></label>
            <label><span>Parcelas pagas</span><input type="number" min="0" value={String(draft.paidInstallments)} onChange={(e) => setDraft({ ...draft, paidInstallments: number(e.target.value) })} /></label>
            <label><span>Valor em atraso</span><input type="number" min="0" step="0.01" value={String(draft.lateAmount)} onChange={(e) => setDraft({ ...draft, lateAmount: number(e.target.value) })} /></label>
            <label><span>Parcelas atrasadas</span><input type="number" min="0" value={String(draft.lateCount)} onChange={(e) => setDraft({ ...draft, lateCount: number(e.target.value) })} /></label>
            <label><span>Entrada pendente</span><input type="number" min="0" step="0.01" value={String(draft.entryPending)} onChange={(e) => setDraft({ ...draft, entryPending: number(e.target.value) })} /></label>
            <label><span>Cor</span><input type="color" value={String(draft.color)} onChange={(e) => setDraft({ ...draft, color: e.target.value })} /></label>
          </div>
        )}

        {editor.entity === "goal" && (
          <div className="form-grid">
            <div className="monthly-plan-field wide">
              <div><span>PLANEJAMENTO DE {monthLabel(String(draft.planMonth))}</span><strong>Quanto deseja separar neste mês?</strong><small>Isso não altera o valor que já está guardado.</small></div>
              <div className="money-field"><b>R$</b><input type="number" min="0" step="0.01" value={String(draft.monthlyAmount)} onChange={(e) => setDraft({ ...draft, monthlyAmount: number(e.target.value) })} /></div>
            </div>
            <label className="wide"><span>Nome da meta</span><input required value={String(draft.title)} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Ex.: Reserva de emergência" /></label>
            <label><span>Valor da meta</span><input required type="number" min="0" step="0.01" value={String(draft.target)} onChange={(e) => setDraft({ ...draft, target: number(e.target.value) })} /></label>
            <label><span>Valor já guardado</span><input type="number" min="0" step="0.01" value={String(draft.current)} onChange={(e) => setDraft({ ...draft, current: number(e.target.value) })} /></label>
            <label><span>Prazo</span><input type="date" value={String(draft.dueDate)} onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })} /></label>
            <label><span>Objetivo</span>
              <select value={String(draft.kind)} onChange={(e) => setDraft({ ...draft, kind: e.target.value })}>
                <option value="save">Guardar dinheiro</option>
                <option value="debt">Reduzir dívida</option>
              </select>
            </label>
            <label><span>Cor</span><input type="color" value={String(draft.color)} onChange={(e) => setDraft({ ...draft, color: e.target.value })} /></label>
          </div>
        )}

        {editor.entity === "entry" && (
          <div className="form-grid">
            <label><span>Data</span>
              <input required type="date" value={String(draft.entryDate)} onChange={(e) => setDraft({ ...draft, entryDate: e.target.value, monthKey: e.target.value.slice(0, 7) })} />
            </label>
            <label><span>Conta de origem</span>
              <select value={String(draft.account)} onChange={(e) => setDraft({ ...draft, account: e.target.value })}>
                {accounts.map((a) => <option key={a}>{a}</option>)}
              </select>
            </label>
            <label className="wide"><span>Descrição</span>
              <input required value={String(draft.description)} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="Ex.: Cliente, mercado, transferência" />
            </label>
            <label><span>Natureza</span>
              <select value={String(draft.flow)} onChange={(e) => { const flow = e.target.value; setDraft({ ...draft, flow, direction: flow === "income" ? "in" : "out" }); }}>
                <option value="expense">Despesa real</option>
                <option value="income">Receita real</option>
                <option value="transfer">Transferência</option>
              </select>
            </label>
            <label><span>Direção</span>
              <select value={String(draft.direction)} onChange={(e) => setDraft({ ...draft, direction: e.target.value })}>
                <option value="out">Saiu da conta</option>
                <option value="in">Entrou na conta</option>
              </select>
            </label>
            {draft.flow === "transfer" && (
              <label><span>Conta de destino</span>
                <select value={String(draft.destinationAccount)} onChange={(e) => setDraft({ ...draft, destinationAccount: e.target.value })}>
                  <option value="">Selecione</option>
                  {accounts.filter((a) => a !== String(draft.account)).map((a) => <option key={a}>{a}</option>)}
                </select>
              </label>
            )}
            <label><span>Contexto</span>
              <select value={String(draft.context)} onChange={(e) => setDraft({ ...draft, context: e.target.value })}>
                <option value="empresa">Empresa</option>
                <option value="pessoal">Pessoal</option>
                <option value="reserva">Reserva/meta</option>
                <option value="transferencia">Transferência</option>
                <option value="revisar">Revisar</option>
              </select>
            </label>
            <label><span>Categoria</span>
              <select value={String(draft.category)} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
                {ENTRY_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label><span>Valor</span>
              <div className="money-field"><b>R$</b><input required type="number" min="0" step="0.01" value={String(draft.amount)} onChange={(e) => setDraft({ ...draft, amount: number(e.target.value) })} /></div>
            </label>
            <label><span>Status</span>
              <select value={String(draft.status)} onChange={(e) => setDraft({ ...draft, status: e.target.value })}>
                <option value="confirmed">Confirmado</option>
                <option value="pending">A confirmar</option>
              </select>
            </label>
            <label className="wide"><span>Observações</span>
              <textarea value={String(draft.notes)} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} placeholder="Explique transferências ou classificações" />
            </label>
          </div>
        )}

        <div className="modal-foot">
          {editor.item && <button type="button" className="delete-button" onClick={onDelete}>Excluir</button>}
          <span />
          <button type="button" className="ghost-button" onClick={onClose}>Cancelar</button>
          <button className="lime-button" type="submit" disabled={saving}>{saving ? "Salvando…" : "Salvar cadastro"}</button>
        </div>
      </form>
    </div>
  );
}
