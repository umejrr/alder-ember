/**
 * File-backed durable outbox. Each accepted enquiry is written as one JSON file (mode 0600).
 * It contains personal data: keep the directory private, outside the web root, and apply the
 * approved retention policy (see docs/integrations.md). For production consider a database or queue.
 */
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { EnquiryInput } from './schema';

export interface OutboxRecord {
  reference: string;
  receivedAt: string;
  delivery: { status: 'pending' | 'delivered' | 'failed'; attempts: number; lastError?: string; deliveredAt?: string };
  enquiry: EnquiryInput;
}

export function createOutbox(dir: string) {
  const file = (ref: string) => join(dir, `${ref}.json`);
  const read = async (ref: string) => JSON.parse(await readFile(file(ref), 'utf8')) as OutboxRecord;
  const write = (rec: OutboxRecord) => writeFile(file(rec.reference), JSON.stringify(rec, null, 2), { mode: 0o600 });
  return {
    async save(enquiry: EnquiryInput) {
      await mkdir(dir, { recursive: true, mode: 0o700 });
      const reference = `AE-${randomUUID().slice(0, 8).toUpperCase()}`;
      await write({ reference, receivedAt: new Date().toISOString(), delivery: { status: 'pending', attempts: 0 }, enquiry });
      return { reference };
    },
    async markDelivered(ref: string) {
      const r = await read(ref);
      r.delivery = { status: 'delivered', attempts: r.delivery.attempts + 1, deliveredAt: new Date().toISOString() };
      await write(r);
    },
    async markFailed(ref: string, err: string) {
      const r = await read(ref);
      r.delivery = { status: 'failed', attempts: r.delivery.attempts + 1, lastError: err.slice(0, 300) };
      await write(r);
    },
    async pending(): Promise<OutboxRecord[]> {
      try {
        const names = (await readdir(dir)).filter((n) => n.endsWith('.json'));
        const all = await Promise.all(names.map((n) => read(n.replace(/\.json$/, ''))));
        return all.filter((r) => r.delivery.status !== 'delivered');
      } catch {
        return [];
      }
    },
  };
}
