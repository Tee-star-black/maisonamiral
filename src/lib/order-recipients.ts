export const STORE_ORDER_RECIPIENTS = [
  "support@maisonamiral.co.za",
  "maisonamiral@gmail.com",
] as const;

export function storeOrderRecipients() {
  return [...STORE_ORDER_RECIPIENTS];
}
