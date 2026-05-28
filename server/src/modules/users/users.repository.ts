import { eq, or, like, and, isNull } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { users } from '../../db/schema/index.js';

export class UsersRepository {
  findById(id: string) {
    return db.query.users.findFirst({ where: and(eq(users.id, id), isNull(users.deletedAt)) });
  }

  findByEmail(email: string) {
    return db.query.users.findFirst({ where: eq(users.email, email) });
  }

  findByUsername(username: string) {
    return db.query.users.findFirst({ where: eq(users.username, username) });
  }

  async update(id: string, data: Partial<{ username: string; avatarUrl: string | null; currency: string; language: string; timezone: string; passwordHash: string; updatedAt: string }>) {
    const [u] = await db.update(users).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(users.id, id)).returning();
    return u;
  }

  async search(q: string, excludeId: string) {
    return db.select({ id: users.id, email: users.email, username: users.username, avatarUrl: users.avatarUrl })
      .from(users)
      .where(
        and(
          isNull(users.deletedAt),
          or(like(users.email, `%${q}%`), like(users.username, `%${q}%`))
        )
      )
      .limit(10);
  }
}
