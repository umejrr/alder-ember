/**
 * Notification boundary: sales alert + customer confirmation email.
 * NOT CONFIGURED: no email provider or approved templates were supplied. These return
 * `sent: false`, and no part of the UI claims an email was sent.
 */
import type { EnquiryInput } from './schema';

export interface NotifyResult {
  sent: false;
  reason: 'not-configured';
}

export async function notifySales(_e: EnquiryInput, _reference: string): Promise<NotifyResult> {
  return { sent: false, reason: 'not-configured' };
}

export async function confirmToCustomer(_e: EnquiryInput, _reference: string): Promise<NotifyResult> {
  return { sent: false, reason: 'not-configured' };
}
