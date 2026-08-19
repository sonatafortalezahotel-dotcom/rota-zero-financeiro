"use client";

import type { Movement } from "@/lib/finance/types";
import { money } from "@/lib/finance/utils";

type Props = {
  movement: Movement;
  setMovement: (m: Movement | null) => void;
  saving: boolean;
  accounts: string[];
  onClose: () => void;
  onConfirm: (event: React.FormEvent) => void;
};

export function MovementModal({ movement, setMovement, saving, accounts, onClose, onConfirm }: Props) {
  const transfer = movement.flow === "transfer";
  const accountLabel = movement.flow === "income" ? "Entrou em qual conta?" : "Saiu de qual conta?";
  const actionLabel = movement.flow === "income" ? "Confirmar recebimento" : transfer ? "Confirmar transferência" : "Confirmar pagamento";

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.currentTarget === e.target) onClose(); }}>
      <form className="modal movement-modal" onSubmit={onConfirm}>
        <div className="modal-head">
          <div>
            <span>CONFIRMAR MOVIMENTAÇÃO</span>
            <h2>{movement.flow === "income" ? "Onde o dinheiro entrou?" : transfer ? "Entre quais contas?" : "De onde o dinheiro saiu?"}</h2>
          </div>
          <button type="button" onClick={onClose}>×</button>
        </div>
        <div className="movement-summary">
          <span>{movement.title}</span>
          <strong>{money(movement.amount)}</strong>
          <small>{movement.note}</small>
        </div>
        <div className="form-grid">
          <label>
            <span>Data da movimentação</span>
            <input required type="date" value={movement.date} onChange={(e) => setMovement({ ...movement, date: e.target.value })} />
          </label>
          <label>
            <span>{accountLabel}</span>
            <select required value={movement.account} onChange={(e) => setMovement({ ...movement, account: e.target.value })}>
              {accounts.map((a) => <option key={a}>{a}</option>)}
            </select>
          </label>
          {transfer && (
            <label className="wide">
              <span>Entrou em qual conta?</span>
              <select required value={movement.destinationAccount} onChange={(e) => setMovement({ ...movement, destinationAccount: e.target.value })}>
                <option value="">Selecione a conta de destino</option>
                {accounts.filter((a) => a !== movement.account).map((a) => <option key={a}>{a}</option>)}
              </select>
            </label>
          )}
          <div className="movement-rule wide">
            <i>↕</i>
            <span><strong>Isso alimenta o extrato automaticamente.</strong><small>O saldo da conta e o gasto x sobra passam a usar esta movimentação.</small></span>
          </div>
        </div>
        <div className="modal-foot">
          <span /><span />
          <button type="button" className="ghost-button" onClick={onClose}>Cancelar</button>
          <button className="lime-button" type="submit" disabled={saving || (transfer && !movement.destinationAccount)}>
            {saving ? "Registrando…" : actionLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
