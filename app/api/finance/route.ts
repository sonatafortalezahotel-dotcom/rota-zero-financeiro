export const dynamic = "force-dynamic";

import { sql } from "@/db/client";

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
type Payload = { entity?: string; id?: string; data?: Record<string, JsonValue> };

const now = () => new Date().toISOString();
const genId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;
const asText = (v: JsonValue | undefined, fb = "") => (typeof v === "string" ? v.trim() : fb);
const asNumber = (v: JsonValue | undefined, fb = 0) => (typeof v === "number" && Number.isFinite(v) ? v : fb);
const asBoolean = (v: JsonValue | undefined) => v === true;
const asJsonArr = (v: JsonValue | undefined) => JSON.stringify(Array.isArray(v) ? v : []);
const asJsonObj = (v: JsonValue | undefined) =>
  JSON.stringify(v && typeof v === "object" && !Array.isArray(v) ? v : {});

// ─── Seeds ───────────────────────────────────────────────────────────────────

const incomeSeeds = [
  ["obracon", "Obracon", 15000], ["rinomaq", "Rinomaq", 750], ["zulmak", "Zulmak", 750],
  ["locablu", "Locablu", 750], ["mm-locacoes", "MM Locações", 1050], ["casmaq", "Casmaq", 500],
  ["lokaja", "Lokaja", 750], ["sp-log", "SP Log", 400], ["mariloc", "Mariloc", 250],
  ["conceito", "Conceito Locadora", 250], ["locus", "Locus Locadora", 550], ["inova", "Inova Loc", 250],
  ["maqpecas-construcao", "Maqpeças Construção", 500], ["maqpecas-agro", "Maq Peças Agro", 500],
] as const;

const expenseSeeds = [
  ["internet", "Internet", "Moradia", 198.11, 20, "Fatura mensal"],
  ["tim", "TIM Black", "Comunicação", 110, null, "Valor aproximado"],
  ["gustavo", "Gustavo · Designer", "Negócio", 4000, null, "Custo mensal de design"],
  ["escola-joao", "Escola João", "Família", 900, null, "Mensalidade escolar"],
  ["reforco-joao", "Reforço João", "Família", 400, null, "Reforço escolar"],
  ["contadora", "Contadora", "Negócio", 270, null, "Serviço contábil"],
  ["luz", "Luz", "Moradia", 370, null, "Média mensal"],
  ["agua", "Água", "Moradia", 120, null, "Média mensal"],
  ["hostinger", "Hostinger VPS", "Ferramentas", 0, null, "Preencher valor do plano"],
  ["drive", "Google Drive 5 TB", "Ferramentas", 0, null, "Preencher valor da assinatura"],
  ["chatgpt", "ChatGPT Plus", "Ferramentas", 0, null, "Preencher valor da assinatura"],
  ["cursor", "Cursor Pro", "Ferramentas", 0, null, "Preencher valor da assinatura"],
  ["canva", "Canva Pro+", "Ferramentas", 0, null, "Preencher valor da assinatura"],
  ["youtube", "YouTube Premium", "Pessoal", 0, null, "Preencher valor da assinatura"],
  ["nota-fiscal", "Nota fiscal · 3%", "Impostos", 0, null, "Calculado automaticamente sobre receita prevista"],
  ["gasolina", "Gasolina", "Transporte", 1082.5, null, "R$ 250 × 4,33 semanas"],
  ["pessoal", "Gastos pessoais", "Pessoal", 900, null, "R$ 30 × 30 dias"],
  ["fim-semana", "Finais de semana", "Lazer", 1299, null, "R$ 300 × 4,33 semanas"],
] as const;

const debtSeeds = [
  ["santander-acordo", "Santander", "Acordo 261396265", 1825.56, 1217.04, 152.13, 10, 12, 4, 304.26, 2, "#9b7cff", 0, ""],
  ["bradesco", "Bradesco", "Acordo em 24 parcelas", 5746.56, 5507.12, 239.44, 14, 24, 1, 239.44, 1, "#ff6b6b", 0, ""],
  ["carro-c6", "Carro · C6", "Jeep Renegade · entrada paga", 97060.45, 95901.12, 2663.92, 18, 36, 0, 0, 0, "#b8f23d", 0, "1ª parcela em 18/09/2026"],
  ["sem-parar", "Sem Parar", "Parcela 1 de 6 em andamento", 1880.25, 1880.25, 310.45, 20, 6, 0, 0, 0, "#ffbd59", 0, ""],
  ["neon", "Neon", "Parcela 3 de 24 vencida", 5808.3, 5546.2, 252.1, 24, 24, 2, 252.1, 1, "#4ed9c5", 0, ""],
  ["moto-santander", "Moto · Santander", "Yamaha MT-03 · entrada pendente", 33841.03, 33841.03, 908.66, 30, 36, 0, 0, 0, "#43b5ff", 1129.27, "1ª parcela em 30/09/2026"],
] as const;

type StatementSeed = readonly [string, string, string, number, "income" | "expense" | "transfer", "in" | "out", string, "confirmed" | "pending", string?, string?];

