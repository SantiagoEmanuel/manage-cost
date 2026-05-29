import { eq, and } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { categoryBudgets } from '../../db/schema/index.js';
import type { NewCategoryBudget } from '../../db/schema/index.js';

export class CategoryBudgetsRepository {
  findAllByUser(userId: string) {
    return db.select().from(categoryBudgets).where(eq(categoryBudgets.userId, userId));
  }

  findById(id: string, userId: string) {
    return db.query.categoryBudgets.findFirst({
      where: and(eq(categoryBudgets.id, id), eq(categoryBudgets.userId, userId)),
    });
  }

  async upsert(data: NewCategoryBudget) {
    const [b] = await db.insert(categoryBudgets)
      .values(data)
      .onConflictDoUpdate({
        target: [categoryBudgets.userId, categoryBudgets.category],
        set: {
          limitAmount: data.limitAmount,
          currency: data.currency,
          updatedAt: new Date().toISOString(),
        },
      })
      .returning();
    return b!;
  }

  async delete(id: string, userId: string) {
    await db.delete(categoryBudgets).where(and(eq(categoryBudgets.id, id), eq(categoryBudgets.userId, userId)));
  }
}
