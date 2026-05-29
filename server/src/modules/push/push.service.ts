import { v4 as uuidv4 } from 'uuid';
import webpush, { WebPushError } from 'web-push';
import { PushRepository } from './push.repository.js';
import { vapidPublicKey } from '../../config/env.js';
import type { SubscribeInput } from './push.schema.js';

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

export class PushService {
  private readonly repo = new PushRepository();

  getVapidPublicKey(): string {
    return vapidPublicKey;
  }

  async subscribe(userId: string, input: SubscribeInput): Promise<void> {
    await this.repo.upsertSubscription({
      id: uuidv4(),
      userId,
      endpoint: input.endpoint,
      p256dh: input.keys.p256dh,
      auth: input.keys.auth,
    });
  }

  async unsubscribe(endpoint: string): Promise<void> {
    await this.repo.removeByEndpoint(endpoint);
  }

  async sendToUser(userId: string, payload: PushPayload): Promise<void> {
    if (!vapidPublicKey) return;
    const subs = await this.repo.findByUser(userId);
    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload),
        );
      } catch (err) {
        if (err instanceof WebPushError && (err.statusCode === 404 || err.statusCode === 410)) {
          await this.repo.removeByEndpoint(sub.endpoint);
        } else {
          console.warn('Push notification failed:', err);
        }
      }
    }
  }
}
