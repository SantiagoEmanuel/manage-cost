import { eq, and } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { users, sessions } from '../../db/schema/index.js';
import type { NewUser, NewSession } from '../../db/schema/index.js';

export class AuthRepository {
  findUserByEmail(email: string) { return db.query.users.findFirst({ where: eq(users.email, email) }); }
  findUserById(id: string) { return db.query.users.findFirst({ where: eq(users.id, id) }); }
  findUserByUsername(username: string) { return db.query.users.findFirst({ where: eq(users.username, username) }); }
  async createUser(data: NewUser) { const [u] = await db.insert(users).values(data).returning(); return u!; }
  async createSession(data: NewSession) { const [s] = await db.insert(sessions).values(data).returning(); return s!; }
  findSessionByTokenHash(tokenHash: string) {
    return db.query.sessions.findFirst({
      where: and(eq(sessions.tokenHash, tokenHash), eq(sessions.isRevoked, false)),
    });
  }
  async revokeSession(id: string) { await db.update(sessions).set({ isRevoked: true }).where(eq(sessions.id, id)); }
  async revokeAllUserSessions(userId: string) { await db.update(sessions).set({ isRevoked: true }).where(eq(sessions.userId, userId)); }
}
