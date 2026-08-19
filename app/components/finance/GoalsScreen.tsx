"use client";

import type { Goal } from "@/lib/finance/types";
import { money } from "@/lib/finance/utils";

type Props = {
  goals: Goal[];
  goalDraft: Record<string, string>;
  setGoalDraft: (draft: Record<string, string>) => void;
  advanceGoal: (goal: Goal) => void;
  onNew: () => void;
  onEdit: (goal: Goal) => void;
  onDelete: (goal: Goal) => void;
};

export function GoalsScreen({ goals, goalDraft, setGoalDraft, advanceGoal, onNew, onEdit, onDelete }: Props) {
  return (
    <section className="screen">
      <div className="screen-title">
        <div><span>OBJETIVOS COM PRAZO</span><h1>Metas financeiras</h1><p>Metas pequenas e visíveis transformam intenção em comportamento.</p></div>
        <button className="lime-button" onClick={onNew}>＋ Nova meta</button>
      </div>

      <div className="goals-intro">
        <div>
          <span>REGRA ROTA ZERO</span>
          <h2>Dinheiro sem destino desaparece.</h2>
          <p>Dê uma função à sobra antes que ela vire gasto: reserva, atraso ou amortização.</p>
        </div>
        <div className="goals-score">
          <span>METAS ATIVAS</span>
          <strong>{goals.length}</strong>
          <small>{goals.filter((g) => g.current >= g.target).length} concluídas</small>
        </div>
      </div>

      <div className="goals-grid">
        {goals.map((goal) => {
          const progress = goal.target ? Math.min(100, (goal.current / goal.target) * 100) : 0;
          return (
            <article className="goal-card" key={goal.id} style={{ "--accent": goal.color } as React.CSSProperties}>
              <div className="goal-head">
                <span>{goal.kind === "debt" ? "REDUZIR DÍVIDA" : "CONSTRUIR RESERVA"}</span>
                <button onClick={() => onEdit(goal)}>•••</button>
              </div>
              <h3>{goal.title}</h3>
              <div className="goal-values">
                <strong>{money(goal.current)}</strong>
                <span>de {money(goal.target)}</span>
              </div>
              <div className="goal-bar"><i style={{ width: `${progress}%` }} /></div>
              <div className="goal-meta">
                <span>{progress.toFixed(0)}% concluído</span>
                <span>{goal.dueDate ? `até ${new Intl.DateTimeFormat("pt-BR").format(new Date(`${goal.dueDate}T12:00:00`))}` : "sem prazo"}</span>
              </div>
              <label className="goal-add">
                <span>Adicionar progresso</span>
                <div>
                  <b>R$</b>
                  <input
                    value={goalDraft[goal.id] ?? ""}
                    inputMode="decimal"
                    placeholder="0,00"
                    onChange={(e) => setGoalDraft({ ...goalDraft, [goal.id]: e.target.value })}
                  />
                  <button onClick={() => advanceGoal(goal)}>Adicionar</button>
                </div>
              </label>
              <div className="goal-actions">
                <button onClick={() => onEdit(goal)}>Editar meta</button>
                <button onClick={() => onDelete(goal)}>Excluir</button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
