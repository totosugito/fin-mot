import { eq, sql } from "drizzle-orm";
import { projectsCost, projectEvents} from "../../db/schema/index.ts";
import { db } from "../../db/index.ts";

export const computeEventCost = async (parentId: string) => {
  // If this event has a parent, update the parent's cost totals
    const totals = await db
      .select({
        totalBudgetIncome: sql<number>`COALESCE(SUM(${projectsCost.budgetIncome}), 0)`,
        totalBudgetExpense: sql<number>`COALESCE(SUM(${projectsCost.budgetExpense}), 0)`,
        totalRealIncome: sql<number>`COALESCE(SUM(${projectsCost.realIncome}), 0)`,
        totalRealExpense: sql<number>`COALESCE(SUM(${projectsCost.realExpense}), 0)`,
      })
      .from(projectsCost)
      .innerJoin(projectEvents, eq(projectEvents.id, projectsCost.projectEventId))
      .where(eq(projectEvents.parentId, parentId));

    await db
      .update(projectsCost)
      .set({
        budgetIncome: sql`${totals[0].totalBudgetIncome}`,
        budgetExpense: sql`${totals[0].totalBudgetExpense}`,
        realIncome: sql`${totals[0].totalRealIncome}`,
        realExpense: sql`${totals[0].totalRealExpense}`,
        updatedAt: sql`NOW()`,
      })
      .where(eq(projectsCost.projectEventId, parentId));
}
