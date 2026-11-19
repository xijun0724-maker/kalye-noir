import type { FormSubmittedEvent } from '@netlify/functions';
import nodemailer from 'nodemailer';
import { contact, site } from '../../src/config/site';

const paymentLabel: Record<string, string> = {
  cod: 'Cash on Delivery (COD)',
  gcash: 'GCash / Maya QR',
};

function orderLines(d: Record<string, string>): string {
  const payment = paymentLabel[d['payment-method']] ?? d['payment-method'] ?? '';
  const lines = [
    'ITEMS',
    d['cart-contents'] || '(none listed)',
    '',
    `Subtotal:     ${d['subtotal'] ?? ''}`,
    `Delivery fee: ${d['shipping-fee'] ?? ''}`,
    `Total:        ${d['grand-total'] ?? ''}`,
    '',
    `Payment:  ${payment}`,
  ];
  if (d['payment-method'] === 'gcash') {
    lines.push(`Reference no.: ${d['payment-ref'] || '(not provided)'}`);
  }
  lines.push(
    '',
    'DELIVER TO',
    d['name'] ?? '',
    d['street'] ?? '',
    [d['city'], d['province'], d['zip']].filter(Boolean).join(', '),
    `Mobile: ${d['phone'] ?? ''}`,
    `Delivery window: ${d['delivery-window'] || 'Pending'}`
  );
  if (d['note']?.trim()) lines.push('', 'NOTE', d['note'].trim());
  return lines.join('\n');
}

export default {
  async formSubmitted(event: FormSubmittedEvent) {
    const d = event.data;
    // Only the checkout form carries a cart; incident reports also trigger this event.
    if (!('cart-contents' in d)) return;

    const password = Netlify.env.get('GMAIL_APP_PASSWORD');
    if (!password) {
      console.error('GMAIL_APP_PASSWORD is not set; order emails were not sent.');
      return;
    }

    const transport = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: contact.email, pass: password },
    });
    const from = `"${site.name}" <${contact.email}>`;
    const details = orderLines(d);
    const first = (d['name'] ?? '').trim().split(/\s+/)[0] || 'there';

    const sends = [
      transport.sendMail({
        from,
        to: contact.email,
        replyTo: d['email'] || undefined,
        subject: `New order: ${d['name'] ?? 'Customer'} · ${d['grand-total'] ?? ''}`,
        text: `${details}\n\nCustomer email: ${d['email'] ?? ''}${
          d['payment-slip'] ? `\nPayment slip: ${d['payment-slip']}` : ''
        }`,
      }),
    ];

    if (d['email']) {
      sends.push(
        transport.sendMail({
          from,
          to: d['email'],
          replyTo: contact.email,
          subject: `${site.name}: we got your order`,
          text: [
            `Hi ${first},`,
            '',
            'Thanks for your order. Here is what we received:',
            '',
            details,
            '',
            d['payment-method'] === 'gcash'
              ? 'We will check your GCash / Maya payment, then send your parcel.'
              : 'Please have the exact amount ready for the courier.',
            '',
            `Questions? Reply to this email or text ${contact.mobile}.`,
            '',
            site.name,
          ].join('\n'),
        })
      );
    }

    const results = await Promise.allSettled(sends);
    for (const r of results) {
      if (r.status === 'rejected') console.error('Order email failed:', r.reason);
    }
  },
};
