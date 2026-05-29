import { eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { pushSubscriptions } from '../../db/schema/index.js';
import type { NewPushSubscription } from '../../db/schema/index.js';

export class PushRepository {
  async upsertSubscription(data: NewPushSubscription) {
    const [s] = await db.insert(pushSubscriptions)
      .values(data)
      .onConflictDoUpdate({
        target: pushSubscriptions.endpoint,
        set: {
          userId: data.userId,
          p256dh: data.p256dh,
          auth: data.auth,
        },
      })
      .returning();
    return s!;
  }

  findByUser(userId: string) {
    return db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
  }

  async removeByEndpoint(endpoint: string) {
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
  }
}
