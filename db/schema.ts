import {
  boolean,
  integer,
  pgTable,
  real,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const records = pgTable("records", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  amount: real("amount").notNull().default(0),
  dueDay: integer("due_day"),
  monthKey: text("month_key"),
  recurring: boolean("recurring").notNull().default(false),
  statusMonths: text("status_months").notNull().default("[]"),
  monthAdjustments: text("month_adjustments").notNull().default("[]"),
  notes: text("notes").notNull().default(""),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const debts = pgTable("debts", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  detail: text("detail").notNull().default(""),
  original: real("original").notNull(),
  balance: real("balance").notNull(),
  installment: real("installment").notNull(),
  dueDay: integer("due_day").notNull(),
  totalInstallments: integer("total_installments").notNull(),
  paidInstallments: integer("paid_installments").notNull().default(0),
  lateAmount: real("late_amount").notNull().default(0),
  lateCount: integer("late_count").notNull().default(0),
  color: text("color").notNull().default("#b8f23d"),
  entryPending: real("entry_pending").notNull().default(0),
  starts: text("starts").notNull().default(""),
  paymentHistory: text("payment_history").notNull().default("[]"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const goals = pgTable("goals", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  target: real("target").notNull(),
  current: real("current").notNull().default(0),
  dueDate: text("due_date").notNull().default(""),
  kind: text("kind").notNull().default("save"),
  color: text("color").notNull().default("#b8f23d"),
  monthlyPlans: text("monthly_plans").notNull().default("{}"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const bankEntries = pgTable("bank_entries", {
  id: text("id").primaryKey(),
  entryDate: text("entry_date").notNull(),
  monthKey: text("month_key").notNull(),
  account: text("account").notNull().default("Bradesco"),
  destinationAccount: text("destination_account").notNull().default(""),
  context: text("context").notNull().default("review"),
  description: text("description").notNull(),
  counterparty: text("counterparty").notNull().default(""),
  amount: real("amount").notNull(),
  flow: text("flow").notNull(),
  direction: text("direction").notNull(),
  category: text("category").notNull(),
  status: text("status").notNull().default("confirmed"),
  notes: text("notes").notNull().default(""),
  document: text("document").notNull().default(""),
  source: text("source").notNull().default("manual"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const appState = pgTable("app_state", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull(),
});
