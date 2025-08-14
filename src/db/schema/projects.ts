import type { AnyPgColumn } from "drizzle-orm/pg-core";
import {
  pgTable,
  uuid,
  text,
  jsonb,
  timestamp,
  integer,
  numeric,
  char,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import {users} from "./auth.ts";
import {ltree} from "./custom/ltree.ts";
import {EnumProjectEventType, EnumProjectStatus, PgEnumProjectEventType, PgEnumProjectStatus} from "./enum-projects.ts";


// ===== PROJECTS TABLE =====
export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    extra: jsonb("extra").default(sql`'{}'::jsonb`),
    status: PgEnumProjectStatus("status").notNull().default(EnumProjectStatus.draft),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_projects_name").on(table.name),
    index("idx_projects_user_name").on(table.userId, table.name),
  ]
);

// ===== PROJECT EVENTS TABLE =====
export const projectEvents = pgTable(
  "project_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    parentId: uuid("parent_id")
      .$type<string>()
      .references((): AnyPgColumn => projectEvents.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    extra: jsonb("extra").default(sql`'{}'::jsonb`),
    type: PgEnumProjectEventType("type").notNull().default(EnumProjectEventType.folder),
    sortOrder: integer("sort_order").default(0),

    // 🚀 Now explicitly an ltree type in DB
    path: ltree("path").notNull(),

    depth: integer("depth").generatedAlwaysAs(sql`nlevel(path) - 1`),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_project_events_parent_id").on(table.parentId),
    index("idx_project_events_parent_sort").on(table.parentId, table.sortOrder),
    index("idx_project_events_name").on(table.name),
    // Path GIST index is added manually in raw migration
  ]
);

// ===== PROJECTS COST TABLE =====
export const projectsCost = pgTable(
  "projects_cost",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectEventId: uuid("project_event_id")
      .notNull()
      .references(() => projectEvents.id, { onDelete: "cascade" }),

    budgetIncomeCurrency: char("budget_income_currency", { length: 3 }),
    budgetIncome: numeric("budget_income", { precision: 18, scale: 2 }),

    budgetExpenseCurrency: char("budget_expense_currency", { length: 3 }),
    budgetExpense: numeric("budget_expense", { precision: 18, scale: 2 }),

    realIncomeCurrency: char("real_income_currency", { length: 3 }),
    realIncome: numeric("real_income", { precision: 18, scale: 2 }),
    realIncomeCreatedAt: timestamp("real_income_created_at", {
      withTimezone: true,
    }),

    realExpenseCurrency: char("real_expense_currency", { length: 3 }),
    realExpense: numeric("real_expense", { precision: 18, scale: 2 }),
    realExpenseCreatedAt: timestamp("real_expense_created_at", {
      withTimezone: true,
    }),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_projects_cost_event_id").on(table.projectEventId),
  ]
);