const augustStatement: StatementSeed[] = [
  ["aug-03-encargos", "2026-08-03", "Encargos do limite", 62.10, "expense", "out", "Bancos", "confirmed"],
  ["aug-03-open-dreams", "2026-08-03", "Transferência Bradesco → Cora", 110, "transfer", "out", "Transferência", "confirmed", "R$ 110 enviados do Bradesco para a Cora em 03/08", "Bradesco"],
  ["aug-03-leticia", "2026-08-03", "Letícia Ferreira", 15.20, "expense", "out", "Trabalho", "confirmed"],
  ["aug-03-rei-1", "2026-08-03", "Rei das Bebidas", 22.80, "expense", "out", "Alimentação", "confirmed"],
  ["aug-03-posto", "2026-08-03", "Posto Monte Carlo", 112.74, "expense", "out", "Combustível", "confirmed"],
  ["aug-03-mario", "2026-08-03", "Mario Cesar Gilioli", 28.99, "expense", "out", "Trabalho", "confirmed"],
  ["aug-03-ligia", "2026-08-03", "Ligia Maria Lopes", 100.88, "expense", "out", "Trabalho", "confirmed"],
  ["aug-03-rei-2", "2026-08-03", "Rei das Bebidas", 11.40, "expense", "out", "Alimentação", "confirmed"],
  ["aug-04-iof", "2026-08-04", "IOF sobre limite", 13.97, "expense", "out", "Bancos", "confirmed"],
  ["aug-04-luz", "2026-08-04", "Companhia Paulista de Força e Luz", 383.99, "expense", "out", "Moradia", "confirmed"],
  ["aug-04-mario", "2026-08-04", "Mario Cesar Gilioli", 7.39, "expense", "out", "Trabalho", "confirmed"],
  ["aug-04-uber", "2026-08-04", "Uber", 16.83, "expense", "out", "Transporte", "confirmed"],
  ["aug-04-posto", "2026-08-04", "Auto Posto Express", 100, "expense", "out", "Combustível", "confirmed"],
  ["aug-04-play", "2026-08-04", "Play Serviços", 19, "expense", "out", "Trabalho", "confirmed"],
  ["aug-05-johnny", "2026-08-05", "Johnny Anderson", 72, "expense", "out", "Trabalho", "confirmed"],
  ["aug-05-mario", "2026-08-05", "Mario Cesar Gilioli", 28.47, "expense", "out", "Trabalho", "confirmed"],
  ["aug-05-rei", "2026-08-05", "Rei das Bebidas", 33.70, "expense", "out", "Alimentação", "confirmed"],
  ["aug-06-larissa-in", "2026-08-06", "Larissa Pereira Lopes Olimpio", 2000, "transfer", "in", "Transferência", "pending", "Provável transferência entre contas; confirmar origem"],
  ["aug-07-conceito", "2026-08-07", "Conceito Estrutura Locadora", 1200, "income", "in", "Clientes", "confirmed"],
  ["aug-07-capital-giro", "2026-08-07", "Capital de giro · parcela 10/42", 335.62, "expense", "out", "Dívidas", "confirmed"],
  ["aug-07-gustavo", "2026-08-07", "Gustavo Henrique · Designer", 2000, "expense", "out", "Trabalho", "confirmed"],
  ["aug-07-leticia", "2026-08-07", "Letícia Ferreira", 67.70, "expense", "out", "Trabalho", "confirmed"],
  ["aug-07-mario", "2026-08-07", "Mario Cesar Gilioli", 6.07, "expense", "out", "Trabalho", "confirmed"],
  ["aug-07-play", "2026-08-07", "Play Serviços", 19, "expense", "out", "Trabalho", "confirmed"],
  ["aug-07-posto", "2026-08-07", "Posto Monte Carlo", 165.39, "expense", "out", "Combustível", "confirmed"],
  ["aug-07-marciel", "2026-08-07", "Marciel Aparecido", 141.22, "expense", "out", "Trabalho", "confirmed"],
  ["aug-10-sp-log", "2026-08-10", "SP Log Equipamentos", 400, "income", "in", "Clientes", "confirmed"],
  ["aug-10-tarifa", "2026-08-10", "Tarifa bancária RecebaFácil", 73.80, "expense", "out", "Bancos", "confirmed"],
  ["aug-10-anuidade", "2026-08-10", "Anuidade de cartão", 22, "expense", "out", "Bancos", "confirmed"],
  ["aug-10-mercado", "2026-08-10", "Mercado Campina Verde", 1.56, "expense", "out", "Alimentação", "confirmed"],
  ["aug-10-mobifacil", "2026-08-10", "Mobifácil Serviços", 249.99, "expense", "out", "Trabalho", "confirmed"],
  ["aug-10-marciel", "2026-08-10", "Marciel Aparecido", 142.85, "expense", "out", "Trabalho", "confirmed"],
  ["aug-11-drogaria-1", "2026-08-11", "Cardoso e Cardoso Drogaria", 66, "expense", "out", "Saúde", "confirmed"],
  ["aug-11-drogaria-2", "2026-08-11", "Cardoso e Cardoso Drogaria", 29.90, "expense", "out", "Saúde", "confirmed"],
  ["aug-11-mario", "2026-08-11", "Mario Cesar Gilioli", 21.90, "expense", "out", "Trabalho", "confirmed"],
  ["aug-11-ifood", "2026-08-11", "iFood", 116.18, "expense", "out", "Alimentação", "confirmed"],
  ["aug-12-claro", "2026-08-12", "Claro · Internet", 198.28, "expense", "out", "Comunicação", "confirmed"],
  ["aug-12-mobifacil", "2026-08-12", "Mobifácil Serviços", 359.69, "expense", "out", "Trabalho", "confirmed"],
  ["aug-14-obracon", "2026-08-14", "Obracon Engenharia", 20000, "income", "in", "Clientes", "confirmed"],
  ["aug-14-mustache", "2026-08-14", "Mustache Ltda", 5000, "expense", "out", "Trabalho", "confirmed"],
  ["aug-14-realize", "2026-08-14", "Realize Crédito", 3300.77, "expense", "out", "Dívidas", "confirmed"],
  ["aug-14-midway", "2026-08-14", "Midway", 150.68, "expense", "out", "Dívidas", "confirmed"],
  ["aug-14-posto-1", "2026-08-14", "Posto Monte Carlo", 82.05, "expense", "out", "Combustível", "confirmed"],
  ["aug-14-posto-2", "2026-08-14", "Posto Monte Carlo", 120.55, "expense", "out", "Combustível", "confirmed"],
  ["aug-14-estoril", "2026-08-14", "Auto Posto Estoril", 132.11, "expense", "out", "Combustível", "confirmed"],
  ["aug-17-casmanq", "2026-08-17", "Casmaq Equipamentos", 500, "income", "in", "Clientes", "confirmed"],
  ["aug-17-matos", "2026-08-17", "Matos & Melo Ltda", 1050, "income", "in", "Clientes", "confirmed"],
  ["aug-17-lokaja", "2026-08-17", "Lokaja Locação", 750, "income", "in", "Clientes", "confirmed"],
  ["aug-17-sofia", "2026-08-17", "Sofia Olimpio Berbel", 500, "expense", "out", "Trabalho", "confirmed"],
  ["aug-17-larissa", "2026-08-17", "Larissa Pereira Lopes", 50, "expense", "out", "Trabalho", "confirmed"],
  ["aug-17-moda", "2026-08-17", "Franca Estação da Moda", 142.49, "expense", "out", "Pessoal", "confirmed"],
  ["aug-17-diones", "2026-08-17", "Diones Araujo", 168, "expense", "out", "Trabalho", "confirmed"],
  ["aug-17-mario", "2026-08-17", "Mario Cesar Gilioli", 6.07, "expense", "out", "Trabalho", "confirmed"],
  ["aug-17-otica", "2026-08-17", "K & K Óticas", 70, "expense", "out", "Saúde", "confirmed"],
  ["aug-17-vera", "2026-08-17", "Vera Lucia Mendes", 325, "expense", "out", "Trabalho", "confirmed"],
  ["aug-17-car10", "2026-08-17", "Car10", 7, "expense", "out", "Transporte", "confirmed"],
  ["aug-17-mineiros", "2026-08-17", "Mineiros Sucos e Lanches", 133, "expense", "out", "Alimentação", "confirmed"],
  ["aug-17-noemia-1", "2026-08-17", "Supermercado Noemia", 23.92, "expense", "out", "Alimentação", "confirmed"],
  ["aug-17-noemia-2", "2026-08-17", "Supermercado Noemia", 320.77, "expense", "out", "Alimentação", "confirmed"],
  ["aug-17-galo-branco", "2026-08-17", "Posto Galo Branco", 87.52, "expense", "out", "Combustível", "confirmed"],
  ["aug-17-conveniencia", "2026-08-17", "Loja de Conveniência", 51.50, "expense", "out", "Alimentação", "confirmed"],
  ["aug-17-farma", "2026-08-17", "Farma Conde", 154.71, "expense", "out", "Saúde", "confirmed"],
  ["aug-17-claudemir", "2026-08-17", "Claudemir Aparecido", 45.51, "expense", "out", "Trabalho", "confirmed"],
  ["aug-18-mario", "2026-08-18", "Mario Cesar Gilioli", 30.14, "expense", "out", "Trabalho", "confirmed"],
  ["aug-18-gustavo", "2026-08-18", "Gustavo Henrique · Designer", 2000, "expense", "out", "Trabalho", "confirmed"],
  ["aug-18-contador", "2026-08-18", "Escritório Contábil", 255.24, "expense", "out", "Trabalho", "confirmed"],
  ["aug-18-neon-quitada", "2026-08-18", "PagueVeloz · dívida Neon quitada", 644.33, "expense", "out", "Dívidas", "confirmed"],
  ["aug-18-neon", "2026-08-18", "Neon · parcela", 252.10, "expense", "out", "Dívidas", "confirmed"],
  ["aug-18-santander", "2026-08-18", "Santander · parcela", 152.13, "expense", "out", "Dívidas", "confirmed"],
  ["aug-18-nu", "2026-08-18", "Nubank · parcelas em atraso", 797.49, "expense", "out", "Dívidas", "confirmed", "R$ 797,49 de parcelas atrasadas pagos em agosto"],
  ["aug-18-sem-parar", "2026-08-18", "Sem Parar · parcela", 310.45, "expense", "out", "Dívidas", "confirmed"],
  ["aug-18-bradesco", "2026-08-18", "Bradesco · parcela", 239.62, "expense", "out", "Dívidas", "confirmed"],
  ["aug-18-demerge", "2026-08-18", "Demerge Brasil", 139.99, "expense", "out", "Trabalho", "confirmed"],
  ["aug-18-nucleo", "2026-08-18", "Núcleo de Informação", 40, "expense", "out", "Trabalho", "confirmed"],
  ["aug-18-carro", "2026-08-18", "Renegociação do carro", 1159.33, "expense", "out", "Dívidas", "confirmed", "Entrada/pagamento da renegociação"],
  ["aug-18-metas", "2026-08-18", "Santander · caixinhas", 1700, "transfer", "out", "Metas", "confirmed", "R$ 500 viagem + R$ 500 reserva + R$ 500 carro + R$ 200 casa"],
  ["aug-18-pessoal", "2026-08-18", "Conta para gastos pessoais", 800, "transfer", "out", "Orçamento pessoal", "confirmed", "Orçamento disponível; ainda não é gasto"],
  ["card-opening-aug", "2026-08-01", "Saldo anterior do cartão pré-pago", 48.81, "transfer", "in", "Transferência", "confirmed", "Saldo que já existia antes das cargas de agosto", "Cora · Cartão pré-pago"],
  ["card-cursor-1", "2026-08-18", "Cursor · cobrança 1", 116.75, "expense", "out", "Ferramentas", "confirmed", "Pago no cartão pré-pago Cora", "Cora · Cartão pré-pago"],
  ["card-cursor-2", "2026-08-18", "Cursor · cobrança 2", 114.06, "expense", "out", "Ferramentas", "confirmed", "Pago no cartão pré-pago Cora", "Cora · Cartão pré-pago"],
  ["card-railway", "2026-08-18", "Railway", 53.98, "expense", "out", "Ferramentas", "confirmed", "Pago no cartão pré-pago Cora", "Cora · Cartão pré-pago"],
  ["card-canva", "2026-08-18", "Canva", 34.90, "expense", "out", "Ferramentas", "confirmed", "Pago no cartão pré-pago Cora", "Cora · Cartão pré-pago"],
  ["cora-03-rafael", "2026-08-03", "Recebimento Bradesco → Cora", 110, "transfer", "in", "Transferência", "confirmed", "Contrapartida de R$ 110 recebida na Cora em 03/08", "Open Dreams · Cora"],
  ["cora-03-cartao", "2026-08-03", "Carga Cora → cartão pré-pago", 110, "transfer", "out", "Reserva do cartão", "confirmed", "R$ 110 carregados no cartão pré-pago em 03/08", "Open Dreams · Cora"],
  ["cora-08-tarifa", "2026-08-08", "Cora SCFI", 0.49, "expense", "out", "Bancos", "confirmed", "", "Open Dreams · Cora"],
  ["cora-10-mario", "2026-08-10", "Mario Cesar Gilioli", 5.99, "expense", "out", "Trabalho", "confirmed", "", "Open Dreams · Cora"],
  ["cora-11-maq-construcao", "2026-08-11", "Maqpeças Construção", 500, "income", "in", "Clientes", "confirmed", "Metade da entrada agrupada de R$ 1.000", "Open Dreams · Cora"],
  ["cora-11-maq-agro", "2026-08-11", "Maq Peças Agro", 500, "income", "in", "Clientes", "confirmed", "Metade da entrada agrupada de R$ 1.000", "Open Dreams · Cora"],
  ["cora-12-fm", "2026-08-12", "FM Agenciamento Publicitário", 19.80, "expense", "out", "Trabalho", "confirmed", "", "Open Dreams · Cora"],
  ["cora-12-uber", "2026-08-12", "Uber", 20.08, "expense", "out", "Transporte", "confirmed", "", "Open Dreams · Cora"],
  ["cora-13-leblon", "2026-08-13", "Leblon Pastelaria", 6, "expense", "out", "Alimentação", "confirmed", "", "Open Dreams · Cora"],
  ["cora-13-tarifa", "2026-08-13", "Cora SCFI", 0.49, "expense", "out", "Bancos", "confirmed", "", "Open Dreams · Cora"],
  ["cora-13-carlos", "2026-08-13", "Carlos Cesar Fraga Matos Junior", 1, "expense", "out", "Trabalho", "confirmed", "", "Open Dreams · Cora"],
  ["cora-13-manoel", "2026-08-13", "Manoel de Sousa Oliveira", 138, "expense", "out", "Trabalho", "confirmed", "", "Open Dreams · Cora"],
  ["cora-13-cartao", "2026-08-13", "Carga Cora → cartão pré-pago", 200, "transfer", "out", "Reserva do cartão", "confirmed", "R$ 200 carregados no cartão pré-pago em 13/08", "Open Dreams · Cora"],
  ["cora-13-cafe", "2026-08-13", "Encantos Cafeteria", 30.50, "expense", "out", "Alimentação", "confirmed", "", "Open Dreams · Cora"],
  ["cora-13-uber", "2026-08-13", "Uber", 118.98, "expense", "out", "Transporte", "confirmed", "", "Open Dreams · Cora"],
  ["cora-13-mobifacil", "2026-08-13", "Mobifácil Serviços", 257.49, "expense", "out", "Trabalho", "confirmed", "", "Open Dreams · Cora"],
  ["cora-13-magnata", "2026-08-13", "Lanchonete Nova Magnata", 52, "expense", "out", "Alimentação", "confirmed", "", "Open Dreams · Cora"],
  ["cora-13-osbrito", "2026-08-13", "Osbrito Burguer", 28, "expense", "out", "Alimentação", "confirmed", "", "Open Dreams · Cora"],
  ["cora-13-kero", "2026-08-13", "Kero Mais", 17, "expense", "out", "Alimentação", "confirmed", "", "Open Dreams · Cora"],
  ["cora-14-uber", "2026-08-14", "Uber", 28.37, "expense", "out", "Transporte", "confirmed", "", "Open Dreams · Cora"],
  ["cora-17-cora", "2026-08-17", "Cora Tecnologia", 44.90, "expense", "out", "Bancos", "confirmed", "", "Open Dreams · Cora"],
  ["cora-17-zulmak", "2026-08-17", "Zulmak", 750, "income", "in", "Clientes", "confirmed", "No extrato consta como Zaluk", "Open Dreams · Cora"],
  ["cora-18-tarifa-1", "2026-08-18", "Cora SCFI", 0.49, "expense", "out", "Bancos", "confirmed", "", "Open Dreams · Cora"],
  ["cora-18-tarifa-2", "2026-08-18", "Cora SCFI", 0.49, "expense", "out", "Bancos", "confirmed", "", "Open Dreams · Cora"],
  ["cora-18-tarifa-3", "2026-08-18", "Cora SCFI", 0.49, "expense", "out", "Bancos", "confirmed", "", "Open Dreams · Cora"],
  ["cora-18-tarifa-4", "2026-08-18", "Cora SCFI", 0.49, "expense", "out", "Bancos", "confirmed", "", "Open Dreams · Cora"],
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getState(key: string): Promise<string | null> {
  const rows = await sql`SELECT value FROM app_state WHERE key = ${key}`;
  return (rows[0] as { value: string } | undefined)?.value ?? null;
}

async function setState(key: string, value: string, ts: string) {
  await sql`
    INSERT INTO app_state (key, value, updated_at) VALUES (${key}, ${value}, ${ts})
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at
  `;
}

// ─── Schema + Seeds ───────────────────────────────────────────────────────────

async function ensureDatabase() {
  await sql`
    CREATE TABLE IF NOT EXISTS records (
      id TEXT PRIMARY KEY, type TEXT NOT NULL, title TEXT NOT NULL, category TEXT NOT NULL,
      amount REAL NOT NULL DEFAULT 0, due_day INTEGER, month_key TEXT, recurring BOOLEAN NOT NULL DEFAULT false,
      status_months TEXT NOT NULL DEFAULT '[]', month_adjustments TEXT NOT NULL DEFAULT '[]',
      notes TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS records_type_month_idx ON records(type, month_key)`;
  await sql`
    CREATE TABLE IF NOT EXISTS debts (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, detail TEXT NOT NULL DEFAULT '',
      original REAL NOT NULL, balance REAL NOT NULL, installment REAL NOT NULL,
      due_day INTEGER NOT NULL, total_installments INTEGER NOT NULL,
      paid_installments INTEGER NOT NULL DEFAULT 0, late_amount REAL NOT NULL DEFAULT 0,
      late_count INTEGER NOT NULL DEFAULT 0, color TEXT NOT NULL DEFAULT '#b8f23d',
      entry_pending REAL NOT NULL DEFAULT 0, starts TEXT NOT NULL DEFAULT '',
      payment_history TEXT NOT NULL DEFAULT '[]', created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY, title TEXT NOT NULL, target REAL NOT NULL,
      current REAL NOT NULL DEFAULT 0, due_date TEXT NOT NULL DEFAULT '',
      kind TEXT NOT NULL DEFAULT 'save', color TEXT NOT NULL DEFAULT '#b8f23d',
      monthly_plans TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS bank_entries (
      id TEXT PRIMARY KEY, entry_date TEXT NOT NULL, month_key TEXT NOT NULL,
      account TEXT NOT NULL DEFAULT 'Bradesco', destination_account TEXT NOT NULL DEFAULT '',
      context TEXT NOT NULL DEFAULT 'review', description TEXT NOT NULL,
      counterparty TEXT NOT NULL DEFAULT '', amount REAL NOT NULL,
      flow TEXT NOT NULL, direction TEXT NOT NULL, category TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'confirmed', notes TEXT NOT NULL DEFAULT '',
      document TEXT NOT NULL DEFAULT '', source TEXT NOT NULL DEFAULT 'manual',
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS bank_entries_month_flow_idx ON bank_entries(month_key, flow)`;
  await sql`
    CREATE TABLE IF NOT EXISTS app_state (
      key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL
    )
  `;

  // Seed inicial
  const [{ total }] = await sql`SELECT COUNT(*) AS total FROM records` as { total: string }[];
  if (Number(total) === 0) {
    const ts = now();
    for (const [seedId, title, amount] of incomeSeeds) {
      await sql`
        INSERT INTO records (id,type,title,category,amount,due_day,month_key,recurring,status_months,month_adjustments,notes,created_at,updated_at)
        VALUES (${seedId},'income',${title},'Clientes',${amount},NULL,NULL,true,'[]','[]','Receita recorrente',${ts},${ts})
        ON CONFLICT (id) DO NOTHING
      `;
    }
    for (const [seedId, title, category, amount, dueDay, notes] of expenseSeeds) {
      await sql`
        INSERT INTO records (id,type,title,category,amount,due_day,month_key,recurring,status_months,month_adjustments,notes,created_at,updated_at)
        VALUES (${seedId},'expense',${title},${category},${amount},${dueDay ?? null},NULL,true,'[]','[]',${notes},${ts},${ts})
        ON CONFLICT (id) DO NOTHING
      `;
    }
    await sql`
      INSERT INTO records (id,type,title,category,amount,due_day,month_key,recurring,status_months,month_adjustments,notes,created_at,updated_at)
      VALUES ('mustache-2026-09','expense','Mustache','Negócio',5000,NULL,'2026-09',false,'[]','[]','Pagamento excepcional',${ts},${ts})
      ON CONFLICT (id) DO NOTHING
    `;
    for (const [dId, name, detail, original, balance, installment, dueDay, totalInst, paidInst, lateAmt, lateCnt, color, entryPending, starts] of debtSeeds) {
      await sql`
        INSERT INTO debts (id,name,detail,original,balance,installment,due_day,total_installments,paid_installments,late_amount,late_count,color,entry_pending,starts,payment_history,created_at,updated_at)
        VALUES (${dId},${name},${detail},${original},${balance},${installment},${dueDay},${totalInst},${paidInst},${lateAmt},${lateCnt},${color},${entryPending},${starts},'[]',${ts},${ts})
        ON CONFLICT (id) DO NOTHING
      `;
    }
    await sql`
      INSERT INTO goals (id,title,target,current,due_date,kind,color,monthly_plans,created_at,updated_at)
      VALUES ('reserva','Reserva de segurança',15000,1700,'2027-02-28','save','#b8f23d','{}',${ts},${ts})
      ON CONFLICT (id) DO NOTHING
    `;
    await sql`
      INSERT INTO goals (id,title,target,current,due_date,kind,color,monthly_plans,created_at,updated_at)
      VALUES ('atrasos','Zerar parcelas atrasadas',795.8,0,'2026-08-31','debt','#ff6b6b','{}',${ts},${ts})
      ON CONFLICT (id) DO NOTHING
    `;
    await sql`
      INSERT INTO goals (id,title,target,current,due_date,kind,color,monthly_plans,created_at,updated_at)
      VALUES ('primeiros-5k','Primeiros R$ 5 mil eliminados',5000,2269.39,'2026-12-31','debt','#43b5ff','{}',${ts},${ts})
      ON CONFLICT (id) DO NOTHING
    `;
  }

  await ensureMigrations();
}

async function ensureMigrations() {
  const ts = now();

  // August statement
  for (const [entryId, date, description, amount, flow, direction, category, status, notes = "", account = "Bradesco"] of augustStatement) {
    await sql`
      INSERT INTO bank_entries (id,entry_date,month_key,account,destination_account,context,description,counterparty,amount,flow,direction,category,status,notes,document,source,created_at,updated_at)
      VALUES (${entryId},${date},'2026-08',${account},'','review',${description},${description},${amount},${flow},${direction},${category},${status},${notes},'','extrato-agosto-2026',${ts},${ts})
      ON CONFLICT (id) DO NOTHING
    `;
  }

  if (!(await getState("august-reconciliation-v1"))) {
    const hist = (eid: string, amt: number, label: string) =>
      JSON.stringify([{ id: eid, month: "2026-08", amount: amt, label, date: "2026-08-18T12:00:00.000Z" }]);
    await sql`UPDATE records SET month_key='2026-08',status_months='["2026-08"]',updated_at=${ts} WHERE id='mustache-2026-09'`;
    for (const rid of ["obracon","conceito","sp-log","casmaq","mm-locacoes","lokaja","gustavo","internet","contadora","luz"]) {
      await sql`UPDATE records SET status_months='["2026-08"]',updated_at=${ts} WHERE id=${rid}`;
    }
    await sql`UPDATE debts SET balance=1064.91,paid_installments=5,late_amount=152.13,late_count=1,payment_history=${hist("aug-18-santander",152.13,"Parcela")},updated_at=${ts} WHERE id='santander-acordo'`;
    await sql`UPDATE debts SET balance=5267.50,paid_installments=2,late_amount=0,late_count=0,payment_history=${hist("aug-18-bradesco",239.62,"Parcela")},updated_at=${ts} WHERE id='bradesco'`;
    await sql`UPDATE debts SET balance=5294.10,paid_installments=3,late_amount=0,late_count=0,payment_history=${hist("aug-18-neon",252.10,"Parcela")},updated_at=${ts} WHERE id='neon'`;
    await sql`UPDATE debts SET balance=1569.80,paid_installments=1,payment_history=${hist("aug-18-sem-parar",310.45,"Parcela")},updated_at=${ts} WHERE id='sem-parar'`;
    await sql`UPDATE debts SET payment_history=${hist("aug-18-carro",1159.33,"Entrada da renegociação")},updated_at=${ts} WHERE id='carro-c6'`;
    await sql`INSERT INTO goals (id,title,target,current,due_date,kind,color,monthly_plans,created_at,updated_at) VALUES ('reserva','Reserva de emergência',50000,500,'','save','#b8f23d','{}',${ts},${ts}) ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title,target=EXCLUDED.target,current=EXCLUDED.current,updated_at=EXCLUDED.updated_at`;
    await sql`INSERT INTO goals (id,title,target,current,due_date,kind,color,monthly_plans,created_at,updated_at) VALUES ('viagem','Viagem',10000,500,'','save','#43b5ff','{}',${ts},${ts}) ON CONFLICT (id) DO UPDATE SET target=EXCLUDED.target,current=EXCLUDED.current,updated_at=EXCLUDED.updated_at`;
    await sql`INSERT INTO goals (id,title,target,current,due_date,kind,color,monthly_plans,created_at,updated_at) VALUES ('quitar-carro','Amortizar e quitar o carro',30000,500,'','debt','#ffbd59','{}',${ts},${ts}) ON CONFLICT (id) DO UPDATE SET target=EXCLUDED.target,current=EXCLUDED.current,updated_at=EXCLUDED.updated_at`;
    await sql`INSERT INTO goals (id,title,target,current,due_date,kind,color,monthly_plans,created_at,updated_at) VALUES ('entrada-casa','Entrada da casa',300000,200,'','save','#9b7cff','{}',${ts},${ts}) ON CONFLICT (id) DO UPDATE SET target=EXCLUDED.target,current=EXCLUDED.current,updated_at=EXCLUDED.updated_at`;
    await setState("august-reconciliation-v1", "done", ts);
  }

  if (!(await getState("august-reconciliation-v2"))) {
    for (const rid of ["zulmak","maqpecas-construcao","maqpecas-agro"]) {
      await sql`UPDATE records SET status_months='["2026-08"]',updated_at=${ts} WHERE id=${rid}`;
    }
    await sql`UPDATE goals SET title='Reserva de emergência',target=50000,current=500,due_date='',updated_at=${ts} WHERE id='reserva'`;
    await sql`UPDATE goals SET target=152.13,current=0,updated_at=${ts} WHERE id='atrasos'`;
    await sql`UPDATE goals SET current=3223.69,updated_at=${ts} WHERE id='primeiros-5k'`;
    await sql`UPDATE debts SET detail='Acordo 261396265 · 5/12 pagas',updated_at=${ts} WHERE id='santander-acordo'`;
    await sql`UPDATE debts SET detail='Acordo em 24 parcelas · 2 pagas',updated_at=${ts} WHERE id='bradesco'`;
    await sql`UPDATE debts SET detail='Parcela 3 de 24 paga em agosto',updated_at=${ts} WHERE id='neon'`;
    await sql`UPDATE debts SET detail='Parcela 1 de 6 paga em agosto',updated_at=${ts} WHERE id='sem-parar'`;
    await setState("august-reconciliation-v2", "done", ts);
  }

  if (!(await getState("account-model-v3"))) {
    await sql`UPDATE bank_entries SET context='empresa',updated_at=${ts} WHERE flow='income' OR category IN ('Trabalho','Bancos')`;
    await sql`UPDATE bank_entries SET context='pessoal',updated_at=${ts} WHERE category IN ('Dívidas','Moradia','Alimentação','Combustível','Saúde','Pessoal','Comunicação')`;
    await sql`UPDATE bank_entries SET context='empresa',updated_at=${ts} WHERE id='aug-07-capital-giro'`;
    await sql`UPDATE bank_entries SET context='transferencia',destination_account='Open Dreams · Cora',updated_at=${ts} WHERE id='aug-03-open-dreams'`;
    await sql`UPDATE bank_entries SET context='reserva',destination_account='Santander · Caixinhas',updated_at=${ts} WHERE id='aug-18-metas'`;
    await sql`UPDATE bank_entries SET context='pessoal',destination_account='Santander · Pessoal',updated_at=${ts} WHERE id='aug-18-pessoal'`;
    await sql`UPDATE bank_entries SET context='transferencia',destination_account='Bradesco',updated_at=${ts} WHERE id='cora-03-rafael'`;
    await sql`UPDATE bank_entries SET context='reserva',destination_account='Cora · Cartão pré-pago',updated_at=${ts} WHERE id IN ('cora-03-cartao','cora-13-cartao')`;
    await sql`UPDATE bank_entries SET context='revisar',updated_at=${ts} WHERE status='pending'`;
    await setState("account-model-v3", "done", ts);
  }

  if (!(await getState("nubank-and-prepaid-v4"))) {
    await sql`UPDATE bank_entries SET description='Nubank · parcelas em atraso',counterparty='Nubank',category='Dívidas',context='pessoal',notes='R$ 797,49 de parcelas atrasadas pagos em agosto.',updated_at=${ts} WHERE id='aug-18-nu'`;
    await setState("nubank-and-prepaid-v4", "done", ts);
  }

  if (!(await getState("prepaid-card-reconciliation-v5"))) {
    await sql`UPDATE bank_entries SET context='transferencia',updated_at=${ts} WHERE id='card-opening-aug'`;
    await sql`UPDATE bank_entries SET context='empresa',category='Ferramentas',updated_at=${ts} WHERE id IN ('card-cursor-1','card-cursor-2','card-railway','card-canva')`;
    await setState("prepaid-card-reconciliation-v5", "done", ts);
  }

  if (!(await getState("forecast-reconciliation-v6"))) {
    await sql`UPDATE records SET month_key='2026-09',status_months='[]',notes='Mensalidade recorrente a partir de setembro de 2026',updated_at=${ts} WHERE id='conceito'`;
    await sql`INSERT INTO records (id,type,title,category,amount,due_day,month_key,recurring,status_months,month_adjustments,notes,created_at,updated_at) VALUES ('conceito-implementacao-2026-08','income','Conceito · implementação','Clientes',1200,NULL,'2026-08',false,'["2026-08"]','[]','Pagamento pontual',${ts},${ts}) ON CONFLICT (id) DO UPDATE SET status_months=EXCLUDED.status_months,updated_at=EXCLUDED.updated_at`;
    await sql`UPDATE debts SET late_amount=0,late_count=0,updated_at=${ts} WHERE id='santander-acordo'`;
    await setState("forecast-reconciliation-v6", "done", ts);
  }

  if (!(await getState("obracon-recurring-v7"))) {
    await sql`UPDATE records SET title='Obracon · agosto',amount=20000,month_key='2026-08',recurring=false,status_months='["2026-08"]',notes='Recebimento excepcional de agosto',updated_at=${ts} WHERE id='obracon'`;
    await sql`INSERT INTO records (id,type,title,category,amount,due_day,month_key,recurring,status_months,month_adjustments,notes,created_at,updated_at) SELECT 'obracon-recorrente-2026-09','income','Obracon','Clientes',15000,15,'2026-09',true,'[]','[]','Mensalidade recorrente a partir de setembro de 2026',${ts},${ts} WHERE NOT EXISTS (SELECT 1 FROM records WHERE type='income' AND title='Obracon' AND recurring=true AND month_key='2026-09')`;
    await setState("obracon-recurring-v7", "done", ts);
  }

  if (!(await getState("monthly-planning-v8"))) {
    await sql`UPDATE goals SET monthly_plans='{"2026-08":500}',updated_at=${ts} WHERE id IN ('reserva','viagem','quitar-carro')`;
    await sql`UPDATE goals SET monthly_plans='{"2026-08":200}',updated_at=${ts} WHERE id='entrada-casa'`;
    await setState("monthly-planning-v8", "done", ts);
  }

  if (!(await getState("neon-settled-v9"))) {
    const neonHistory = JSON.stringify([
      { id: "aug-18-neon", month: "2026-08", amount: 252.10, label: "Parcela em atraso", date: "2026-08-18T12:00:00.000Z" },
      { id: "aug-18-neon-quitada", month: "2026-08", amount: 644.33, label: "Quitação do acordo", date: "2026-08-18T12:05:00.000Z" },
    ]);
    await sql`UPDATE debts SET balance=0,paid_installments=total_installments,late_amount=0,late_count=0,detail='Quitada em 18/08/2026 · acordo final de R$ 644,33',payment_history=${neonHistory},updated_at=${ts} WHERE id='neon'`;
    await setState("neon-settled-v9", "done", ts);
  }

  if (!(await getState("settings-opening-v10"))) {
    const defaultSettings = JSON.stringify({ displayName: "você", initials: "?", primaryAccount: "Bradesco" });
    const openingBalances = JSON.stringify({ "2026-08": { "Bradesco": -256.32 } });
    await sql`INSERT INTO app_state (key,value,updated_at) VALUES ('settings',${defaultSettings},${ts}) ON CONFLICT (key) DO NOTHING`;
    await sql`INSERT INTO app_state (key,value,updated_at) VALUES ('opening_balances',${openingBalances},${ts}) ON CONFLICT (key) DO NOTHING`;
    await setState("settings-opening-v10", "done", ts);
  }
}

// ─── Read all ─────────────────────────────────────────────────────────────────

async function readAll() {
  const [records, debts, goals, entries, stateRows] = await Promise.all([
    sql`SELECT * FROM records ORDER BY type DESC, title ASC`,
    sql`SELECT * FROM debts ORDER BY balance ASC`,
    sql`SELECT * FROM goals ORDER BY created_at ASC`,
    sql`SELECT * FROM bank_entries ORDER BY entry_date DESC, created_at DESC`,
    sql`SELECT key, value FROM app_state WHERE key IN ('settings','opening_balances')`,
  ]);

  const stateMap = Object.fromEntries(
    (stateRows as { key: string; value: string }[]).map((r) => [r.key, r.value]),
  );
  let settingsParsed = { displayName: "você", initials: "?", primaryAccount: "Bradesco" };
  let openingBalances: Record<string, Record<string, number>> = {};
  try { settingsParsed = JSON.parse(stateMap.settings ?? "{}"); } catch { /* usa default */ }
  try { openingBalances = JSON.parse(stateMap.opening_balances ?? "{}"); } catch { /* usa default */ }

  return {
    records,
    debts,
    goals,
    entries,
    settings: { ...settingsParsed, openingBalances },
  };
}

// ─── Route handlers ───────────────────────────────────────────────────────────

export async function GET() {
  try {
    await ensureDatabase();
    return Response.json(await readAll());
  } catch (error) {
    console.error("[finance GET]", error);
    return Response.json({ error: error instanceof Error ? error.message : "Erro ao carregar dados" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureDatabase();
    const payload = (await request.json()) as Payload;
    const data = payload.data ?? {};
    const ts = now();

    if (payload.entity === "record") {
      const rid = genId("rec");
      await sql`
        INSERT INTO records (id,type,title,category,amount,due_day,month_key,recurring,status_months,month_adjustments,notes,created_at,updated_at)
        VALUES (${rid},${asText(data.type,"expense")},${asText(data.title,"Novo lançamento")},${asText(data.category,"Outros")},
          ${asNumber(data.amount)},${data.dueDay === null ? null : asNumber(data.dueDay)},${asText(data.monthKey)||null},
          ${asBoolean(data.recurring)},${asJsonArr(data.statusMonths)},${asJsonArr(data.adjustments)},${asText(data.notes)},${ts},${ts})
      `;
    } else if (payload.entity === "debt") {
      const did = genId("debt");
      await sql`
        INSERT INTO debts (id,name,detail,original,balance,installment,due_day,total_installments,paid_installments,late_amount,late_count,color,entry_pending,starts,payment_history,created_at,updated_at)
        VALUES (${did},${asText(data.name,"Nova dívida")},${asText(data.detail)},${asNumber(data.original)},${asNumber(data.balance)},
          ${asNumber(data.installment)},${asNumber(data.dueDay,1)},${asNumber(data.totalInstallments,1)},${asNumber(data.paidInstallments)},
          ${asNumber(data.lateAmount)},${asNumber(data.lateCount)},${asText(data.color,"#b8f23d")},${asNumber(data.entryPending)},
          ${asText(data.starts)},${asJsonArr(data.paymentHistory)},${ts},${ts})
      `;
    } else if (payload.entity === "goal") {
      const gid = genId("goal");
      await sql`
        INSERT INTO goals (id,title,target,current,due_date,kind,color,monthly_plans,created_at,updated_at)
        VALUES (${gid},${asText(data.title,"Nova meta")},${asNumber(data.target)},${asNumber(data.current)},
          ${asText(data.dueDate)},${asText(data.kind,"save")},${asText(data.color,"#b8f23d")},${asJsonObj(data.monthlyPlans)},${ts},${ts})
      `;
    } else if (payload.entity === "entry") {
      const eid = genId("entry");
      const entryDate = asText(data.entryDate, ts.slice(0, 10));
      await sql`
        INSERT INTO bank_entries (id,entry_date,month_key,account,destination_account,context,description,counterparty,amount,flow,direction,category,status,notes,document,source,created_at,updated_at)
        VALUES (${eid},${entryDate},${asText(data.monthKey,entryDate.slice(0,7))},${asText(data.account,"Bradesco")},
          ${asText(data.destinationAccount)},${asText(data.context,"revisar")},${asText(data.description,"Nova movimentação")},
          ${asText(data.counterparty)},${asNumber(data.amount)},${asText(data.flow,"expense")},${asText(data.direction,"out")},
          ${asText(data.category,"Outros")},${asText(data.status,"confirmed")},${asText(data.notes)},${asText(data.document)},'manual',${ts},${ts})
      `;
    } else if (payload.entity === "settings") {
      const current = await getState("settings");
      let existing: Record<string, unknown> = {};
      try { existing = JSON.parse(current ?? "{}"); } catch { /* ignora */ }
      const merged = { ...existing, ...Object.fromEntries(Object.entries(data).filter(([k]) => ["displayName","initials","primaryAccount"].includes(k))) };
      await setState("settings", JSON.stringify(merged), ts);
    } else if (payload.entity === "opening_balance") {
      const month = asText(data.month);
      if (!month) return Response.json({ error: "Mês inválido" }, { status: 400 });
      const account = asText(data.account, "Bradesco");
      const amount = asNumber(data.amount);
      const current = await getState("opening_balances");
      let existing: Record<string, Record<string, number>> = {};
      try { existing = JSON.parse(current ?? "{}"); } catch { /* ignora */ }
      existing[month] = { ...(existing[month] ?? {}), [account]: amount };
      await setState("opening_balances", JSON.stringify(existing), ts);
    } else if (payload.entity === "settlement") {
      const action = asText(data.action);
      const sourceId = asText(payload.id);
      if (!sourceId || !["record","debt","goal"].includes(action))
        return Response.json({ error: "Movimentação inválida" }, { status: 400 });
      const entryDate = asText(data.entryDate, ts.slice(0, 10));
      if (action === "record") {
        await sql`UPDATE records SET status_months=${asJsonArr(data.statusMonths)},updated_at=${ts} WHERE id=${sourceId}`;
      } else if (action === "debt") {
        await sql`UPDATE debts SET balance=${asNumber(data.balance)},paid_installments=${asNumber(data.paidInstallments)},late_amount=${asNumber(data.lateAmount)},late_count=${asNumber(data.lateCount)},entry_pending=${asNumber(data.entryPending)},payment_history=${asJsonArr(data.paymentHistory)},detail=${asText(data.detail)},updated_at=${ts} WHERE id=${sourceId}`;
      } else {
        await sql`UPDATE goals SET current=${asNumber(data.current)},updated_at=${ts} WHERE id=${sourceId}`;
      }
      const eid = genId("entry");
      await sql`
        INSERT INTO bank_entries (id,entry_date,month_key,account,destination_account,context,description,counterparty,amount,flow,direction,category,status,notes,document,source,created_at,updated_at)
        VALUES (${eid},${entryDate},${asText(data.monthKey,entryDate.slice(0,7))},${asText(data.account,"Bradesco")},
          ${asText(data.destinationAccount)},${asText(data.context,"revisar")},${asText(data.description,"Movimentação confirmada")},
          ${asText(data.counterparty)},${asNumber(data.amount)},${asText(data.flow,"expense")},${asText(data.direction,"out")},
          ${asText(data.category,"Outros")},'confirmed',${asText(data.notes)},${asText(data.document)},'confirmacao-planejamento',${ts},${ts})
      `;
    } else if (payload.entity === "settlement-reverse") {
      const sourceId = asText(payload.id);
      if (!sourceId) return Response.json({ error: "Movimentação inválida" }, { status: 400 });
      await sql`UPDATE records SET status_months=${asJsonArr(data.statusMonths)},updated_at=${ts} WHERE id=${sourceId}`;
      await sql`DELETE FROM bank_entries WHERE document=${asText(data.document)} AND source='confirmacao-planejamento'`;
    } else {
      return Response.json({ error: "Tipo de cadastro inválido" }, { status: 400 });
    }
    return Response.json(await readAll());
  } catch (error) {
    console.error("[finance POST]", error);
    return Response.json({ error: error instanceof Error ? error.message : "Erro ao salvar" }, { status: 500 });
  }
}

// ─── PATCH dinâmico ───────────────────────────────────────────────────────────

const fieldMap: Record<string, Record<string, string>> = {
  record: { type:"type", title:"title", category:"category", amount:"amount", dueDay:"due_day", monthKey:"month_key", recurring:"recurring", statusMonths:"status_months", adjustments:"month_adjustments", notes:"notes" },
  debt: { name:"name", detail:"detail", original:"original", balance:"balance", installment:"installment", dueDay:"due_day", totalInstallments:"total_installments", paidInstallments:"paid_installments", lateAmount:"late_amount", lateCount:"late_count", color:"color", entryPending:"entry_pending", starts:"starts", paymentHistory:"payment_history" },
  goal: { title:"title", target:"target", current:"current", dueDate:"due_date", kind:"kind", color:"color", monthlyPlans:"monthly_plans" },
  entry: { entryDate:"entry_date", monthKey:"month_key", account:"account", destinationAccount:"destination_account", context:"context", description:"description", counterparty:"counterparty", amount:"amount", flow:"flow", direction:"direction", category:"category", status:"status", notes:"notes", document:"document" },
};
const tableMap: Record<string, string> = { record:"records", debt:"debts", goal:"goals", entry:"bank_entries" };

export async function PATCH(request: Request) {
  try {
    await ensureDatabase();
    const payload = (await request.json()) as Payload;
    const entity = payload.entity ?? "";
    const itemId = asText(payload.id);
    const data = payload.data ?? {};
    if (!tableMap[entity] || !itemId) return Response.json({ error: "Cadastro inválido" }, { status: 400 });

    const setClauses: string[] = [];
    const values: unknown[] = [];
    for (const [key, value] of Object.entries(data)) {
      const col = fieldMap[entity]?.[key];
      if (!col) continue;
      let v: unknown = value;
      if (key === "statusMonths" || key === "paymentHistory" || key === "adjustments") v = JSON.stringify(Array.isArray(value) ? value : []);
      else if (key === "monthlyPlans") v = JSON.stringify(value && typeof value === "object" && !Array.isArray(value) ? value : {});
      else if (key === "recurring") v = value === true;
      setClauses.push(`${col} = $${setClauses.length + 1}`);
      values.push(v);
    }
    if (!setClauses.length) return Response.json({ error: "Nada para atualizar" }, { status: 400 });
    const ts = now();
    setClauses.push(`updated_at = $${setClauses.length + 1}`);
    values.push(ts);
    values.push(itemId);
    await sql.unsafe(
      `UPDATE ${tableMap[entity]} SET ${setClauses.join(", ")} WHERE id = $${values.length}`,
      values as (string | number | boolean | null)[],
    );
    return Response.json(await readAll());
  } catch (error) {
    console.error("[finance PATCH]", error);
    return Response.json({ error: error instanceof Error ? error.message : "Erro ao atualizar" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await ensureDatabase();
    const payload = (await request.json()) as Payload;
    const entity = payload.entity ?? "";
    const itemId = asText(payload.id);
    if (!tableMap[entity] || !itemId) return Response.json({ error: "Cadastro inválido" }, { status: 400 });
    await sql.unsafe(`DELETE FROM ${tableMap[entity]} WHERE id = $1`, [itemId]);
    return Response.json(await readAll());
  } catch (error) {
    console.error("[finance DELETE]", error);
    return Response.json({ error: error instanceof Error ? error.message : "Erro ao excluir" }, { status: 500 });
  }
}
