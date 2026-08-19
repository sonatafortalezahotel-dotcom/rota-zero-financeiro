"use client";

type Props = {
  level: number;
  levelName: string;
  setTab: (tab: string) => void;
};

export function GuideScreen({ level, levelName, setTab }: Props) {
  return (
    <section className="screen guide-screen">
      <div className="screen-title">
        <div><span>EDUCAÇÃO FINANCEIRA PRÁTICA</span><h1>Seu método do zero</h1><p>Sem planilha complicada e sem julgamento. Siga a ordem.</p></div>
      </div>
      <div className="guide-hero">
        <div>
          <span>COMECE AQUI</span>
          <h2>Organização financeira não começa cortando tudo.</h2>
          <p>Começa sabendo o que existe, o que vence e quanto realmente sobra. O Rota Zero separa previsão de realidade para você não gastar um saldo que já tem destino.</p>
        </div>
        <div className="guide-badge">
          <span>{level}</span>
          <strong>Seu nível</strong>
          <small>{levelName}</small>
        </div>
      </div>
      <div className="lesson-grid">
        <article>
          <span>01</span><i>▤</i>
          <h3>Mapeie tudo</h3>
          <p>Cadastre toda receita e despesa, mesmo as pequenas. Valor desconhecido não é zero: é pendência.</p>
          <button onClick={() => setTab("records")}>Abrir lançamentos →</button>
        </article>
        <article>
          <span>02</span><i>✓</i>
          <h3>Confirme o realizado</h3>
          <p>&ldquo;Previsto&rdquo; é o que deve acontecer. &ldquo;Pago&rdquo; e &ldquo;recebido&rdquo; só entram quando o dinheiro se movimentar.</p>
          <button onClick={() => setTab("records")}>Abrir meu mês →</button>
        </article>
        <article>
          <span>03</span><i>◆</i>
          <h3>Proteja a sobra</h3>
          <p>Separe primeiro a reserva e as metas. Se esperar sobrar no fim, normalmente não sobra.</p>
          <button onClick={() => setTab("goals")}>Definir metas →</button>
        </article>
        <article>
          <span>04</span><i>◎</i>
          <h3>Ataque as dívidas</h3>
          <p>Primeiro regularize atrasos. Depois quite a menor dívida para liberar caixa e ganhar velocidade.</p>
          <button onClick={() => setTab("debts")}>Ver estratégia →</button>
        </article>
      </div>
      <div className="rules-panel">
        <div><span>LEMBRETE</span><h3>As quatro perguntas do fechamento mensal</h3></div>
        <ol>
          <li><span>1</span>Quanto entrou de verdade?</li>
          <li><span>2</span>Quanto saiu de verdade?</li>
          <li><span>3</span>O que ainda está pendente?</li>
          <li><span>4</span>Qual destino darei à sobra?</li>
        </ol>
      </div>
    </section>
  );
}
