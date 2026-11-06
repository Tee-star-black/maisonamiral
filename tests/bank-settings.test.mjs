import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { storeOrderRecipients } from '../src/lib/order-recipients.ts';
import { renderInvoice } from '../src/lib/eft-invoice.ts';

const source = ts.transpileModule(readFileSync(new URL('../src/lib/commerce.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
function settings(overrides = {}) {
  const exports = {};
  vm.runInNewContext(source, { exports, process: { env: {
    MAISON_BANK_NAME: 'Test Bank', MAISON_BANK_ACCOUNT_HOLDER: 'Test Holder', MAISON_BANK_ACCOUNT_NUMBER: '0000000000',
    MAISON_RESEND_FROM: 'support@maisonamiral.co.za', RESEND_API_KEY: 're_test',
    MAISON_SUPABASE_URL: 'https://example.supabase.co', MAISON_SUPABASE_SERVICE_ROLE_KEY: 'test-only', ...overrides,
  } }, require: (name) => name === './order-recipients' ? { storeOrderRecipients } : {} });
  return exports.getEftSettings();
}

test('EFT checkout does not require branch code or account type', () => {
  assert.equal(settings().enabled, true);
  assert.equal(settings().bank.branchCode, '');
  assert.equal(settings().bank.accountType, '');
});
test('bank account number remains required', () => {
  assert.equal(settings({ MAISON_BANK_ACCOUNT_NUMBER: '' }).enabled, false);
});
test('invoice omits blank optional banking fields', () => {
  const html = renderInvoice({ id: 'test', buyer: {}, items: [], subtotalCents: 0, deliveryCents: 0, totalCents: 0, bank: settings().bank });
  assert.match(html, /Test Bank/);
  assert.match(html, /Account number/);
  assert.doesNotMatch(html, /Branch code|Account type/);
});
