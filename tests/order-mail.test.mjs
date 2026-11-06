import assert from 'node:assert/strict';
import { test } from 'node:test';
import { storeOrderRecipients } from '../src/lib/order-recipients.ts';
import { sendOrderEmail, renderInvoice } from '../src/lib/eft-invoice.ts';

const invoice = {
  id: '65d952b2-4372-4100-a2c9-2e7ad1c77371',
  buyer: { firstName: 'Test', lastName: 'Buyer', email: 'test@example.invalid', phone: '', address: '', suburb: '', city: '', province: '', postalCode: '' },
  items: [], subtotalCents: 0, deliveryCents: 0, totalCents: 0,
  bank: { bankName: '', accountHolder: '', accountNumber: '', branchCode: '', accountType: '' },
};

test('store invoices go to the two requested business inboxes', () => {
  assert.deepEqual(storeOrderRecipients(), ['support@maisonamiral.co.za', 'maisonamiral@gmail.com']);
});

test('each recipient and customer/store copy has a distinct retry key', async () => {
  const original = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (_url, init) => {
    requests.push(init);
    return Response.json({ id: 'test-email' });
  };
  try {
    for (const to of storeOrderRecipients()) await sendOrderEmail(to, invoice, 'fake', 'support@maisonamiral.co.za', true, true);
    await sendOrderEmail('support@maisonamiral.co.za', invoice, 'fake', 'support@maisonamiral.co.za', false);
    assert.equal(new Set(requests.map(r => r.headers['Idempotency-Key'])).size, 3);
    assert.deepEqual(requests.slice(0, 2).map(r => JSON.parse(r.body).to[0]), storeOrderRecipients());
    assert.ok(JSON.parse(requests[0].body).subject.startsWith('TEST ONLY'));
    assert.ok(!JSON.parse(requests[2].body).subject.startsWith('TEST ONLY'));
  } finally { globalThis.fetch = original; }
});

test('test invoice clearly forbids payment and contains no banking instructions', () => {
  const html = renderInvoice(invoice, true, true);
  assert.match(html, /TEST ONLY/);
  assert.match(html, /Do not make payment/);
  assert.doesNotMatch(html, /EFT banking details|Please use the payment reference/);
});
